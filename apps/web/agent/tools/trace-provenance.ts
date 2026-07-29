import { defineTool } from "eve/tools";
import { z } from "zod";
import { getGraphStore } from "../lib/graph-store.js";

export default defineTool<any, any>({
  description:
    "Trace the provenance chain of an entity — follow evidence back to source documents. Returns the full chain from entity to original sources with depth and completeness information.",
  inputSchema: z.object({
    entityId: z.string().describe("Entity to trace provenance for"),
    maxDepth: z.number().min(1).max(10).default(5).describe("Maximum depth to trace"),
  }),
  async execute(input) {
    const store = await getGraphStore();
    const trace = await store.traceProvenance({
      entityId: input.entityId,
      maxDepth: input.maxDepth,
    });

    return {
      entityId: input.entityId,
      root: { id: trace.root.id, kind: trace.root.kind, title: trace.root.title },
      chainLength: trace.chain.length,
      incomplete: trace.incomplete,
      chain: trace.chain.map((r) => ({
        source: { id: r.source.id, kind: r.source.kind, title: r.source.title },
        relation: r.relation.kind,
        depth: r.depth,
      })),
      sourceDocuments: trace.sourceDocuments.map((s) => ({
        file: s.file,
        documentId: s.documentId,
        contentHash: s.contentHash,
      })),
    };
  },
});
