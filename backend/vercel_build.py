"""Vercel build hook: apply Alembic migrations when DATABASE_URL / DIRECT_URL is set."""

from __future__ import annotations

import os
import subprocess
import sys


def main() -> int:
    if not (os.environ.get("DATABASE_URL") or os.environ.get("DIRECT_URL")):
        print("Skipping migrations: DATABASE_URL not set")
        return 0
    print("Running alembic upgrade head…")
    result = subprocess.run(
        [sys.executable, "-m", "alembic", "-c", "alembic.ini", "upgrade", "head"],
        check=False,
    )
    if result.returncode != 0:
        print("Alembic failed — ensure DIRECT_URL points at a session-mode Postgres and pgvector is enabled.")
        return result.returncode
    print("Migrations OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
