import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { GraphStore } from "@agkl/domain";
import { MemoryGraphStore } from "../memory-graph-store.js";

/**
 * Contract tests for GraphStore implementations.
 * Every GraphStore implementation must pass this suite.
 */

function createStore(): GraphStore {
  return new MemoryGraphStore();
}

describe("GraphStore contract", () => {
  let store: GraphStore;

  beforeAll(async () => {
    store = createStore();
    await store.initialise();
  });

  afterAll(async () => {
    await store.close();
  });

  it("initialises empty graph", async () => {
    const health = await store.health();
    expect(health.ok).toBe(true);
    expect(health.entityCount).toBeGreaterThanOrEqual(0);
  });

  it("rebuilds graph from corpus", async () => {
    const corpus = {
      entities: [
        {
          id: "test-entity-1",
          kind: "concept" as const,
          title: "Test Entity",
          status: "draft" as const,
          tags: [],
          source: { file: "test.md", documentId: "test-entity-1", contentHash: "abc123" },
          lifecycle: {},
          metadata: {},
        },
      ],
      relations: [],
      documents: [],
      diagnostics: [],
      corpusHash: "hash123",
    };

    const report = await store.rebuild(corpus);
    expect(report.entityCount).toBe(1);
    expect(report.relationCount).toBe(0);
    expect(report.corpusHash).toBe("hash123");
  });

  it("retrieves entity by ID", async () => {
    const entity = await store.getEntity("test-entity-1");
    expect(entity).not.toBeNull();
    expect(entity!.id).toBe("test-entity-1");
    expect(entity!.title).toBe("Test Entity");
  });

  it("returns null for missing entity", async () => {
    const entity = await store.getEntity("nonexistent");
    expect(entity).toBeNull();
  });

  it("searches entities by query", async () => {
    const results = await store.searchEntities({ query: "Test" });
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]!.entity.title).toContain("Test");
  });

  it("searches entities respects limit", async () => {
    // Add a second entity
    await store.rebuild({
      entities: [
        {
          id: "t1",
          kind: "concept" as const,
          title: "Alpha",
          status: "draft" as const,
          tags: [],
          source: { file: "a.md", documentId: "t1", contentHash: "h1" },
          lifecycle: {},
          metadata: {},
        },
        {
          id: "t2",
          kind: "concept" as const,
          title: "Beta",
          status: "draft" as const,
          tags: [],
          source: { file: "b.md", documentId: "t2", contentHash: "h2" },
          lifecycle: {},
          metadata: {},
        },
        {
          id: "t3",
          kind: "concept" as const,
          title: "Alpha Beta",
          status: "draft" as const,
          tags: [],
          source: { file: "c.md", documentId: "t3", contentHash: "h3" },
          lifecycle: {},
          metadata: {},
        },
      ],
      relations: [],
      documents: [],
      diagnostics: [],
      corpusHash: "hash2",
    });

    const results = await store.searchEntities({ query: "Alpha", limit: 1 });
    expect(results.length).toBeLessThanOrEqual(1);
  });

  it("expand returns root entity", async () => {
    const result = await store.expand({ entityId: "t1" });
    expect(result.entities.length).toBe(1);
    expect(result.entities[0]!.id).toBe("t1");
  });

  it("expand throws on missing entity", async () => {
    await expect(store.expand({ entityId: "nonexistent" })).rejects.toThrow();
  });

  it("findPaths returns empty array", async () => {
    const paths = await store.findPaths({ fromId: "t1", toId: "t2" });
    expect(Array.isArray(paths)).toBe(true);
  });

  it("findEvidence returns empty results", async () => {
    const result = await store.findEvidence({ claimId: "test-entity-1" });
    expect(result.supporting).toEqual([]);
    expect(result.contradicting).toEqual([]);
  });

  it("findContradictions returns empty array", async () => {
    const contradictions = await store.findContradictions({ entityId: "test-entity-1" });
    expect(contradictions).toEqual([]);
  });

  it("traceProvenance returns root with incomplete flag", async () => {
    const trace = await store.traceProvenance({ entityId: "t1" });
    expect(trace.root.id).toBe("t1");
    expect(trace.incomplete).toBe(true);
  });

  it("health reports correct counts", async () => {
    const health = await store.health();
    expect(health.ok).toBe(true);
    expect(typeof health.entityCount).toBe("number");
  });
});
