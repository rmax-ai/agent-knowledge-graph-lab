---
id: decision-semantic-tools-only
kind: decision
title: Agents receive semantic tools, not raw Cypher access
status: accepted
confidence: 0.92
tags:
  - architecture
  - agent-safety
  - tool-design
relations:
  - type: DEPENDS_ON
    target: concept-graph-retrieval
  - type: IMPLEMENTS
    target: concept-graph-retrieval
---

**Date:** 2026-07-27
**Deciders:** Max

## Context

Giving agents unrestricted Cypher access creates security, observability, and evaluation problems. The agent could execute arbitrary graph mutations, exfiltrate data, or produce queries the evaluation framework cannot trace.

## Decision

Expose eight typed semantic tools (searchKnowledge, getKnowledgeEntity, expandKnowledge, findKnowledgePaths, findSupportingEvidence, findContradictions, traceProvenance, proposeKnowledgePatch) instead of a single `executeCypher` tool.

## Consequences

- **Positive:** Bounded operations, observable tool use, evaluable tool selection
- **Negative:** Some valid queries may not be expressible through the semantic tools
- **Mitigation:** Add new semantic tools when benchmark questions require them; track in competency questions
