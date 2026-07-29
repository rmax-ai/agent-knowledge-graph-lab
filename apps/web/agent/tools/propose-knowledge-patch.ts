import { defineTool } from "eve/tools";
import { z } from "zod";

export default defineTool<any, any>({
  description:
    "Propose a change to the knowledge graph. Creates a patch proposal with rationale and evidence. Proposals are NOT applied automatically — they require human review and approval.",
  inputSchema: z.object({
    targetFile: z.string().describe("The knowledge document file to patch (e.g., 'concept-graph-retrieval.md')"),
    entityId: z.string().optional().describe("Specific entity ID within the document, if applicable"),
    operation: z.enum(["create-document", "update-frontmatter", "append-evidence", "add-relation", "deprecate-entity"]).describe("Type of change to propose"),
    rationale: z.string().min(10).describe("Why this change is needed — explain reasoning"),
    evidenceIds: z.array(z.string()).describe("Entity IDs that support this proposal"),
    patch: z.string().describe("The proposed change content (Markdown, YAML, or relation description)"),
  }),
  execute(input) {
    // Proposals are logged and returned for human review. They do NOT modify the graph.
    const proposal = {
      id: `prop-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      proposedAt: new Date().toISOString(),
      target: { file: input.targetFile, entityId: input.entityId },
      operation: input.operation,
      rationale: input.rationale,
      evidenceIds: input.evidenceIds,
      patch: input.patch,
      status: "pending-review",
      validation: {
        schemaValid: true,
        referencesValid: false, // Requires compiler validation
        evidencePresent: input.evidenceIds.length > 0,
      },
    };

    return {
      message: "Patch proposal created. It requires human review before being applied.",
      proposal,
    };
  },
});
