## AI Document Q&A SaaS

Full‑stack AI-powered SaaS platform where users upload documents (PDF/TXT/DOCX) and ask questions against their private workspace knowledge base. The system uses a Retrieval‑Augmented Generation (RAG) pipeline to return **grounded answers with citations**.

This repository is suitable as:
- a GitHub portfolio project
- an MVP foundation for client work (Upwork)
- a reviewable reference implementation of RAG + async ingestion + SaaS primitives

---

## 🚀 Overview

### What it does
- Ingests uploaded documents into text chunks + embeddings
- Retrieves the most relevant chunks per question
- Generates an answer using an LLM constrained to retrieved context
- Returns citations (document, chunk, page number, excerpt) to support trust and auditing

### Who it is for
- Teams building a “Chat with your docs” product
- Agencies shipping an MVP for a client with clear upgrade paths (billing, email, vector DB)
- Engineers evaluating a clean FastAPI + React implementation of RAG

### Key value proposition
- **Trustworthy AI outputs**: citations + “answer only from context” prompting
- **Workspace isolation**: per-user workspaces with document + chat separation
- **Scalable pipeline**: async ingestion via Redis + Celery with an inline fallback for simple dev

---

## ✨ Features

### Core Features
- **Authentication (JWT)**: register/login, access + refresh tokens, current-user endpoint
- **Workspace management**: create/list/select workspaces (owned by the authenticated user)
- **Document upload & management**:
  - Upload PDF/TXT/DOCX (server-side validation; **25MB** max per file)
  - List documents, view details, delete documents
  - View extracted chunks for inspection/debugging
- **Background document processing**:
  - Extract text (PDF/TXT/DOCX)
  - Chunking with overlap
  - Embedding generation (OpenAI or local FastEmbed)
  - Status tracking: pending/processing/ready/failed + error message
- **Embeddings + vector search**:
  - Embeddings persisted in PostgreSQL
  - Retrieval by cosine similarity (MVP computes similarity in Python; see “Future improvements” for pgvector)
- **AI chat with documents**:
  - Workspace-scoped chats
  - Stores messages and citations
- **Citation-based answers**: chunk-level citations with excerpts + metadata
- **Chat history**: list chats; fetch message history for a chat

### Advanced Features
- **Multi-workspace support**: separate document + chat corpora per workspace
- **Async processing with Celery**: background ingestion worker via Redis queue
- **Scalable architecture**: services split by domain (auth, docs, retrieval, LLM, billing, email)
- **Error handling & status tracking**: ingestion failures are captured and surfaced
- **Modular backend services**: clean separation of API routes, services, tasks, and models
- **Billing (Stripe) (MVP-ready)**:
  - Subscription checkout session
  - Billing portal session
  - Webhook handler to sync subscription status into the database
- **Email flows (optional)**: verify email + reset password via Resend (no-op if not configured)

---

## 🧠 How It Works (RAG Explanation)

At a high level, each question follows a “retrieve → generate” workflow.

### 1) Document ingestion
1. User uploads a document to a workspace.
2. The backend stores the file and creates a `Document` row with status `pending`.
3. A worker (Celery) or inline job extracts text from the file.

### 2) Chunking
Extracted text is split into overlapping chunks (configurable chunk size and overlap). Chunking improves retrieval quality by narrowing context to the most relevant sections.

### 3) Embeddings
Each chunk is converted into a vector embedding:
- **Preferred**: OpenAI embeddings when `OPENAI_API_KEY` is configured
- **Fallback**: local embeddings via **FastEmbed** when OpenAI is not configured

### 4) Vector search (retrieval)
When a user asks a question:
1. The question is embedded into a query vector.
2. The system scores stored chunk embeddings against the query (cosine similarity).
3. The top \(K\) chunks are selected, then optionally expanded with neighbor chunks to provide continuity.

> Note: The MVP stores embeddings in PostgreSQL as a float array and computes similarity in Python. The repo includes `pgvector` as a dependency to support a production upgrade to DB-side vector indexes.

### 5) LLM answer generation
The LLM is prompted with:
- strict system instructions (“use only provided context”)
- the retrieved chunk text blocks
- the user question

The backend supports **Groq (OpenAI-compatible)** when `GROQ_API_KEY` is set, otherwise **OpenAI** when `OPENAI_API_KEY` is set.

### 6) Citations
Alongside the answer, the API returns citations including:
- document id + filename
- chunk id
- page number (when available)
- an excerpt for quick review

This makes responses verifiable and user-friendly.

---

## 🏗️ Architecture

### A) Text explanation
- **Frontend (React + Vite)**: authentication UI, workspace selection, document upload + status, chat UI with citations, billing screen.
- **Backend (FastAPI)**: REST API, JWT auth, workspace authorization, ingestion orchestration, retrieval, LLM calls, Stripe + webhook endpoints.
- **PostgreSQL**: persists users, workspaces, documents, chunks (including embeddings), chats, messages, subscriptions.
- **Redis**: queue and broker for background ingestion.
- **Celery worker**: executes ingestion tasks (extract → chunk → embed → store) out-of-band.
- **Storage**: local filesystem path (Docker volume or local directory). The design supports migration to S3-compatible storage.
- **AI providers**: OpenAI/Groq for LLM; OpenAI or local FastEmbed for embeddings.

### B) Architecture diagram (Mermaid)

```mermaid
graph TD
  U[User] --> F[Frontend (React SPA / Next.js-compatible)]
  F -->|HTTPS JSON| API[FastAPI Backend]

  API --> DB[(PostgreSQL)]
  API -->|store files| ST[Storage (Local / S3)]
  API --> R[(Redis)]

  R --> W[Celery Worker]
  W --> DB
  W --> ST

  API -->|LLM + Embeddings| OA[OpenAI API]
  API -->|LLM (optional)| G[Groq API]
  API -->|Email (optional)| E[Resend]
  API -->|Billing| S[Stripe]
  S -->|Webhooks| API
```

---

## 🛠️ Tech Stack

### Frontend
- React + TypeScript
- Vite
- Tailwind CSS

> If you prefer **Next.js**, the API contract and UI flows are already compatible; migrating the SPA to Next.js is straightforward.

### Backend
- FastAPI
- SQLAlchemy + Alembic
- Celery (async ingestion)

### Database & Infra
- PostgreSQL
- Redis
- (Upgrade path) **pgvector** for indexed vector search

### AI
- OpenAI API (embeddings + chat completions)
- Groq API (OpenAI-compatible, optional)
- Local embeddings via FastEmbed (fallback)

---

## 📁 Project Structure

```bash
frontend/           # React UI (Vite + Tailwind)
backend/            # FastAPI app, DB models/migrations, Celery tasks
docker-compose.yml  # Local production-like stack (db, redis, api, worker, frontend)
```

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js 20+
- Python 3.11+
- PostgreSQL 16+
- (Optional) Redis 7+ for background ingestion
- (Optional) Docker + Docker Compose for one-command setup

---

### Backend setup (recommended for local dev)

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\pip install -r requirements.txt
copy .env.example .env
.\.venv\Scripts\python -m alembic upgrade head
.\.venv\Scripts\python -m uvicorn app.main:app --reload --port 8000
```

Health check:
- `GET http://localhost:8000/health`

---

### Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Create `frontend/.env` from `frontend/.env.example`:

```env
VITE_API_BASE_URL=http://localhost:8000
```

Frontend:
- `http://localhost:5173`

---

### Running with Docker (production-like)

Set env vars in your shell (at minimum one of `GROQ_API_KEY` or `OPENAI_API_KEY`), then:

```bash
docker compose up --build
```

Services:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`
- Postgres: `localhost:5432`
- Redis: `localhost:6379`

---

## Environment Variables

### Frontend (`frontend/.env`)
- `VITE_API_BASE_URL` (example: `http://localhost:8000`)

### Backend (`backend/.env`)

#### Core
- `DATABASE_URL` (example: `postgresql+psycopg://postgres:postgres@localhost:5432/documind`)
- `JWT_SECRET`
- `ACCESS_TOKEN_EXPIRE_MINUTES`
- `REFRESH_TOKEN_EXPIRE_DAYS`
- `BACKEND_CORS_ORIGINS` (comma-separated list; example `http://localhost:5173`)
- `STORAGE_PATH` (local directory for uploaded files)

#### Ingestion
- `RUN_INGEST_INLINE` (`true` = ingest in API process; `false` = enqueue Celery job)
- `REDIS_URL` (required for Celery mode; example `redis://localhost:6379/0`)

#### AI provider (set at least one)
- `GROQ_API_KEY` (preferred for LLM if set)
- `OPENAI_API_KEY` (required for OpenAI embeddings and/or OpenAI LLM)

Optional model tuning:
- `OPENAI_EMBEDDING_MODEL` (default: `text-embedding-3-small`)
- `LOCAL_EMBEDDING_MODEL` (default: `BAAI/bge-small-en-v1.5`)
- `LLM_MODEL` (Groq default: `llama-3.1-8b-instant`)
- `CHUNK_SIZE`, `CHUNK_OVERLAP`
- `RETRIEVAL_TOP_K`, `RETRIEVAL_NEIGHBOR_WINDOW`

#### Billing (Stripe) (optional)
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_PRO_MONTHLY` (must start with `price_`)
- `STRIPE_SUCCESS_URL`
- `STRIPE_CANCEL_URL`

#### Email (Resend) (optional)
- `FRONTEND_BASE_URL`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `REQUIRE_EMAIL_VERIFICATION`

---

## 🔄 API Overview

High-level endpoints (REST):

### Auth (`/api/auth`)
- `POST /register`
- `POST /login`
- `POST /refresh`
- `GET /me`
- `POST /request-verification`
- `POST /verify-email`
- `POST /forgot-password`
- `POST /reset-password`

### Workspaces (`/api/workspaces`)
- `GET /api/workspaces`
- `POST /api/workspaces`
- `GET /api/workspaces/{workspace_id}`

### Documents
- `GET /api/workspaces/{workspace_id}/documents`
- `POST /api/workspaces/{workspace_id}/documents/upload`
- `GET /api/documents/{document_id}`
- `GET /api/documents/{document_id}/chunks`
- `DELETE /api/documents/{document_id}`

### Chat
- `GET /api/workspaces/{workspace_id}/chats`
- `POST /api/workspaces/{workspace_id}/chats`
- `GET /api/chats/{chat_id}/messages?workspace_id=...`
- `POST /api/workspaces/{workspace_id}/chat`

### Billing (`/api/billing`) (optional)
- `GET /api/billing/workspaces/{workspace_id}`
- `POST /api/billing/workspaces/{workspace_id}/checkout`
- `POST /api/billing/workspaces/{workspace_id}/portal`
- `POST /api/billing/webhook`

---

## 📸 Screenshots (placeholders)

Add images under a `docs/` folder and update these links:
- **Dashboard**: `docs/screenshots/dashboard.png`
- **Document upload & status**: `docs/screenshots/documents.png`
- **Chat + citations**: `docs/screenshots/chat.png`
- **Billing**: `docs/screenshots/billing.png`

---

## 🚀 Future Improvements

Practical upgrades for a production SaaS:
- **pgvector + ANN indexes** for fast DB-side retrieval at scale (HNSW/IVFFlat)
- **Streaming responses** (SSE/WebSockets) for better chat UX
- **Role-based access control** (orgs, members, permissions)
- **Usage metering & rate limits** (per workspace / plan)
- **More ingestion formats** (HTML, PPTX) + OCR for scanned PDFs
- **Model routing** (quality/cost tiers, fallbacks, evals)
- **Analytics** (query volume, ingestion time, retrieval quality metrics)
- **Integrations** (Slack, Teams, WhatsApp, Drive/Dropbox)

---

## 📄 License

MIT (placeholder). Add a `LICENSE` file to formalize usage terms.

---

## Notes
- Backend details: `backend/README.md`
- Frontend details: `frontend/README.md`
