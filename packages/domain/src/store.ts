import type { KnowledgeEntity } from "./entities.js";
import type { KnowledgeRelation } from "./relations.js";
import type { KnowledgeSubgraph, KnowledgePath } from "./graph.js";
import type { EvidenceRecord, ProvenanceTrace } from "./provenance.js";
import type { Contradiction } from "./contradictions.js";
import type { SearchEntitiesRequest, ScoredEntity, ExpandGraphRequest, FindPathsRequest, FindEvidenceRequest, FindContradictionsRequest, TraceProvenanceRequest } from "./queries.js";
import type { CompiledCorpus } from "./compiler.js";

export interface GraphStoreHealth {
  ok: boolean;
  entityCount: number;
  relationCount: number;
  databasePath: string;
}

export interface GraphBuildReport {
  entityCount: number;
  relationCount: number;
  diagnostics: readonly { level: "info" | "warning" | "error"; message: string }[];
  buildTimeMs: number;
  corpusHash: string;
}

export interface GraphStore {
  initialise(): Promise<void>;

  rebuild(corpus: CompiledCorpus): Promise<GraphBuildReport>;

  getEntity(id: string): Promise<KnowledgeEntity | null>;

  searchEntities(request: SearchEntitiesRequest): Promise<readonly ScoredEntity[]>;

  expand(request: ExpandGraphRequest): Promise<KnowledgeSubgraph & { truncated: boolean }>;

  findPaths(request: FindPathsRequest): Promise<readonly KnowledgePath[]>;

  findEvidence(request: FindEvidenceRequest): Promise<{
    supporting: readonly EvidenceRecord[];
    contradicting: readonly EvidenceRecord[];
    unresolved: boolean;
  }>;

  findContradictions(request: FindContradictionsRequest): Promise<readonly Contradiction[]>;

  traceProvenance(request: TraceProvenanceRequest): Promise<ProvenanceTrace>;

  health(): Promise<GraphStoreHealth>;

  close(): Promise<void>;
}
