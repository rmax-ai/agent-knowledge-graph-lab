import type { KnowledgeEntity } from "./entities.js";
import type { KnowledgeRelation } from "./relations.js";

export interface Contradiction {
  claimA: KnowledgeEntity;
  claimB: KnowledgeEntity;
  contradictingRelation: KnowledgeRelation;
  resolution?: string;
}
