"""add pgvector embedding_vec, content_tsv, HNSW/GIN, documents.embedding_model

Revision ID: 20261107_000009
Revises: 20260318_000008
Create Date: 2026-11-07

Keeps legacy document_chunks.embedding (REAL[]) for verification.
Does NOT drop the old column — that is a separate, later migration.
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "20261107_000009"
down_revision = "20260318_000008"
branch_labels = None
depends_on = None

# Fixed at migration time — must match production EMBEDDING_DIM (startup validates).
VECTOR_DIM = 1536


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    op.add_column(
        "documents",
        sa.Column("embedding_model", sa.String(length=128), nullable=True),
    )

    op.execute(
        f"ALTER TABLE document_chunks ADD COLUMN embedding_vec vector({VECTOR_DIM})"
    )

    conn = op.get_bind()
    conn.execute(
        sa.text(
            f"""
            UPDATE document_chunks
            SET embedding_vec = embedding::real[]::vector
            WHERE embedding IS NOT NULL
              AND cardinality(embedding) = {VECTOR_DIM}
            """
        )
    )
    skipped = conn.execute(
        sa.text(
            f"""
            SELECT COUNT(*) FROM document_chunks
            WHERE embedding IS NULL
               OR cardinality(embedding) <> {VECTOR_DIM}
            """
        )
    ).scalar_one()
    print(
        f"pgvector backfill: skipped {skipped} chunk(s) "
        f"(NULL embedding or dimension != {VECTOR_DIM})"
    )

    # Infer embedding_model from chunk array length for existing ready docs.
    conn.execute(
        sa.text(
            """
            UPDATE documents d
            SET embedding_model = sub.inferred
            FROM (
                SELECT DISTINCT ON (c.document_id)
                    c.document_id,
                    CASE cardinality(c.embedding)
                        WHEN 1536 THEN 'text-embedding-3-small'
                        WHEN 384 THEN 'BAAI/bge-small-en-v1.5'
                        ELSE NULL
                    END AS inferred
                FROM document_chunks c
                ORDER BY c.document_id, c.id
            ) AS sub
            WHERE d.id = sub.document_id
              AND d.embedding_model IS NULL
              AND sub.inferred IS NOT NULL
            """
        )
    )

    op.execute(
        """
        ALTER TABLE document_chunks
        ADD COLUMN content_tsv tsvector
        GENERATED ALWAYS AS (to_tsvector('english', coalesce(content, ''))) STORED
        """
    )

    op.execute(
        """
        CREATE INDEX ix_document_chunks_embedding_vec_hnsw
        ON document_chunks
        USING hnsw (embedding_vec vector_cosine_ops)
        """
    )
    op.execute(
        """
        CREATE INDEX ix_document_chunks_content_tsv_gin
        ON document_chunks
        USING gin (content_tsv)
        """
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_document_chunks_content_tsv_gin")
    op.execute("DROP INDEX IF EXISTS ix_document_chunks_embedding_vec_hnsw")
    op.execute("ALTER TABLE document_chunks DROP COLUMN IF EXISTS content_tsv")
    op.execute("ALTER TABLE document_chunks DROP COLUMN IF EXISTS embedding_vec")
    op.drop_column("documents", "embedding_model")
    # Leave the vector extension installed — other DBs may depend on it.
