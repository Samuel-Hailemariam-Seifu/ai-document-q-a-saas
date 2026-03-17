from __future__ import annotations

from openai import OpenAI

from app.core.config import settings


def generate_answer(*, question: str, context_blocks: list[str]) -> str:
    # Prefer Groq (OpenAI-compatible) when configured, otherwise use OpenAI.
    if settings.groq_api_key:
        client = OpenAI(api_key=settings.groq_api_key, base_url="https://api.groq.com/openai/v1")
        model = settings.llm_model or "llama-3.1-8b-instant"
    elif settings.openai_api_key:
        client = OpenAI(api_key=settings.openai_api_key)
        model = "gpt-4o-mini"
    else:
        raise RuntimeError("Set GROQ_API_KEY or OPENAI_API_KEY")

    context = "\n\n".join(context_blocks)
    system = (
        "You are DocuMind AI, a document Q&A assistant. Answer using ONLY the provided context. "
        "If the context is insufficient, say you don't have enough information and ask a follow-up question. "
        "Be concise and factual."
    )

    user = f"Context:\n{context}\n\nQuestion:\n{question}"

    resp = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        temperature=0.2,
    )
    return resp.choices[0].message.content or ""

