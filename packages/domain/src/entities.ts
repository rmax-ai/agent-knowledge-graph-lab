/** Entity kinds supported in v1. */
export type EntityKind =
  | "concept"
  | "claim"
  | "evidence"
  | "source"
  | "decision"
  | "technology"
  | "project";

export type EntityStatus = "draft" | "reviewed" | "accepted" | "deprecated";

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

/** A node in the knowledge graph. */
export interface KnowledgeEntity {
  id: string;
  kind: EntityKind;
  title: string;
  summary?: string;
  status: EntityStatus;
  confidence?: number;
  tags: readonly string[];

  source: {
    file: string;
    documentId: string;
    contentHash: string;
    heading?: string;
    startLine?: number;
    endLine?: number;
  };

  lifecycle: {
    createdAt?: string;
    updatedAt?: string;
    supersededBy?: string;
  };

  metadata: Readonly<Record<string, JsonValue>>;
}
