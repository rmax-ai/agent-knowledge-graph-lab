import type { KnowledgeContext } from "@agkl/domain";
import type { KnowledgeRetriever, KnowledgeRetrievalRequest } from "./types.js";

/** Stub: retrieves knowledge by scanning markdown files directly. */
export class DirectDocumentRetriever implements KnowledgeRetriever {
  async retrieve(_request: KnowledgeRetrievalRequest): Promise<KnowledgeContext> {
    return { entities: [], relations: [], documents: [] };
  }
}
