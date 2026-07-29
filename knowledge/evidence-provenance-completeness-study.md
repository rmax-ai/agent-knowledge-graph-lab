---
id: evidence-provenance-completeness-study
kind: evidence
title: Provenance completeness correlates with answer accuracy (r = 0.74)
status: reviewed
confidence: 0.83
tags:
  - provenance
  - accuracy
  - correlation
relations:
  - type: SUPPORTS
    target: claim-provenance-reduces-hallucination
  - type: DERIVED_FROM
    target: source-provenance-study-2025
---

## Results

In a controlled study of 200 agent answers across 50 multi-hop questions:

| Provenance completeness | Answer accuracy | Sample size |
|---|---|---|
| Full (all sources traced) | 0.91 | 78 |
| Partial (≥50% sources traced) | 0.73 | 64 |
| Minimal (<50% sources traced) | 0.41 | 41 |
| None (zero provenance) | 0.12 | 17 |

Pearson correlation: r = 0.74 (p < 0.001)

## Interpretation

Answers with complete provenance traces were 7.6x more likely to be correct than answers with no provenance. This suggests provenance is both a quality signal and a debugging tool for incorrect answers.
