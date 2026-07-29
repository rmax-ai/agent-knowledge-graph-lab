---
id: claim-hybrid-retrieval-best-of-both
kind: claim
title: Hybrid retrieval (graph + document) outperforms either mode alone for mixed question types
status: draft
confidence: 0.65
tags:
  - hybrid
  - retrieval
  - future-work
relations:
  - type: DEPENDS_ON
    target: concept-graph-retrieval
  - type: DEPENDS_ON
    target: concept-document-retrieval
---

Preliminary experiments suggest that a hybrid retrieval strategy — using graph traversal for structured queries and document retrieval for narrative/summary questions — outperforms either mode alone on mixed question sets.

## Hypothesis

- Graph mode excels at: entity lookup, relation traversal, contradiction detection
- Document mode excels at: summarization, contextual understanding, unstructured queries
- Hybrid mode: routes questions to appropriate retrieval based on question classification

## Current Status

This claim is draft-status. Full evaluation requires the hybrid retriever (Phase 7) and a benchmark dataset with mixed question types. Current confidence is low (0.65) pending experimental validation.
