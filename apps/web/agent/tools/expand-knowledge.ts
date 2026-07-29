import { defineTool } from "eve/tools";
import { z } from "zod";
import { getGraphStore } from "../../lib/graph-store.js";

const VALID_KINDS = [
  "SUPPORTS", "CONTRADICTS", "DERIVED_FROM", "MENTIONS",
  "DEPENDS_ON", "SELECTS", "REJECTS", "IMPLEMENTS", "RELATED_TO", "SUPERSEDES",
] as const;

export default defineTool<any, any>({
  description:
    "Expand the neighborhood of an entity — find connected entities and relations. Control direction (incoming, outgoing, both), depth (1-3 hops), and filter by relation kinds.",
  inputSchema: z.object({
    entityId: z.string().describe("The entity to expand from"),
    direction: z.enum(["incoming", "outgoing", "both"]).default("both").describe("Direction of relations to follow"),
    relationKinds: z.array(z.enum(VALID_KINDS)).optional().describe("Filter by relation types"),
    depth: z.number().min(1).max(3).default(1).describe("How many hops to traverse"),
    limit: z.number().min(1).max(100).default(20).describe("Maximum results to return"),
  }),
  async execute(input) {
    const store = await getGraphStore();
    const result = await store.expand({
      entityId: input.entityId,
      direction: input.direction,
      relationKinds: input.relationKinds,
      depth: input.depth as 1 | 2 | 3,
      limit: input.limit,
    });

    return {
      rootEntityId: input.entityId,
      entityCount: result.entities.length,
      relationCount: result.relations.length,
      truncated: result.truncated,
      entities: result.entities.map((e) => ({
        id: e.id,
        kind: e.kind,
        title: e.title,
        status: e.status,
      })),
      relations: result.relations.map((r) => ({
        id: r.id,
        kind: r.kind,
        from: r.from,
        to: r.to,
        status: r.status,
      })),
    };
  },
});
