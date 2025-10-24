.PHONY: init install migrate seed run test lint lint-backend lint-frontend format format-backend format-frontend

PY=backend/venv/bin/python
PIP=backend/venv/bin/pip
ALEMBIC=backend/venv/bin/alembic
UVICORN=backend/venv/bin/uvicorn

init:
	python3 -m venv backend/venv
	$(PIP) install --upgrade pip
	$(PIP) install -r backend/requirements.txt

install:
	$(PIP) install -r backend/requirements.txt

migrate:
	cd backend && ../venv/bin/alembic upgrade head

seed:
	cd backend && ../venv/bin/python -m backend.scripts.seed_dev

run:
	$(UVICORN) backend.app.main:app --host 0.0.0.0 --port 8000

test:
	$(PY) -m pytest backend

lint-backend:
	backend/venv/bin/ruff check backend/app backend/tests
	backend/venv/bin/black --check backend/app backend/tests

lint-frontend:
	cd frontend && npm run lint

lint: lint-backend lint-frontend

format-backend:
	backend/venv/bin/ruff check backend/app backend/tests --fix
	backend/venv/bin/black backend/app backend/tests

format-frontend:
	cd frontend && npm run format

format: format-backend format-frontend
