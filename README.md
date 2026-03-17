## DocuMind AI — Document Q&A SaaS MVP

Production-style MVP that lets users:
- sign up / log in
- create workspaces
- upload documents (PDF/TXT/DOCX)
- ingest documents into chunks + embeddings
- chat with grounded answers + citations

### Tech stack
- **Frontend**: React + TypeScript + Vite + Tailwind
- **Backend**: FastAPI + SQLAlchemy + Alembic
- **Async ingestion**: Celery + Redis (optional inline mode for local dev)
- **DB**: PostgreSQL
- **AI**: OpenAI (embeddings + chat completions)

### Running locally (recommended)

#### 1) Frontend
```bash
npm install
npm run dev
```

Create `.env` from `.env.example` and set:
```env
VITE_API_BASE_URL=http://localhost:8000
```

#### 2) Backend
```bash
cd backend
python -m venv .venv
.\.venv\Scripts\pip install -r requirements.txt
copy .env.example .env
.\.venv\Scripts\python -m alembic upgrade head
.\.venv\Scripts\python -m uvicorn app.main:app --reload --port 8000
```

### Document ingestion modes

#### Option A: Inline ingest (no Redis/Celery)
Set in `backend/.env`:
```env
RUN_INGEST_INLINE=true
```
Uploads will process in the API process (slower request, simplest setup).

#### Option B: Background ingest (Redis + Celery)
1. Start Redis.
2. Set in `backend/.env`:
```env
RUN_INGEST_INLINE=false
REDIS_URL=redis://localhost:6379/0
OPENAI_API_KEY=sk-...
```
3. Start worker:
```bash
cd backend
.\.venv\Scripts\celery -A app.tasks.celery_app worker --loglevel=info
```

### Docker (one command)
Set env vars in your shell (at minimum `OPENAI_API_KEY`), then:
```bash
docker compose up --build
```

Frontend: `http://localhost:5173`  
Backend: `http://localhost:8000`

### API quick reference
- **Auth**: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh`, `GET /api/auth/me`
- **Workspaces**: `GET/POST /api/workspaces`
- **Documents**: upload/list/detail/delete + `GET /api/documents/{id}/chunks`
- **Chat**: list/create chats + `POST /api/workspaces/{workspace_id}/chat`
