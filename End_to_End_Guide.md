# End-to-End System Guide

This document provides a detailed explanation of how the **AI Contract & Invoice Intelligence System** works under the hood, traversing the path of a document from initial upload to final actionable insight. It also outlines the necessary requirements to run and maintain the system.

---

## 🔄 End-to-End Workflow

### 1. Document Ingestion
**User Action**: The user uploads a PDF (Invoice or Contract) via the Next.js Dashboard.

1.  **API Receipt**: The Request hits `POST /upload` on the FastAPI backend.
2.  **Storage**: The raw file is securely stored in **MinIO** (Object Storage) with a unique ID.
3.  **Database Entry**: A metadata record (`Document` table) is created in **PostgreSQL** with status `PENDING`.
4.  **Async Task**: A message is pushed to **Redis** to trigger the background worker.

### 2. Processing Engine (The Worker)
**Trigger**: The Celery Worker picks up the task from Redis.

1.  **Parsing**: The worker downloads the file from MinIO and uses `pdfplumber` to extract high-fidelity text.
2.  **Chunking**: The text is split into semantic chunks (overlapping segments) to optimize for AI retrieval.
3.  **Embedding**: Each chunk is converted into a vector (numerical representation) using the `all-MiniLM-L6-v2` model.
4.  **Indexing**: These vectors are pushed to **Qdrant**, enabling semantic search (e.g., finding "Liability" clauses even if referenced as "Indemnification").

### 3. Intelligence Layer (AI & Graphs)
This is where the core logic resides, powered by **LangGraph**.

#### A. Data Extraction (Invoices)
-   **Graph Flow**: `Classify Document` -> `Extract Fields` -> `Validate Data`.
-   **LLM**: The system prompts Mistral/OpenAI to extract structured JSON (Vendor, Date, Amount, etc.) from the unstructured PDF text.

#### B. Mismatch Detection (Invoice vs. Contract)
-   **Retrieval**: When an Invoice is analyzed, the system searches Qdrant for the corresponding Contract (matching Vendor Name).
-   **Logic**: It compares specific terms:
    -   *Does the Invoice Total exceed the Contract Rate?*
    -   *Are the Payment Terms (e.g., Net 30) consistent?*
-   **Output**: Discrepancies are flagged as "Mismatch Findings" in the database.

#### C. Risk Assessment (Contracts)
-   **Semantic Search**: The system scans the contract for standard legal clauses (e.g., Liability, Termination).
-   **Evaluation**: It compares the actual clause text against a "Gold Standard" safe version.
-   **Scoring**: The LLM assigns a risk score (1-10) and generates "Redlines" (suggested edits) for high-risk language.

### 4. Review & Action
**User Action**: The User opens the specific document in the Dashboard.

1.  **Visualization**: The Frontend fetches the PDF URL and renders it alongside the findings.
2.  **Human-in-the-Loop**: The User reviews each finding:
    -   **Approve**: Confirms the AI's finding is correct.
    -   **Override**: Rejects the finding (e.g., "This exception was pre-approved").
3.  **Audit Trail**: Every decision is logged in the `ReviewDecision` table with the user's ID and timestamp.

---

## 📋 System Requirements

To run this system effectively, the following resources and configurations are required.

### 1. Infrastructure Requirements
The system is containerized, but the host machine needs:
-   **Docker Engine**: v20.10+
-   **Docker Compose**: v2.0+
-   **RAM**: Minimum 8GB (recommended 16GB) to handle Vector DB and LLM inference if running local models.
-   **CPU**: 4+ Cores recommended.

### 2. Service Dependencies
These services are orchestrated via Docker Compose:
-   **PostgreSQL 15**: For relational data (users, documents, findings).
-   **Qdrant**: For vector storage and similarity search.
-   **MinIO**: S3-compatible object storage for files.
-   **Redis 7**: Message broker for the task queue.

### 3. External APIs
-   **LLM Provider**: You must have an API Key for one of the following:
    -   **OpenAI** (`OPENAI_API_KEY`) - Models: `gpt-3.5-turbo` or `gpt-4o`.
    -   **Mistral** (`MISTRAL_API_KEY`) - Models: `mistral-medium` or `mistral-large`.

### 4. Software Stack
If developing or running locally without Docker:
-   **Python 3.10+**:
    -   `fastapi`, `celery`, `sqlalchemy`, `langchain`, `pydantic`
    -   `sentence-transformers`, `qdrant-client`, `minio`
-   **Node.js 18+**:
    -   `next`, `react`, `tailwindcss`, `lucide-react`
    -   `shadcn-ui` components

### 5. Security Requirements (Production)
-   **HTTPS/TLS**: Required for all web traffic.
-   **Environment Variables**: Secrets (API Keys, DB Passwords) must be injected securely, NOT hardcoded.
-   **Network**: Database and Vector ports (5432, 6333) should not be exposed to the public internet.
