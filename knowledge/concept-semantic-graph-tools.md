---
id: concept-semantic-graph-tools
kind: concept
title: Semantic Graph Tools
status: reviewed
confidence: 0.92
tags:
  - agent
  - tools
  - graph
relations:
  - type: DEPENDS_ON
    target: concept-graph-retrieval
  - type: IMPLEMENTS
    target: decision-semantic-tools-only
---

Semantic graph tools are typed, bounded operations that Eve agents use to interact with the knowledge graph. Unlike raw Cypher or GQL queries, semantic tools constrain what agents can do and enforce provenance, limits, and type safety.

## The 8 Semantic Tools

| Tool | Purpose | Input | Output |
|---|---|---|---|
| searchKnowledge | Find entities by text query | query, kinds, tags, limit | ScoredEntity[] |
| getKnowledgeEntity | Fetch a single entity | entityId | KnowledgeEntity |
| expandKnowledge | Expand neighborhood | entityId, direction, depth | KnowledgeSubgraph |
| findKnowledgePaths | Find paths between entities | fromId, toId, maxDepth | KnowledgePath[] |
| findSupportingEvidence | Find evidence for a claim | claimId | EvidenceRecord[] |
| findContradictions | Find contradictions | entityId | Contradiction[] |
| traceProvenance | Trace provenance chain | entityId, maxDepth | ProvenanceTrace |
| proposeKnowledgePatch | Propose a change | patch proposal | ValidationResult |

## Design Constraints

- No unrestricted database access (no `executeCypher`)
- Every result includes provenance metadata
- Depth and count limits prevent runaway queries
- Zod schemas on all inputs and outputs
