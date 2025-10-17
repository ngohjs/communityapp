# communityapp

MVP skeleton for a Community App with a FastAPI backend and React frontend.

Quick start (backend only for Task 1.0)
- Prereqs: Python 3.9+, PostgreSQL 13+ (or use `docker-compose`)
- Create a virtualenv and install deps:
  - `python3 -m venv backend/venv`
  - `backend/venv/bin/pip install --upgrade pip`
  - `backend/venv/bin/pip install -r backend/requirements.txt`
- Configure env:
  - `cp backend/.env.example backend/.env` and adjust `DATABASE_URL` if needed
- Start Postgres (option A): local DB matching `DATABASE_URL`
- Start Postgres (option B): via Compose
  - `docker compose up -d db`
  - Then set `DATABASE_URL=postgresql+psycopg2://community_user:community_password@localhost:5432/community_db` in `backend/.env`
- Run migrations and seed:
  - `cd backend`
  - `../venv/bin/alembic upgrade head`
  - `../venv/bin/python -m backend.scripts.seed_dev`
- Run API:
  - From repo root: `backend/venv/bin/uvicorn backend.app.main:app --host 0.0.0.0 --port 8000`
- Tests:
  - `backend/venv/bin/python -m pytest backend`

Key backend files (Task 1.0)
- `backend/app/config.py` – Pydantic settings (reads `.env`)
- `backend/app/database.py` – SQLAlchemy engine/session helpers
- `backend/app/models/*` – ORM models
- `backend/alembic/*` – Migrations
- `backend/scripts/seed_dev.py` – Dev seed (categories + super-admin)
