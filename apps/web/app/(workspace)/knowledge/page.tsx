import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { CompiledCorpus } from "@agkl/domain";
import KnowledgeBrowser from "./knowledge-browser";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function loadCorpus(): CompiledCorpus | null {
  const paths = [
    join(process.cwd(), "..", "..", ".data", "compiled-corpus.json"),
    join(process.cwd(), ".data", "compiled-corpus.json"),
  ];
  for (const p of paths) {
    if (existsSync(p)) return JSON.parse(readFileSync(p, "utf-8")) as CompiledCorpus;
  }
  return null;
}

export default function KnowledgeBrowserPage() {
  const corpus = loadCorpus();

  if (!corpus) {
    return (
      <div className="p-8 text-gray-400">
        <h1 className="text-2xl font-bold text-gray-100 mb-4">Knowledge Browser</h1>
        <div className="bg-yellow-900/50 text-yellow-300 border border-yellow-700 rounded-lg p-4">
          No compiled corpus found. Run{" "}
          <code className="bg-gray-800 px-1 rounded">pnpm graph:build</code> first.
        </div>
      </div>
    );
  }

  const entities = corpus.entities.map((e) => ({
    id: e.id,
    kind: e.kind,
    title: e.title,
    status: e.status,
    confidence: e.confidence,
    summary: e.summary ?? "",
    tags: e.tags ?? [],
    sourceFile: e.source.file,
  }));

  const relations = corpus.relations.map((r) => ({
    id: r.id,
    kind: r.kind,
    from: r.from,
    to: r.to,
    sourceFile: r.provenance.sourceFile,
  }));

  return (
    <div className="p-6 bg-gray-950 text-gray-100 min-h-screen">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Knowledge Browser</h1>
        <p className="text-sm text-gray-500 mt-1">
          {entities.length} entities · {relations.length} relations · corpus {corpus.corpusHash.slice(0, 8)}
        </p>
      </header>

      <KnowledgeBrowser entities={entities} relations={relations} />
    </div>
  );
}
