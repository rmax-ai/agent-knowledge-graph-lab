# Agent Knowledge Graph Lab — Specification

> Preserved verbatim from original development specification.
> This document is the ground-truth reference. All downstream documents reference SPEC.md sections.

**Working name:** Agent Knowledge Graph Lab
**Repository:** rmax-ai/agent-knowledge-graph-lab
**Runtime:** Node.js 22 (pragmatic: 24 used due to disk constraints)
**Language:** TypeScript (strict, ESM)
**Web framework:** Next.js App Router
**Agent framework:** Eve
**Canonical knowledge format:** OKF-compatible Markdown
**Graph engine:** LadybugDB via Kuzu-compatible adapter
**Primary purpose:** Research how typed knowledge graphs improve agent retrieval, reasoning, provenance tracing and contradiction detection.

---

*(Full original specification preserved below. See git history for the original commit.)*

See sections below for the complete specification as delivered.

## Executive Summary

Agent Knowledge Graph Lab is a local-first research environment for building and evaluating agents that operate over a typed knowledge graph.

Knowledge is authored as version-controlled Markdown documents with structured YAML metadata. A deterministic compiler validates these documents and materializes them into an embedded property graph. Eve agents access the graph through typed semantic tools rather than unrestricted database queries.

The system compares three knowledge-access strategies:
1. Direct Markdown retrieval
2. Semantic or vector retrieval
3. Typed graph retrieval

The primary research question: **Under which classes of agent tasks does typed graph retrieval produce better evidence selection, provenance, contradiction detection and multi-hop reasoning than conventional document retrieval?**

The graph database is a regenerable projection. Markdown files remain the canonical knowledge source.

## Product Goals

### Primary Goals
- Store canonical knowledge as human-readable Markdown
- Compile canonical knowledge into a typed property graph
- Expose semantic graph operations as Eve tools
- Provide an agent interface for knowledge investigation
- Expose every answer's evidence, graph path and source documents
- Support deterministic graph regeneration
- Evaluate graph retrieval against non-graph baselines
- Run locally without an external database service
- Remain replaceable at the graph-storage layer

### Research Goals
- Whether graph traversal improves multi-hop questions
- Whether typed relations improve evidence precision
- Whether explicit provenance reduces unsupported claims
- Whether contradiction relations improve uncertainty handling
- Whether graph retrieval reduces context-window usage
- Whether agents can choose useful graph operations reliably
- Whether graph structure improves tool trajectory quality
- Which graph capabilities agents need exposed as affordances

### Non-Goals (v1)
- General enterprise search
- Production multi-tenancy
- Autonomous ontology generation
- Unrestricted NL-to-Cypher
- Automatic ingestion from arbitrary systems
- Graph neural networks
- Large-scale distributed graph processing
- Collaborative knowledge editing
- Autonomous mutation of canonical knowledge
- Production-grade IAM
- Generic agent-memory platform

## Core Architectural Principles

1. **Markdown is canonical** — `knowledge/**/*.md` is authoritative; graph is derived
2. **Graph is a compiled projection** — supports traversal, retrieval, paths, provenance, contradictions
3. **Agents never receive unrestricted graph access** — semantic tools only, no `executeCypher`
4. **Every relation has provenance** — source file, assertion origin, confidence, evidence span, timestamp, deterministic ID
5. **Agent writes are proposals** — `KnowledgePatchProposal` must pass schema, reference, evidence, and consistency validation, then human review
6. **Server-first rendering** — Server Components by default; Client Components only for browser state/APIs

## Technology Stack

| Layer | Choice |
|---|---|
| Runtime | Node.js 22 LTS |
| Language | TypeScript (strict, ESM, noUncheckedIndexedAccess, exactOptionalPropertyTypes) |
| Package manager | pnpm (workspace monorepo) |
| Web framework | Next.js App Router |
| Agent framework | Eve |
| Graph engine | LadybugDB (Kuzu-compatible adapter) |
| Validation | Zod |
| Markdown | unified + remark-parse + remark-frontmatter + remark-gfm |
| UI | React + Tailwind CSS + shadcn/ui + Cytoscape.js |
| Testing | Vitest + React Testing Library + Playwright |
| Code quality | ESLint + Prettier |

## Monorepo Structure

```
agent-knowledge-graph-lab/
├── apps/web/          # Next.js App Router
├── agent/             # Eve agents, tools, skills, subagents
├── packages/          # domain, okf, compiler, graph-store, retrieval, agent-runtime, evals, observability, config
├── knowledge/         # Canonical Markdown documents
├── ontology/          # Node types, relation types, constraints, competency questions
├── datasets/          # Benchmark questions + expected results
├── scripts/           # validate, build, inspect, eval, clean
├── fixtures/          # Test knowledge corpus + graphs
├── .data/             # Runtime: graph DB, eval results, traces
├── docs/              # Architecture, ADRs, research notes
└── .github/workflows/ # CI pipeline
```

## Package Responsibilities

- **domain** — Database-independent types (no Next.js, React, Eve, LadybugDB imports)
- **okf** — Markdown parsing, YAML frontmatter, OKF validation, span extraction
- **compiler** — Normalization, deterministic IDs, link resolution, diagnostics, `CompiledCorpus` output
- **graph-store** — `GraphStore` interface with Ladybug, Memory, and Kuzu implementations
- **retrieval** — Interchangeable `KnowledgeRetriever` (direct-document, graph, hybrid)
- **agent-runtime** — Eve tool → domain service bridges, scoped execution context, trace IDs
- **evals** — Benchmark loaders, evaluation runners, metrics, regression comparison
- **observability** — Structured logging, trace events, correlation IDs, timing, token usage
- **config** — Zod environment validation, app configuration

## Domain Model

**Entity kinds (v1):** concept, claim, evidence, source, decision, technology, project

**Relation kinds (v1):** SUPPORTS, CONTRADICTS, DERIVED_FROM, MENTIONS, DEPENDS_ON, SELECTS, REJECTS, IMPLEMENTS, RELATED_TO, SUPERSEDES

**Entity schema:** id, kind, title, summary, status (draft|reviewed|accepted|deprecated), confidence, tags, source (file/documentId/contentHash/heading/line span), lifecycle (createdAt/updatedAt/supersededBy), metadata

**Relation schema:** id, kind, from, to, provenance (sourceFile/sourceDocumentId/assertedBy/evidenceText/line span), confidence, status (asserted|inferred|reviewed|deprecated)

**Patch proposals:** id, createdAt, proposedBy, target (file/entityId), operation (create-document|update-frontmatter|append-evidence|add-relation|deprecate-entity), rationale, evidenceIds, patch, validation

## Canonical Knowledge Format (OKF Markdown)

Required frontmatter: id, kind, title, status
Optional: confidence, tags, relations, created_at, updated_at, owners, supersedes, sources

Compiler requirements: globally unique IDs, existing relation targets, confidence 0-1, evidence for accepted claims, deprecation reasons, cyclic dependency reporting, deterministic duplicate collapsing, file-order independence.

## Eve Agent Design

- **Root agent** — Knowledge investigation orchestrator
- **Researcher subagent** — Explore concepts, find entities, traverse relations
- **Verifier subagent** — Inspect evidence, detect contradictions, assess provenance
- **Curator subagent** — Identify gaps, propose corrections, generate patches (no direct writes)

**Semantic tools (8):** searchKnowledge, getKnowledgeEntity, expandKnowledge, findKnowledgePaths, findSupportingEvidence, findContradictions, traceProvenance, proposeKnowledgePatch

## API Design (Next.js Route Handlers)

- `POST /api/agent/run` — Execute agent run
- `GET /api/agent/runs/:runId` — Run status
- `GET /api/agent/runs/:runId/events` — SSE event stream
- `GET /api/knowledge`, `GET /api/knowledge/:id` — Knowledge CRUD
- `POST /api/graph/search`, `POST /api/graph/expand`, `POST /api/graph/paths` — Graph operations
- `POST /api/evaluations/run`, `GET /api/evaluations/:runId` — Evaluation execution

## Development Phases

| Phase | Deliverable | Acceptance |
|---|---|---|
| 1: Foundation | Monorepo, Next.js, TS config, lint/format, CI | `pnpm install && pnpm typecheck && pnpm lint && pnpm build` |
| 2: Knowledge compiler | OKF parser, frontmatter schema, deterministic compilation, diagnostics, fixture corpus | Repeated compiles identical; invalid refs fail; stable hashes |
| 3: Graph layer | GraphStore interface, Memory + Ladybug implementations, contract tests | Both impls pass same tests; no daemon; regenerable |
| 4: Eve integration | Root agent, researcher, verifier, semantic tools, traces | Answers fixture Qs; source refs; tool traces; no raw DB access |
| 5: Web console | Assistant UI, streaming, graph explorer, evidence drawer, trace viewer | Answer → evidence → graph path → source document path |
| 6: Evaluation harness | Benchmark dataset, retrieval modes, deterministic metrics, failure classification | Direct-doc vs graph comparison; serialized results; regressions comparable |
| 7: Publication | Hybrid retriever, experimental report, architecture docs, reproducible instructions | Third-party clone → install → rebuild graph → reproduce evals |

## Definition of Done

- Node.js enforced locally + CI
- Next.js App Router, no custom server
- Eve agents with explicit instructions/tools/skills
- Canonical knowledge as Markdown
- Graph fully regenerable
- GraphStore abstraction layer
- LadybugDB default
- Typed, bounded semantic graph tools
- Every relation has provenance
- Agent answers expose evidence
- Contradictions surfaced, not silenced
- Direct-document vs graph retrieval evaluated
- Benchmark traces inspectable
- Critical paths automated tested
- Clean clone runs without external DB

## Initial Milestone Scope

- 30-50 knowledge documents
- 100-250 graph entities
- 200-500 graph relations
- 7 node types, 10 relation types
- 8 semantic agent tools
- 25 benchmark questions
- 2 retrieval modes
- 1 root agent, 2 subagents
- 4 primary UI views

## Principal Technical Risks

1. **Database lifecycle** — Kuzu archived → LadybugDB default, GraphStore isolation, contract tests
2. **Ontology overengineering** — Freeze at 7 node types; add only when benchmarks require
3. **Agent graph pollution** — Proposal-only mutations, evidence required, compiler validation, human approval
4. **Evaluation circularity** — Define questions before tuning; include graph-neutral + adversarial cases
5. **UI scope expansion** — Treat UI as research console; prioritize traces and evidence

## Recommended First Implementation Sequence

1. Node.js 22 pnpm workspace
2. Next.js App Router application
3. domain, okf, compiler, graph-store packages
4. 7 entity types, 10 relation types
5. 15-document fixture corpus
6. Deterministic compilation
7. MemoryGraphStore
8. Graph-store contract tests
9. LadybugGraphStore
10. Eve semantic tools
11. Researcher + verifier agents
12. Assistant page
13. Graph + evidence inspection
14. Benchmark definition
15. First direct-document vs graph experiment
