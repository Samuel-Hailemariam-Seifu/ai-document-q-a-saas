## Backend (FastAPI)

### Setup

Create a virtualenv and install dependencies:

```bash
python -m venv .venv
.venv/Scripts/pip install -r requirements.txt
```

Create `.env` from the example:

```bash
copy .env.example .env
```

### Database (Postgres + pgvector)

Set `DATABASE_URL` in `backend/.env`. Example:

`postgresql+psycopg://postgres:postgres@localhost:5432/documind`

Use a Postgres image/extension that includes **pgvector** (Compose: `pgvector/pgvector:pg16`). On Supabase, enable the `vector` extension in the dashboard if `CREATE EXTENSION` fails.

Default embedding column is `vector(1536)` — set `OPENAI_API_KEY` (or re-embed after changing dim/model). `KEYWORD_BACKEND=postgres|bm25` selects keyword ranking.

Run migrations:

```bash
.venv/Scripts/python -m alembic -c alembic.ini upgrade head
```

Compare old vs new retrieval (before dropping the legacy `embedding` array column):

```bash
.venv/Scripts/python -m scripts.compare_retrieval --workspace-id 1
```

Tests create and drop `documind_test` (never the dev DB):

```bash
.venv/Scripts/python -m pytest -q
```

### Run the API

```bash
.venv/Scripts/python -m uvicorn app.main:app --reload --port 8000
```

### Document ingestion (Celery + Redis)

For document processing (extract text → chunk → embed → store) you need **Redis** and an **OpenAI API key**.

1. Set in `.env`:
   - `REDIS_URL=redis://localhost:6379/0`
   - `OPENAI_API_KEY=sk-your-key`

2. **Start Redis** (required unless using inline ingest). Options:
   - **Docker**: `docker run -d -p 6379:6379 redis`
   - **Windows**: Install [Redis for Windows](https://github.com/microsoftarchive/redis/releases) or use WSL/Docker, then run `redis-server`.
   - **macOS**: `brew install redis && brew services start redis` or `redis-server`

3. Run the Celery worker from the `backend` directory:
   ```bash
   .venv/Scripts/celery -A app.tasks.celery_app worker --loglevel=info
   ```
   On Windows the app uses the `solo` pool by default to avoid `PermissionError`; no extra flags needed.

**Without Redis:** Set `RUN_INGEST_INLINE=true` in `.env`. Document ingestion will run in the API process after each upload (no Celery worker needed). The request may take a few seconds while the document is processed. Use for local development when Redis is not available.

### Auth endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `GET /api/auth/me` (requires `Authorization: Bearer <access_token>`)

