from __future__ import annotations

from openai import OpenAI

from app.core.config import settings


def generate_answer(*, question: str, context_blocks: list[str]) -> str:
    if not settings.openai_api_key:
        raise RuntimeError("OPENAI_API_KEY is not set")

    client = OpenAI(api_key=settings.openai_api_key)

    context = "\n\n".join(context_blocks)
    system = (
        "You are DocuMind AI, a document Q&A assistant. Answer using ONLY the provided context. "
        "If the context is insufficient, say you don't have enough information and ask a follow-up question. "
        "Be concise and factual."
    )

    user = f"Context:\n{context}\n\nQuestion:\n{question}"

    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        temperature=0.2,
    )
    return resp.choices[0].message.content or ""

