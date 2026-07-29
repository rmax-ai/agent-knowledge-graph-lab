---
id: decision-agent-writes-proposal-only
kind: decision
title: Agent writes are proposals requiring human review
status: accepted
confidence: 0.95
tags:
  - governance
  - agent-safety
  - knowledge-integrity
relations:
  - type: SELECTS
    target: concept-semantic-graph-tools
  - type: REJECTS
    target: concept-graph-retrieval
---

**Decision**: Agents can propose knowledge changes via `proposeKnowledgePatch` but cannot directly modify `knowledge/*.md` or the graph.

**Rationale**:
- Canonical knowledge must remain human-authoritative
- Compiler validation catches schema violations before proposals are created
- Human review prevents agent pollution of the knowledge base
- Proposals include rationale, evidence, and validation metadata

**Proposal lifecycle**:
1. Agent creates KnowledgePatchProposal with rationale + evidence
2. Proposal passes schema, reference, and consistency validation
3. Human reviews and accepts/rejects
4. Accepted proposals are applied to canonical Markdown
5. Graph is regenerated from updated Markdown

**Non-goal**: Autonomous self-improving knowledge graph. The graph is a regenerable projection, not a live mutable database.
