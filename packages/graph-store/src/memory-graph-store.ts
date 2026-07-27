import type {
  GraphStore,
  KnowledgeEntity,
  CompiledCorpus,
  GraphBuildReport,
  GraphStoreHealth,
  SearchEntitiesRequest,
  ScoredEntity,
  ExpandGraphRequest,
  KnowledgeSubgraph,
  FindPathsRequest,
  KnowledgePath,
  FindEvidenceRequest,
  EvidenceRecord,
  FindContradictionsRequest,
  Contradiction,
  TraceProvenanceRequest,
  ProvenanceTrace,
} from "@agkl/domain";
import { KnowledgeNotFoundError } from "@agkl/domain";

/**
 * In-memory graph store for unit tests and fast iteration.
 * No persistence. Full graph rebuild on every corpus load.
 */
export class MemoryGraphStore implements GraphStore {
  private entities = new Map<string, KnowledgeEntity>();
  private initialized = false;

  async initialise(): Promise<void> {
    this.initialized = true;
  }

  async rebuild(corpus: CompiledCorpus): Promise<GraphBuildReport> {
    this.entities.clear();
    for (const entity of corpus.entities) {
      this.entities.set(entity.id, entity);
    }
    return {
      entityCount: corpus.entities.length,
      relationCount: corpus.relations.length,
      diagnostics: [],
      buildTimeMs: 0,
      corpusHash: corpus.corpusHash,
    };
  }

  async getEntity(id: string): Promise<KnowledgeEntity | null> {
    return this.entities.get(id) ?? null;
  }

  async searchEntities(request: SearchEntitiesRequest): Promise<readonly ScoredEntity[]> {
    const query = request.query.toLowerCase();
    const results: ScoredEntity[] = [];
    for (const entity of this.entities.values()) {
      if (entity.title.toLowerCase().includes(query)) {
        results.push({ entity, score: 1.0, matchReason: "title-match" });
      }
    }
    const limit = request.limit ?? 10;
    return results.slice(0, limit);
  }

  async expand(request: ExpandGraphRequest): Promise<KnowledgeSubgraph & { truncated: boolean }> {
    const root = this.entities.get(request.entityId);
    if (!root) throw new KnowledgeNotFoundError(request.entityId);
    return { entities: [root], relations: [], truncated: false };
  }

  async findPaths(_request: FindPathsRequest): Promise<readonly KnowledgePath[]> {
    return [];
  }

  async findEvidence(_request: FindEvidenceRequest): Promise<{
    supporting: readonly EvidenceRecord[];
    contradicting: readonly EvidenceRecord[];
    unresolved: boolean;
  }> {
    return { supporting: [], contradicting: [], unresolved: false };
  }

  async findContradictions(_request: FindContradictionsRequest): Promise<readonly Contradiction[]> {
    return [];
  }

  async traceProvenance(_request: TraceProvenanceRequest): Promise<ProvenanceTrace> {
    const root = this.entities.get(_request.entityId);
    if (!root) throw new KnowledgeNotFoundError(_request.entityId);
    return { root, chain: [], sourceDocuments: [], incomplete: true };
  }

  async health(): Promise<GraphStoreHealth> {
    return {
      ok: this.initialized,
      entityCount: this.entities.size,
      relationCount: 0,
      databasePath: "memory",
    };
  }

  async close(): Promise<void> {
    this.entities.clear();
    this.initialized = false;
  }
}
