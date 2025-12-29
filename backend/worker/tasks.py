import time
import os
import shutil
from worker.celery_app import celery_app
from shared.database import SessionLocal, get_db
from shared.models import Document, DocumentStatus
from shared.ingestion import ParsingService, ChunkingService, VectorService
from shared.extraction import ExtractionGraph
from minio import Minio

# MinIO Client (Should be shared potentially, but init here for worker context)
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

# Initialize Services
# vector_service = VectorService() # Moved inside task for fork safety

@celery_app.task(name="process_document")
def process_document(document_id: int):
    print(f"Starting processing for document {document_id}")
    db = SessionLocal()
    local_path = None
    try:
        # Lazy init service
        vector_service = VectorService()
        doc = db.query(Document).filter(Document.id == document_id).first()
        if not doc:
            print(f"Document {document_id} not found")
            return
        
        doc.status = DocumentStatus.PROCESSING
        db.commit()

        # 1. Download file
        local_path = f"/tmp/{doc.s3_key}"
        minio_client.fget_object(MINIO_BUCKET, doc.s3_key, local_path)
        print(f"Downloaded {doc.s3_key} to {local_path}")

        # 2. Parse
        pages = ParsingService.parse_pdf(local_path)
        print(f"Parsed {len(pages)} pages")

        # 3. Chunk
        chunks = ChunkingService.chunk_document(doc.id, pages)
        print(f"Generated {len(chunks)} chunks")

        # 4. Embed and Upsert
        # Add metadata
        for chunk in chunks:
            chunk.metadata["filename"] = doc.filename
            chunk.metadata["type"] = "text"
        
        vector_service.upsert_chunks(chunks)
        print(f"Upserted chunks to Qdrant")

        # 5. Extraction
        print(f"Running extraction graph for document {document_id}")
        full_text = "\n".join([p.text for p in pages])
        extractor = ExtractionGraph()
        extraction_result = extractor.run(doc.id, full_text)
        
        print(f"Extraction complete: {extraction_result['doc_type']}")
        
        doc.extraction_result = extraction_result
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
