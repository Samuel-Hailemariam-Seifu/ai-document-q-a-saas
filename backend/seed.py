"""Seed the database with a demo user, workspace, documents, and a sample chat.

Run from backend/ with the venv active:
    ./.venv/Scripts/python.exe seed.py

Safe to re-run: skips creating the demo user/workspace if they already exist,
but always adds fresh documents to keep the workspace populated.
"""
from __future__ import annotations

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.user import User
from app.models.workspace import Workspace
from app.services.document_service import create_document
from app.services.chat_service import add_message, create_chat
from app.services.embeddings_service import embed_texts
from app.services.llm_service import generate_answer
from app.services.retrieval_service import expand_with_neighbors, top_k_chunks_for_workspace
from app.tasks.document_tasks import ingest_document
from sqlalchemy import select

DEMO_EMAIL = "demo@documind.ai"
DEMO_PASSWORD = "Demo1234!"
DEMO_NAME = "Demo User"
WORKSPACE_NAME = "Acme Support"

DOCUMENTS: list[tuple[str, str]] = [
    (
        "refund_policy.txt",
        """Acme Inc. Refund Policy

Section 4.1 Eligibility
Customers may request a refund within fourteen (14) days of purchase, provided the
service has not been used beyond the plan's fair-use limits described in Section 3.

Section 4.2 Refund Window
Refunds are available within fourteen (14) days of purchase. After the 14-day period,
refunds are generally not provided, except where required by local consumer law.

Section 4.3 How to Request
Email billing@acme.example with your account email and order ID. Approved refunds are
processed to the original payment method within 5-10 business days.

Section 4.4 Non-Refundable Items
Custom onboarding services and usage-based overage charges are non-refundable once
delivered or incurred.
""",
    ),
    (
        "onboarding_guide.txt",
        """Acme Inc. Onboarding Guide

Section 1 Getting Started
Create a workspace, then upload your first document (PDF, DOCX, or TXT, up to 25MB).
Documents are automatically chunked and embedded so you can ask questions right away.

Section 2 Asking Questions
Open the Assistant tab and ask a question in plain language. Answers are grounded in
your uploaded documents and include citations back to the exact source chunk.

Section 3 Fair Use Limits
The Starter plan includes 3 documents and 50 queries per month. The Pro plan removes
the document limit and raises the monthly query allowance significantly.

Section 4 Inviting Your Team
Workspaces are currently single-owner. Multi-user workspaces with role-based access
are on the roadmap (see Future Improvements in the README).
""",
    ),
]

SAMPLE_QUESTION = "What is the refund policy?"


def main() -> None:
    db = SessionLocal()
    try:
        user = db.execute(select(User).where(User.email == DEMO_EMAIL)).scalar_one_or_none()
        if user is None:
            user = User(
                full_name=DEMO_NAME,
                email=DEMO_EMAIL,
                password_hash=hash_password(DEMO_PASSWORD),
                email_verified=True,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print(f"Created demo user: {DEMO_EMAIL} / {DEMO_PASSWORD}")
        else:
            print(f"Demo user already exists: {DEMO_EMAIL}")

        workspace = db.execute(
            select(Workspace).where(Workspace.owner_id == user.id, Workspace.name == WORKSPACE_NAME)
        ).scalar_one_or_none()
        if workspace is None:
            workspace = Workspace(owner_id=user.id, name=WORKSPACE_NAME)
            db.add(workspace)
            db.commit()
            db.refresh(workspace)
            print(f"Created workspace: {WORKSPACE_NAME}")
        else:
            print(f"Workspace already exists: {WORKSPACE_NAME}")

        doc_ids: list[int] = []
        for filename, content in DOCUMENTS:
            doc = create_document(
                db,
                workspace_id=workspace.id,
                owner_id=user.id,
                original_name=filename,
                content=content.encode("utf-8"),
                mime_type="text/plain",
            )
            if doc is None:
                print(f"Skipped {filename} (rejected by validation)")
                continue
            print(f"Ingesting {filename} ...")
            ingest_document(doc.id)
            db.refresh(doc)
            print(f"  status={doc.status} chunks={doc.chunk_count}")
            doc_ids.append(doc.id)

        if doc_ids:
            chat = create_chat(db, workspace_id=workspace.id, title=SAMPLE_QUESTION[:60])
            add_message(db, chat_id=chat.id, role="user", content=SAMPLE_QUESTION)
            try:
                query_emb = embed_texts([SAMPLE_QUESTION])[0]
                top = top_k_chunks_for_workspace(
                    db, workspace_id=workspace.id, query_embedding=query_emb, k=6
                )
                expanded = expand_with_neighbors(db, seed_chunks=[c for c, _s, _fn in top])
                name_by_doc = {c.document_id: fn for c, _s, fn in top}
                context_blocks = [
                    f"[{name_by_doc.get(c.document_id, 'document')} | chunk {c.id} | page {c.page_number}]\n{c.content[:1800]}"
                    for c in expanded
                ]
                answer = generate_answer(question=SAMPLE_QUESTION, context_blocks=context_blocks)
                citations = [
                    {
                        "document_id": c.document_id,
                        "filename": name_by_doc.get(c.document_id, "document"),
                        "chunk_id": c.id,
                        "page_number": c.page_number,
                        "excerpt": c.content[:900],
                    }
                    for c in expanded
                ]
                add_message(
                    db,
                    chat_id=chat.id,
                    role="assistant",
                    content=answer,
                    citations_json={"citations": citations},
                )
                print("Seeded a sample chat with a real grounded answer.")
            except Exception as exc:  # noqa: BLE001
                print(f"Skipped sample answer (LLM call failed: {exc}). Chat created with question only.")

        print("\nDone. Log in with:")
        print(f"  email:    {DEMO_EMAIL}")
        print(f"  password: {DEMO_PASSWORD}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
