# Community App

FastAPI + React/Vite application delivering community content, profiles, and admin tooling.

## Requirements

- Python 3.9+
- Node.js 20+
- Docker (optional but recommended for full stack parity)

## Quick start with Docker Compose

```bash
docker compose up --build
```

- API available at <http://localhost:8000> (docs at `/docs`)
- Frontend served from <http://localhost:5173>
- PostgreSQL runs inside Docker; application media persists in the `backend_media` volume

To stop:

```bash
docker compose down
```

## Manual setup

### Backend

```bash
python3 -m venv backend/venv
backend/venv/bin/pip install --upgrade pip
backend/venv/bin/pip install -r backend/requirements.txt
cp backend/.env.example backend/.env  # adjust DATABASE_URL if required

# start Postgres locally or via Docker
docker compose up -d db

# apply migrations & seed initial data
cd backend
../venv/bin/alembic upgrade head
../venv/bin/python -m backend.scripts.seed_dev

# run the API
cd ..
backend/venv/bin/uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Visit <http://localhost:5173>. The frontend expects the API at `http://localhost:8000`.

## Linting & tests

The project ships with Ruff/Black for Python and ESLint/Prettier for TypeScript.

```bash
# lint & format helpers
make lint          # ruff/black + eslint
make format        # auto-fix backend + frontend

# run automated tests
make test          # pytest suite
npm run build      # type-check + bundle frontend

GitHub Actions workflow (`.github/workflows/ci.yml`) runs the same lint + test matrix on every push/PR.
```

## Environment variables

| Name | Location | Description |
| ---- | -------- | ----------- |
| `DATABASE_URL` | `backend/.env` | SQLAlchemy connection string |
| `MEDIA_ROOT` | env / compose | Directory for uploaded content files |
| `LOG_LEVEL` | env / compose | Logging verbosity (`INFO`, `DEBUG`, etc.) |
| `VITE_API_BASE_URL` | `frontend` build args | API base URL used by the frontend |

### Test accounts

Running `make seed` (or the docker compose stack) will provision two logins by default:

| Role | Email | Password |
| ---- | ----- | -------- |
| Admin | `admin@example.com` | `ChangeMe123!` |
| QA Member | `member.qa@example.com` | `MemberPass123!` |

You can tweak these in `backend/.env` via the `SEED_ADMIN_*` and `SEED_MEMBER_*` variables before seeding.

## Observability

- Health check: `GET /health`
- Metrics placeholder: `GET /metrics` (exposes structured payload for future monitoring)
- Logs are emitted as JSON via `python-json-logger`

## Useful Make targets

| Command | Purpose |
| ------- | ------- |
| `make init` | Bootstrap backend virtualenv |
| `make migrate` | Apply latest Alembic migrations |
| `make seed` | Seed admin user and sample categories |
| `make run` | Run backend locally |
| `make lint` | Run Ruff/Black and ESLint |
| `make format` | Auto-format backend & frontend |

## Project structure

- `backend/app/` – FastAPI application modules
- `backend/scripts/` – Utility scripts (`seed_dev`)
- `frontend/src/` – React routes, hooks, and layouts
- `docker-compose.yml` – Full stack orchestration with Postgres, backend, frontend
