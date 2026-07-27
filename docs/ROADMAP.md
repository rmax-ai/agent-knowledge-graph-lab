# Roadmap — Agent Knowledge Graph Lab

> References: SPEC.md §22 (Development Phases), §24 (Initial Milestone Scope)

## Phase 1: Foundation ✅ (in progress)

**Deliverables:**
- [x] Node.js workspace (Node 24; spec target 22)
- [x] pnpm workspace monorepo
- [x] Next.js App Router scaffold
- [x] Shared TypeScript configuration (tsconfig.base.json)
- [ ] ESLint + Prettier configuration
- [ ] Package scaffolding (all workspace packages)
- [ ] CI baseline (GitHub Actions: install, typecheck, lint, format-check)

**Acceptance:** `pnpm install && pnpm typecheck && pnpm lint && pnpm build` all succeed.

## Phase 2: Knowledge Compiler

**Deliverables:**
- [ ] Markdown parser (unified + remark)
- [ ] YAML frontmatter schema (Zod)
- [ ] OKF structure validation
- [ ] Ontology schema (node types, relation types, constraints)
- [ ] Deterministic compilation
- [ ] Compiler diagnostics
- [ ] 15-document fixture corpus

**Acceptance:** Corpus compiles identically across repeated runs; invalid references fail validation; output has stable hashes and IDs.

## Phase 3: Graph Layer

**Deliverables:**
- [ ] GraphStore interface
- [ ] MemoryGraphStore implementation
- [ ] LadybugGraphStore implementation
- [ ] Graph schema creation
- [ ] Full rebuild from CompiledCorpus
- [ ] Semantic graph operations (search, expand, paths, evidence, contradictions, provenance)
- [ ] Graph-store contract test suite

**Acceptance:** Both implementations pass contract tests; embedded database requires no daemon; graph can be deleted and regenerated.

## Phase 4: Eve Integration

**Deliverables:**
- [ ] Root Eve agent (knowledge investigation orchestrator)
- [ ] Researcher subagent
- [ ] Verifier subagent
- [ ] Semantic tools (8 tools with Zod I/O schemas)
- [ ] Tool execution limits (depth, count, result size)
- [ ] Structured traces (tool calls, timing, results)

**Acceptance:** Agent answers fixture questions; every factual answer contains source references; tool calls visible in traces; no unrestricted DB access possible.

## Phase 5: Web Research Console

**Deliverables:**
- [ ] Assistant interface with streaming
- [ ] Graph explorer (Cytoscape.js, Client Component)
- [ ] Evidence drawer
- [ ] Source document browser
- [ ] Trace viewer
- [ ] Knowledge browser (filter by kind, status, tag)

**Acceptance:** User can navigate from answer → evidence → graph path → source document.

## Phase 6: Evaluation Harness

**Deliverables:**
- [ ] 25-question benchmark dataset
- [ ] Retrieval-mode abstraction (direct-document, graph)
- [ ] Deterministic metrics computation
- [ ] Comparison reports
- [ ] Failure classification (10 categories)
- [ ] Regression comparison between commits

**Acceptance:** Direct-document and graph modes run against same questions; results serialized; regressions comparable.

## Phase 7: Hybrid Retrieval & Publication

**Deliverables:**
- [ ] Hybrid retriever
- [ ] Experimental report
- [ ] Architecture documentation (complete)
- [ ] Reproducible benchmark instructions
- [ ] Public demonstration corpus (30-50 documents)

**Acceptance:** Third party can clone → install → rebuild graph → reproduce evaluations.

## Initial Milestone Target

- 30-50 knowledge documents
- 100-250 graph entities
- 200-500 graph relations
- 7 node types, 10 relation types
- 8 semantic agent tools
- 25 benchmark questions
- 2 retrieval modes
- 1 root agent, 2 subagents
- 4 primary UI views

## Timeline Estimates

| Phase | Est. Sessions | Dependencies |
|---|---|---|
| 1: Foundation | 1 | None |
| 2: Compiler | 2-3 | Phase 1 |
| 3: Graph Layer | 2-3 | Phase 2 |
| 4: Eve Integration | 3-4 | Phase 3 |
| 5: Web Console | 3-4 | Phase 4 |
| 6: Evaluation | 2-3 | Phase 5 |
| 7: Publication | 2 | Phase 6 |
| **Total** | **15-20** | |
