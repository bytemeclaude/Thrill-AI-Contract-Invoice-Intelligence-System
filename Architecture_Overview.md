# System Architecture Overview

This document provides a technical deep-dive into the architecture of the **AI Contract & Invoice Intelligence System**. The system is designed as a **Service-Oriented Architecture (SOA)**, containerized with Docker, ensuring scalability, separation of concerns, and maintainability.

---

## 🏗 High-Level Architecture Diagram

```mermaid
graph TD
    Client[Next.js Frontend] <-->|REST API| API[FastAPI Gateway]
    
    subgraph "Data Layer"
        Postgres[(PostgreSQL)]
        MinIO[(MinIO Object Storage)]
        Qdrant[(Qdrant Vector DB)]
        Redis[(Redis Broker)]
    end
    
    subgraph "Backend Services"
        API <--> Postgres
        API <--> MinIO
        API <--> Qdrant
        API -->|Enqueue Task| Redis
        
        Worker[Celery Processor]
        Worker <-->|Dequeue Task| Redis
        Worker -->|Read/Write| Postgres
        Worker -->|Read/Write| MinIO
        Worker -->|Embed & Index| Qdrant
    end
    
    subgraph "AI Inference"
        Worker -->|LLM Calls| LLM[External LLM (Mistral/OpenAI)]
    end
```

---

## 🧩 Component Breakdown

### 1. Frontend Layer
*   **Tech Stack**: Next.js 14, React, TypeScript, Tailwind CSS, Shadcn UI.
*   **Role**: Provides the user interface for uploading documents, reviewing findings, and visualizing metrics.
*   **Key Features**:
    *   **Dashboard**: Real-time status tracking of documents.
    *   **Split-Screen Review**: Side-by-side rendering of PDF and AI Findings.
    *   **Interactive Review**: Approving or overriding findings with audit comments.

### 2. API Gateway (Backend)
*   **Tech Stack**: Python (FastAPI), Pydantic, SQLAlchemy.
*   **Role**: The central entry point for all client requests.
*   **Responsibilities**:
    *   **Authentication**: Validates JWT tokens and enforces RBAC (Admin, AP, Legal).
    *   **Orchestration**: Manages document uploads and triggers background tasks.
    *   **Data Access**: Serves structured data (findings, statuses) to the frontend.
    *   **Middleware**: Handles request logging, rate limiting, and CORS.

### 3. Asynchronous Worker (Processing Engine)
*   **Tech Stack**: Celery, Python.
*   **Role**: Handles heavy computation and long-running AI tasks without blocking the API.
*   **Workflows**:
    *   **Ingestion**: PDF Parsing (`pdfplumber`) -> Chunking -> Embedding (`SentenceTransformers`) -> Qdrant Indexing.
    *   **Intelligence**: Executes LangGraph workflows for Extraction, Mismatch Detection, and Risk Assessment.

### 4. Data Layer
*   **PostgreSQL**: Stores relational data (Users, Document Metadata, Findings, Audit Logs).
*   **MinIO**: High-performance, S3-compatible object storage for raw PDF files.
*   **Qdrant**: Vector Database for semantic search (retrieving contract clauses or similar documents).
*   **Redis**: Message broker for the Celery task queue and caching rate-limit counters.

---

## 🤖 AI Logic & Pipelines

The system moves beyond simple RAG (Retrieval-Augmented Generation) by using **LangGraph** to model complex cognitive workflows.

### A. Invoice Extraction Pipeline
1.  **Classification**: Identify document type (Invoice vs Contract).
2.  **Schema Extraction**: Use LLM to extract JSON fields (Vendor, Amount, Date).
3.  **Validation**: Post-processing to ensure dates and numbers are formatted correctly.

### B. Mismatch Detection Engine
1.  **Retrieval**: Given an Invoice, find the associated Contract via Vendor Name matching in Qdrant.
2.  **Parametric Comparison**:
    *   *Logic*: `Invoice.Total <= Contract.Rate`?
    *   *Logic*: `Invoice.Terms == Contract.Terms`?
3.  **Flagging**: Create `Finding` records for any violations.

### C. Legal Risk Assessment
1.  **Clause Segmentation**: Break contract into legal clauses.
2.  **Semantic Search**: Match each clause against a "Golden Standard" library of safe clauses.
3.  **Redlining**: If a clause deviates significantly (high risk), the LLM generates a redline (suggested edit) to bring it back to safety.

---

## 🔒 Security Architecture

*   **Stateless Auth**: JWT (JSON Web Tokens) for scalability.
*   **RBAC**: Role-Based Access Control limits actions (e.g., only `Legal` role can override risk findings).
*   **Rate Limiting**: Redis-backed sliding window limiter prevents abuse.
*   **Input Validation**: Strict Pydantic schemas prevent injection and malformed data.
*   **Isolation**: Database and Vector DB are isolated in the internal Docker network; only the API and Frontend ports are exposed.
