import { mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Connection, Database, type LbugValue, type QueryResult } from "@ladybugdb/core";
import type {
  CompiledCorpus,
  Contradiction,
  EntityKind,
  EntityStatus,
  EvidenceRecord,
  ExpandGraphRequest,
  FindContradictionsRequest,
  FindEvidenceRequest,
  FindPathsRequest,
  GraphBuildReport,
  GraphStore,
  GraphStoreHealth,
  JsonValue,
  KnowledgeEntity,
  KnowledgePath,
  KnowledgeRelation,
  KnowledgeSubgraph,
  ProvenanceRecord,
  ProvenanceTrace,
  RelationKind,
  RelationStatus,
  ScoredEntity,
  SearchEntitiesRequest,
  SourceReference,
  TraceProvenanceRequest,
} from "@agkl/domain";
import { GraphBuildError, GraphQueryError, KnowledgeNotFoundError } from "@agkl/domain";

const PACKAGE_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PROJECT_ROOT = join(PACKAGE_ROOT, "..", "..");
const DEFAULT_DB_PATH = join(PROJECT_ROOT, ".data", "ladybug", "graph.lbug");

const ENTITY_DDL = `
CREATE NODE TABLE IF NOT EXISTS ENTITY(
  id STRING,
  kind STRING,
  title STRING,
  summary STRING,
  status STRING,
  confidence DOUBLE,
  tags STRING[],
  sourceFile STRING,
  documentId STRING,
  contentHash STRING,
  heading STRING,
  startLine INT64,
  endLine INT64,
  createdAt STRING,
  updatedAt STRING,
  supersededBy STRING,
  metadata STRING,
  PRIMARY KEY(id)
)
`.trim();

const RELATION_DDL = `
CREATE REL TABLE IF NOT EXISTS RELATION(
  FROM ENTITY TO ENTITY,
  id STRING,
  kind STRING,
  fromId STRING,
  toId STRING,
  sourceFile STRING,
  sourceDocumentId STRING,
  assertedBy STRING,
  evidenceText STRING,
  startLine INT64,
  endLine INT64,
  confidence DOUBLE,
  status STRING
)
`.trim();

export interface LadybugGraphStoreOptions {
  /** Absolute path to the LadybugDB database file. Defaults to `.data/ladybug/graph.lbug`. */
  databasePath?: string;
}

/**
 * Embedded LadybugDB-backed GraphStore.
 * Persistent, regenerable projection of CompiledCorpus.
 */
export class LadybugGraphStore implements GraphStore {
  private readonly databasePath: string;
  private db: Database | null = null;
  private conn: Connection | null = null;
  private initialized = false;

  constructor(options: LadybugGraphStoreOptions = {}) {
    this.databasePath = resolve(options.databasePath ?? DEFAULT_DB_PATH);
  }

  async initialise(): Promise<void> {
    try {
      mkdirSync(dirname(this.databasePath), { recursive: true });
      this.db = new Database(this.databasePath);
      await this.db.init();
      this.conn = new Connection(this.db);
      await this.conn.init();
      await this.run(ENTITY_DDL);
      await this.run(RELATION_DDL);
      this.initialized = true;
    } catch (err) {
      throw new GraphBuildError(
        `Failed to initialise LadybugGraphStore at ${this.databasePath}: ${errorMessage(err)}`,
      );
    }
  }

  async rebuild(corpus: CompiledCorpus): Promise<GraphBuildReport> {
    this.ensureReady();
    const start = performance.now();

    try {
      await this.run("MATCH (n) DETACH DELETE n");

      const insertEntity = await this.prepare(`
        CREATE (n:ENTITY {
          id: $id,
          kind: $kind,
          title: $title,
          summary: $summary,
          status: $status,
          confidence: $confidence,
          tags: $tags,
          sourceFile: $sourceFile,
          documentId: $documentId,
          contentHash: $contentHash,
          heading: $heading,
          startLine: $startLine,
          endLine: $endLine,
          createdAt: $createdAt,
          updatedAt: $updatedAt,
          supersededBy: $supersededBy,
          metadata: $metadata
        })
      `);

      for (const entity of corpus.entities) {
        await this.execute(insertEntity, entityToParams(entity));
      }

      const insertRelation = await this.prepare(`
        MATCH (a:ENTITY {id: $fromId}), (b:ENTITY {id: $toId})
        CREATE (a)-[r:RELATION {
          id: $id,
          kind: $kind,
          fromId: $fromId,
          toId: $toId,
          sourceFile: $sourceFile,
          sourceDocumentId: $sourceDocumentId,
          assertedBy: $assertedBy,
          evidenceText: $evidenceText,
          startLine: $startLine,
          endLine: $endLine,
          confidence: $confidence,
          status: $status
        }]->(b)
      `);

      for (const relation of corpus.relations) {
        await this.execute(insertRelation, relationToParams(relation));
      }

      return {
        entityCount: corpus.entities.length,
        relationCount: corpus.relations.length,
        diagnostics: [],
        buildTimeMs: Math.round(performance.now() - start),
        corpusHash: corpus.corpusHash,
      };
    } catch (err) {
      if (err instanceof GraphBuildError || err instanceof GraphQueryError) throw err;
      throw new GraphBuildError(`LadybugGraphStore rebuild failed: ${errorMessage(err)}`);
    }
  }

  async getEntity(id: string): Promise<KnowledgeEntity | null> {
    this.ensureReady();
    try {
      const rows = await this.queryAll("MATCH (n:ENTITY {id: $id}) RETURN n", { id });
      const node = rows[0]?.["n"];
      if (!node || typeof node !== "object") return null;
      return nodeToEntity(node as Record<string, LbugValue>);
    } catch (err) {
      throw new GraphQueryError(`getEntity failed for ${id}: ${errorMessage(err)}`);
    }
  }

  async searchEntities(request: SearchEntitiesRequest): Promise<readonly ScoredEntity[]> {
    this.ensureReady();
    try {
      const query = request.query;
      const limit = request.limit ?? 10;
      const kinds = request.kinds ? new Set(request.kinds) : null;
      const tags = request.tags ? new Set(request.tags) : null;

      const rows = await this.queryAll(
        `
        MATCH (n:ENTITY)
        WHERE lower(n.title) CONTAINS lower($query)
           OR lower(n.summary) CONTAINS lower($query)
        RETURN n
        `,
        { query },
      );

      const results: ScoredEntity[] = [];
      for (const row of rows) {
        const node = row["n"];
        if (!node || typeof node !== "object") continue;
        const entity = nodeToEntity(node as Record<string, LbugValue>);

        if (kinds && !kinds.has(entity.kind)) continue;
        if (tags && !entity.tags.some((t) => tags.has(t))) continue;

        const titleMatch = entity.title.toLowerCase().includes(query.toLowerCase());
        results.push({
          entity,
          score: titleMatch ? 1.0 : 0.6,
          matchReason: titleMatch ? "title-match" : "summary-match",
        });
      }

      results.sort((a, b) => b.score - a.score);
      return results.slice(0, limit);
    } catch (err) {
      throw new GraphQueryError(`searchEntities failed: ${errorMessage(err)}`);
    }
  }

  async expand(request: ExpandGraphRequest): Promise<KnowledgeSubgraph & { truncated: boolean }> {
    this.ensureReady();
    const root = await this.getEntity(request.entityId);
    if (!root) throw new KnowledgeNotFoundError(request.entityId);

    try {
      const direction = request.direction ?? "both";
      const depth = request.depth ?? 1;
      const limit = request.limit ?? 20;
      const relationKinds = request.relationKinds ? new Set(request.relationKinds) : null;

      const visitedEntities = new Set<string>([root.id]);
      const visitedRelations = new Set<string>();
      const resultEntities: KnowledgeEntity[] = [root];
      const resultRelations: KnowledgeRelation[] = [];

      let frontier = new Set<string>([root.id]);

      for (let d = 0; d < depth; d++) {
        const nextFrontier = new Set<string>();

        for (const entityId of frontier) {
          const neighbors = await this.loadNeighbors(entityId, direction);

          for (const { relation, other } of neighbors) {
            if (relationKinds && !relationKinds.has(relation.kind)) continue;
            if (visitedRelations.has(relation.id)) continue;

            visitedRelations.add(relation.id);
            resultRelations.push(relation);

            if (!visitedEntities.has(other.id)) {
              visitedEntities.add(other.id);
              resultEntities.push(other);
              nextFrontier.add(other.id);
            }

            if (resultEntities.length >= limit) break;
          }

          if (resultEntities.length >= limit) break;
        }

        frontier = nextFrontier;
        if (resultEntities.length >= limit) break;
      }

      const health = await this.health();
      return {
        entities: resultEntities.slice(0, limit),
        relations: resultRelations,
        truncated:
          visitedEntities.size < health.entityCount && resultEntities.length >= limit,
      };
    } catch (err) {
      if (err instanceof KnowledgeNotFoundError) throw err;
      throw new GraphQueryError(`expand failed for ${request.entityId}: ${errorMessage(err)}`);
    }
  }

  async findPaths(request: FindPathsRequest): Promise<readonly KnowledgePath[]> {
    this.ensureReady();
    try {
      const { fromId, toId, allowedRelations, maxDepth = 4, limit = 3 } = request;
      const relationFilter = allowedRelations ? new Set(allowedRelations) : null;

      interface BfsNode {
        entityId: string;
        entityIds: string[];
        relationIds: string[];
      }

      const entityCache = new Map<string, KnowledgeEntity>();
      const relationCache = new Map<string, KnowledgeRelation>();

      const fromEntity = await this.getEntity(fromId);
      if (fromEntity) entityCache.set(fromId, fromEntity);

      const visited = new Set<string>([fromId]);
      const queue: BfsNode[] = [{ entityId: fromId, entityIds: [fromId], relationIds: [] }];
      const found: BfsNode[] = [];

      while (queue.length > 0 && found.length < limit) {
        const current = queue.shift()!;
        if (current.entityIds.length - 1 >= maxDepth) continue;

        const neighbors = await this.loadNeighbors(current.entityId, "both");
        for (const { relation, other } of neighbors) {
          if (relationFilter && !relationFilter.has(relation.kind)) continue;
          if (visited.has(other.id)) continue;

          visited.add(other.id);
          entityCache.set(other.id, other);
          relationCache.set(relation.id, relation);

          const next: BfsNode = {
            entityId: other.id,
            entityIds: [...current.entityIds, other.id],
            relationIds: [...current.relationIds, relation.id],
          };

          if (other.id === toId) {
            found.push(next);
            if (found.length >= limit) break;
          } else {
            queue.push(next);
          }
        }
      }

      return found.map((p) => ({
        entities: p.entityIds
          .map((id) => entityCache.get(id))
          .filter((e): e is KnowledgeEntity => e !== undefined),
        relations: p.relationIds
          .map((id) => relationCache.get(id))
          .filter((r): r is KnowledgeRelation => r !== undefined),
        length: p.relationIds.length,
      }));
    } catch (err) {
      throw new GraphQueryError(`findPaths failed: ${errorMessage(err)}`);
    }
  }

  async findEvidence(request: FindEvidenceRequest): Promise<{
    supporting: readonly EvidenceRecord[];
    contradicting: readonly EvidenceRecord[];
    unresolved: boolean;
  }> {
    this.ensureReady();
    try {
      const { claimId, includeContradicting = true } = request;
      const supporting: EvidenceRecord[] = [];
      const contradicting: EvidenceRecord[] = [];

      const incoming = await this.loadNeighbors(claimId, "incoming");
      for (const { relation, other } of incoming) {
        if (relation.kind === "SUPPORTS" || relation.kind === "DERIVED_FROM") {
          supporting.push({
            entity: other,
            relation,
            relevanceScore: relation.confidence ?? 0.8,
          });
        }
        if (includeContradicting && relation.kind === "CONTRADICTS") {
          contradicting.push({
            entity: other,
            relation,
            relevanceScore: relation.confidence ?? 0.8,
          });
        }
      }

      if (includeContradicting) {
        const outgoing = await this.loadNeighbors(claimId, "outgoing");
        for (const { relation, other } of outgoing) {
          if (relation.kind === "CONTRADICTS") {
            contradicting.push({
              entity: other,
              relation,
              relevanceScore: relation.confidence ?? 0.8,
            });
          }
        }
      }

      return {
        supporting,
        contradicting,
        unresolved: supporting.length === 0 && contradicting.length === 0,
      };
    } catch (err) {
      throw new GraphQueryError(`findEvidence failed: ${errorMessage(err)}`);
    }
  }

  async findContradictions(
    request: FindContradictionsRequest,
  ): Promise<readonly Contradiction[]> {
    this.ensureReady();
    try {
      const { entityId, relationKinds } = request;
      const kindFilter = relationKinds ? new Set(relationKinds) : new Set<RelationKind>(["CONTRADICTS"]);
      const root = await this.getEntity(entityId);
      if (!root) return [];

      const contradictions: Contradiction[] = [];
      const neighbors = await this.loadNeighbors(entityId, "both");

      for (const { relation, other } of neighbors) {
        if (!kindFilter.has(relation.kind)) continue;

        const claimA = relation.from === entityId ? root : other;
        const claimB = relation.from === entityId ? other : root;

        const isDuplicate = contradictions.some(
          (c) =>
            (c.claimA.id === claimA.id && c.claimB.id === claimB.id) ||
            (c.claimA.id === claimB.id && c.claimB.id === claimA.id),
        );
        if (isDuplicate) continue;

        contradictions.push({
          claimA,
          claimB,
          contradictingRelation: relation,
        });
      }

      return contradictions;
    } catch (err) {
      throw new GraphQueryError(`findContradictions failed: ${errorMessage(err)}`);
    }
  }

  async traceProvenance(request: TraceProvenanceRequest): Promise<ProvenanceTrace> {
    this.ensureReady();
    const { entityId, maxDepth = 5 } = request;
    const root = await this.getEntity(entityId);
    if (!root) throw new KnowledgeNotFoundError(entityId);

    try {
      const chain: ProvenanceRecord[] = [];
      const sourceDocs = new Map<string, SourceReference>();
      const visited = new Set<string>([entityId]);

      const walk = async (currentId: string, depth: number): Promise<void> => {
        if (depth >= maxDepth) return;

        const incoming = await this.loadNeighbors(currentId, "incoming");
        for (const { relation, other } of incoming) {
          if (relation.kind !== "DERIVED_FROM" && relation.kind !== "SUPPORTS") continue;
          if (visited.has(other.id)) continue;
          visited.add(other.id);

          chain.push({
            source: other,
            relation,
            depth: depth + 1,
          });

          const docId = other.source.documentId;
          if (!sourceDocs.has(docId)) {
            sourceDocs.set(docId, {
              file: other.source.file,
              documentId: other.source.documentId,
              contentHash: other.source.contentHash,
            });
          }

          await walk(other.id, depth + 1);
        }
      };

      await walk(entityId, 0);

      return {
        root,
        chain,
        sourceDocuments: [...sourceDocs.values()],
        incomplete: chain.length === 0,
      };
    } catch (err) {
      if (err instanceof KnowledgeNotFoundError) throw err;
      throw new GraphQueryError(`traceProvenance failed: ${errorMessage(err)}`);
    }
  }

  async health(): Promise<GraphStoreHealth> {
    if (!this.initialized || !this.conn) {
      return {
        ok: false,
        entityCount: 0,
        relationCount: 0,
        databasePath: this.databasePath,
      };
    }

    try {
      const entityRows = await this.queryAll("MATCH (n:ENTITY) RETURN count(n) AS entities");
      const relationRows = await this.queryAll("MATCH ()-[r]->() RETURN count(r) AS relations");
      return {
        ok: true,
        entityCount: asNumber(entityRows[0]?.["entities"]),
        relationCount: asNumber(relationRows[0]?.["relations"]),
        databasePath: this.databasePath,
      };
    } catch (err) {
      throw new GraphQueryError(`health failed: ${errorMessage(err)}`);
    }
  }

  async close(): Promise<void> {
    try {
      if (this.conn) {
        await this.conn.close();
        this.conn = null;
      }
      if (this.db) {
        await this.db.close();
        this.db = null;
      }
    } finally {
      this.initialized = false;
    }
  }

  // ---------------------------------------------------------------------------
  // Internals
  // ---------------------------------------------------------------------------

  private ensureReady(): void {
    if (!this.initialized || !this.conn) {
      throw new GraphQueryError("LadybugGraphStore is not initialised");
    }
  }

  private connection(): Connection {
    if (!this.conn) throw new GraphQueryError("LadybugGraphStore connection is closed");
    return this.conn;
  }

  private async run(cypher: string): Promise<void> {
    const result = await this.connection().query(cypher);
    closeResult(result);
  }

  private async prepare(cypher: string) {
    const statement = await this.connection().prepare(cypher);
    if (!statement.isSuccess()) {
      throw new GraphQueryError(`Failed to prepare statement: ${statement.getErrorMessage()}`);
    }
    return statement;
  }

  private async execute(
    statement: Awaited<ReturnType<Connection["prepare"]>>,
    params: Record<string, LbugValue>,
  ): Promise<void> {
    const result = await this.connection().execute(statement, params);
    closeResult(result);
  }

  private async queryAll(
    cypher: string,
    params?: Record<string, LbugValue>,
  ): Promise<Record<string, LbugValue>[]> {
    if (!params || Object.keys(params).length === 0) {
      const result = await this.connection().query(cypher);
      try {
        const single = Array.isArray(result) ? result[0] : result;
        if (!single) return [];
        return await single.getAll();
      } finally {
        closeResult(result);
      }
    }

    const statement = await this.prepare(cypher);
    const result = await this.connection().execute(statement, params);
    try {
      const single = Array.isArray(result) ? result[0] : result;
      if (!single) return [];
      return await single.getAll();
    } finally {
      closeResult(result);
    }
  }

  private async loadNeighbors(
    entityId: string,
    direction: "incoming" | "outgoing" | "both",
  ): Promise<Array<{ relation: KnowledgeRelation; other: KnowledgeEntity }>> {
    let cypher: string;
    if (direction === "outgoing") {
      cypher = `
        MATCH (n:ENTITY {id: $id})-[r:RELATION]->(m:ENTITY)
        RETURN r, m
      `;
    } else if (direction === "incoming") {
      cypher = `
        MATCH (n:ENTITY {id: $id})<-[r:RELATION]-(m:ENTITY)
        RETURN r, m
      `;
    } else {
      cypher = `
        MATCH (n:ENTITY {id: $id})-[r:RELATION]-(m:ENTITY)
        RETURN r, m
      `;
    }

    const rows = await this.queryAll(cypher, { id: entityId });
    const out: Array<{ relation: KnowledgeRelation; other: KnowledgeEntity }> = [];

    for (const row of rows) {
      const relNode = row["r"];
      const otherNode = row["m"];
      if (!relNode || typeof relNode !== "object") continue;
      if (!otherNode || typeof otherNode !== "object") continue;

      out.push({
        relation: relToRelation(relNode as Record<string, LbugValue>),
        other: nodeToEntity(otherNode as Record<string, LbugValue>),
      });
    }

    return out;
  }
}

// ---------------------------------------------------------------------------
// Mapping helpers
// ---------------------------------------------------------------------------

function entityToParams(entity: KnowledgeEntity): Record<string, LbugValue> {
  return {
    id: entity.id,
    kind: entity.kind,
    title: entity.title,
    summary: entity.summary ?? "",
    status: entity.status,
    confidence: entity.confidence ?? null,
    tags: [...entity.tags],
    sourceFile: entity.source.file,
    documentId: entity.source.documentId,
    contentHash: entity.source.contentHash,
    heading: entity.source.heading ?? "",
    startLine: entity.source.startLine ?? null,
    endLine: entity.source.endLine ?? null,
    createdAt: entity.lifecycle.createdAt ?? "",
    updatedAt: entity.lifecycle.updatedAt ?? "",
    supersededBy: entity.lifecycle.supersededBy ?? "",
    metadata: JSON.stringify(entity.metadata ?? {}),
  };
}

function relationToParams(relation: KnowledgeRelation): Record<string, LbugValue> {
  return {
    id: relation.id,
    kind: relation.kind,
    fromId: relation.from,
    toId: relation.to,
    sourceFile: relation.provenance.sourceFile,
    sourceDocumentId: relation.provenance.sourceDocumentId,
    assertedBy: relation.provenance.assertedBy,
    evidenceText: relation.provenance.evidenceText ?? "",
    startLine: relation.provenance.startLine ?? null,
    endLine: relation.provenance.endLine ?? null,
    confidence: relation.confidence ?? null,
    status: relation.status,
  };
}

function nodeToEntity(node: Record<string, LbugValue>): KnowledgeEntity {
  const tagsRaw = node["tags"];
  const tags = Array.isArray(tagsRaw) ? tagsRaw.map((t) => String(t)) : [];

  const source: KnowledgeEntity["source"] = {
    file: asString(node["sourceFile"]),
    documentId: asString(node["documentId"]),
    contentHash: asString(node["contentHash"]),
  };

  const heading = asString(node["heading"]);
  if (heading) source.heading = heading;

  const startLine = asOptionalInt(node["startLine"]);
  if (startLine !== undefined) source.startLine = startLine;

  const endLine = asOptionalInt(node["endLine"]);
  if (endLine !== undefined) source.endLine = endLine;

  const lifecycle: KnowledgeEntity["lifecycle"] = {};
  const createdAt = asString(node["createdAt"]);
  if (createdAt) lifecycle.createdAt = createdAt;
  const updatedAt = asString(node["updatedAt"]);
  if (updatedAt) lifecycle.updatedAt = updatedAt;
  const supersededBy = asString(node["supersededBy"]);
  if (supersededBy) lifecycle.supersededBy = supersededBy;

  let metadata: Readonly<Record<string, JsonValue>> = {};
  const metadataRaw = asString(node["metadata"]);
  if (metadataRaw) {
    try {
      metadata = JSON.parse(metadataRaw) as Record<string, JsonValue>;
    } catch {
      metadata = {};
    }
  }

  const entity: KnowledgeEntity = {
    id: asString(node["id"]),
    kind: asString(node["kind"]) as EntityKind,
    title: asString(node["title"]),
    status: asString(node["status"]) as EntityStatus,
    tags,
    source,
    lifecycle,
    metadata,
  };

  const summary = asString(node["summary"]);
  if (summary) {
    (entity as { summary?: string }).summary = summary;
  }

  const confidence = node["confidence"];
  if (typeof confidence === "number") {
    (entity as { confidence?: number }).confidence = confidence;
  }

  return entity;
}

function relToRelation(rel: Record<string, LbugValue>): KnowledgeRelation {
  const provenance: KnowledgeRelation["provenance"] = {
    sourceFile: asString(rel["sourceFile"]),
    sourceDocumentId: asString(rel["sourceDocumentId"]),
    assertedBy: (asString(rel["assertedBy"]) || "compiler") as
      | "human"
      | "agent"
      | "compiler",
  };

  const evidenceText = asString(rel["evidenceText"]);
  if (evidenceText) provenance.evidenceText = evidenceText;

  const startLine = asOptionalInt(rel["startLine"]);
  if (startLine !== undefined) provenance.startLine = startLine;

  const endLine = asOptionalInt(rel["endLine"]);
  if (endLine !== undefined) provenance.endLine = endLine;

  const relation: KnowledgeRelation = {
    id: asString(rel["id"]),
    kind: asString(rel["kind"]) as RelationKind,
    from: asString(rel["fromId"]),
    to: asString(rel["toId"]),
    provenance,
    status: (asString(rel["status"]) || "asserted") as RelationStatus,
  };

  const confidence = rel["confidence"];
  if (typeof confidence === "number") {
    (relation as { confidence?: number }).confidence = confidence;
  }

  return relation;
}

function asString(value: LbugValue | undefined): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

function asNumber(value: LbugValue | undefined): number {
  if (typeof value === "number") return value;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string" && value !== "") return Number(value);
  return 0;
}

function asOptionalInt(value: LbugValue | undefined): number | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "number") return value;
  if (typeof value === "bigint") return Number(value);
  return undefined;
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

function closeResult(result: QueryResult | QueryResult[] | null | undefined): void {
  if (!result) return;
  if (Array.isArray(result)) {
    for (const item of result) item.close();
    return;
  }
  result.close();
}
