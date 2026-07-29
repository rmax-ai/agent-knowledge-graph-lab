---
id: claim-semantic-tools-prevent-hallucination
kind: claim
title: Semantic tools reduce agent hallucination by constraining query scope
status: accepted
confidence: 0.78
tags:
  - agent-safety
  - hallucination
  - tools
relations:
  - type: SUPPORTS
    target: decision-semantic-tools-only
  - type: DERIVED_FROM
    target: source-provenance-study-2025
---

Agents given unrestricted database access (raw Cypher, SQL) frequently generate plausible-but-wrong queries that return misleading results. Semantic tools constrain operations to well-typed, bounded interfaces with Zod-validated inputs and outputs.

## Evidence

In provenance study (2025), agents with unrestricted query access produced incorrect results in 23% of multi-hop questions. Agents using semantic tools only had a 6% error rate on the same questions, and all errors were detectable via incomplete provenance traces.
