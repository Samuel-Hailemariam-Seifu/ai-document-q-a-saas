from __future__ import annotations

from dataclasses import dataclass
from io import BytesIO

from docx import Document as DocxDocument
from pypdf import PdfReader


@dataclass(frozen=True)
class ExtractedPage:
    page_number: int | None
    text: str


def extract_text(mime_type: str, content: bytes) -> tuple[list[ExtractedPage], int | None]:
    """
    Returns (pages, page_count).
    - For PDF: pages have page_number (1-based)
    - For TXT/DOCX: pages have page_number=None
    """
    if mime_type == "text/plain":
        text = content.decode("utf-8", errors="ignore")
        return [ExtractedPage(page_number=None, text=text)], None

    if mime_type == "application/pdf":
        reader = PdfReader(BytesIO(content))
        pages: list[ExtractedPage] = []
        for i, page in enumerate(reader.pages, start=1):
            pages.append(ExtractedPage(page_number=i, text=page.extract_text() or ""))
        return pages, len(reader.pages)

    if mime_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        doc = DocxDocument(BytesIO(content))
        text = "\n".join(p.text for p in doc.paragraphs if p.text)
        return [ExtractedPage(page_number=None, text=text)], None

    return [ExtractedPage(page_number=None, text="")], None

