"""resize embedding_vec to vector(768) for Groq nomic-embed-text-v1.5

Revision ID: 20261107_000010
Revises: 20261107_000009
Create Date: 2026-11-07

Clears incompatible vectors; re-embed after upgrade.
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "20261107_000010"
down_revision = "20261107_000009"
branch_labels = None
depends_on = None

NEW_DIM = 768
OLD_DIM = 1536


def upgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_document_chunks_embedding_vec_hnsw")
    op.execute("ALTER TABLE document_chunks DROP COLUMN IF EXISTS embedding_vec")
    op.execute(f"ALTER TABLE document_chunks ADD COLUMN embedding_vec vector({NEW_DIM})")
    # Legacy float[] rows from a different model are not comparable — force re-embed.
    op.execute("UPDATE document_chunks SET embedding_vec = NULL")
    op.execute(
        """
        UPDATE documents
        SET embedding_model = NULL
        WHERE status = 'ready'
        """
    )
    cleared = op.get_bind().execute(sa.text("SELECT COUNT(*) FROM document_chunks")).scalar_one()
    print(
        f"embedding_vec resized to vector({NEW_DIM}); "
        f"{cleared} chunk(s) need re-embed (embedding_vec cleared)"
    )
    op.execute(
        """
        CREATE INDEX ix_document_chunks_embedding_vec_hnsw
        ON document_chunks
        USING hnsw (embedding_vec vector_cosine_ops)
        """
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_document_chunks_embedding_vec_hnsw")
    op.execute("ALTER TABLE document_chunks DROP COLUMN IF EXISTS embedding_vec")
    op.execute(f"ALTER TABLE document_chunks ADD COLUMN embedding_vec vector({OLD_DIM})")
    op.execute("UPDATE document_chunks SET embedding_vec = NULL")
    op.execute(
        """
        CREATE INDEX ix_document_chunks_embedding_vec_hnsw
        ON document_chunks
        USING hnsw (embedding_vec vector_cosine_ops)
        """
    )
