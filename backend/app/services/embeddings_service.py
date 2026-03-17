from __future__ import annotations

from functools import lru_cache

from fastembed import TextEmbedding
from openai import OpenAI

from app.core.config import settings


@lru_cache(maxsize=1)
def _local_embedder() -> TextEmbedding:
    # FastEmbed downloads an ONNX model on first use.
    return TextEmbedding(model_name=settings.local_embedding_model)


def embed_texts(texts: list[str]) -> list[list[float]]:
    # Prefer OpenAI embeddings when configured, otherwise use a local embedding model.
    if not settings.openai_api_key:
        embedder = _local_embedder()
        return [list(vec) for vec in embedder.embed(texts)]

    client = OpenAI(api_key=settings.openai_api_key)
    resp = client.embeddings.create(model=settings.openai_embedding_model, input=texts)
    # response order matches input order
    return [d.embedding for d in resp.data]

