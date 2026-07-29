---
id: concept-provenance-tracing
kind: concept
title: Provenance Tracing
status: reviewed
confidence: 0.89
tags:
  - provenance
  - evidence
  - traceability
relations:
  - type: SUPPORTS
    target: claim-provenance-reduces-hallucination
  - type: DEPENDS_ON
    target: concept-graph-retrieval
---

Provenance tracing follows the chain of evidence from an entity back to its source documents. Every relation in the graph carries provenance metadata: source file, document ID, assertion origin (human/agent/compiler), evidence text, and line spans.

## Provenance Chain

A provenance trace starts from an entity and walks backwards through DERIVED_FROM and SUPPORTS relations to reach original source documents. The trace includes:

1. The root entity
2. Intermediate entities (claims, evidence)
3. Terminal source documents

## Why Provenance Matters

- Agents can verify claims by following evidence chains
- Users can navigate from answer → evidence → source document
- Contradictions become visible as conflicting provenance paths
- Hallucinated claims lack complete provenance (incomplete traces)
