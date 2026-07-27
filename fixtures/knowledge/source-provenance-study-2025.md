---
id: source-provenance-study-2025
kind: source
title: 'Provenance-Aware Agents: Reducing Hallucination Through Attribution (Park et al., 2025)'
status: reviewed
confidence: 0.86
tags:
  - provenance
  - hallucination
  - attribution
relations:
  - type: DERIVES
    target: claim-provenance-reduces-hallucination
---

**Authors:** Park, S., Nguyen, T., Davis, K.
**Venue:** ACL 2025
**DOI:** 10.18653/v1/2025.acl-long.234

## Summary

Studied the effect of explicit provenance metadata on agent hallucination rates. Agents with access to provenance chains produced 52% fewer unsupported claims.

## Methodology

- 500 factoid questions requiring evidence
- Control: agents receive entity text only
- Treatment: agents receive entity + provenance chain
- Human evaluation of claim support (3 annotators, Fleiss' κ = 0.78)
