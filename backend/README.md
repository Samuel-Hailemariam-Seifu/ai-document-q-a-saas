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

### Database (Postgres)

Set `DATABASE_URL` in `backend/.env`. Example:

`postgresql+psycopg://postgres:postgres@localhost:5432/documind`

Run migrations:

```bash
.venv/Scripts/python -m alembic -c alembic.ini upgrade head
```

### Run the API

```bash
.venv/Scripts/python -m uvicorn app.main:app --reload --port 8000
```

### Auth endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `GET /api/auth/me` (requires `Authorization: Bearer <access_token>`)

