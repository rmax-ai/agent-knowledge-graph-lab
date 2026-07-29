import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { CompiledCorpus } from "@agkl/domain";
import GraphCanvas from "~/components/graph-canvas";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function loadCorpus(): CompiledCorpus | null {
  const paths = [
    join(process.cwd(), ".data", "compiled-corpus.json"),
    join(process.cwd(), "..", "..", ".data", "compiled-corpus.json"),
  ];
  for (const p of paths) {
    if (existsSync(p)) return JSON.parse(readFileSync(p, "utf-8"));
  }
  return null;
}

export default function GraphExplorerPage() {
  const corpus = loadCorpus();

  if (!corpus) {
    return (
      <div className="p-8 text-gray-400">
        <h1 className="text-2xl font-bold text-gray-100 mb-4">Graph Explorer</h1>
        <p className="bg-yellow-900/50 text-yellow-300 border border-yellow-700 rounded-lg p-4">
          No compiled corpus found. Run <code className="bg-gray-800 px-1 rounded">pnpm graph:build</code> first.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="border-b border-gray-800 px-6 py-3 shrink-0">
        <h1 className="text-lg font-semibold text-gray-100">Graph Explorer</h1>
        <p className="text-sm text-gray-500">
          {corpus.entities.length} entities · {corpus.relations.length} relations ·{" "}
          corpus {corpus.corpusHash.slice(0, 8)}
        </p>
      </header>
      <div className="flex-1 min-h-0">
        <GraphCanvas
          data={{
            entities: corpus.entities.map((e) => {
              const result: { id: string; kind: string; title: string; status: string; confidence?: number } = {
                id: e.id,
                kind: e.kind,
                title: e.title,
                status: e.status,
              };
              if (e.confidence !== undefined) result.confidence = e.confidence;
              return result;
            }),
            relations: corpus.relations.map((r) => ({
              id: r.id,
              kind: r.kind,
              from: r.from,
              to: r.to,
            })),
          }}
        />
      </div>
    </div>
  );
}
