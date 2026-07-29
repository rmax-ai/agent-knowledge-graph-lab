---
id: claim-typed-relations-improve-precision
kind: claim
title: Typed relations improve retrieval precision by constraining valid traversal paths
status: accepted
confidence: 0.78
tags:
  - graph-retrieval
  - precision
  - evidence
relations:
  - type: SUPPORTS
    target: concept-graph-retrieval
  - type: DERIVED_FROM
    target: source-graph-retrieval-benchmark-2025
  - type: DEPENDS_ON
    target: concept-graph-retrieval
---

When agents traverse a knowledge graph using typed relations (e.g., SUPPORTS, CONTRADICTS, DERIVED_FROM), the type constrains which transitions are valid. This reduces the search space and improves evidence precision compared to untyped document retrieval.

## Evidence

The 2025 benchmark study found that typed graph traversal achieved 34% higher evidence precision than keyword-based document retrieval on multi-hop questions.

## Limitations

- Requires well-typed relations in the corpus
- May underperform when the question's answer requires semantic similarity rather than structural traversal
- Precision gains diminish when the graph is sparse
