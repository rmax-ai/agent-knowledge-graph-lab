import type { EntityKind } from "./entities.js";
import type { RelationKind } from "./relations.js";
import type { KnowledgeEntity } from "./entities.js";
import type { KnowledgeRelation } from "./relations.js";

export interface SearchEntitiesRequest {
  query: string;
  kinds?: readonly EntityKind[];
  tags?: readonly string[];
  limit?: number;
}

export interface ScoredEntity {
  entity: KnowledgeEntity;
  score: number;
  matchReason: string;
}

export interface ExpandGraphRequest {
  entityId: string;
  direction?: "incoming" | "outgoing" | "both";
  relationKinds?: readonly RelationKind[];
  depth?: 1 | 2 | 3;
  limit?: number;
}

export interface FindPathsRequest {
  fromId: string;
  toId: string;
  allowedRelations?: readonly RelationKind[];
  maxDepth?: number;
  limit?: number;
}

export interface FindEvidenceRequest {
  claimId: string;
  includeContradicting?: boolean;
}

export interface FindContradictionsRequest {
  entityId: string;
  relationKinds?: readonly RelationKind[];
}

export interface TraceProvenanceRequest {
  entityId: string;
  maxDepth?: number;
}

export interface KnowledgeQuery {
  text: string;
  context?: KnowledgeContext;
}

export interface KnowledgeContext {
  entities: readonly KnowledgeEntity[];
  relations: readonly KnowledgeRelation[];
  documents: readonly string[];
}
