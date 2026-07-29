import { defineTool } from "eve/tools";
import { z } from "zod";
import { getGraphStore } from "../../lib/graph-store.js";

const VALID_KINDS = [
  "SUPPORTS", "CONTRADICTS", "DERIVED_FROM", "MENTIONS",
  "DEPENDS_ON", "SELECTS", "REJECTS", "IMPLEMENTS", "RELATED_TO", "SUPERSEDES",
] as const;

export default defineTool<any, any>({
  description:
    "Find paths between two knowledge entities. Returns the shortest paths showing how entities are connected through typed relations.",
  inputSchema: z.object({
    fromId: z.string().describe("Starting entity ID"),
    toId: z.string().describe("Target entity ID"),
    allowedRelations: z.array(z.enum(VALID_KINDS)).optional().describe("Only traverse these relation types"),
    maxDepth: z.number().min(1).max(6).default(4).describe("Maximum path length in hops"),
    limit: z.number().min(1).max(10).default(3).describe("Maximum paths to return"),
  }),
  async execute(input) {
    const store = await getGraphStore();
    const paths = await store.findPaths({
      fromId: input.fromId,
      toId: input.toId,
      allowedRelations: input.allowedRelations,
      maxDepth: input.maxDepth,
      limit: input.limit,
    });

    return {
      fromId: input.fromId,
      toId: input.toId,
      pathCount: paths.length,
      paths: paths.map((p) => ({
        length: p.length,
        entities: p.entities.map((e) => `${e.kind}:${e.title}`),
        relations: p.relations.map((r) => r.kind),
      })),
    };
  },
});
