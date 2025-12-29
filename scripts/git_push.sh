#!/bin/bash
set -e

# 0. Prep Artifacts
echo "Preparing artifacts..."
mkdir -p docs/artifacts
cp "/Users/kaushikreddy/.gemini/antigravity/brain/3f544612-98ce-40c8-aa26-c0839038d485/"*.md docs/artifacts/ || echo "No artifacts found to copy"

# 1. Documentation artifacts
git add .gitignore
git commit -m "chore: Init project with gitignore" || echo "Nothing to commit for .gitignore"

git add docs/artifacts/
git commit -m "docs: Add project planning artifacts" || echo "Nothing to commit for artifacts"

# 2. Infra
git add docker-compose.yml
git commit -m "infra: Add Docker Compose configuration"

# 3. Backend Config
git add backend/requirements.txt backend/Dockerfile*
git commit -m "backend: Add requirements and Dockerfiles"

# 4. DB
git add backend/shared/database.py backend/alembic.ini backend/migrations/env.py
git commit -m "backend: Setup database connection and alembic"

git add backend/shared/models.py
git commit -m "backend: Define SQLAlchemy models"

git add backend/migrations/versions/
git commit -m "backend: Add initial migration scripts" || echo "No migrations found"

git add backend/shared/schemas.py
git commit -m "backend: Define Pydantic schemas"

# 5. Logic
git add backend/shared/ingestion.py
git commit -m "backend: Implement parsing and vector ingestion logic"

git add backend/worker/
git commit -m "backend: Setup Celery worker and tasks"

git add backend/shared/auth.py
git commit -m "backend: Implement JWT auth and role checking"

git add backend/shared/middleware.py
git commit -m "backend: Implement Request Logging and Rate Limiting middleware"

git add backend/shared/comparison.py
git commit -m "backend: Implement LangGraph comparison logic"

git add backend/shared/risk.py backend/seed_clauses.py
git commit -m "backend: Implement Risk Assessment and Seed script"

git add backend/api/main.py
git commit -m "backend: Implement FastAPI endpoints"

# 6. Evaluation & Scripts
git add backend/evaluation/
git commit -m "backend: Add evaluation generation and runner scripts"

git add backend/tests/
git commit -m "backend: Add unit tests" || echo "No tests found"

git add backend/create_risky_contract.py backend/create_bad_invoice.py scripts/
git commit -m "chore: Add synthetic data generation scripts"

git add *.pdf create_pdf.py
git commit -m "assets: Add test PDF files"

# 7. Frontend
git add frontend/package.json frontend/tsconfig.json frontend/next.config.mjs frontend/postcss.config.mjs frontend/tailwind.config.ts frontend/Dockerfile
git commit -m "frontend: Initialize Next.js app with Docker"

git add frontend/components/ui/ frontend/lib/utils.ts
git commit -m "frontend: Add Shadcn UI components"

git add frontend/lib/api.ts
git commit -m "frontend: Implement API client wrappers"

git add frontend/app/globals.css frontend/app/layout.tsx
git commit -m "frontend: Setup global styles and layout"

git add frontend/app/page.tsx
git commit -m "frontend: Implement Dashboard page"

git add frontend/app/documents/
git commit -m "frontend: Implement Document Details and Review UI"

git add frontend/app/evaluations/
git commit -m "frontend: Implement Evaluation Dashboard"

# 8. CI & Docs
git add .github/workflows/
git commit -m "ci: Add GitHub Actions CI pipeline"

git add Deployment.md
git commit -m "docs: Add Deployment Guide"

git add SecurityChecklist.md
git commit -m "docs: Add Security Checklist"

git add End_to_End_Guide.md
git commit -m "docs: Add End-to-End System Guide"

git add ModelCard.md
git commit -m "docs: Add AI Model Card"

git add README.md
git commit -m "docs: Add main README"

# 9. Cleanup & Push
git add .
git commit -m "chore: Add any remaining files" || echo "Nothing left to commit"

# Rename branch to main if not already
git branch -M main

echo "Pushing to origin..."
git push -u origin main

echo "Done!"
