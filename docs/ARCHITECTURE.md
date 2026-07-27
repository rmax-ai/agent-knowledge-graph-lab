# Architecture — Agent Knowledge Graph Lab

> References: SPEC.md §3 (Core Architectural Principles), §5 (System Architecture), §6-8 (Monorepo, Packages, Domain Model)

## System Architecture

```
┌─────────────────────────────────────────────────────┐
│                 Canonical knowledge                  │
│            Markdown + YAML + Git history             │
└─────────────────────────┬───────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│              Knowledge compilation pipeline          │
│ parse → validate → normalize → resolve → diagnose   │
└─────────────────────────┬───────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│                Compiled domain graph                 │
│        entities + relations + provenance data        │
└─────────────────────────┬───────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│                    GraphStore                        │
│  LadybugGraphStore / MemoryGraphStore / KuzuStore   │
└─────────────────────────┬───────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│             Semantic knowledge operations            │
│ search · expand · paths · evidence · contradictions │
└─────────────────────────┬───────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│                     Eve agents                       │
│ researcher · verifier · curator · orchestrator       │
└─────────────────────────┬───────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│               Next.js research console               │
│ chat · traces · evidence · graph · evaluations       │
└─────────────────────────────────────────────────────┘
```

## Component Architecture

### 1. Knowledge Compilation Pipeline (`packages/compiler`)

Dependency chain: `okf` → `compiler` → `graph-store`

```
knowledge/**/*.md
    │
    ▼
[okf] parse → YAML frontmatter + Markdown body + source spans + content hash
    │
    ▼
[compiler] normalize → deterministic IDs → link resolution → dedup → ontology checks → diagnostics
    │
    ▼
CompiledCorpus { entities, relations, documents, diagnostics, corpusHash }
    │
    ▼
[graph-store] rebuild(corpus) → GraphBuildReport
```

**Determinism guarantees:**
- IDs derived from content hashes (content-addressable)
- File ordering does not affect output
- Duplicate relations collapsed deterministically
- Repeated compilation of same corpus → identical corpusHash

### 2. GraphStore Interface (`packages/graph-store`)

```
interface GraphStore {
  initialize(): Promise<void>
  rebuild(corpus: CompiledCorpus): Promise<GraphBuildReport>
  getEntity(id: EntityId): Promise<KnowledgeEntity | null>
  searchEntities(req: SearchEntitiesRequest): Promise<readonly ScoredEntity[]>
  expand(req: ExpandGraphRequest): Promise<KnowledgeSubgraph>
  findPaths(req: FindPathsRequest): Promise<readonly KnowledgePath[]>
  findEvidence(req: FindEvidenceRequest): Promise<readonly EvidenceRecord[]>
  findContradictions(req: FindContradictionsRequest): Promise<readonly Contradiction[]>
  traceProvenance(req: TraceProvenanceRequest): Promise<ProvenanceTrace>
  health(): Promise<GraphStoreHealth>
  close(): Promise<void>
}
```

Implementations:
- **LadybugGraphStore** — Default. Embedded property graph via LadybugDB.
- **MemoryGraphStore** — In-memory for fast unit/contract tests.
- **KuzuGraphStore** — Historical compatibility (Kuzu archived, not default).

### 3. Retrieval Strategies (`packages/retrieval`)

```
interface KnowledgeRetriever {
  retrieve(req: KnowledgeRetrievalRequest): Promise<KnowledgeContext>
}
```

| Mode | Implementation | Strategy |
|---|---|---|
| `direct-document` | DirectDocumentRetriever | Raw Markdown → agent context |
| `graph` | GraphRetriever | GraphStore → semantic tools → agent context |
| `hybrid` | HybridRetriever | Both, ranked by relevance |

### 4. Eve Agent Runtime (`packages/agent-runtime`)

Bridges semantic tools to domain services:
- Constructs tool dependencies per-request
- Provides scoped execution context (traceId, runId, limits)
- Records tool inputs/outputs
- Enforces tool limits (depth, count, result size)
- Converts domain failures to typed tool errors
- Prevents direct database leakage

### 5. API Layer (`apps/web/app/api/`)

```
Route Handlers
├── agent/run        POST — Start agent execution (SSE stream)
├── agent/runs/:id   GET  — Run status
├── agent/runs/:id/events GET — SSE event stream
├── knowledge        GET  — List/query entities
├── knowledge/:id    GET  — Single entity
├── graph/search     POST — Graph search
├── graph/expand     POST — Neighborhood expansion
├── graph/paths      POST — Path finding
├── evaluations/run  POST — Execute evaluation
└── evaluations/:id  GET  — Evaluation results
```

## Data Flow: Agent Question → Answer

```
User question
  │
  ▼
Eve root agent (orchestrator)
  │
  ├─→ researcher subagent
  │     ├─ searchKnowledge → GraphStore.searchEntities()
  │     ├─ expandKnowledge → GraphStore.expand()
  │     └─ findKnowledgePaths → GraphStore.findPaths()
  │
  ├─→ verifier subagent
  │     ├─ findSupportingEvidence → GraphStore.findEvidence()
  │     ├─ findContradictions → GraphStore.findContradictions()
  │     └─ traceProvenance → GraphStore.traceProvenance()
  │
  ▼
Evidence-backed answer
  ├─ citations → source files
  ├─ graph paths → traversed entities/relations
  ├─ contradictions → surfaced uncertainties
  └─ trace → observability events
```

## Trust Boundaries

```
┌──────────┐     ┌──────────────┐     ┌──────────┐     ┌──────────┐
│  Browser  │────▶│  Next.js API  │────▶│  GraphStore │────▶│  .data/  │
│  (untrust) │     │  (validation) │     │  (typed)    │     │  graph/  │
└──────────┘     └──────────────┘     └──────────┘     └──────────┘
                        │
                        ▼
                 ┌──────────────┐
                 │  Eve Agents   │
                 │  (semantic    │
                 │   tools only) │
                 └──────────────┘
                        │
                        ▼
                 ┌──────────────┐
                 │  knowledge/   │
                 │  (read-only   │
                 │   for agents) │
                 └──────────────┘
```

- Browser: untrusted — all inputs validated via Zod
- API layer: validates, enforces limits, maps errors
- GraphStore: typed interface, no raw query exposure
- Agents: semantic tools only, no filesystem/DB access
- Knowledge: read-only for agents; writes are proposals → human review

## Deployment Topology

```
Single machine (local-first)
├── Node.js process
│   ├── Next.js server (App Router)
│   ├── Eve agent runtime (in-process)
│   └── LadybugDB (embedded, in-process)
├── .data/graph/        — LadybugDB files (regenerable)
├── .data/traces/       — JSONL trace files
├── .data/evals/        — Evaluation results
└── knowledge/          — Canonical Markdown (Git-tracked)
```

No external database daemon. No separate agent server. No Docker required for development.

## Risks & Open Questions

1. **LadybugDB maturity** — Mitigation: GraphStore abstraction, contract tests, MemoryGraphStore fallback
2. **Eve ↔ Next.js integration** — SSE streaming from Route Handlers; verify Eve supports in-process Node.js embedding
3. **Ontology scope** — Locked at 7 node types, 10 relation types; only expand when benchmarks demand it
4. **Evaluation validity** — Questions defined before retrieval tuning; include adversarial + graph-neutral cases
5. **Disk space** — Local environment is tight (~214MB free); monitor .data/ growth
