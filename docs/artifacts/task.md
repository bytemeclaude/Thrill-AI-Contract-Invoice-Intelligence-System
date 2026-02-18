# Tasks

- [x] Project Kickoff & Spec
    - [x] Create PRD (Product Requirements Document) <!-- id: 1 -->
        - [x] Define MVP & Out of Scope
        - [x] Define User Personas & Workflows
        - [x] Define Exit Criteria
    - [x] Create Data Model Sketch <!-- id: 2 -->
    - [x] Design UI Wireframes (4 screens) <!-- id: 3 -->
    - [x] Create Evaluation Plan Outline <!-- id: 4 -->

- [x] Foundation & Infra
    - [x] Repo Structure & Env Setup <!-- id: 5 -->
    - [x] Docker Compose Stack (Postgres, Redis, MinIO, Qdrant) <!-- id: 6 -->
    - [x] Backend API (FastAPI) Skeleton <!-- id: 7 -->
    - [x] Ingestion Worker Skeleton <!-- id: 8 -->
    - [x] Database Migrations (Alembic) <!-- id: 9 -->
    - [x] End-to-End Upload Verification <!-- id: 10 -->

- [x] Ingestion & Indexing
    - [x] Install Parsing & ML Dependencies <!-- id: 11 -->
    - [x] Implement Document Parsing (pdfplumber) <!-- id: 12 -->
    - [x] Implement Chunking Strategy (Page-aware) <!-- id: 13 -->
    - [x] Implement Embedding & Vector Storage (Qdrant) <!-- id: 14 -->
    - [x] Update Worker for End-to-End Ingestion <!-- id: 15 -->
    - [x] Create Search & Debug Endpoints <!-- id: 16 -->
    - [x] Verify Search Quality ("Payment Terms") <!-- id: 17 -->

- [x] Document Understanding (Extraction Graph)
    - [x] Define Pydantic Schemas (Invoice/Contract) <!-- id: 18 -->
    - [x] Install LangChain & LangGraph <!-- id: 19 -->
    - [x] Implement Extraction Graph (Classify -> Extract -> Validate) <!-- id: 20 -->
    - [x] Implement Evidence Linking Logic <!-- id: 21 -->
    - [x] Update DB Schema for Extraction Results <!-- id: 22 -->
    - [x] Update Worker pipeline <!-- id: 23 -->
    - [x] Add Extraction API & UI Page <!-- id: 24 -->
    - [x] Verify Extraction Accuracy on Test Doc <!-- id: 25 -->

- [x] LLM Integration (Mistral)
    - [x] Add Mistral Dependencies <!-- id: 26 -->
    - [x] Update Extraction Graph to support Mistral <!-- id: 27 -->
    - [x] Configure Environment Variables <!-- id: 28 -->

- [x] Mismatch Detection (Comparison Graph)
    - [x] Define Finding Pydantic Schema <!-- id: 29 -->
    - [x] Create Database Models for Findings <!-- id: 30 -->
    - [x] Implement Doc Retrieval (Find Contract for Invoice) <!-- id: 31 -->
    - [x] Implement Comparison Graph (LangGraph) <!-- id: 32 -->
    - [x] Add Findings API Endpoint <!-- id: 33 -->
    - [x] Verify Mismatch Detection on Bad Invoice <!-- id: 34 -->

- [x] Contract Risk Scoring & Redlines
    - [x] Design Risk & Redline Schemas <!-- id: 35 -->
    - [x] Create & Seed Clause Library (Vector Store) <!-- id: 36 -->
    - [x] Implement Identify & Retrieve Clauses Logic <!-- id: 37 -->
    - [x] Implement Risk Assessment Graph (Score + Redline) <!-- id: 38 -->
    - [x] Add Risk API Enpoints <!-- id: 39 -->
    - [x] Verify Risk Scoring on Contract <!-- id: 40 -->

- [x] AI UX + Review Workflow
    - [x] Create Frontend (Next.js + storage) <!-- id: 41 -->
    - [x] Implement Upload & Processing UI <!-- id: 42 -->
    - [x] Implement Findings Dashboard (Risk + Mismatch) <!-- id: 43 -->
    - [x] Implement Evidence Viewer (PDF + Highlights) <!-- id: 44 -->
    - [x] Design Audit Log Schema & API <!-- id: 45 -->
    - [x] Implement Review Actions (Approve/Override) <!-- id: 46 -->
    - [x] Implement Export Audit Report <!-- id: 47 -->

- [x] Evaluation & Monitoring
    - [x] Create Gold Dataset Generator (Synthetic PDFs) <!-- id: 48 -->
    - [x] Implement Metrics Logic (F1, Precision, Recall) <!-- id: 49 -->
    - [x] Create Eval Runner Script <!-- id: 50 -->
    - [x] Build Evaluation Dashboard (React) <!-- id: 51 -->
    - [x] Create Model Card <!-- id: 52 -->

- [x] Production Hardening
    - [x] Implement JWT Authentication & Users Table <!-- id: 53 -->
    - [x] Implement RBAC (AP vs Legal Roles) <!-- id: 54 -->
    - [x] Add Request Logging & Rate Limiting Middleware <!-- id: 55 -->
    - [x] Create GitHub Actions CI Pipeline <!-- id: 56 -->
    - [x] Create Deployment Documentation <!-- id: 57 -->
    - [x] Perform Security Audit (Checklist) <!-- id: 58 -->
