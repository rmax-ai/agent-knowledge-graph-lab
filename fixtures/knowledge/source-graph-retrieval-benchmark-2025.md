---
id: source-graph-retrieval-benchmark-2025
kind: source
title: 'Graph-Based vs Document Retrieval for Multi-Hop QA (Chen et al., 2025)'
status: reviewed
confidence: 0.88
tags:
  - benchmark
  - retrieval
  - academic-paper
relations:
  - type: DERIVES
    target: claim-typed-relations-improve-precision
---

**Authors:** Chen, L., Park, J., Williams, R.
**Venue:** SIGIR 2025
**DOI:** 10.1145/3539618.3591902

## Summary

Compared graph-based retrieval against document retrieval across 200 multi-hop questions. Found typed graph traversal improved precision by 34% and reduced context-window usage by 47%.

## Key Findings

1. Typed relations constrain valid paths, reducing false positives
2. Multi-hop questions benefit most (2+ hop chains)
3. Single-hop lookups show no significant difference
4. Graph compilation overhead is amortized over multiple queries
