from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.chat import (
    AskRequest,
    AskResponse,
    ChatCreate,
    ChatOut,
    ChatPreviewOut,
    CitationOut,
    MessageOut,
)
from app.services.chat_service import (
    add_message,
    create_chat,
    delete_chat,
    get_chat,
    list_chats,
    list_messages,
    list_recent_chat_previews,
)
from app.services.embeddings_service import embed_texts
from app.services.llm_service import generate_answer
from app.core.config import settings
from app.services.retrieval_service import (
    expand_with_neighbors,
    first_chunks_for_documents,
    top_k_chunks_for_workspace,
)
from app.services.workspace_service import get_workspace

router = APIRouter(tags=["chat"])
logger = logging.getLogger(__name__)


def _is_summary_question(q: str) -> bool:
    text = (q or "").lower()
    triggers = ("summarize", "summary", "summarise", "give me a summary", "overview", "tl;dr", "tldr")
    return any(t in text for t in triggers)


@router.get("/api/workspaces/{workspace_id}/chats", response_model=list[ChatOut])
def get_chats(
    workspace_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ChatOut]:
    ws = get_workspace(db, workspace_id=workspace_id, owner_id=current_user.id)
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")
    items = list_chats(db, workspace_id=workspace_id)
    return [ChatOut(id=c.id, workspace_id=c.workspace_id, title=c.title, created_at=c.created_at) for c in items]


@router.get("/api/workspaces/{workspace_id}/chats/recent", response_model=list[ChatPreviewOut])
def recent_chats(
    workspace_id: int,
    limit: int = 8,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ChatPreviewOut]:
    ws = get_workspace(db, workspace_id=workspace_id, owner_id=current_user.id)
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")
    rows = list_recent_chat_previews(db, workspace_id=workspace_id, limit=limit)
    out: list[ChatPreviewOut] = []
    for c, m in rows:
        preview = None
        last_at = None
        if m is not None:
            last_at = m.created_at
            text = (m.content or "").strip()
            preview = text[:140] if text else None
        out.append(
            ChatPreviewOut(
                id=c.id,
                workspace_id=c.workspace_id,
                title=c.title,
                last_message_preview=preview,
                last_message_at=last_at,
            )
        )
    return out


@router.post("/api/workspaces/{workspace_id}/chats", response_model=ChatOut, status_code=status.HTTP_201_CREATED)
def create_new_chat(
    workspace_id: int,
    payload: ChatCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ChatOut:
    ws = get_workspace(db, workspace_id=workspace_id, owner_id=current_user.id)
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")
    c = create_chat(db, workspace_id=workspace_id, title=payload.title)
    return ChatOut(id=c.id, workspace_id=c.workspace_id, title=c.title, created_at=c.created_at)


@router.get("/api/chats/{chat_id}/messages", response_model=list[MessageOut])
def get_messages(
    chat_id: int,
    workspace_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[MessageOut]:
    ws = get_workspace(db, workspace_id=workspace_id, owner_id=current_user.id)
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")
    c = get_chat(db, chat_id=chat_id, workspace_id=workspace_id)
    if not c:
        raise HTTPException(status_code=404, detail="Chat not found")
    msgs = list_messages(db, chat_id=chat_id)
    out: list[MessageOut] = []
    for m in msgs:
        citations = None
        if isinstance(m.citations_json, dict) and isinstance(m.citations_json.get("citations"), list):
            citations = [CitationOut(**c) for c in m.citations_json["citations"]]
        out.append(
            MessageOut(
                id=m.id,
                chat_id=m.chat_id,
                role=m.role,
                content=m.content,
                citations=citations,
                created_at=m.created_at,
            )
        )
    return out


@router.delete("/api/chats/{chat_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_chat(
    chat_id: int,
    workspace_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    ws = get_workspace(db, workspace_id=workspace_id, owner_id=current_user.id)
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")
    c = get_chat(db, chat_id=chat_id, workspace_id=workspace_id)
    if not c:
        raise HTTPException(status_code=404, detail="Chat not found")
    delete_chat(db, chat=c)


@router.post("/api/workspaces/{workspace_id}/chat", response_model=AskResponse)
def ask(
    workspace_id: int,
    payload: AskRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AskResponse:
    ws = get_workspace(db, workspace_id=workspace_id, owner_id=current_user.id)
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")

    # create chat if not provided
    if payload.chat_id is None:
        c = create_chat(db, workspace_id=workspace_id, title=payload.question[:60])
    else:
        c = get_chat(db, chat_id=payload.chat_id, workspace_id=workspace_id)
        if not c:
            raise HTTPException(status_code=404, detail="Chat not found")

    add_message(db, chat_id=c.id, role="user", content=payload.question)

    selected_document_ids = None
    if payload.document_ids:
        selected_document_ids = sorted({int(doc_id) for doc_id in payload.document_ids if int(doc_id) > 0})

    # For summary-style questions, semantic top-k often misses the paper body.
    # Instead, pull the first chunks (intro/abstract) from the selected docs.
    top: list[tuple] = []
    if selected_document_ids and _is_summary_question(payload.question):
        expanded_chunks = first_chunks_for_documents(db, document_ids=selected_document_ids, per_document=4)
        name_by_doc = {}
    else:
        query_emb = embed_texts([payload.question])[0]
        top = top_k_chunks_for_workspace(
            db,
            workspace_id=workspace_id,
            query_embedding=query_emb,
            k=settings.retrieval_top_k,
            document_ids=selected_document_ids,
        )
        expanded_chunks = expand_with_neighbors(db, seed_chunks=[c for c, _s, _fn in top])
        # Map doc_id -> filename from top hits
        name_by_doc: dict[int, str] = {c.document_id: fn for c, _s, fn in top}

    citations: list[CitationOut] = []
    context_blocks: list[str] = []
    for chunk in expanded_chunks:
        filename = name_by_doc.get(chunk.document_id, f"document {chunk.document_id}")
        excerpt = chunk.content[:900]
        citations.append(
            CitationOut(
                document_id=chunk.document_id,
                filename=filename,
                chunk_id=chunk.id,
                page_number=chunk.page_number,
                excerpt=excerpt,
            )
        )
        # Keep per-chunk content bounded to reduce prompt size.
        context_blocks.append(
            f"[{filename} | chunk {chunk.id} | page {chunk.page_number}]\n{chunk.content[:1800]}"
        )

    try:
        answer = generate_answer(question=payload.question, context_blocks=context_blocks)
    except Exception as exc:
        logger.exception("LLM provider request failed")
        raise HTTPException(
            status_code=502,
            detail=(
                f"LLM provider request failed ({type(exc).__name__}). "
                "Check API credentials, model access, request size, and outbound network access "
                "to OpenAI/Groq from the backend container."
            ),
        ) from exc

    add_message(
        db,
        chat_id=c.id,
        role="assistant",
        content=answer,
        citations_json={"citations": [c.model_dump() for c in citations]},
    )

    return AskResponse(chat_id=c.id, answer=answer, citations=citations)

