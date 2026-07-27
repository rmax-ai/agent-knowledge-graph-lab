---
id: technology-ladybugdb
kind: technology
title: LadybugDB
status: reviewed
confidence: 0.90
tags:
  - graph-database
  - embedded
  - cypher
  - columnar
relations:
  - type: RELATED_TO
    target: technology-kuzudb
  - type: IMPLEMENTS
    target: concept-graph-retrieval
---

**Version:** v0.18.2
**License:** MIT
**Repository:** https://github.com/LadybugDB/ladybug

## Description

LadybugDB is an embedded graph database optimized for analytical query workloads. It is the successor to KuzuDB, built by the same core team. Features include:

- Property graph data model with Cypher query language
- Embedded, in-process operation (no server daemon)
- Columnar disk-based storage
- Multi-core query parallelism
- Serializable ACID transactions
- Node.js bindings via `lbug` package

## Usage in This Project

LadybugDB serves as the default graph storage backend. All database access goes through the `GraphStore` interface in `packages/graph-store/`. The `LadybugGraphStore` implementation wraps `lbug` with typed operations.
