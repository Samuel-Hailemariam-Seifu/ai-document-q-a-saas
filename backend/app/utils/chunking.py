from __future__ import annotations

from dataclasses import dataclass

from app.core.config import settings
from app.utils.text_extraction import ExtractedPage


@dataclass(frozen=True)
class Chunk:
    chunk_index: int
    page_number: int | None
    content: str


def _normalize(text: str) -> str:
    return " ".join(text.replace("\u00a0", " ").split())


def chunk_pages(pages: list[ExtractedPage]) -> list[Chunk]:
    size = max(200, int(settings.chunk_size))
    overlap = max(0, min(int(settings.chunk_overlap), size - 1))

    chunks: list[Chunk] = []
    idx = 0
    for p in pages:
        text = _normalize(p.text)
        if not text:
            continue
        start = 0
        while start < len(text):
            end = min(len(text), start + size)
            piece = text[start:end].strip()
            if piece:
                chunks.append(Chunk(chunk_index=idx, page_number=p.page_number, content=piece))
                idx += 1
            if end >= len(text):
                break
            start = max(0, end - overlap)
    return chunks

