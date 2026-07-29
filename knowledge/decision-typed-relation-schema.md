---
id: decision-typed-relation-schema
kind: decision
title: Use fixed set of 10 typed relations
status: accepted
confidence: 0.90
tags:
  - ontology
  - relations
  - design
relations:
  - type: SELECTS
    target: concept-semantic-graph-tools
  - type: REJECTS
    target: concept-graph-retrieval
---

**Decision**: The knowledge graph uses a fixed set of 10 relation types rather than allowing arbitrary or extensible relation kinds.

**Rationale**:
- Bounded relation types enable type-safe semantic tools
- Agents can reason about 10 types reliably; 50+ creates ambiguous tool selection
- Fixed set enables relation-type indexes and optimized traversal
- Extensibility is deferred to post-v1 evaluation

**Trade-offs**:
- Some nuanced relationships may not fit the fixed set
- Adding new types requires ontology migration
- Limits expressiveness of human-authored relations

**Alternatives considered**: Extensible relation vocabulary (rejected — complexity cost exceeds v1 benefits); RDF-style property graphs (rejected — adds indirection without proven agent benefit).
