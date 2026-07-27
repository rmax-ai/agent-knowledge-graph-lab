import type { KnowledgeContext } from "@agkl/domain";

export interface KnowledgeRetrievalRequest {
  query: string;
  mode: "direct-document" | "graph" | "hybrid";
  maxResults?: number;
}

export interface KnowledgeRetriever {
  retrieve(request: KnowledgeRetrievalRequest): Promise<KnowledgeContext>;
}
