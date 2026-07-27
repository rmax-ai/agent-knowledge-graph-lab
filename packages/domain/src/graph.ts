import type { KnowledgeEntity } from "./entities.js";
import type { KnowledgeRelation } from "./relations.js";

export interface KnowledgeSubgraph {
  entities: readonly KnowledgeEntity[];
  relations: readonly KnowledgeRelation[];
}

export interface KnowledgePath {
  entities: readonly KnowledgeEntity[];
  relations: readonly KnowledgeRelation[];
  length: number;
}
