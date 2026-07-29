---
id: claim-graph-retrieval-outperforms-document
kind: claim
title: Graph retrieval outperforms document retrieval on multi-hop questions with 3+ hops
status: accepted
confidence: 0.81
tags:
  - multi-hop
  - graph-retrieval
  - benchmarking
relations:
  - type: SUPPORTS
    target: concept-graph-retrieval
  - type: CONTRADICTS
    target: claim-context-window-not-bottleneck
  - type: DERIVED_FROM
    target: source-graph-retrieval-benchmark-2025
---

On questions requiring 3 or more reasoning hops, graph retrieval achieves 34% higher precision and 41% higher recall than direct document retrieval. The gap widens with hop count: at 5+ hops, graph retrieval is 2.8x more precise.

## Mechanism

Graph traversal follows typed relations directly, while document retrieval must fit all potentially relevant documents into context and rely on the LLM to infer cross-document relationships. As the number of relevant documents grows, context-window pressure increases for document retrieval.
