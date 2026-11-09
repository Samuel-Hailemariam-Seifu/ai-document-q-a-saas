from __future__ import annotations

from functools import lru_cache

from fastembed import TextEmbedding
from openai import OpenAI

from app.core.config import settings

# Known output dimensions for configured models.
_MODEL_DIMS: dict[str, int] = {
    "text-embedding-3-small": 1536,
    "BAAI/bge-small-en-v1.5": 384,
}


class EmbeddingModelMismatchError(RuntimeError):
    """Raised when a workspace would mix incompatible embedding models."""


class EmbeddingConfigError(RuntimeError):
    """Raised when EMBEDDING_DIM / model configuration is invalid."""


def configured_embedding_model() -> str:
    """Active embedding model from env — no silent cross-provider fallback mid-workspace."""
    if settings.openai_api_key:
        return settings.openai_embedding_model
    return settings.local_embedding_model


def expected_dim_for_model(model: str) -> int | None:
    return _MODEL_DIMS.get(model)


def validate_embedding_config() -> None:
    model = configured_embedding_model()
    expected = expected_dim_for_model(model)
    if expected is not None and expected != settings.embedding_dim:
        raise EmbeddingConfigError(
            f"EMBEDDING_DIM={settings.embedding_dim} does not match configured model "
            f"{model!r} (expected {expected}). Set EMBEDDING_DIM={expected} or change the model, "
            f"then re-embed workspaces that used a different model."
        )
    if expected is None:
        # Unknown model name — still require a positive dim; warn via exception only if dim <= 0.
        if settings.embedding_dim <= 0:
            raise EmbeddingConfigError("EMBEDDING_DIM must be a positive integer")


@lru_cache(maxsize=1)
def _local_embedder() -> TextEmbedding:
    # FastEmbed downloads an ONNX model on first use.
    return TextEmbedding(model_name=settings.local_embedding_model)


def embed_texts(texts: list[str]) -> list[list[float]]:
    model = configured_embedding_model()
    if settings.openai_api_key:
        client = OpenAI(api_key=settings.openai_api_key)
        resp = client.embeddings.create(model=settings.openai_embedding_model, input=texts)
        vectors = [d.embedding for d in resp.data]
    else:
        embedder = _local_embedder()
        vectors = [list(vec) for vec in embedder.embed(texts)]

    for i, vec in enumerate(vectors):
        if len(vec) != settings.embedding_dim:
            raise EmbeddingConfigError(
                f"Embedding from {model!r} has dim {len(vec)} but EMBEDDING_DIM="
                f"{settings.embedding_dim} (text index {i})"
            )
    return vectors
