import type { KnowledgeEntity } from "./entities.js";
import type { KnowledgeRelation } from "./relations.js";

export interface EvidenceRecord {
  entity: KnowledgeEntity;
  relation: KnowledgeRelation;
  relevanceScore: number;
}

export interface ProvenanceRecord {
  source: KnowledgeEntity;
  relation: KnowledgeRelation;
  depth: number;
}

export interface ProvenanceTrace {
  root: KnowledgeEntity;
  chain: readonly ProvenanceRecord[];
  sourceDocuments: readonly SourceReference[];
  incomplete: boolean;
}

export interface SourceReference {
  file: string;
  documentId: string;
  contentHash: string;
}
