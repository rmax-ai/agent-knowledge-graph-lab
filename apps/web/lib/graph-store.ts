import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { MemoryGraphStore } from "@agkl/graph-store";
import type { CompiledCorpus, GraphStore } from "@agkl/domain";

let _store: GraphStore | null = null;

/** Returns a shared, initialized graph store for server-side API routes. */
export async function getGraphStore(): Promise<GraphStore> {
  if (_store) return _store;

  const candidates = [
    join(process.cwd(), ".data", "compiled-corpus.json"),
    join(process.cwd(), "..", "..", ".data", "compiled-corpus.json"),
    join(process.cwd(), "..", "..", "..", ".data", "compiled-corpus.json"),
  ];

  let corpus: CompiledCorpus | null = null;
  for (const p of candidates) {
    if (existsSync(p)) {
      corpus = JSON.parse(readFileSync(p, "utf-8"));
      break;
    }
  }

  if (!corpus) {
    throw new Error(
      "Compiled corpus not found. Run `pnpm graph:build` first.\n" +
        `Searched: ${candidates.join(", ")}`,
    );
  }

  const store = new MemoryGraphStore();
  await store.initialise();
  await store.rebuild(corpus);
  _store = store;
  return store;
}
