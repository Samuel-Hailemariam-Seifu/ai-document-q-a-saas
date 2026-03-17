from __future__ import annotations

from openai import OpenAI

from app.core.config import settings


def embed_texts(texts: list[str]) -> list[list[float]]:
    if not settings.openai_api_key:
        raise RuntimeError("OPENAI_API_KEY is not set")

    client = OpenAI(api_key=settings.openai_api_key)
    resp = client.embeddings.create(model=settings.openai_embedding_model, input=texts)
    # response order matches input order
    return [d.embedding for d in resp.data]

