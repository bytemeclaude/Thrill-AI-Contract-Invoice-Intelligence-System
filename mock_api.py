from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import random
from datetime import datetime
import uvicorn
import threading
import time

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock Data
DOCS = [
    {"id": 1, "filename": "INV-2024-001_AcmeCorp.pdf", "status": "COMPLETED", "doc_type": "invoice", "created_at": datetime.now().isoformat(), "open_findings": 0},
    {"id": 2, "filename": "MSA_Globex_Signed.pdf", "status": "REVIEW_NEEDED", "doc_type": "contract", "created_at": datetime.now().isoformat(), "open_findings": 3},
    {"id": 3, "filename": "PO_7782_StarkInd.pdf", "status": "PROCESSING", "doc_type": "invoice", "created_at": datetime.now().isoformat(), "open_findings": 0},
    {"id": 4, "filename": "Consulting_Agreement_v2.pdf", "status": "PENDING", "doc_type": "contract", "created_at": datetime.now().isoformat(), "open_findings": 0},
    {"id": 5, "filename": "INV-2024-002_WayneEnt.pdf", "status": "COMPLETED", "doc_type": "invoice", "created_at": datetime.now().isoformat(), "open_findings": 0},
    {"id": 6, "filename": "NDA_Cyberdyne.pdf", "status": "FAILED", "doc_type": "contract", "created_at": datetime.now().isoformat(), "open_findings": 0},
]

FINDINGS_DOC_2 = [
    {
        "id": 101,
        "document_id": 2,
        "finding_type": "term_mismatch",
        "severity": "high",
        "description": "Payment terms in invoice (Net 30) do not match contract (Net 60).",
        "evidence": {"invoice_term": "Net 30", "contract_term": "Net 60"},
        "status": "open"
    },
    {
        "id": 102,
        "document_id": 2,
        "finding_type": "indemnification_risk",
        "severity": "critical",
        "description": "Unlimited indemnification clause detected.",
        "evidence": {"risk_score": 9, "original": "The Provider shall indemnify the Client for all losses without limitation.", "redline": "The Provider shall indemnify the Client for direct losses, capped at 1x contract value."},
        "status": "open"
    },
    {
        "id": 103,
        "document_id": 2,
        "finding_type": "missing_po",
        "severity": "medium",
        "description": "Purchase Order reference missing in invoice.",
        "evidence": {},
        "status": "open"
    }
]

@app.get("/documents")
def get_documents():
    return {"documents": DOCS}

@app.get("/dashboard/stats")
def get_stats():
    return {
        "processing": 1,
        "needs_review": 1,
        "completed": 2,
        "failed": 1,
        "open_findings": 3,
        "total": 6
    }

@app.post("/upload")
def upload(file: UploadFile = File(...)):
    time.sleep(1.5) # Simulate latency
    new_id = len(DOCS) + 1
    new_doc = {
        "id": new_id,
        "filename": file.filename,
        "status": "PROCESSING",
        "doc_type": "invoice" if "inv" in file.filename.lower() else "contract" if "contract" in file.filename.lower() else None,
        "created_at": datetime.now().isoformat(),
        "open_findings": 0
    }
    DOCS.insert(0, new_doc)
    
    # Simulate processing completion in background
    def complete_processing():
        time.sleep(5)
        new_doc["status"] = "REVIEW_NEEDED" if new_doc["doc_type"] == "contract" else "COMPLETED"
    
    threading.Thread(target=complete_processing).start()
    
    return {"status": "success", "id": new_id}

@app.get("/documents/{doc_id}/extraction")
def get_extraction(doc_id: int):
    doc = next((d for d in DOCS if d["id"] == doc_id), None)
    return doc if doc else {}

@app.get("/documents/{doc_id}/findings")
def get_findings(doc_id: int):
    # Only return findings for doc 2 for demo
    if doc_id == 2:
        return {"findings": FINDINGS_DOC_2}
    return {"findings": []}

@app.get("/documents/{doc_id}/pdf")
def get_pdf(doc_id: int):
    # Return a dummy PDF URL (configured to open a sample PDF from web if needed, or just 404 handled by UI)
    return {"url": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"} 

@app.post("/documents/{doc_id}/analyze")
def analyze(doc_id: int):
    time.sleep(2)
    return {"status": "success"}

@app.post("/contracts/{doc_id}/risk_assessment")
def risk_assessment(doc_id: int):
    task_id = f"task_{random.randint(1000,9999)}"
    return {"status": "queued", "task_id": task_id}

@app.get("/tasks/{task_id}/status")
def task_status(task_id: str):
    return {"task_id": task_id, "state": "SUCCESS", "result": {}}

@app.post("/findings/{finding_id}/review")
def review_finding(finding_id: int, req: dict):
    # Update local finding status
    for f in FINDINGS_DOC_2:
        if f["id"] == finding_id:
            f["status"] = "reviewed" if req.get("decision") == "APPROVE" else "overridden"
            
    # Update doc status if all closed
    open_findings = [f for f in FINDINGS_DOC_2 if f["status"] == "open"]
    if not open_findings:
        for d in DOCS:
            if d["id"] == 2:
                d["status"] = "COMPLETED"
                d["open_findings"] = 0
                
    return {"status": "success"}

@app.get("/evaluation/report")
def eval_report():
    return {
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "metrics": {
            "extraction_f1": 0.92,
            "mismatch_accuracy": 0.85,
            "risk_recall": 0.98
        },
        "details": [
            {"scenario_id": 1, "extraction_score": 0.95, "found_mismatch": True, "expected_mismatch": True, "mismatch_correct": True},
            {"scenario_id": 2, "extraction_score": 0.88, "found_mismatch": False, "expected_mismatch": False, "mismatch_correct": True},
            {"scenario_id": 3, "extraction_score": 0.91, "found_mismatch": True, "expected_mismatch": False, "mismatch_correct": False},
            {"scenario_id": 4, "extraction_score": 0.99, "found_mismatch": False, "expected_mismatch": False, "mismatch_correct": True},
        ]
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
