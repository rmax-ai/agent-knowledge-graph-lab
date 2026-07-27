// @agkl/domain — Database-independent domain types
// Must not import: Next.js, React, Eve, LadybugDB, or filesystem implementations.

export type { KnowledgeEntity, EntityKind, EntityStatus, JsonValue } from "./entities.js";
export type { KnowledgeRelation, RelationKind, RelationStatus } from "./relations.js";
export type { KnowledgePath, KnowledgeSubgraph } from "./graph.js";
export type { EvidenceRecord, ProvenanceRecord, ProvenanceTrace } from "./provenance.js";
export type { Contradiction } from "./contradictions.js";
export type { KnowledgePatchProposal, PatchOperation } from "./patches.js";
export type { KnowledgeQuery, KnowledgeContext, ScoredEntity, SearchEntitiesRequest, ExpandGraphRequest, FindPathsRequest, FindEvidenceRequest, FindContradictionsRequest, TraceProvenanceRequest } from "./queries.js";
export type { GraphStoreHealth, GraphBuildReport, GraphStore } from "./store.js";
export type { CompilerDiagnostic, CompiledCorpus, CompiledDocument } from "./compiler.js";
export { KnowledgeValidationError, KnowledgeNotFoundError, GraphBuildError, GraphQueryError, AgentExecutionError, ToolInputError, ToolLimitError, EvaluationError } from "./errors.js";
