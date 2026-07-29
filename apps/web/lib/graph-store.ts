import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { MemoryGraphStore } from "@agkl/graph-store";
import type { CompiledCorpus, GraphStore } from "@agkl/domain";

let _store: GraphStore | null = null;

/** Returns a shared, initialized graph store for server-side API routes. */
export async function getGraphStore(): Promise<GraphStore> {
  if (_store) return _store;

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const rootDir = join(__dirname, "..", "..", "..");
  const corpusPath = join(rootDir, ".data", "compiled-corpus.json");

  if (!existsSync(corpusPath)) {
    throw new Error(
      `Compiled corpus not found at ${corpusPath}. Run \`pnpm graph:build\` from the project root first.`,
    );
  }

  const corpus = JSON.parse(readFileSync(corpusPath, "utf-8")) as CompiledCorpus;
  const store = new MemoryGraphStore();
  await store.initialise();
  await store.rebuild(corpus);
  _store = store;
  return store;
}
