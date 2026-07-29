/**
 * Builds the knowledge graph from canonical Markdown documents.
 * Flow: knowledge/*.md → parse → compile → build GraphStore
 */
import { readFileSync, readdirSync, mkdirSync, existsSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { parseMarkdownDocument } from "@agkl/okf";
import { compileCorpus } from "@agkl/compiler";
import { MemoryGraphStore } from "@agkl/graph-store";

async function buildGraph(knowledgeDir: string, dataDir: string) {
  if (!existsSync(knowledgeDir)) {
    console.error(`Knowledge directory not found: ${knowledgeDir}`);
    process.exit(1);
  }

  const mdFiles = readdirSync(knowledgeDir).filter((f) => f.endsWith(".md")).sort();
  console.log(`Found ${mdFiles.length} knowledge documents`);

  const documents = mdFiles.map((file) => {
    const content = readFileSync(join(knowledgeDir, file), "utf-8");
    return parseMarkdownDocument(file, content);
  });

  console.log("Compiling corpus...");
  const corpus = compileCorpus(documents, { knowledgeRoot: knowledgeDir });

  if (corpus.diagnostics.length > 0) {
    console.log("\nDiagnostics:");
    for (const d of corpus.diagnostics) {
      console.log(`  [${d.level.toUpperCase()}] ${d.file ?? ""}: ${d.message}`);
    }

    const errors = corpus.diagnostics.filter((d) => d.level === "error");
    if (errors.length > 0) {
      console.error(`\nCompilation failed with ${errors.length} error(s).`);
      process.exit(1);
    }
  }

  mkdirSync(dataDir, { recursive: true });

  // Write compiled corpus to disk
  const corpusPath = join(dataDir, "compiled-corpus.json");
  writeFileSync(corpusPath, JSON.stringify(corpus, null, 2));
  console.log(`Corpus written to ${corpusPath}`);

  // Build graph store
  console.log("Building graph store...");
  const start = performance.now();
  const store = new MemoryGraphStore();
  await store.initialise();
  const report = await store.rebuild(corpus);
  const elapsed = (performance.now() - start).toFixed(1);

  console.log(`\nGraph build complete in ${elapsed}ms`);
  console.log(`  Entities: ${report.entityCount}`);
  console.log(`  Relations: ${report.relationCount}`);
  console.log(`  Corpus hash: ${report.corpusHash}`);

  // Entity kind breakdown
  const kindCounts = new Map<string, number>();
  for (const e of corpus.entities) {
    kindCounts.set(e.kind, (kindCounts.get(e.kind) ?? 0) + 1);
  }
  console.log("\nEntity kinds:");
  for (const [kind, count] of [...kindCounts].sort()) {
    console.log(`  ${kind}: ${count}`);
  }

  await store.close();
}

// --- Main ---
async function main() {
  const knowledgeDir = resolve(process.argv[2] ?? join(import.meta.dirname, "..", "knowledge"));
  const dataDir = resolve(process.argv[3] ?? join(import.meta.dirname, "..", ".data"));

  await buildGraph(knowledgeDir, dataDir);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
