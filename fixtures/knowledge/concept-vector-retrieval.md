---
id: concept-vector-retrieval
kind: concept
title: Vector-Based Knowledge Retrieval
status: reviewed
confidence: 0.85
tags:
  - vector-retrieval
  - embeddings
  - semantic-search
relations:
  - type: RELATED_TO
    target: concept-document-retrieval
---

Vector retrieval encodes knowledge documents as dense embedding vectors. Queries are embedded into the same space, and nearest-neighbor search returns semantically similar documents regardless of exact keyword match.

## Strengths

- Handles semantic similarity without exact keyword match
- No schema required
- Works well for fuzzy, open-ended questions

## Weaknesses

- No explicit relationship traversal
- Limited provenance tracing
- Context-window bloat from embedding entire documents
- Cannot detect structured contradictions
