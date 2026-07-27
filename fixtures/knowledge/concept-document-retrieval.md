---
id: concept-document-retrieval
kind: concept
title: Direct Document Retrieval
status: reviewed
confidence: 0.88
tags:
  - document-retrieval
  - baseline
relations:
  - type: RELATED_TO
    target: concept-graph-retrieval
---

Direct document retrieval loads relevant Markdown files into the agent's context window based on keyword matching or full-text search. This is the simplest retrieval baseline.

## Characteristics

- Zero preprocessing — documents are used as-is
- Keyword or full-text matching
- No type system, no relationship graph
- Documents returned as raw Markdown text

## Baseline Role

Direct document retrieval serves as the control condition in our experiments. It represents the "no graph" baseline that typed graph retrieval must outperform to demonstrate value.
