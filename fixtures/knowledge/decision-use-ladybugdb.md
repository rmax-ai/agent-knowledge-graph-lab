---
id: decision-use-ladybugdb
kind: decision
title: Use LadybugDB as the default embedded graph engine
status: accepted
confidence: 0.85
tags:
  - architecture
  - graph-database
  - ladybugdb
relations:
  - type: SELECTS
    target: technology-ladybugdb
  - type: REJECTS
    target: technology-kuzudb
  - type: DEPENDS_ON
    target: concept-graph-retrieval
---

**Date:** 2026-07-27
**Deciders:** Max

## Context

KuzuDB was archived after acquisition by Apple. The project needed an embedded graph database with Cypher compatibility, zero-external-dependency operation, and active maintenance.

## Options Considered

1. **LadybugDB** — Kuzu successor, active development (1.4K stars, 80 contributors), MIT license
2. **Neo4j Embedded** — heavyweight, JVM dependency
3. **SQLite + graph layer** — would need custom graph traversal, no Cypher
4. **Memory-only** — works for testing, not for production-scale corpora

## Decision

Use LadybugDB as the default backend with a `GraphStore` interface abstraction. MemoryGraphStore serves as the test backend. All graph operations go through the interface — never direct LadybugDB calls.

## Consequences

- **Positive:** Cypher compatibility, embedded operation, active community
- **Negative:** v0.18.x — API may change before 1.0
- **Mitigation:** GraphStore interface isolates all LadybugDB-specific code
