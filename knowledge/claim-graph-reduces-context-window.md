---
id: claim-graph-reduces-context-window
kind: claim
title: Graph retrieval reduces context-window usage by 40-60% compared to document retrieval
status: accepted
confidence: 0.72
tags:
  - graph-retrieval
  - context-window
  - efficiency
relations:
  - type: SUPPORTS
    target: concept-graph-retrieval
  - type: DERIVED_FROM
    target: source-agent-memory-benchmark-2026
  - type: CONTRADICTS
    target: claim-context-window-not-bottleneck
---

In controlled benchmarks, agents using graph retrieval consumed 40-60% fewer context tokens than those using full-document retrieval. Graph queries return entity summaries and typed relations rather than entire documents.

## Evidence

The agent-memory benchmark (2026) measured token usage across 100 multi-hop questions. Graph mode: median 1,200 tokens. Document mode: median 2,800 tokens.

## Caveats

- Graph compilation adds upfront token cost (one-time)
- Very large graphs may require pagination, adding round-trips
- Results depend on entity density and relation coverage
