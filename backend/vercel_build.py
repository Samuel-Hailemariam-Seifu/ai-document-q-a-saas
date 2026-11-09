"""Vercel build hook: apply Alembic migrations when DATABASE_URL / DIRECT_URL is set."""

from __future__ import annotations

import os
import subprocess
import sys


def main() -> int:
    url = os.environ.get("DIRECT_URL") or os.environ.get("DATABASE_URL") or ""
    if not url:
        print("Skipping migrations: DATABASE_URL not set")
        return 0
    # Don't fail the whole deploy on a bad placeholder URL (e.g. example ellipsis hosts).
    if "…" in url or "xxxx" in url or "PASSWORD" in url:
        print("Skipping migrations: DATABASE_URL looks like a placeholder")
        return 0
    print("Running alembic upgrade head…")
    result = subprocess.run(
        [sys.executable, "-m", "alembic", "-c", "alembic.ini", "upgrade", "head"],
        check=False,
    )
    if result.returncode != 0:
        print(
            "Alembic failed — ensure DIRECT_URL is session-mode Postgres, "
            "pgvector is enabled, and credentials are correct."
        )
        # Prefer a deployable API over a hard build fail; fix DB then redeploy.
        if os.environ.get("VERCEL_MIGRATE_STRICT", "").lower() in {"1", "true", "yes"}:
            return result.returncode
        print("Continuing deploy (set VERCEL_MIGRATE_STRICT=true to fail the build).")
        return 0
    print("Migrations OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
