// @agkl/domain — Database-independent domain types
// Must not import: Next.js, React, Eve, LadybugDB, or filesystem implementations.

export type { KnowledgeEntity, EntityKind, EntityStatus, JsonValue } from "./entities";
export type { KnowledgeRelation, RelationKind, RelationStatus } from "./relations";
export type { KnowledgePath, KnowledgeSubgraph } from "./graph";
export type { EvidenceRecord, ProvenanceRecord, ProvenanceTrace, SourceReference } from "./provenance";
export type { Contradiction } from "./contradictions";
export type { KnowledgePatchProposal, PatchOperation } from "./patches";
export type { KnowledgeQuery, KnowledgeContext, ScoredEntity, SearchEntitiesRequest, ExpandGraphRequest, FindPathsRequest, FindEvidenceRequest, FindContradictionsRequest, TraceProvenanceRequest } from "./queries";
export type { GraphStoreHealth, GraphBuildReport, GraphStore } from "./store";
export type { CompilerDiagnostic, CompiledCorpus, CompiledDocument } from "./compiler";
export { KnowledgeValidationError, KnowledgeNotFoundError, GraphBuildError, GraphQueryError, AgentExecutionError, ToolInputError, ToolLimitError, EvaluationError } from "./errors";
