import type { Citation } from '../services/chat'

export type NumberedCitation = Citation & { number: number }

/** Deduplicate by chunk_id (fallback document_id+excerpt), preserve first-seen order. */
export function dedupeCitations(citations: Citation[]): NumberedCitation[] {
  const seen = new Set<string>()
  const out: NumberedCitation[] = []
  for (const c of citations) {
    const key = c.chunk_id != null ? `chunk:${c.chunk_id}` : `doc:${c.document_id}:${c.excerpt.slice(0, 80)}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push({ ...c, number: out.length + 1 })
  }
  return out
}

export function citationFootnotes(answer: string, citations: NumberedCitation[]): string {
  if (citations.length === 0) return answer
  const lines = citations.map((c) => {
    const page = c.page_number != null ? `, p. ${c.page_number}` : ''
    return `[${c.number}] ${c.filename}${page} — ${c.excerpt.replace(/\s+/g, ' ').trim().slice(0, 220)}`
  })
  return `${answer.trim()}\n\nSources:\n${lines.join('\n')}`
}

export function excerptPreview(text: string, maxChars = 180): string {
  const cleaned = text.replace(/\s+/g, ' ').trim()
  if (cleaned.length <= maxChars) return cleaned
  return `${cleaned.slice(0, maxChars).trimEnd()}…`
}
