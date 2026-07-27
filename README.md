# Agent Knowledge Graph Lab

[![CI](https://github.com/rmax-ai/agent-knowledge-graph-lab/actions/workflows/ci.yml/badge.svg)](https://github.com/rmax-ai/agent-knowledge-graph-lab/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Local-first research environment for building and evaluating agents that operate over a typed knowledge graph. Compares three knowledge-access strategies — direct Markdown retrieval, graph retrieval, and hybrid — to determine when typed graph structures improve agent evidence selection, provenance tracing, and multi-hop reasoning.

## Quick Start

```bash
# Prerequisites: Node.js 22+, pnpm 10+

git clone git@github.com:rmax-ai/agent-knowledge-graph-lab.git
cd agent-knowledge-graph-lab
pnpm install
pnpm dev                    # Starts Next.js + initializes embedded graph
```

Open [http://localhost:3000](http://localhost:3000).

## What This Is

- **A research console** for comparing retrieval strategies (graph vs. document vs. hybrid)
- **A typed knowledge graph** compiled from human-readable Markdown (OKF-compatible)
- **An agent harness** using Eve for structured tool-based knowledge investigation
- **An evaluation framework** with benchmarks, metrics, and regression testing

## What This Is Not

- A production knowledge management platform
- A general-purpose enterprise search system
- An autonomous ontology generator
- A collaborative editing environment

## Architecture

```
Markdown (canonical) → Compiler → GraphStore → Semantic Tools → Eve Agents → Web Console
```

- **Canonical knowledge:** `knowledge/**/*.md` with YAML frontmatter
- **Graph engine:** LadybugDB (embedded, zero-config)
- **Agent framework:** Eve with typed semantic tools
- **Web console:** Next.js 16 App Router

Read [ARCHITECTURE.md](ARCHITECTURE.md) for details.

## Repository Structure

```
├── apps/web/          # Next.js App Router application
├── agent/             # Eve agents, tools, skills, subagents
├── packages/          # domain, okf, compiler, graph-store, retrieval, agent-runtime, evals, observability, config
├── knowledge/         # Canonical knowledge documents (OKF)
├── ontology/          # Node types, relation types, constraints
├── datasets/          # Benchmark questions and expected outputs
├── docs/              # Architecture docs, ADRs, research notes
└── scripts/           # Build, validate, evaluate
```

## Commands

| Command | Purpose |
|---|---|
| `pnpm dev` | Start Next.js dev server + initialize graph |
| `pnpm build` | Build all packages + Next.js production build |
| `pnpm typecheck` | TypeScript type checking across all packages |
| `pnpm lint` | ESLint across the project |
| `pnpm test` | Vitest (unit + contract + integration) |
| `pnpm test:e2e` | Playwright end-to-end tests |
| `pnpm knowledge:validate` | Validate canonical knowledge documents |
| `pnpm knowledge:compile` | Compile Markdown → graph entities |
| `pnpm graph:build` | Build the graph database |
| `pnpm graph:inspect` | Interactive graph inspection |
| `pnpm eval` | Run evaluation benchmarks |

## Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) — System architecture and design decisions
- [docs/architecture/](docs/architecture/) — Detailed architecture documentation
- [docs/adr/](docs/adr/) — Architecture Decision Records
- [docs/research/](docs/research/) — Research notes and experimental results
- [TS_DEVELOPMENT.md](TS_DEVELOPMENT.md) — TypeScript development conventions
- [AGENTS.md](AGENTS.md) — Conventions for AI coding agents

## License

MIT — see [LICENSE](LICENSE).
