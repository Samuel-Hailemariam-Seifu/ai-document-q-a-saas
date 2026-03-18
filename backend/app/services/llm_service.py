from __future__ import annotations

from openai import APIStatusError, OpenAI

from app.core.config import settings


def _build_bounded_context(context_blocks: list[str], *, max_chars: int) -> str:
    """
    Keep context under a hard character budget to avoid model/provider limits.
    This is a pragmatic bound (chars != tokens) but prevents runaway prompts.
    """
    max_chars = max(500, int(max_chars))
    per_block_cap = max(200, min(2400, max_chars // 3))

    out: list[str] = []
    used = 0
    for block in context_blocks:
        if used >= max_chars:
            break
        b = (block or "").strip()
        if not b:
            continue
        if len(b) > per_block_cap:
            b = b[:per_block_cap] + "\n...[truncated]..."
        # +2 for separator newlines when joined
        if used + len(b) + (2 if out else 0) > max_chars:
            remaining = max_chars - used - (2 if out else 0)
            if remaining > 50:
                b = b[:remaining] + "\n...[truncated]..."
            else:
                break
        out.append(b)
        used += len(b) + (2 if out else 0)
    return "\n\n".join(out)


def generate_answer(*, question: str, context_blocks: list[str]) -> str:
    # Some LLM endpoints (e.g. behind Cloudflare) may block "bot-like" user agents.
    # Setting an explicit UA makes requests more consistent across environments.
    default_headers = {"User-Agent": "DocuMindAI/1.0 (+https://localhost)"}

    # Prefer Groq (OpenAI-compatible) when configured, otherwise use OpenAI.
    if settings.groq_api_key:
        client = OpenAI(
            api_key=settings.groq_api_key,
            base_url="https://api.groq.com/openai/v1",
            default_headers=default_headers,
        )
        model = settings.llm_model or "llama-3.1-8b-instant"
    elif settings.openai_api_key:
        client = OpenAI(api_key=settings.openai_api_key, default_headers=default_headers)
        model = "gpt-4o-mini"
    else:
        raise RuntimeError("Set GROQ_API_KEY or OPENAI_API_KEY")

    # Bound context to avoid provider request-size / TPM limits.
    # Groq on-demand tiers can be strict, so we keep this aggressive.
    context = _build_bounded_context(context_blocks, max_chars=4_000)
    system = (
        "You are DocuMind AI, a document Q&A assistant. Answer using ONLY the provided context. "
        "If the context is insufficient, say you don't have enough information and ask a follow-up question. "
        "Be concise and factual."
    )

    # If the provider still rejects due to size/TPM, retry once with smaller context.
    budgets = [4_000, 2_000]
    last_error: Exception | None = None
    for budget in budgets:
        bounded = _build_bounded_context(context_blocks, max_chars=budget)
        user = f"Context:\n{bounded}\n\nQuestion:\n{question}"
        try:
            resp = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
                temperature=0.2,
            )
            return resp.choices[0].message.content or ""
        except APIStatusError as exc:
            last_error = exc
            # 413 typically indicates request too large / TPM too high.
            if exc.status_code in (413, 429):
                continue
            raise
    if last_error:
        raise last_error
    return ""

