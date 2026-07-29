import { defineTool } from "eve/tools";
import { z } from "zod";
import { getGraphStore } from "../../lib/graph-store.js";

const VALID_KINDS = [
  "SUPPORTS", "CONTRADICTS", "DERIVED_FROM", "MENTIONS",
  "DEPENDS_ON", "SELECTS", "REJECTS", "IMPLEMENTS", "RELATED_TO", "SUPERSEDES",
] as const;

export default defineTool<any, any>({
  description:
    "Find contradictions involving an entity. Returns pairs of claims that conflict — essential for surfacing disagreements and uncertainty in the knowledge graph.",
  inputSchema: z.object({
    entityId: z.string().describe("Entity to check for contradictions"),
    relationKinds: z.array(z.enum(VALID_KINDS)).optional().describe("Filter contradiction relations by type"),
  }),
  async execute(input) {
    const store = await getGraphStore();
    const contradictions = await store.findContradictions({
      entityId: input.entityId,
      relationKinds: input.relationKinds,
    });

    return {
      entityId: input.entityId,
      contradictionCount: contradictions.length,
      contradictions: contradictions.map((c) => ({
        claimA: { id: c.claimA.id, title: c.claimA.title },
        claimB: { id: c.claimB.id, title: c.claimB.title },
        relationKind: c.contradictingRelation.kind,
        resolution: c.resolution ?? "unresolved",
      })),
    };
  },
});
