---
id: project-agent-knowledge-graph-lab
kind: project
title: Agent Knowledge Graph Lab
status: reviewed
confidence: 0.95
tags:
  - research
  - agent
  - knowledge-graph
relations:
  - type: DEPENDS_ON
    target: concept-graph-retrieval
  - type: IMPLEMENTS
    target: decision-use-ladybugdb
  - type: IMPLEMENTS
    target: decision-semantic-tools-only
---

## Purpose

A local-first research environment for evaluating whether typed knowledge graphs improve agent retrieval, reasoning, provenance tracing, and contradiction detection compared to document retrieval baselines.

## Key Artifacts

- **Knowledge compiler:** Markdown → typed property graph
- **GraphStore:** LadybugDB + MemoryGraphStore backends
- **Eve agents:** Researcher, verifier, curator with semantic tools
- **Web console:** Next.js App Router with streaming agent interface
- **Evaluation harness:** Benchmark questions, metrics, regression testing

## Research Questions

1. Does graph traversal improve multi-hop question answering?
2. Do typed relations improve evidence precision?
3. Does explicit provenance reduce unsupported claims?
4. Do contradiction relations improve uncertainty handling?
5. Does graph retrieval reduce context-window usage?
