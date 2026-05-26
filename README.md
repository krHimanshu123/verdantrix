# Verdantrix

Verdantrix is a small ESG operations workspace for analysts. It focuses on the day-to-day mechanics that make emissions data reviewable: preserving source rows, normalizing them into a consistent shape, applying lightweight quality checks, and recording analyst actions in an audit trail.

This repository is intentionally scoped for local evaluation and review. It is not trying to model every reporting requirement or external system integration.

## Architecture

- **Backend** (`backend/`): Django + Django REST Framework API (JWT auth, ingestion, normalization, validation/anomaly scoring, review actions, audit logging, dashboard metrics)
- **Frontend** (`frontend/`): React + TypeScript + Tailwind UI (login/register, dashboard, upload center, review console, audit timeline)
- **Database**: MySQL 8 (provided via `docker-compose.yml` for local dev)
- **Sample data** (`sample-data/`): CSV exports and a travel sync payload used by the seed command

## Ingestion workflow

1. Analyst selects an organization context.
2. Data enters via:
   - SAP CSV upload
   - Utility billing CSV upload
   - Travel sync (mock payload; API-shaped)
3. Each source row is persisted as an immutable **RawRecord** with row number + raw payload.
4. An ingestion run is tracked as a **DataSource** record with status (`processing` → `completed` / `failed`).

## Normalization workflow

1. Source-specific normalizers map each raw row into a **NormalizedEmissionRecord**.
2. Units are standardized where possible (e.g., gallons → liters, MWh → kWh).
3. A derived estimate (CO2e) is calculated using embedded constants for deterministic local runs.
4. The normalized record keeps a clear `source_reference` to support review and audit.

## Validation + review lifecycle

1. A new normalized record is evaluated for basic quality signals:
   - missing fields
   - future dates
   - potential duplicates
   - high-consumption outliers vs. baseline / static thresholds
2. The record receives:
   - `validation_status` (`valid` / `flagged` / `rejected`)
   - `anomaly_score` (0–99.99)
3. Analysts can:
   - add/update notes
   - approve or reject
   - **lock for audit** (terminal state; locked records cannot be edited)
4. Material state changes are written as **AuditLog** entries.

## Local setup

### 1) Start MySQL

```bash
docker compose up -d
```

This starts MySQL on `127.0.0.1:3306` with database `verdantrix_core`.

### 2) Start the backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python manage.py migrate
python manage.py load_verdantrix_sample_data
python manage.py runserver
```

Once the backend is running, create an account in the UI (or call `POST /api/auth/register/`).

### 3) Start the frontend

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

- UI: `http://localhost:5173`
- API: `http://127.0.0.1:8000/api`

## Deployment notes (non-goals)

This repository is set up for local runs. If you deploy it, treat it like a normal Django + React project:

- Set `DJANGO_SECRET_KEY` to a real secret, set `DJANGO_DEBUG=False`, and restrict `DJANGO_ALLOWED_HOSTS`.
- Provide a managed MySQL instance and set `MYSQL_*` env vars.
- Serve the frontend build artifacts from a static host (or behind a reverse proxy) and configure CORS accordingly.
- Consider proper file storage for uploads (the prototype focuses on row-level lineage rather than durable blob storage).

## API overview

Authentication:

- `POST /api/auth/register/`
- `POST /api/auth/login/`
- `POST /api/auth/refresh/`
- `GET /api/auth/me/`

Ingestion:

- `POST /api/ingestion/sap/upload/`
- `POST /api/ingestion/utility/upload/`
- `POST /api/travel/sync/`
- `GET /api/data-sources/`

Records + review:

- `GET /api/records/` (supports filters + ordering where implemented)
- `PATCH /api/records/{id}/`
- `POST /api/reviews/{id}/action/`

Analytics + audit:

- `GET /api/dashboard/metrics/`
- `GET /api/audit-logs/`
- `GET /api/organizations/`

## Project structure

```text
backend/
  apps/
    ingestion/        uploads, DataSource/RawRecord persistence
    normalization/    normalized records + validation
    reviews/          auth endpoints + review actions
    audit/            audit log models + viewsets
    analytics/        dashboard metrics
    organizations/    org tenancy boundary
    users/            custom user model (role + org)
  common/             shared helpers (responses, pagination, constants)
  config/             Django settings + URL routing

frontend/
  src/
    pages/            login/register/dashboard/upload/review/audit
    components/       UI building blocks
    services/         API client, auth storage, token refresh

sample-data/          local seed inputs
docs/                 reviewer-facing notes and screenshots
```

## Assumptions and tradeoffs

- Raw inputs are append-only; normalized records are the analyst working surface.
- Travel sync is mocked to keep focus on review/audit mechanics.
- Emission factors are embedded constants (deterministic local runs; not a governance model).
- Authorization is intentionally lightweight (single-org membership + role field).

More detail:

- [MODEL.md](./MODEL.md)
- [DECISIONS.md](./DECISIONS.md)
- [TRADEOFFS.md](./TRADEOFFS.md)
- [SOURCES.md](./SOURCES.md)
