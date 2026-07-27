/** A single benchmark question. */
export interface BenchmarkQuestion {
  id: string;
  type:
    | "direct-lookup"
    | "relationship-lookup"
    | "multi-hop-dependency"
    | "provenance-tracing"
    | "evidence-aggregation"
    | "contradiction-detection"
    | "decision-explanation"
    | "supersession"
    | "impact-analysis"
    | "missing-knowledge-detection";
  question: string;
  expectedAnswerContains?: string[];
  expectedEntityIds?: string[];
  expectedPathLength?: number;
}

export interface EvalMetrics {
  answerCorrectness: number;
  evidencePrecision: number;
  evidenceRecall: number;
  citationValidity: number;
  pathValidity: number;
  provenanceCompleteness: number;
  contradictionRecall: number;
  unsupportedClaimRate: number;
  toolCallCount: number;
  contextTokenCount: number;
  latencyMs: number;
  graphNodesReturned: number;
  graphEdgesReturned: number;
}

export type FailureCategory =
  | "entity-resolution-failure"
  | "wrong-tool-selection"
  | "invalid-path"
  | "missing-evidence"
  | "retrieval-overflow"
  | "contradiction-missed"
  | "unsupported-synthesis"
  | "ontology-gap"
  | "corpus-gap"
  | "tool-error"
  | "model-reasoning-error";

export interface EvalResult {
  questionId: string;
  retrievalMode: "direct-document" | "graph" | "hybrid";
  metrics: EvalMetrics;
  failureCategory?: FailureCategory;
  timestamp: string;
}
