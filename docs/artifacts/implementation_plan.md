# Production Hardening Implementation Plan

## Goal
Secure the application and prepare it for deployment with CI/CD and proper access controls.

## Components

### 1. Authentication & RBAC (`backend/shared/auth.py`, `backend/api/main.py`)
- **Dependencies**: `python-jose`, `passlib`, `bcrypt`, `python-multipart`.
- **Database**: Add `User` table to `shared/models.py`.
    - `id`, `username`, `email`, `hashed_password`, `role` (enum: 'admin', 'ap', 'legal').
- **Endpoints**:
    - `POST /token`: Login (username/password) -> Returns JWT.
    - `POST /users`: Register (Admin only).
- **Security**:
    - Protect all sensitive endpoints with `Depends(get_current_user)`.
    - Restrict `POST /findings/{id}/review` to `legal` or `admin`.
    - Restrict `POST /upload` to `ap` or `admin`.

### 2. Middleware (`backend/api/middleware.py`)
- **Logging**: Log every request ID, method, path, response status, and duration.
- **Rate Limiting**: Simple Redis-based limiter (e.g., 100 req/min per IP).

### 3. CI Pipeline (`.github/workflows/ci.yml`)
- Trigger on `push` to `main`.
- Steps:
    1. Checkout.
    2. Set up Python 3.11.
    3. Install dependencies (`backend/requirements.txt`).
    4. Run Linting (`ruff` or `flake8`).
    5. Build Docker Images (API, Worker, Frontend).

### 4. Documentation
- `Deployment.md`: Instructions for setting up `.env`, running Docker Compose.
- `SecurityChecklist.md`: List of security controls implemented.

## Execution Steps
1.  Install Auth dependencies.
2.  Update DB Schema (User table).
3.  Implement Auth Logic (JWT, Hashing).
4.  Protect Endpoints.
5.  Add Middleware.
6.  Create CI config.
7.  Write Docs.
