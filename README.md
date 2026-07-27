# Agent Knowledge Graph Lab

Research environment for evaluating whether **typed knowledge graphs** improve agent retrieval, reasoning, and provenance tracing compared to document retrieval baselines.

**Stack:** TypeScript · Next.js App Router · Eve agents · LadybugDB · OKF Markdown

## What This Is

A local-first research lab where:
- **Knowledge** lives as version-controlled Markdown (`knowledge/**/*.md`)
- **A compiler** validates + materializes it into a typed property graph
- **Eve agents** query the graph through semantic tools (not raw Cypher)
- **An evaluation harness** compares graph retrieval against direct-document baselines

The primary research question: *Under which classes of agent tasks does typed graph retrieval produce better evidence selection, provenance, contradiction detection, and multi-hop reasoning than conventional document retrieval?*

## Quick Start

```bash
# Prerequisites: Node.js 22+, pnpm
pnpm install
pnpm dev            # Starts Next.js + initializes embedded graph
```

Open [http://localhost:3000](http://localhost:3000).

## Architecture

```
Markdown (canonical) → Compiler → LadybugDB (embedded graph) → Semantic Tools → Eve Agents → Next.js Console
```

- **Markdown is canonical.** The graph is a regenerable projection.
- **Agents use semantic tools** — `searchKnowledge`, `expandKnowledge`, `findPaths`, `findEvidence`, `findContradictions`, `traceProvenance` — never raw database queries.
- **Every relation carries provenance** — source file, assertion origin, confidence, evidence.
- **Agent writes are proposals** — must pass schema + reference + evidence validation, then human review.
- **Server Components by default.** Client Components only for browser APIs (graph viz, streaming chat).

## Project Structure

```
├── apps/web/          # Next.js App Router
├── agent/             # Eve agents, tools, skills, subagents
├── packages/          # domain, okf, compiler, graph-store, retrieval, agent-runtime, evals, observability, config
├── knowledge/         # Canonical OKF Markdown documents
├── ontology/          # Node types, relation types, constraints
├── datasets/          # Benchmark questions + expected results
├── docs/              # Architecture, ADRs, research notes
└── scripts/           # Build, validate, eval, inspect
```

## Commands

| Command | Description |
|---|---|
| `pnpm dev` | Start Next.js dev server + init graph |
| `pnpm build` | Production build |
| `pnpm typecheck` | Full-project type checking |
| `pnpm lint` | ESLint |
| `pnpm test` | Vitest (unit + contract + integration) |
| `pnpm test:e2e` | Playwright end-to-end |
| `pnpm knowledge:validate` | Validate knowledge documents |
| `pnpm knowledge:compile` | Compile corpus → graph |
| `pnpm eval` | Run evaluation benchmarks |
| `pnpm eval:compare` | Compare retrieval modes |

## Documentation

- [SPEC.md](SPEC.md) — Full specification (ground truth)
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — System architecture
- [docs/ROADMAP.md](docs/ROADMAP.md) — Development phases
- [AGENTS.md](AGENTS.md) — AI coding agent conventions

## Research Goals

- Does graph traversal improve multi-hop question answering?
- Do typed relations improve evidence precision?
- Does explicit provenance reduce unsupported claims?
- Do contradiction relations improve uncertainty handling?
- Does graph retrieval reduce context-window usage?
- Can agents choose useful graph operations reliably?

## License

MIT — see [LICENSE](LICENSE)
