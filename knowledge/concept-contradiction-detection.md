---
id: concept-contradiction-detection
kind: concept
title: Contradiction Detection
status: reviewed
confidence: 0.84
tags:
  - contradiction
  - reasoning
  - uncertainty
relations:
  - type: DEPENDS_ON
    target: concept-graph-retrieval
  - type: RELATED_TO
    target: concept-provenance-tracing
---

Contradiction detection identifies pairs of claims in the knowledge graph that conflict with each other. Contradictions are explicitly modeled as CONTRADICTS relations between claim entities.

## Detection Methods

1. **Explicit** — Human-authored CONTRADICTS relations in source documents
2. **Inferred** — Compiler-detected contradictions when two claims target the same concept with opposing SUPPORTS/CONTRADICTS relations
3. **Agent-discovered** — Verifier subagent identifies novel contradictions during investigation

## Handling Contradictions

Contradictions are not errors to eliminate. They are uncertainty signals that:
- Flag areas requiring further investigation
- Prevent agents from presenting false consensus
- Improve agent response quality by surfacing disagreement
- Provide test cases for evaluation benchmarks
