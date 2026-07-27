# ARCHITECTURE.md — Agent Knowledge Graph Lab

## Problem Statement

Agent systems retrieving knowledge from flat document stores suffer from fragmented evidence, unverifiable provenance, and poor multi-hop reasoning. Typed knowledge graphs offer structured relationships, but whether they materially improve agent decision quality over vector/document retrieval is an open empirical question.

This project creates a controlled research environment to answer: **under which classes of agent tasks does typed graph retrieval produce better evidence selection, provenance, contradiction detection, and multi-hop reasoning than document retrieval?**

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│              Canonical Knowledge (Markdown)           │
│          knowledge/**/*.md + YAML frontmatter         │
└─────────────────────────┬───────────────────────────┘
                          │ parse → validate → normalize
                          ▼
┌─────────────────────────────────────────────────────┐
│                   Compiler Pipeline                   │
│   okf/parser → compiler/normalizer → graph builder    │
└─────────────────────────┬───────────────────────────┘
                          │ entities + relations
                          ▼
┌─────────────────────────────────────────────────────┐
│                    GraphStore (interface)              │
│  LadybugGraphStore | MemoryGraphStore                 │
└─────────────────────────┬───────────────────────────┘
                          │ typed queries
                          ▼
┌─────────────────────────────────────────────────────┐
│              Semantic Knowledge Operations            │
│  search · expand · paths · evidence · contradictions  │
└─────────────────────────┬───────────────────────────┘
                          │ tool contracts (Zod)
                          ▼
┌─────────────────────────────────────────────────────┐
│                    Eve Agent Runtime                  │
│  researcher · verifier · curator · orchestrator       │
└─────────────────────────┬───────────────────────────┘
                          │ SSE / streaming
                          ▼
┌─────────────────────────────────────────────────────┐
│               Next.js Research Console                │
│  chat · traces · evidence · graph · evaluations       │
└─────────────────────────────────────────────────────┘
```

## Package Dependency Graph

```
apps/web ─────────────────────────────────────────┐
  │  depends on: agent-runtime, evals, observability, │
  │              graph-store, config, domain, ui deps   │
  └────────────────────────────────────────────────────┘

packages/config          ← standalone (Zod env schemas)
packages/domain          ← standalone (pure types, no deps)
packages/okf             ← depends on: domain, config
packages/compiler        ← depends on: domain, okf
packages/graph-store     ← depends on: domain, compiler
packages/retrieval       ← depends on: domain, graph-store
packages/agent-runtime   ← depends on: graph-store, retrieval, domain
packages/evals           ← depends on: domain, retrieval
packages/observability   ← depends on: domain
```

**Strict rule:** No circular dependencies. Dependencies flow downward in the list above.

## Key Design Decisions

| Decision | Rationale |
|---|---|
| Markdown canonical, graph projected | Knowledge stays human-editable and version-controllable. Graph is a lossless materialization. |
| GraphStore interface, not direct DB | Allows swapping LadybugDB → Memory → future backends without touching agent or retrieval code. |
| Semantic tools, not raw Cypher | Prevents prompt injection, enables tool-selection evaluation, isolates DB changes. |
| Proposal-only agent writes | Agents can't corrupt canonical knowledge. Every change passes compiler validation. |
| Zod everywhere | Single source of truth for validation and TypeScript types. No drift between runtime checks and type system. |
| Server Components by default | Database and filesystem stay server-side. Only Cytoscape.js and chat streaming need client. |
| pnpm monorepo | Strict dependency isolation, workspace protocol, fast installs. |
| Contract tests for GraphStore | Any new graph backend must pass identical suite — prevents implementation-specific regressions. |

## Trust Boundaries

```
User Browser ──► Next.js Route Handler ──► GraphStore ──► LadybugDB
                       │                        │
                       ▼                        ▼
                 Zod validation          Cypher execution
                 (untrusted input)       (trusted internal)

Eve Agent ──► semantic tool ──► GraphStore
    │                               │
    ▼                               ▼
  no raw queries              typed operations
  no filesystem access         bounded results
```

## Data Flow: Agent Query

1. User submits question → `POST /api/agent/run`
2. Route Handler creates trace context, initializes Eve agent
3. Agent receives instructions + semantic tools
4. Agent calls `searchKnowledge(query)` → GraphStore → LadybugDB → Cypher
5. Agent calls `findSupportingEvidence(claimId)` → GraphStore → path traversal
6. Agent calls `findContradictions(claimId)` → GraphStore → joins on CONTRADICTS edges
7. Agent synthesizes answer with evidence citations
8. Response streams back with tool traces, entity references, provenance

## Regeneration Loop

```
knowledge/**/*.md ──► compiler ──► graph rebuild
                                       │
                    ┌──────────────────┘
                    ▼
              GraphStore.rebuild(corpus) ──► LadybugDB
                    │
                    ▼
              GraphBuildReport (diagnostics, entity count, hash)
```

The graph database can be deleted and fully regenerated from `knowledge/` at any time. No data lives exclusively in the graph.
