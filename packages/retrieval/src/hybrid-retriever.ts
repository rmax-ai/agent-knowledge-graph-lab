import type { KnowledgeContext } from "@agkl/domain";
import type { KnowledgeRetriever, KnowledgeRetrievalRequest } from "./types.js";
import { DirectDocumentRetriever } from "./direct-document-retriever.js";
import { GraphRetriever } from "./graph-retriever.js";
import type { GraphStore } from "@agkl/domain";

/** Combines graph and document retrieval, merges and deduplicates results. */
export class HybridRetriever implements KnowledgeRetriever {
  private readonly direct: DirectDocumentRetriever;
  private readonly graph: GraphRetriever;

  constructor(store: GraphStore) {
    this.direct = new DirectDocumentRetriever();
    this.graph = new GraphRetriever(store);
  }

  async retrieve(request: KnowledgeRetrievalRequest): Promise<KnowledgeContext> {
    const [directResult, graphResult] = await Promise.all([
      this.direct.retrieve(request),
      this.graph.retrieve({ ...request, mode: "graph" }),
    ]);

    // Merge, deduplicate by entity ID
    const seen = new Set<string>();
    const entities = [...directResult.entities, ...graphResult.entities].filter((e) => {
      if (seen.has(e.id)) return false;
      seen.add(e.id);
      return true;
    });

    return { entities, relations: [], documents: [] };
  }
}
