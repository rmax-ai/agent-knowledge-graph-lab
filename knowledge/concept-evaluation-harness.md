---
id: concept-evaluation-harness
kind: concept
title: Evaluation Harness
status: reviewed
confidence: 0.87
tags:
  - evaluation
  - benchmarking
  - metrics
relations:
  - type: DEPENDS_ON
    target: concept-document-retrieval
  - type: DEPENDS_ON
    target: concept-graph-retrieval
---

The evaluation harness is a framework for comparing knowledge retrieval strategies against benchmark questions with known answers. It computes deterministic metrics and produces comparison reports.

## Retrieval Modes

| Mode | Description |
|---|---|
| Direct document | Load matching Markdown files into context |
| Graph | Traverse typed relations for evidence |
| Hybrid | Combine document retrieval + graph expansion |

## Metrics

- **Precision**: Fraction of returned entities that are relevant
- **Recall**: Fraction of expected entities that were found
- **Evidence path length**: Number of hops from answer to source
- **Provenance completeness**: Fraction of answers with complete provenance
- **Context tokens**: Token count used by the agent

## Failure Classification (10 categories)

Tool selection errors, relation traversal errors, depth limit misses, entity resolution failures, contradiction blindness, provenance gaps, context overflow, hallucination, timeout, unknown.
