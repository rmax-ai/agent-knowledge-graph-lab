export type PatchOperation =
  | "create-document"
  | "update-frontmatter"
  | "append-evidence"
  | "add-relation"
  | "deprecate-entity";

export interface KnowledgePatchProposal {
  id: string;
  createdAt: string;
  proposedBy: string;

  target: {
    file: string;
    entityId?: string;
  };

  operation: PatchOperation;

  rationale: string;
  evidenceIds: readonly string[];
  patch: string;

  validation: {
    schemaValid: boolean;
    referencesValid: boolean;
    evidencePresent: boolean;
  };
}
