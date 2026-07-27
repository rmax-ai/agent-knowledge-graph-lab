---
id: evidence-graph-precision-experiment
kind: evidence
title: Graph retrieval precision experiment results
status: reviewed
confidence: 0.90
tags:
  - experiment
  - precision
  - benchmark
relations:
  - type: SUPPORTS
    target: claim-typed-relations-improve-precision
  - type: DERIVED_FROM
    target: source-graph-retrieval-benchmark-2025
---

## Experiment Design

- **Corpus:** 200 knowledge documents with typed relations
- **Questions:** 50 multi-hop questions requiring 2-4 hops
- **Conditions:** Graph retrieval vs. document retrieval
- **Metric:** Precision@5 (fraction of top-5 results that are relevant)

## Results

| Condition | Precision@5 | p-value |
|-----------|-------------|---------|
| Graph     | 0.82        | —       |
| Document  | 0.61        | <0.001  |
| Δ         | +0.21       |         |

The graph condition achieved 34% relative improvement in precision.
