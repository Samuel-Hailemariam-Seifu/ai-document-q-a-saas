"""Compare legacy full-scan retrieval vs pgvector hybrid on the same questions.

Usage (from backend/, after migrate + ingest):
    python -m scripts.compare_retrieval --workspace-id 1

Prints per-question top-k chunk-id overlap, latencies, and how often the new
top-k set differs from the old full-scan top-k.
"""

from __future__ import annotations

import argparse
import time
from statistics import mean

from app.core.config import settings
from app.core.database import SessionLocal, engine
from app.core.pgvector_runtime import probe_pgvector
from app.core.startup import run_startup_checks
from app.services.embeddings_service import embed_texts
from app.services.retrieval_service import hybrid_top_k, hybrid_top_k_legacy

# Mix of paraphrases + exact identifiers (codes / acronyms).
DEFAULT_QUESTIONS = [
    "What is the refund policy?",
    "How long do customers have to request a refund?",
    "When are refunds not available?",
    "How do I request a refund by email?",
    "What are fair-use limits on the Starter plan?",
    "How do I invite my team to a workspace?",
    "Give an overview of onboarding steps",
    "What file types can I upload?",
    "SKU-ACME-REFUND-14",
    "order ID ACME-ORD-7781",
    "billing@acme.example",
    "What does TLDR mean for the refund window?",
    "Section 4.1 Eligibility details",
    "Custom onboarding services refundability",
    "monthly query allowance Pro plan",
    "PDF DOCX TXT size limit",
    "Who owns a workspace today?",
    "processed to the original payment method",
    "Acme Inc. Refund Policy Section 4.3",
    "roadmap multi-user RBAC",
]


def _ids(hits: list) -> list[int]:
    return [int(c.id) for c, _s, _n in hits]


def _jaccard(a: list[int], b: list[int]) -> float:
    sa, sb = set(a), set(b)
    if not sa and not sb:
        return 1.0
    return len(sa & sb) / len(sa | sb)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--workspace-id", type=int, required=True)
    parser.add_argument("--k", type=int, default=None)
    parser.add_argument(
        "--document-ids",
        type=int,
        nargs="*",
        default=None,
        help="Optional document_ids filter",
    )
    args = parser.parse_args()
    k = args.k or settings.retrieval_top_k

    run_startup_checks(engine)
    probe_pgvector(engine)

    db = SessionLocal()
    try:
        differs = 0
        rows_out: list[dict] = []
        for q in DEFAULT_QUESTIONS:
            emb = embed_texts([q])[0]

            t0 = time.perf_counter()
            old = hybrid_top_k_legacy(
                db,
                workspace_id=args.workspace_id,
                query=q,
                query_embedding=emb,
                k=k,
                document_ids=args.document_ids,
            )
            legacy_ms = (time.perf_counter() - t0) * 1000

            t1 = time.perf_counter()
            new = hybrid_top_k(
                db,
                workspace_id=args.workspace_id,
                query=q,
                query_embedding=emb,
                k=k,
                document_ids=args.document_ids,
            )
            new_ms = (time.perf_counter() - t1) * 1000

            old_ids = _ids(old)
            new_ids = _ids(new)
            overlap = len(set(old_ids) & set(new_ids))
            jac = _jaccard(old_ids, new_ids)
            same = old_ids == new_ids
            if set(old_ids) != set(new_ids):
                differs += 1

            rows_out.append(
                {
                    "q": q,
                    "legacy_ms": legacy_ms,
                    "new_ms": new_ms,
                    "overlap": overlap,
                    "jaccard": jac,
                    "same_ordered": same,
                    "old_ids": old_ids,
                    "new_ids": new_ids,
                }
            )

        print(f"workspace_id={args.workspace_id} k={k} keyword_backend={settings.keyword_backend}")
        print(f"candidate_n={settings.retrieval_candidate_n}")
        print("-" * 100)
        for r in rows_out:
            print(
                f"overlap={r['overlap']}/{k} jaccard={r['jaccard']:.2f} "
                f"legacy={r['legacy_ms']:.1f}ms new={r['new_ms']:.1f}ms | {r['q'][:60]}"
            )
            print(f"  old={r['old_ids']}")
            print(f"  new={r['new_ids']}")
        print("-" * 100)
        n = len(rows_out)
        print(
            f"summary: questions={n} "
            f"top-k set differs={differs}/{n} ({100.0 * differs / n:.1f}%) "
            f"avg_jaccard={mean(r['jaccard'] for r in rows_out):.3f} "
            f"avg_legacy_ms={mean(r['legacy_ms'] for r in rows_out):.1f} "
            f"avg_new_ms={mean(r['new_ms'] for r in rows_out):.1f}"
        )
        return 0
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())
