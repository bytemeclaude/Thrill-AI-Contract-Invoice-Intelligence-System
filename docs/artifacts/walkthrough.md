# Walkthrough

## 1. Setup & Infra
The stack consists of:
- **Frontend**: Next.js 14 (Port 3000)
- **API**: FastAPI (Port 8000)
- **Worker**: Celery (Concurrency: 1)
- **DB**: Postgres
- **Vector**: Qdrant
- **Storage**: MinIO

## 2. Ingestion & Indexing
### Upload
```bash
curl -X POST -F "file=@contract.pdf" http://localhost:8000/upload
```

### Search
```bash
curl "http://localhost:8000/search?q=payment%20terms&limit=1"
```

## 3. Document Understanding (Extraction & Mismatch Detection)
The system uses **LangGraph** for extraction and **Comparison Graph** for mismatch detection.

### 3.1 Extraction
Automatic upon upload.
```bash
curl http://localhost:8000/documents/{doc_id}/extraction
```

### 3.2 Mismatch Detection (Analysis)
Once an Invoice is extracted, you can trigger analysis against existing Contracts.
The system automatically finds the Contract matching the Invoice's Vendor Name.

**Trigger Analysis:**
```bash
curl -X POST http://localhost:8000/documents/{invoice_id}/analyze
```

**Get Findings:**
```bash
curl http://localhost:8000/documents/{invoice_id}/findings
```

## 4. Contract Risk Scoring & Redlines
The system maintains a **Clause Library** (Vector Store) of standard/safe clauses.
It extracts clauses from a contract, retrieves the matching standard clause, and assesses risk.

### Trigger Risk Assessment
```bash
curl -X POST http://localhost:8000/contracts/{doc_id}/risk_assessment
```

### Example Risk Finding
```json
{
    "clause_type": "Liability Cap",
    "risk_score": 9,
    "risk_level": "high",
    "explanation": "Unlimited liability is high risk.",
    "redline_text": "Liability limited to 1x Fees."
}
```

## 5. AI UX + Review Workflow
A Full-Stack Review Interface is available at `http://localhost:3000`.

### Dashboard
- Lists all uploaded Invoices & Contracts.
- Status tracking.
- Risk Indicators.

### Review Interface
- **Split View**: Document + Findings.
- **Review Actions**: Users can **Approve** (confirm issue) or **Override** (mark as safe).
- **Audit Log**: Decisions are stored with user ID and timestamp.

## 6. Evaluation & Monitoring
The system includes a rigorous evaluation framework to measure Accuracy and F1 Scores using a synthetic Gold Dataset.

### Evaluation Dashboard
View the latest Quality Report at `http://localhost:3000/evaluations`.

### Run Evaluation
1. **Generate Data**:
   ```bash
   docker-compose exec worker python3 evaluation/generate_gold.py
   ```
2. **Run Eval Script**:
   ```bash
   python3 backend/evaluation/eval_runner.py
   ```
   *Note: Requires `requests_toolbelt` installed locally.*

### Scorecard Targets
- **Extraction F1**: > 90%
- **Mismatch Accuracy**: > 80%
- **Risk Recall**: > 95%

## 7. Production Hardening
The system is secured and ready for deployment:
- **JWT Authentication**: Secure stateless auth.
- **RBAC**: Granular permissions (Admin, AP, Legal).
- **Middleware**: Rate limiting (60 req/min) and request logging.
- **CI/CD**: GitHub Actions pipeline defined in `.github/workflows/ci.yml`.
- **Documentation**: Refer to `Deployment.md` and `SecurityChecklist.md` for operations.
