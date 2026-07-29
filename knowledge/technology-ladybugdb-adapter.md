---
id: technology-ladybugdb-adapter
kind: technology
title: LadybugDB Graph Adapter
status: reviewed
confidence: 0.82
tags:
  - graph-database
  - adapter
  - storage
relations:
  - type: IMPLEMENTS
    target: decision-use-ladybugdb
  - type: SUPERSEDES
    target: technology-kuzudb
---

LadybugDB is an embedded graph database with no external daemon requirement. It provides a property graph model with labeled nodes and typed edges.

## Adapter Design

The `LadybugGraphStore` implements the `GraphStore` interface:

- `initialise()` — Creates or opens the embedded database
- `rebuild(corpus)` — Clears and repopulates from CompiledCorpus
- `searchEntities()` — Index-based search with kind/tag filtering
- `expand()` — BFS traversal with depth and direction controls
- `findPaths()` — Shortest-path between two entities
- `findEvidence()` — Incoming SUPPORTS/DERIVED_FROM relations
- `findContradictions()` — CONTRADICTS relations from/to entity
- `traceProvenance()` — Recursive provenance chain walk

## Performance Characteristics

- Embedded, zero-config
- Sub-millisecond neighbor traversals
- Full corpus rebuild under 500ms for <500 entities
- SQLite-compatible storage format
