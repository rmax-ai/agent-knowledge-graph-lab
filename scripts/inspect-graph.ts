/**
 * Inspects a previously built knowledge graph.
 * Loads compiled-corpus.json and prints summary statistics.
 */
import { readFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import type { CompiledCorpus } from "@agkl/domain";

interface EntitySummary {
  id: string;
  kind: string;
  title: string;
  status: string;
  confidence?: number;
  tags: string[];
}

// --- Main ---
const dataDir = resolve(process.argv[2] ?? join(import.meta.dirname, "..", ".data"));
const corpusPath = join(dataDir, "compiled-corpus.json");

if (!existsSync(corpusPath)) {
  console.error(`Corpus not found at ${corpusPath}. Run "pnpm graph:build" first.`);
  process.exit(1);
}

const corpus = JSON.parse(readFileSync(corpusPath, "utf-8")) as CompiledCorpus;

console.log(`Corpus: ${corpus.corpusHash}`);
console.log(`Entities: ${corpus.entities.length}`);
console.log(`Relations: ${corpus.relations.length}`);
console.log(`Documents: ${corpus.documents.length}`);
console.log(`Diagnostics: ${corpus.diagnostics.length}`);

// Entities by status
const statusCounts = new Map<string, number>();
for (const e of corpus.entities) {
  statusCounts.set(e.status, (statusCounts.get(e.status) ?? 0) + 1);
}
console.log("\nStatus breakdown:");
for (const [status, count] of [...statusCounts].sort()) {
  console.log(`  ${status}: ${count}`);
}

// Tag frequency
const tagCounts = new Map<string, number>();
for (const e of corpus.entities) {
  for (const tag of e.tags) {
    tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
  }
}
if (tagCounts.size > 0) {
  console.log("\nTop tags:");
  const sorted = [...tagCounts].sort((a, b) => b[1] - a[1]).slice(0, 20);
  for (const [tag, count] of sorted) {
    console.log(`  ${tag}: ${count}`);
  }
}

// Full entity listing (compact)
const showFull = process.argv.includes("--full") || process.argv.includes("-f");
if (showFull) {
  console.log("\n--- All Entities ---");
  const summaries: EntitySummary[] = corpus.entities.map((e) => ({
    id: e.id,
    kind: e.kind,
    title: e.title,
    status: e.status,
    confidence: e.confidence,
    tags: [...e.tags],
  }));
  for (const s of summaries) {
    console.log(`  [${s.kind}] ${s.id} — "${s.title}" (${s.status}, confidence: ${s.confidence ?? "—"}, tags: [${s.tags.join(", ")}])`);
  }
} else {
  console.log(`\nUse --full to see all ${corpus.entities.length} entities.`);
}
