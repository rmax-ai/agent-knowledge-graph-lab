/** Relation kinds supported in v1. */
export type RelationKind =
  | "SUPPORTS"
  | "CONTRADICTS"
  | "DERIVED_FROM"
  | "MENTIONS"
  | "DEPENDS_ON"
  | "SELECTS"
  | "REJECTS"
  | "IMPLEMENTS"
  | "RELATED_TO"
  | "SUPERSEDES";

export type RelationStatus = "asserted" | "inferred" | "reviewed" | "deprecated";

/** A typed edge in the knowledge graph with full provenance. */
export interface KnowledgeRelation {
  id: string;
  kind: RelationKind;
  from: string;
  to: string;

  provenance: {
    sourceFile: string;
    sourceDocumentId: string;
    assertedBy: "human" | "agent" | "compiler";
    evidenceText?: string;
    startLine?: number;
    endLine?: number;
  };

  confidence?: number;
  status: RelationStatus;
}
