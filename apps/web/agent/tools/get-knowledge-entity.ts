import { defineTool } from "eve/tools";
import { z } from "zod";
import { getGraphStore } from "../lib/graph-store.js";

export default defineTool<any, any>({
  description:
    "Get a single knowledge entity by its ID. Returns full entity details including provenance, confidence, and lifecycle metadata.",
  inputSchema: z.object({
    entityId: z.string().describe("The unique ID of the knowledge entity"),
  }),
  async execute(input) {
    const store = await getGraphStore();
    const entity = await store.getEntity(input.entityId);

    if (!entity) {
      return {
        found: false,
        message: `Entity "${input.entityId}" not found.`,
      };
    }

    return {
      found: true,
      entity: {
        id: entity.id,
        kind: entity.kind,
        title: entity.title,
        summary: entity.summary,
        status: entity.status,
        confidence: entity.confidence,
        tags: entity.tags,
        source: entity.source,
        lifecycle: entity.lifecycle,
      },
    };
  },
});
