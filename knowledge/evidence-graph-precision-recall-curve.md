---
id: evidence-graph-precision-recall-curve
kind: evidence
title: Precision-Recall curve for graph vs document retrieval across hop counts
status: reviewed
confidence: 0.91
tags:
  - evaluation
  - precision
  - recall
relations:
  - type: SUPPORTS
    target: claim-graph-retrieval-outperforms-document
  - type: DERIVED_FROM
    target: source-graph-retrieval-benchmark-2025
---

## Results

| Hops | Graph Precision | Graph Recall | Document Precision | Document Recall |
|---|---|---|---|---|
| 1 | 0.94 | 0.96 | 0.91 | 0.93 |
| 2 | 0.89 | 0.92 | 0.78 | 0.81 |
| 3 | 0.82 | 0.86 | 0.61 | 0.61 |
| 4 | 0.76 | 0.79 | 0.45 | 0.42 |
| 5+ | 0.71 | 0.72 | 0.25 | 0.19 |

The divergence at 3+ hops is statistically significant (p < 0.01, paired t-test over 100 questions per hop count).
