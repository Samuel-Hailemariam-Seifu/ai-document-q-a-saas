from __future__ import annotations

from dataclasses import dataclass
from io import BytesIO

from docx import Document as DocxDocument
from docx.oxml.ns import qn
from pypdf import PdfReader


@dataclass(frozen=True)
class ExtractedPage:
    page_number: int | None
    text: str


def _extract_docx_text(content: bytes) -> str:
    """
    Extracts text from a DOCX file preserving document order — paragraphs
    and tables interleaved as they appear in the document body, not
    paragraphs-first then tables. Table cells are tab-separated, rows
    are newline-separated, with a blank line after each table.
    """
    doc = DocxDocument(BytesIO(content))
    parts: list[str] = []

    for block in doc.element.body:
        tag = block.tag.split("}")[-1] if "}" in block.tag else block.tag

        if tag == "p":
            # Regular paragraph
            text = "".join(node.text or "" for node in block.iter() if node.tag.endswith("}t"))
            text = text.strip()
            if text:
                parts.append(text)

        elif tag == "tbl":
            # Table — extract row by row, cell by cell
            rows: list[str] = []
            for tr in block.findall(f".//{qn('w:tr')}"):
                cells: list[str] = []
                for tc in tr.findall(f".//{qn('w:tc')}"):
                    cell_text = "".join(
                        node.text or ""
                        for node in tc.iter()
                        if node.tag.endswith("}t")
                    ).strip()
                    cells.append(cell_text)
                row_text = "\t".join(cells)
                if any(cells):
                    rows.append(row_text)
            if rows:
                parts.append("\n".join(rows))
                parts.append("")  # blank line after table for chunk boundary clarity

    return "\n".join(parts)


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
        text = _extract_docx_text(content)
        return [ExtractedPage(page_number=None, text=text)], None

    return [ExtractedPage(page_number=None, text="")], None