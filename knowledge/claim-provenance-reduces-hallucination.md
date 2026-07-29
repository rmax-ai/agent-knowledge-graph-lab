---
id: claim-provenance-reduces-hallucination
kind: claim
title: Explicit provenance tracing reduces unsupported agent claims by 50% or more
status: accepted
confidence: 0.81
tags:
  - provenance
  - hallucination
  - trust
relations:
  - type: SUPPORTS
    target: concept-graph-retrieval
  - type: DERIVED_FROM
    target: source-provenance-study-2025
  - type: DEPENDS_ON
    target: concept-graph-retrieval
  - type: DEPENDS_ON
    target: claim-typed-relations-improve-precision
---

When every retrieved relation carries explicit provenance (source file, assertion origin, confidence), agents produce fewer unsupported claims. The provenance chain provides a verifiable path from answer to source.

## Mechanism

1. Agent retrieves entity with provenance metadata
2. Agent cites source document, not just entity
3. Verifier subagent cross-references provenance chain
4. Unsupported claims are flagged during verification

## Evidence

The 2025 provenance study compared agents with and without provenance access. Agents with provenance produced 52% fewer unsupported claims (p < 0.01).
