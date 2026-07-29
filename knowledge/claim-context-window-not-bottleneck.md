---
id: claim-context-window-not-bottleneck
kind: claim
title: Context-window size is not a bottleneck for modern agents
status: draft
confidence: 0.45
tags:
  - context-window
  - skepticism
relations:
  - type: CONTRADICTS
    target: claim-graph-reduces-context-window
---

With context windows exceeding 1M tokens in current frontier models, the argument that graph retrieval "saves context" may be irrelevant for many use cases. The bottleneck is retrieval quality, not capacity.

## Counterpoint

While raw capacity is high, retrieval quality degrades as context fills with irrelevant content. The "needle in a haystack" problem persists regardless of window size.

## Status

This claim is under review and requires additional evidence before promotion to "accepted."
