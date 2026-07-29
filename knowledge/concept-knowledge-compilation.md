---
id: concept-knowledge-compilation
kind: concept
title: Knowledge Compilation Pipeline
status: reviewed
confidence: 0.90
tags:
  - compiler
  - pipeline
  - okf
relations:
  - type: DEPENDS_ON
    target: concept-document-retrieval
  - type: RELATED_TO
    target: concept-graph-retrieval
---

The knowledge compilation pipeline transforms human-authored Markdown documents into a typed property graph. It is the bridge between canonical knowledge (Markdown) and agent-accessible knowledge (graph).

## Pipeline Stages

1. **Parse** — Read Markdown, extract YAML frontmatter, parse body into AST (unified + remark)
2. **Validate** — Zod schema validation for frontmatter, kind/status constraints, reference integrity
3. **Compile** — Normalize entities, assign deterministic IDs, resolve cross-references, emit diagnostics
4. **Build** — Materialize entities and relations into GraphStore (LadybugDB or MemoryGraphStore)

## Design Properties

- **Deterministic**: Same input → same output, including stable hashes
- **File-order independent**: Entity IDs and hashes don't depend on read order
- **Regenerable**: Delete graph, recompile — identical result
- **Diagnostic-driven**: Warnings and errors with file/line references
