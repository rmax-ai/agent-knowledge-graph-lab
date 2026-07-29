import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { CompiledCorpus } from "@agkl/domain";
import SettingsPanel from "./settings-panel";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface EvalReport {
  timestamp: string;
  questions: number;
  aggregates: {
    graph: { precision: number; recall: number; f1: number };
    document: { precision: number; recall: number; f1: number };
  };
}

function loadCorpus(): CompiledCorpus | null {
  const p = join(process.cwd(), "..", "..", ".data", "compiled-corpus.json");
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, "utf-8")) as CompiledCorpus;
}

function loadLatestEval(): EvalReport | null {
  const evalsDir = join(process.cwd(), "..", "..", ".data", "evaluations");
  if (!existsSync(evalsDir)) return null;

  const files = readdirSync(evalsDir)
    .filter((f: string) => f.startsWith("comparison-") && f.endsWith(".json"))
    .sort()
    .reverse();

  if (files.length === 0) return null;
  const latest = files[0]!;
  return JSON.parse(readFileSync(join(evalsDir, latest), "utf-8")) as EvalReport;
}

export default function SettingsPage() {
  const corpus = loadCorpus();
  const evalReport = loadLatestEval();

  const kindCounts = corpus
    ? (() => {
        const m = new Map<string, number>();
        for (const e of corpus.entities) m.set(e.kind, (m.get(e.kind) ?? 0) + 1);
        return [...m.entries()].sort((a, b) => b[1] - a[1]);
      })()
    : [];

  const relationKindCounts = corpus
    ? (() => {
        const m = new Map<string, number>();
        for (const r of corpus.relations) m.set(r.kind, (m.get(r.kind) ?? 0) + 1);
        return [...m.entries()].sort((a, b) => b[1] - a[1]);
      })()
    : [];

  return (
    <div className="p-6 bg-gray-950 text-gray-100 min-h-screen space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Settings & Status</h1>
        <p className="text-sm text-gray-500 mt-1">
          Project configuration, data management, and system status.
        </p>
      </header>

      {/* Corpus Stats */}
      <section className="bg-gray-900 border border-gray-800 rounded-lg p-5">
        <h2 className="text-lg font-semibold mb-4">Knowledge Graph</h2>
        {corpus ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-gray-500 uppercase mb-1">Corpus</div>
              <div className="text-lg font-medium text-gray-200">
                {corpus.entities.length} entities · {corpus.relations.length} relations
              </div>
              <div className="text-xs text-gray-600">
                Hash: <code className="bg-gray-800 px-1 rounded">{corpus.corpusHash.slice(0, 16)}</code>
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase mb-2">Entity Kinds</div>
              <div className="space-y-1">
                {kindCounts.map(([kind, count]) => (
                  <div key={kind} className="flex justify-between text-sm">
                    <span className="text-gray-400">{kind}</span>
                    <span className="text-gray-600">{count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase mb-2">Relation Kinds</div>
              <div className="space-y-1">
                {relationKindCounts.map(([kind, count]) => (
                  <div key={kind} className="flex justify-between text-sm">
                    <span className="text-gray-400">{kind}</span>
                    <span className="text-gray-600">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-900/50 text-yellow-300 border border-yellow-700 rounded-lg p-3">
            No corpus built. Run <code className="bg-gray-800 px-1 rounded">pnpm graph:build</code>.
          </div>
        )}
      </section>

      {/* Last Eval */}
      <section className="bg-gray-900 border border-gray-800 rounded-lg p-5">
        <h2 className="text-lg font-semibold mb-4">Latest Evaluation</h2>
        {evalReport ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-gray-500 uppercase mb-1">Run</div>
              <div className="text-sm text-gray-300">
                {new Date(evalReport.timestamp).toLocaleString()}
              </div>
              <div className="text-xs text-gray-600">
                {evalReport.questions} questions
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase mb-1">Graph F1</div>
              <div className="text-lg font-medium text-blue-400">
                {(evalReport.aggregates.graph.f1 * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-gray-600">
                P {(evalReport.aggregates.graph.precision * 100).toFixed(1)}% · R {(evalReport.aggregates.graph.recall * 100).toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase mb-1">Document F1</div>
              <div className="text-lg font-medium text-gray-300">
                {(evalReport.aggregates.document.f1 * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-gray-600">
                P {(evalReport.aggregates.document.precision * 100).toFixed(1)}% · R {(evalReport.aggregates.document.recall * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-800/50 text-gray-500 rounded-lg p-3 text-sm">
            No evaluation runs yet. Run <code className="bg-gray-800 px-1 rounded">pnpm eval:compare</code>.
          </div>
        )}
      </section>

      {/* Commands */}
      <SettingsPanel />
    </div>
  );
}
