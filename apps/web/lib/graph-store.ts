import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { LadybugGraphStore } from "@agkl/graph-store";
import type { CompiledCorpus, GraphStore } from "@agkl/domain";

let _store: GraphStore | null = null;
let _initPromise: Promise<GraphStore> | null = null;

/** Returns a shared, initialized Ladybug graph store for server-side routes and agent tools. */
export async function getGraphStore(): Promise<GraphStore> {
  if (_store) return _store;
  if (_initPromise) return _initPromise;

  _initPromise = (async () => {
    const __dirname = dirname(fileURLToPath(import.meta.url));
    // apps/web/lib → apps/web → apps → project root
    const rootDir = join(__dirname, "..", "..", "..");
    const corpusPath = join(rootDir, ".data", "compiled-corpus.json");
    const databasePath = join(rootDir, ".data", "ladybug", "graph.lbug");

    if (!existsSync(corpusPath)) {
      throw new Error(
        `Compiled corpus not found at ${corpusPath}. Run \`pnpm graph:build\` from the project root first.`,
      );
    }

    const corpus = JSON.parse(readFileSync(corpusPath, "utf-8")) as CompiledCorpus;
    const store = new LadybugGraphStore({ databasePath });
    await store.initialise();
    await store.rebuild(corpus);
    _store = store;
    return store;
  })();

  try {
    return await _initPromise;
  } catch (err) {
    _initPromise = null;
    throw err;
  }
}
