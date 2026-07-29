import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { MemoryGraphStore } from "@agkl/graph-store";
import type { CompiledCorpus, GraphStore } from "@agkl/domain";

let _store: GraphStore | null = null;

/** Returns a shared, initialized graph store loaded from the compiled corpus. */
export async function getGraphStore(): Promise<GraphStore> {
  if (_store) return _store;

  // Try multiple paths to find the compiled corpus
  const candidatePaths = [
    join(process.cwd(), ".data", "compiled-corpus.json"),
    join(process.cwd(), "..", "..", ".data", "compiled-corpus.json"),
    join(process.cwd(), "..", "..", "..", ".data", "compiled-corpus.json"),
  ];

  let corpus: CompiledCorpus | null = null;
  for (const p of candidatePaths) {
    if (existsSync(p)) {
      corpus = JSON.parse(readFileSync(p, "utf-8")) as CompiledCorpus;
      break;
    }
  }

  if (!corpus) {
    throw new Error(
      "Compiled corpus not found. Run `pnpm graph:build` from the project root first.\n" +
        `Searched paths: ${candidatePaths.join(", ")}`,
    );
  }

  const store = new MemoryGraphStore();
  await store.initialise();
  await store.rebuild(corpus);
  _store = store;
  return store;
}
