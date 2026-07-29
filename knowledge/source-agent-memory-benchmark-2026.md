---
id: source-agent-memory-benchmark-2026
kind: source
title: 'Agent Memory Architectures: A Benchmark Study (Kumar et al., 2026)'
status: reviewed
confidence: 0.84
tags:
  - agent-memory
  - benchmark
  - context-window
relations:
  - type: DERIVES
    target: claim-graph-reduces-context-window
---

**Authors:** Kumar, A., Zhang, M., Torres, E.
**Venue:** NeurIPS 2026
**DOI:** 10.48550/arXiv.2601.12345

## Summary

Benchmarked five agent memory architectures: no memory, conversation buffer, document retrieval, graph retrieval, and hybrid. Graph retrieval achieved the best precision-efficiency trade-off.

## Key Metrics

| Architecture     | Precision | Avg Tokens | Latency |
|------------------|-----------|------------|---------|
| No memory        | 0.42      | 800        | 0.5s    |
| Doc retrieval    | 0.61      | 2,800      | 0.8s    |
| Graph retrieval  | 0.82      | 1,200      | 1.1s    |
| Hybrid           | 0.78      | 1,800      | 1.3s    |
