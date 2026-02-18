import os
from worker.celery_app import celery_app
from shared.database import SessionLocal
from shared.models import Document, DocumentStatus, Finding as DBFinding
from shared.ingestion import ParsingService, ChunkingService, VectorService
from shared.extraction import ExtractionGraph
from minio import Minio

# MinIO Client
MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "minio:9000")
MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY", "minioadmin")
MINIO_BUCKET = os.getenv("MINIO_BUCKET", "documents")
MINIO_SECURE = False

minio_client = Minio(
    MINIO_ENDPOINT.replace("http://", "").replace("https://", ""),
    access_key=MINIO_ACCESS_KEY,
    secret_key=MINIO_SECRET_KEY,
    secure=MINIO_SECURE
)


def _download_and_parse(s3_key: str):
    """Download PDF from MinIO and parse to pages. Returns (local_path, pages, full_text)."""
    local_path = f"/tmp/{s3_key}"
    minio_client.fget_object(MINIO_BUCKET, s3_key, local_path)
    pages = ParsingService.parse_pdf(local_path)
    full_text = "\n".join([p.text for p in pages])
    return local_path, pages, full_text


@celery_app.task(name="process_document")
def process_document(document_id: int):
    print(f"Starting processing for document {document_id}")
    db = SessionLocal()
    local_path = None
    try:
        vector_service = VectorService()
        doc = db.query(Document).filter(Document.id == document_id).first()
        if not doc:
            print(f"Document {document_id} not found")
            return

        doc.status = DocumentStatus.PROCESSING
        db.commit()

        # 1. Download + Parse
        local_path, pages, full_text = _download_and_parse(doc.s3_key)
        print(f"Downloaded {doc.s3_key}, parsed {len(pages)} pages")

        # 2. Chunk
        chunks = ChunkingService.chunk_document(doc.id, pages)
        print(f"Generated {len(chunks)} chunks")

        # 3. Embed and Upsert
        for chunk in chunks:
            chunk.metadata["filename"] = doc.filename
            chunk.metadata["type"] = "text"

        vector_service.upsert_chunks(chunks)
        print(f"Upserted chunks to Qdrant")

        # 4. Extraction
        print(f"Running extraction graph for document {document_id}")
        extractor = ExtractionGraph()
        extraction_result = extractor.run(doc.id, full_text)
        print(f"Extraction complete: {extraction_result['doc_type']}")

        doc.extraction_result = extraction_result

        # Set status based on document type
        doc_type = extraction_result.get("doc_type", "other")
        if doc_type in ("invoice", "contract"):
            doc.status = DocumentStatus.REVIEW_NEEDED
        else:
            doc.status = DocumentStatus.COMPLETED

        db.commit()
        print(f"Finished processing document {document_id}")

    except Exception as e:
        print(f"Error processing document {document_id}: {e}")
        doc.status = DocumentStatus.FAILED
        db.commit()
    finally:
        db.close()
        if local_path and os.path.exists(local_path):
            os.remove(local_path)


@celery_app.task(name="assess_risk", bind=True)
def assess_risk(self, document_id: int):
    """Background task: download PDF, parse, run risk assessment, save findings."""
    print(f"Starting risk assessment for document {document_id}")
    db = SessionLocal()
    local_path = None
    try:
        doc = db.query(Document).filter(Document.id == document_id).first()
        if not doc:
            return {"status": "error", "message": f"Document {document_id} not found"}

        # 1. Download + Parse (the heavy part moved out of the API)
        local_path, pages, full_text = _download_and_parse(doc.s3_key)
        print(f"Downloaded {doc.s3_key}, parsed {len(pages)} pages for risk assessment")

        # 2. Run risk graph
        from shared.risk import RiskAssessmentGraph
        graph = RiskAssessmentGraph()
        findings = graph.run(doc.id, full_text)
        print(f"Risk assessment found {len(findings)} risks")

        # 3. Save findings to DB
        saved_count = 0
        for f in findings:
            db_f = DBFinding(
                document_id=doc.id,
                finding_type=f.clause_type,
                severity=f.risk_level,
                description=f"{f.explanation}\nOriginal: {f.original_text}\nRedline: {f.redline_text}",
                evidence={
                    "original": f.original_text,
                    "standard": f.standard_clause,
                    "risk_score": f.risk_score,
                    "redline": f.redline_text
                },
                status="open"
            )
            db.add(db_f)
            saved_count += 1

        db.commit()
        print(f"Saved {saved_count} risk findings for document {document_id}")

        return {
            "status": "success",
            "document_id": document_id,
            "findings_count": saved_count
        }

    except Exception as e:
        print(f"Error in risk assessment for document {document_id}: {e}")
        return {"status": "error", "message": str(e)}
    finally:
        db.close()
        if local_path and os.path.exists(local_path):
            os.remove(local_path)
