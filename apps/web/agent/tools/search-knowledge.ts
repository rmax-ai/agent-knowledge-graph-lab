import { defineTool } from "eve/tools";
import { z } from "zod";
import { getGraphStore } from "../../lib/graph-store.js";

const VALID_KINDS = ["concept", "claim", "evidence", "source", "decision", "technology", "project"] as const;

export default defineTool<any, any>({
  description:
    "Search for knowledge entities by text query. Returns scored results matching the query across entity titles and summaries. Filter by entity kind (concept, claim, evidence, source, decision, technology, project) or tags.",
  inputSchema: z.object({
    query: z.string().describe("Text query to search for"),
    kinds: z.array(z.enum(VALID_KINDS)).optional().describe("Filter by entity kinds"),
    tags: z.array(z.string()).optional().describe("Filter by tags"),
    limit: z.number().min(1).max(50).default(10).describe("Maximum results to return"),
  }),
  async execute(input) {
    const store = await getGraphStore();
    const results = await store.searchEntities({
      query: input.query,
      kinds: input.kinds,
      tags: input.tags,
      limit: input.limit,
    });

    return {
      count: results.length,
      results: results.map((r) => ({
        id: r.entity.id,
        kind: r.entity.kind,
        title: r.entity.title,
        status: r.entity.status,
        confidence: r.entity.confidence,
        score: r.score,
        matchReason: r.matchReason,
        summary: r.entity.summary,
        tags: r.entity.tags,
      })),
    };
  },
});
