---
id: concept-graph-retrieval
kind: concept
title: Graph-Based Knowledge Retrieval
status: reviewed
confidence: 0.92
tags:
  - graph-retrieval
  - agent-context
  - knowledge-representation
relations:
  - type: RELATED_TO
    target: concept-vector-retrieval
  - type: RELATED_TO
    target: concept-document-retrieval
---

Graph-based retrieval represents knowledge as a typed property graph with entities (nodes) and relations (edges). Queries traverse the graph structure to find relevant knowledge, leveraging explicit relationship semantics.

## How It Works

1. Knowledge is compiled into a graph from canonical source documents
2. Queries match entities by type, property, or full-text
3. Traversal follows typed edges to expand context
4. Path finding discovers multi-hop relationships

## Advantages Over Document Retrieval

- **Provenance:** Every edge carries source attribution
- **Precision:** Typed relations constrain valid transitions
- **Multi-hop:** Path traversal discovers indirect relationships
- **Contradiction detection:** Conflicting claims share a CONTRADICTS edge

## Known Limitations

- Requires upfront knowledge compilation
- Graph schema must be maintained
- May miss relevant knowledge not yet in the graph
