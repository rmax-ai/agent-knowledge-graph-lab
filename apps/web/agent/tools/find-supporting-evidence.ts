import { defineTool } from "eve/tools";
import { z } from "zod";
import { getGraphStore } from "../lib/graph-store.js";

export default defineTool<any, any>({
  description:
    "Find evidence that supports or contradicts a claim entity. Returns supporting and contradicting evidence records with relevance scores. Essential for verifying factual claims.",
  inputSchema: z.object({
    claimId: z.string().describe("The claim entity ID to find evidence for"),
    includeContradicting: z.boolean().default(true).describe("Also include contradicting evidence"),
  }),
  async execute(input) {
    const store = await getGraphStore();
    const evidence = await store.findEvidence({
      claimId: input.claimId,
      includeContradicting: input.includeContradicting,
    });

    return {
      claimId: input.claimId,
      supportingCount: evidence.supporting.length,
      contradictingCount: evidence.contradicting.length,
      unresolved: evidence.unresolved,
      supporting: evidence.supporting.map((e) => ({
        entityId: e.entity.id,
        entityTitle: e.entity.title,
        relationKind: e.relation.kind,
        relevanceScore: e.relevanceScore,
        source: e.entity.source.file,
      })),
      contradicting: evidence.contradicting.map((e) => ({
        entityId: e.entity.id,
        entityTitle: e.entity.title,
        relationKind: e.relation.kind,
        relevanceScore: e.relevanceScore,
        source: e.entity.source.file,
      })),
    };
  },
});
