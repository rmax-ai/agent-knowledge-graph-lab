import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import EvalDashboard from "./eval-dashboard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface EvalReport {
  timestamp: string;
  corpus: { entities: number; relations: number; hash: string };
  aggregates: {
    graph: { precision: number; recall: number; f1: number };
    document: { precision: number; recall: number; f1: number };
  };
  questions: number;
  failures: Array<{
    questionId: string;
    category: string;
    failureType: string;
    detail: string;
  }>;
  results: {
    graph: Array<{
      questionId: string;
      category: string;
      mode: string;
      entitiesFound: number;
      entitiesExpected: number;
      entitiesMissed: string[];
      relationsFound: number;
      relationsExpected: number;
      precision: number;
      recall: number;
      f1: number;
      durationMs: number;
    }>;
    document: Array<{
      questionId: string;
      category: string;
      mode: string;
      entitiesFound: number;
      entitiesExpected: number;
      entitiesMissed: string[];
      relationsFound: number;
      relationsExpected: number;
      precision: number;
      recall: number;
      f1: number;
      durationMs: number;
    }>;
  };
}

interface BenchmarkQuestion {
  id: string;
  question: string;
  expectedEntities: string[];
  expectedRelations: string[];
  category: string;
}

function loadLatestReport(): EvalReport | null {
  const evalsDir = join(process.cwd(), "..", "..", ".data", "evaluations");
  if (!existsSync(evalsDir)) return null;

  const comparisonFiles = readdirSync(evalsDir)
    .filter((f) => f.startsWith("comparison-") && f.endsWith(".json"))
    .sort()
    .reverse();

  if (comparisonFiles.length === 0) return null;

  return JSON.parse(readFileSync(join(evalsDir, comparisonFiles[0]!), "utf-8")) as EvalReport;
}

function loadBenchmarkQuestions(): BenchmarkQuestion[] {
  const benchPath = join(process.cwd(), "..", "..", "datasets", "benchmark-questions.json");
  if (!existsSync(benchPath)) return [];
  return JSON.parse(readFileSync(benchPath, "utf-8")) as BenchmarkQuestion[];
}

export default function EvaluationsPage() {
  const report = loadLatestReport();
  const questions = loadBenchmarkQuestions();
  const questionMap = new Map(questions.map((q) => [q.id, q]));

  if (!report) {
    return (
      <div className="p-8 text-gray-400">
        <h1 className="text-2xl font-bold text-gray-100 mb-4">Evaluations</h1>
        <div className="bg-yellow-900/50 text-yellow-300 border border-yellow-700 rounded-lg p-4">
          No evaluation results found. Run{" "}
          <code className="bg-gray-800 px-1 rounded">pnpm eval:compare</code> first.
        </div>
      </div>
    );
  }

  const graphResults = report.results.graph;
  const docResults = report.results.document;

  // Merge per-question data
  const merged = graphResults.map((gr) => {
    const dr = docResults.find((d) => d.questionId === gr.questionId);
    const q = questionMap.get(gr.questionId);
    return {
      questionId: gr.questionId,
      question: q?.question ?? gr.questionId,
      category: gr.category,
      expectedEntities: q?.expectedEntities.length ?? gr.entitiesExpected,
      expectedRelations: q?.expectedRelations.length ?? gr.relationsExpected,
      graphPrecision: gr.precision,
      graphRecall: gr.recall,
      graphF1: gr.f1,
      graphFound: gr.entitiesFound,
      graphMissed: gr.entitiesMissed,
      docPrecision: dr?.precision ?? 0,
      docRecall: dr?.recall ?? 0,
      docF1: dr?.f1 ?? 0,
      docFound: dr?.entitiesFound ?? 0,
      docMissed: dr?.entitiesMissed ?? [],
    };
  });

  // Failure type breakdown
  const failureCounts = new Map<string, number>();
  for (const f of report.failures) {
    failureCounts.set(f.failureType, (failureCounts.get(f.failureType) ?? 0) + 1);
  }
  const failureEntries = [...failureCounts.entries()].sort((a, b) => b[1] - a[1]);

  // Graph > Document count
  const graphBetter = merged.filter((m) => m.graphF1 > m.docF1).length;
  const docBetter = merged.filter((m) => m.docF1 > m.graphF1).length;
  const tied = merged.filter((m) => m.graphF1 === m.docF1).length;

  return (
    <div className="p-6 space-y-6 bg-gray-950 text-gray-100 min-h-screen">
      <header>
        <h1 className="text-2xl font-bold">Evaluations</h1>
        <p className="text-sm text-gray-500 mt-1">
          Corpus {report.corpus.hash.slice(0, 8)} · {report.corpus.entities} entities ·{" "}
          {report.corpus.relations} relations ·{" "}
          {new Date(report.timestamp).toLocaleString()}
        </p>
      </header>

      <EvalDashboard
        report={report}
        merged={merged}
        failureEntries={failureEntries}
        graphBetter={graphBetter}
        docBetter={docBetter}
        tied={tied}
      />
    </div>
  );
}
