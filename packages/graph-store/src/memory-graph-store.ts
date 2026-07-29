import type {
  GraphStore,
  KnowledgeEntity,
  KnowledgeRelation,
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
  ProvenanceRecord,
  SourceReference,
} from "@agkl/domain";
import { KnowledgeNotFoundError } from "@agkl/domain";

/**
 * In-memory graph store for unit tests and fast iteration.
 * No persistence. Full graph rebuild on every corpus load.
 *
 * Maintains adjacency indexes for efficient traversal:
 * - outgoing: entityId → relations where entity is `from`
 * - incoming: entityId → relations where entity is `to`
 */
export class MemoryGraphStore implements GraphStore {
  private entities = new Map<string, KnowledgeEntity>();
  private relations = new Map<string, KnowledgeRelation>();
  private outgoing = new Map<string, KnowledgeRelation[]>();
  private incoming = new Map<string, KnowledgeRelation[]>();
  private initialized = false;

  async initialise(): Promise<void> {
    this.initialized = true;
  }

  async rebuild(corpus: CompiledCorpus): Promise<GraphBuildReport> {
    // Clear all state
    this.entities.clear();
    this.relations.clear();
    this.outgoing.clear();
    this.incoming.clear();

    for (const entity of corpus.entities) {
      this.entities.set(entity.id, entity);
    }

    for (const rel of corpus.relations) {
      this.relations.set(rel.id, rel);

      // Outgoing index
      const outList = this.outgoing.get(rel.from) ?? [];
      outList.push(rel);
      this.outgoing.set(rel.from, outList);

      // Incoming index
      const inList = this.incoming.get(rel.to) ?? [];
      inList.push(rel);
      this.incoming.set(rel.to, inList);
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
    const kinds = request.kinds ? new Set(request.kinds) : null;
    const tags = request.tags ? new Set(request.tags) : null;

    for (const entity of this.entities.values()) {
      if (kinds && !kinds.has(entity.kind)) continue;
      if (tags && !entity.tags.some((t) => tags.has(t))) continue;

      const titleMatch = entity.title.toLowerCase().includes(query);
      const summaryMatch = entity.summary?.toLowerCase().includes(query) ?? false;

      if (titleMatch || summaryMatch) {
        const score = titleMatch ? 1.0 : 0.6;
        results.push({
          entity,
          score,
          matchReason: titleMatch ? "title-match" : "summary-match",
        });
      }
    }

    // Sort by score descending
    results.sort((a, b) => b.score - a.score);

    const limit = request.limit ?? 10;
    return results.slice(0, limit);
  }

  async expand(request: ExpandGraphRequest): Promise<KnowledgeSubgraph & { truncated: boolean }> {
    const root = this.entities.get(request.entityId);
    if (!root) throw new KnowledgeNotFoundError(request.entityId);

    const direction = request.direction ?? "both";
    const depth = request.depth ?? 1;
    const limit = request.limit ?? 20;
    const relationKinds = request.relationKinds ? new Set(request.relationKinds) : null;

    const visitedEntities = new Set<string>([root.id]);
    const visitedRelations = new Set<string>();
    const resultEntities: KnowledgeEntity[] = [root];
    const resultRelations: KnowledgeRelation[] = [];

    // BFS frontier
    let frontier = new Set<string>([root.id]);

    for (let d = 0; d < depth; d++) {
      const nextFrontier = new Set<string>();

      for (const entityId of frontier) {
        // Collect relations
        const rels: KnowledgeRelation[] = [];

        if (direction === "outgoing" || direction === "both") {
          const outRels = this.outgoing.get(entityId) ?? [];
          rels.push(...outRels);
        }
        if (direction === "incoming" || direction === "both") {
          const inRels = this.incoming.get(entityId) ?? [];
          rels.push(...inRels);
        }

        for (const rel of rels) {
          if (relationKinds && !relationKinds.has(rel.kind)) continue;
          if (visitedRelations.has(rel.id)) continue;

          visitedRelations.add(rel.id);
          resultRelations.push(rel);

          // Find the other end
          const otherId = rel.from === entityId ? rel.to : rel.from;
          if (!visitedEntities.has(otherId)) {
            visitedEntities.add(otherId);
            const otherEntity = this.entities.get(otherId);
            if (otherEntity) {
              resultEntities.push(otherEntity);
              nextFrontier.add(otherId);
            }
          }

          if (resultEntities.length + nextFrontier.size >= limit) break;
        }

        if (resultEntities.length + nextFrontier.size >= limit) break;
      }

      frontier = nextFrontier;
      if (resultEntities.length >= limit) break;
    }

    return {
      entities: resultEntities,
      relations: resultRelations,
      truncated: visitedEntities.size < this.entities.size && resultEntities.length >= limit,
    };
  }

  async findPaths(request: FindPathsRequest): Promise<readonly KnowledgePath[]> {
    const { fromId, toId, allowedRelations, maxDepth = 4, limit = 3 } = request;
    const relationFilter = allowedRelations ? new Set(allowedRelations) : null;

    // Simple BFS path finding with depth limit
    interface BfsNode {
      entityId: string;
      path: { entities: string[]; relations: string[] };
    }

    const visited = new Set<string>([fromId]);
    const queue: BfsNode[] = [{ entityId: fromId, path: { entities: [fromId], relations: [] } }];
    const foundPaths: { entities: string[]; relations: string[] }[] = [];

    while (queue.length > 0 && foundPaths.length < limit) {
      const current = queue.shift()!;

      if (current.path.entities.length - 1 >= maxDepth) continue;

      // Get all outgoing and incoming relations
      const outRels = this.outgoing.get(current.entityId) ?? [];
      const inRels = this.incoming.get(current.entityId) ?? [];
      const allRels = [...outRels, ...inRels];

      for (const rel of allRels) {
        if (relationFilter && !relationFilter.has(rel.kind)) continue;

        const otherId = rel.from === current.entityId ? rel.to : rel.from;
        if (visited.has(otherId)) continue;

        visited.add(otherId);

        const newEntities = [...current.path.entities, otherId];
        const newRelations = [...current.path.relations, rel.id];

        if (otherId === toId) {
          foundPaths.push({ entities: newEntities, relations: newRelations });
        } else {
          queue.push({ entityId: otherId, path: { entities: newEntities, relations: newRelations } });
        }
      }
    }

    return foundPaths.map((p) => ({
      entities: p.entities.map((id) => this.entities.get(id)!).filter(Boolean),
      relations: p.relations.map((id) => this.relations.get(id)!).filter(Boolean),
      length: p.relations.length,
    }));
  }

  async findEvidence(request: FindEvidenceRequest): Promise<{
    supporting: readonly EvidenceRecord[];
    contradicting: readonly EvidenceRecord[];
    unresolved: boolean;
  }> {
    const { claimId, includeContradicting = true } = request;

    const supporting: EvidenceRecord[] = [];
    const contradicting: EvidenceRecord[] = [];

    // Incoming SUPPORTS / DERIVED_FROM relations to this claim
    const inRels = this.incoming.get(claimId) ?? [];
    for (const rel of inRels) {
      const sourceEntity = this.entities.get(rel.from);
      if (!sourceEntity) continue;

      if (rel.kind === "SUPPORTS" || rel.kind === "DERIVED_FROM") {
        // SUPPORTS = supporting evidence; DERIVED_FROM = this claim is derived from that entity
        supporting.push({
          entity: sourceEntity,
          relation: rel,
          relevanceScore: rel.confidence ?? 0.8,
        });
      }
    }

    // Outgoing CONTRADICTS relations from this claim
    if (includeContradicting) {
      const outRels = this.outgoing.get(claimId) ?? [];
      for (const rel of outRels) {
        if (rel.kind === "CONTRADICTS") {
          const targetEntity = this.entities.get(rel.to);
          if (!targetEntity) continue;
          contradicting.push({
            entity: targetEntity,
            relation: rel,
            relevanceScore: rel.confidence ?? 0.8,
          });
        }
      }

      // Incoming CONTRADICTS to this claim
      for (const rel of inRels) {
        if (rel.kind === "CONTRADICTS") {
          const sourceEntity = this.entities.get(rel.from);
          if (!sourceEntity) continue;
          contradicting.push({
            entity: sourceEntity,
            relation: rel,
            relevanceScore: rel.confidence ?? 0.8,
          });
        }
      }
    }

    return {
      supporting,
      contradicting,
      unresolved: supporting.length === 0 && contradicting.length === 0,
    };
  }

  async findContradictions(request: FindContradictionsRequest): Promise<readonly Contradiction[]> {
    const { entityId, relationKinds } = request;
    const kindFilter = relationKinds ? new Set(relationKinds) : new Set(["CONTRADICTS"]);

    const contradictions: Contradiction[] = [];

    // Outgoing CONTRADICTS
    const outRels = this.outgoing.get(entityId) ?? [];
    for (const rel of outRels) {
      if (!kindFilter.has(rel.kind)) continue;
      const targetEntity = this.entities.get(rel.to);
      if (!targetEntity) continue;

      const root = this.entities.get(entityId);
      if (!root) continue;

      contradictions.push({
        claimA: root,
        claimB: targetEntity,
        contradictingRelation: rel,
      });
    }

    // Incoming CONTRADICTS
    const inRels = this.incoming.get(entityId) ?? [];
    for (const rel of inRels) {
      if (!kindFilter.has(rel.kind)) continue;
      const sourceEntity = this.entities.get(rel.from);
      if (!sourceEntity) continue;

      const root = this.entities.get(entityId);
      if (!root) continue;

      // Avoid duplicates
      const isDuplicate = contradictions.some(
        (c) =>
          (c.claimA.id === sourceEntity.id && c.claimB.id === root.id) ||
          (c.claimA.id === root.id && c.claimB.id === sourceEntity.id),
      );
      if (!isDuplicate) {
        contradictions.push({
          claimA: sourceEntity,
          claimB: root,
          contradictingRelation: rel,
        });
      }
    }

    return contradictions;
  }

  async traceProvenance(request: TraceProvenanceRequest): Promise<ProvenanceTrace> {
    const { entityId, maxDepth = 5 } = request;
    const root = this.entities.get(entityId);
    if (!root) throw new KnowledgeNotFoundError(entityId);

    const chain: ProvenanceRecord[] = [];
    const sourceDocs = new Map<string, SourceReference>();
    const visited = new Set<string>([entityId]);

    // Eliminate the unused import; implement without re-declaring own SourceReference.
    // Walk DERIVED_FROM chain recursively
    const self = this;
    function walk(currentId: string, depth: number): void {
      if (depth >= maxDepth) return;

      const inRels = self.incoming.get(currentId) ?? [];
      for (const rel of inRels) {
        if (rel.kind !== "DERIVED_FROM" && rel.kind !== "SUPPORTS") continue;
        if (visited.has(rel.from)) continue;
        visited.add(rel.from);

        const sourceEntity = self.entities.get(rel.from);
        if (!sourceEntity) continue;

        chain.push({
          source: sourceEntity,
          relation: rel,
          depth: depth + 1,
        });

        // Collect source document references
        const docId = sourceEntity.source.documentId;
        if (!sourceDocs.has(docId)) {
          sourceDocs.set(docId, {
            file: sourceEntity.source.file,
            documentId: sourceEntity.source.documentId,
            contentHash: sourceEntity.source.contentHash,
          });
        }

        walk(rel.from, depth + 1);
      }
    }

    walk(entityId, 0);

    return {
      root,
      chain,
      sourceDocuments: [...sourceDocs.values()],
      incomplete: chain.length === 0,
    };
  }

  async health(): Promise<GraphStoreHealth> {
    return {
      ok: this.initialized,
      entityCount: this.entities.size,
      relationCount: this.relations.size,
      databasePath: "memory",
    };
  }

  async close(): Promise<void> {
    this.entities.clear();
    this.relations.clear();
    this.outgoing.clear();
    this.incoming.clear();
    this.initialized = false;
  }
}
