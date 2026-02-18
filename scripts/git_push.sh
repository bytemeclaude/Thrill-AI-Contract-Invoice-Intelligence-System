#!/bin/bash
set -e

# Function for idempotent commit
commit() {
    git commit -m "$1" || echo "Step '$1' - Nothing to commit (already done)"
}

# 1. Documentation artifacts
git add .gitignore
commit "chore: Init project with gitignore"

git add docs/artifacts/
commit "docs: Add project planning artifacts"

# 2. Infra
git add docker-compose.yml
commit "infra: Add Docker Compose configuration"

# 3. Backend Config
git add backend/requirements.txt backend/Dockerfile*
commit "backend: Add requirements and Dockerfiles"

# 4. DB
git add backend/shared/database.py backend/alembic.ini backend/migrations/env.py backend/migrations/script.py.mako
commit "backend: Setup database connection and alembic"

git add backend/shared/models.py
commit "backend: Define SQLAlchemy models"

git add backend/migrations/versions/
commit "backend: Add initial migration scripts"

git add backend/shared/schemas.py
commit "backend: Define Pydantic schemas"

# 5. Logic
git add backend/shared/ingestion.py
commit "backend: Implement parsing and vector ingestion logic"

git add backend/shared/extraction.py
commit "backend: Implement extraction logic"

git add backend/worker/
commit "backend: Setup Celery worker and tasks"

git add backend/shared/auth.py
commit "backend: Implement JWT auth and role checking"

git add backend/shared/middleware.py
commit "backend: Implement Request Logging and Rate Limiting middleware"

git add backend/shared/comparison.py
commit "backend: Implement LangGraph comparison logic"

git add backend/shared/risk.py backend/seed_clauses.py
commit "backend: Implement Risk Assessment and Seed script"

git add backend/api/main.py
commit "backend: Implement FastAPI endpoints"

# 6. Evaluation & Scripts
git add backend/evaluation/
commit "backend: Add evaluation generation and runner scripts"

git add backend/tests/
commit "backend: Add unit tests"

git add backend/create_risky_contract.py backend/create_bad_invoice.py scripts/
commit "chore: Add synthetic data generation scripts"

git add *.pdf create_pdf.py backend/*.pdf
commit "assets: Add test PDF files"

# 7. Frontend
# Configs
git add frontend/package.json frontend/tsconfig.json frontend/next.config.ts frontend/postcss.config.mjs frontend/Dockerfile
commit "frontend: Initialize Next.js app with Docker"

# Libs (API, Utils if present)
git add frontend/lib/
commit "frontend: Implement API client and utilities"

# Source (Globals, Layout)
git add frontend/src/
commit "frontend: Setup global styles, layout and src structure"

# App Router Pages (Dashboard, Documents, Evals)
git add frontend/app/
commit "frontend: Implement Dashboard, Document, and Evaluation pages"

# 8. CI & Docs
git add .github/workflows/
commit "ci: Add GitHub Actions CI pipeline"

git add Deployment.md
commit "docs: Add Deployment Guide"

git add SecurityChecklist.md
commit "docs: Add Security Checklist"

git add End_to_End_Guide.md
commit "docs: Add End-to-End System Guide"

git add ModelCard.md
commit "docs: Add AI Model Card"

git add README.md
commit "docs: Add main README"

# 9. Cleanup & Push
git add .
commit "chore: Add any remaining files"

# Rename branch to main if not already
git branch -M main

echo "Pushing to origin..."
git push -u origin main

echo "Done!"
