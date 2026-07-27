# Design Decisions — Agent Knowledge Graph Lab

> Records architectural choices, rationale, and rejected alternatives.
> References: SPEC.md, docs/ARCHITECTURE.md

## ADR-001: Markdown as Canonical Knowledge Format

**Decision:** Store all knowledge as version-controlled Markdown files with YAML frontmatter (`knowledge/**/*.md`). The graph database is a derived artifact.

**Rationale:**
- Human-readable, diffable, git-friendly
- No vendor lock-in — graph engine can be replaced without data migration
- Enables deterministic regeneration (delete `.data/graph/`, rebuild from Markdown)
- Supports collaborative editing via standard git workflows (future)

**Rejected alternatives:**
- **Graph-first (YAML/JSON graph definitions):** Less readable, harder to version, couples data to graph schema
- **Database-first (SQLite, PostgreSQL):** Requires migration scripts, harder to diff, less portable
- **Hybrid (Markdown + database as primary):** Unclear authority — which is the source of truth?

## ADR-002: LadybugDB as Default Graph Engine

**Decision:** Use LadybugDB (`@ladybugdb/core`) as the default embedded graph engine. Support KuzuGraphStore for historical compatibility only.

**Rationale:**
- Kuzu is archived — no future updates or security patches
- LadybugDB maintains Kuzu-compatible Cypher API
- Both are embedded (no daemon required) — aligns with local-first principle
- GraphStore abstraction makes the engine swappable

**Rejected alternatives:**
- **Kuzu only:** Archived, no maintenance
- **Neo4j embedded:** Heavy, requires JVM, not local-first
- **SQLite with graph layer:** Reinventing the wheel; Cypher is purpose-built for graph traversal

**Risk:** LadybugDB is relatively new. Mitigated by GraphStore contract tests and MemoryGraphStore fallback.

## ADR-003: Semantic Tools Over Raw Cypher

**Decision:** Eve agents receive typed semantic tools (`searchKnowledge`, `expandKnowledge`, `findPaths`, etc.) — never a general-purpose `executeCypher` tool.

**Rationale:**
- **Security:** Prevents arbitrary graph mutations, path traversal, injection
- **Observability:** Every tool call is typed, traced, and measurable
- **Portability:** Tool contracts are engine-independent — swap LadybugDB for another backend without changing agent code
- **Testability:** Tools have bounded inputs/outputs; can test tool selection patterns
- **Evaluation:** Enables comparison of tool-selection quality across agents

**Rejected alternatives:**
- **Raw Cypher tool:** Power but no guardrails. Agents generate unpredictable queries, hard to trace, hard to evaluate.
- **REST API only:** Loses the typed safety and Zod validation of tool definitions.

## ADR-004: pnpm Workspace Monorepo

**Decision:** Single pnpm workspace monorepo with `apps/` and `packages/`. No Nx, Turborepo, or Lerna.

**Rationale:**
- pnpm's native workspace support is sufficient for a 10-package monorepo
- `workspace:*` protocol ensures local package references
- No additional build orchestration needed — dependency graph is simple (domain ← okf ← compiler ← graph-store ← retrieval ← agent-runtime)
- Research project, not a production build pipeline — overhead of Nx/Turborepo isn't justified

**Rejected alternatives:**
- **Multi-repo:** Cross-package coordination overhead, version drift
- **npm workspaces:** Phantom dependency issues, slower installs
- **Turborepo:** Overkill for 10 packages with simple dependency chain

## ADR-005: Zod for All Validation

**Decision:** Zod as the single validation library for environment config, API payloads, domain entities, tool I/O, and eval records.

**Rationale:**
- `z.infer<typeof schema>` provides static types without duplication
- Discriminated unions (`z.discriminatedUnion`) for entity/relation kinds — O(1) parsing vs O(n) with `z.union`
- Runtime validation is essential for agent tools (untrusted LLM output)
- Single library reduces cognitive overhead

**Rejected alternatives:**
- **TypeScript interfaces only:** No runtime validation for agent tool inputs
- **Joi/Yup:** Similar capability, but Zod has better TypeScript inference and wider ecosystem alignment
- **JSON Schema:** More verbose, less ergonomic TypeScript inference

## ADR-006: Server Components by Default

**Decision:** Next.js App Router with Server Components as the default. Client Components only where browser APIs are required (Cytoscape.js, streaming chat state, drag).

**Rationale:**
- Graph-backed routes must run in Node.js runtime (LadybugDB native addon)
- Server Components reduce JS bundle size
- Database and filesystem access stays server-side
- Better alignment with local-first architecture (graph is on the filesystem)

**Rejected alternatives:**
- **Client Components everywhere:** Unnecessary JS overhead, exposes API patterns to browser
- **Pages Router:** App Router has better streaming, Server Components, and Route Handler patterns
- **SPA (Vite + React):** Would need a separate API server; Next.js provides both in one process

## ADR-007: Agent Writes Are Proposals

**Decision:** Agents may propose changes via `proposeKnowledgePatch` tool but must never directly modify `knowledge/` files.

**Rationale:**
- **Quality control:** Agent-generated knowledge requires human review
- **Safety:** Prevents autonomous corruption of the canonical knowledge base
- **Auditability:** Every proposed change is a discrete artifact under `.data/proposals/`
- **Reproducibility:** Canonical knowledge is deterministic; agent proposals are not

**Rejected alternatives:**
- **Agent direct writes with git history:** Git history shows what changed but not whether the change was valid
- **No agent writes:** Prevents the system from self-improving
- **Auto-approve with compiler validation:** Compiler can validate structure but not semantic correctness

## ADR-008: MemoryGraphStore for Testing

**Decision:** All graph-store implementations must pass an identical contract test suite. MemoryGraphStore is the reference implementation for fast unit tests.

**Rationale:**
- Contract tests ensure LadybugGraphStore and MemoryGraphStore behave identically
- MemoryGraphStore enables sub-second test runs (no native addon, no disk I/O)
- Adding a new backend (e.g., Neo4j in future) only requires passing the contract suite

## ADR-009: OKF-Compatible Markdown

**Decision:** Use OKF v0.2-compatible Markdown with YAML frontmatter. Only required field is `type` (OKF spec); project adds `id`, `kind`, `title`, `status` as required fields.

**Rationale:**
- OKF provides a standard format for knowledge graph entries
- YAML frontmatter is widely supported (gray-matter, remark-frontmatter)
- Markdown body supports rich content (evidence descriptions, limitations, references)
- OKF is simple enough to implement from spec (no heavy dependency)

## ADR-010: Node.js 22 Target (24 in Practice)

**Decision:** Target Node.js 22 LTS in `engines` field and CI. Use Node.js 24 locally due to disk space constraints preventing Node 22 installation.

**Rationale:**
- Node.js 22 is the current LTS — widest compatibility
- Eve requires Node.js 24+ (per docs, 22+ appears to work)
- LadybugDB supports both
- When disk space allows, install Node 22 for CI verification

**Risk:** Node 24 may introduce APIs not available in 22. Mitigated by CI testing against Node 22.
