import type { GraphStore, KnowledgeContext, ScoredEntity } from "@agkl/domain";
import type { KnowledgeRetriever, KnowledgeRetrievalRequest } from "./types.js";

/** Retrieves knowledge through the typed graph. */
export class GraphRetriever implements KnowledgeRetriever {
  constructor(private readonly store: GraphStore) {}

  async retrieve(request: KnowledgeRetrievalRequest): Promise<KnowledgeContext> {
    const matches = await this.store.searchEntities({ query: request.query, limit: request.maxResults ?? 10 });
    return {
      entities: matches.map((m) => m.entity),
      relations: [],
      documents: [],
    };
  }
}
