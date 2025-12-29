import os
import sys
# Make sure we can import shared modules
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from shared.ingestion import VectorService
from qdrant_client.http import models as qmodels
import uuid

CLAUSE_LIBRARY = [
    {
        "type": "Liability Cap",
        "text": "The total liability of either party shall not exceed the total fees paid by Customer to Vendor in the twelve (12) months preceding the claim.",
        "risk_profile": "Standard (Safe)"
    },
    {
        "type": "Payment Terms",
        "text": "Customer shall pay all undisputed invoices within thirty (30) days of receipt.",
        "risk_profile": "Standard (Safe)"
    },
    {
        "type": "Termination for Convenience",
        "text": "Either party may terminate this Agreement for convenience upon providing thirty (30) days prior written notice.",
        "risk_profile": "Standard (Safe)"
    },
    {
        "type": "Indemnification",
        "text": "Vendor shall indemnify, defend, and hold Customer harmless from and against any third-party claims arising from Vendor's negligence or willful misconduct.",
        "risk_profile": "Standard (Safe)"
    },
    {
        "type": "Governing Law",
        "text": "This Agreement shall be governed by and construed in accordance with the laws of the State of Delaware.",
        "risk_profile": "Standard (Safe)"
    }
]

def seed_library():
    print("Seeding Clause Library...")
    # Initialize VectorService with new collection name
    service = VectorService(collection_name="clause_library")
    
    # Check if empty (optional, but good for idempotency)
    # For now, we just upsert.
    
    texts = [c["text"] for c in CLAUSE_LIBRARY]
    embeddings = service.model.encode(texts)
    
    points = []
    for i, clause in enumerate(CLAUSE_LIBRARY):
        points.append(qmodels.PointStruct(
            id=str(uuid.uuid4()),
            vector=embeddings[i].tolist(),
            payload={
                "text": clause["text"],
                "clause_type": clause["type"],
                "risk_profile": clause["risk_profile"]
            }
        ))
    
    service.qdrant.upsert(
        collection_name="clause_library",
        points=points
    )
    print(f"Seeded {len(points)} clauses into 'clause_library'.")

if __name__ == "__main__":
    seed_library()
