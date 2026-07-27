import type { BenchmarkQuestion, EvalResult } from "./types.js";

export async function runBenchmark(
  questions: readonly BenchmarkQuestion[],
  _mode: "direct-document" | "graph" | "hybrid",
): Promise<readonly EvalResult[]> {
  return questions.map((q) => ({
    questionId: q.id,
    retrievalMode: _mode,
    metrics: {
      answerCorrectness: 0,
      evidencePrecision: 0,
      evidenceRecall: 0,
      citationValidity: 0,
      pathValidity: 0,
      provenanceCompleteness: 0,
      contradictionRecall: 0,
      unsupportedClaimRate: 0,
      toolCallCount: 0,
      contextTokenCount: 0,
      latencyMs: 0,
      graphNodesReturned: 0,
      graphEdgesReturned: 0,
    },
    timestamp: new Date().toISOString(),
  }));
}
