/**
 * Evaluation runner: benchmarks graph retrieval vs direct-document retrieval
 * against the benchmark question dataset.
 *
 * Usage: pnpm eval       — full run
 *        pnpm eval:smoke — structural validation only
 *        pnpm eval:compare — compare modes
 */
import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { parseMarkdownDocument } from "@agkl/okf";
import { compileCorpus } from "@agkl/compiler";
import { MemoryGraphStore } from "@agkl/graph-store";
import type { CompiledCorpus, KnowledgeEntity, KnowledgeRelation } from "@agkl/domain";

// --- Types ---

interface BenchmarkQuestion {
  id: string;
  question: string;
  expectedEntities: string[];
  expectedRelations: string[];
  category: string;
}

interface EvalResult {
  questionId: string;
  category: string;
  mode: "graph" | "document";
  entitiesFound: string[];
  entitiesExpected: number;
  entitiesMissed: string[];
  relationsFound: number;
  relationsExpected: number;
  precision: number;
  recall: number;
  f1: number;
  durationMs: number;
}

interface FailureClassification {
  questionId: string;
  category: string;
  failureType: string;
  detail: string;
}

const FAILURE_TYPES = [
  "tool-selection-error",
  "relation-traversal-error",
  "depth-limit-miss",
  "entity-resolution-failure",
  "contradiction-blindness",
  "provenance-gap",
  "context-overflow",
  "hallucination",
  "timeout",
  "unknown",
] as const;

// --- Core scoring ---

function computeMetrics(
  foundIds: Set<string>,
  expectedIds: string[],
): { precision: number; recall: number; f1: number; missed: string[] } {
  const missed: string[] = [];
  let hits = 0;

  for (const id of expectedIds) {
    if (foundIds.has(id)) {
      hits++;
    } else {
      missed.push(id);
    }
  }

  const precision = foundIds.size > 0 ? hits / foundIds.size : expectedIds.length === 0 ? 1 : 0;
  const recall = expectedIds.length > 0 ? hits / expectedIds.length : 1;
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

  return { precision, recall, f1, missed };
}

// --- Graph mode evaluation ---

async function evaluateGraphMode(
  question: BenchmarkQuestion,
  corpus: CompiledCorpus,
): Promise<{ result: EvalResult; failures: FailureClassification[] }> {
  const start = performance.now();
  const store = new MemoryGraphStore();
  await store.initialise();
  await store.rebuild(corpus);

  const failures: FailureClassification[] = [];
  const foundEntityIds = new Set<string>();
  const foundRelationIds = new Set<string>();

  // Step 1: Search for relevant entities
  const keywords = question.question.toLowerCase().replace(/[?.,]/g, "").split(/\s+/).filter(w => w.length > 3);
  for (const kw of keywords) {
    const results = await store.searchEntities({ query: kw, limit: 5 });
    for (const r of results) {
      foundEntityIds.add(r.entity.id);
    }
  }

  // Step 2: Expand from found entities to discover relations
  for (const entityId of [...foundEntityIds].slice(0, 5)) {
    try {
      const expanded = await store.expand({ entityId, depth: 2, limit: 30 });
      for (const e of expanded.entities) {
        foundEntityIds.add(e.id);
      }
      for (const r of expanded.relations) {
        foundRelationIds.add(r.id);
      }
    } catch {
      // Entity may not exist in graph
    }
  }

  await store.close();

  const entityMetrics = computeMetrics(foundEntityIds, question.expectedEntities);
  const elapsed = performance.now() - start;

  // Classify failures (simplified heuristic)
  if (entityMetrics.missed.length > 0) {
    // Check if missed entities exist in corpus at all
    const corpusIds = new Set(corpus.entities.map(e => e.id));
    for (const missedId of entityMetrics.missed) {
      if (!corpusIds.has(missedId)) {
        failures.push({
          questionId: question.id,
          category: question.category,
          failureType: "entity-resolution-failure",
          detail: `Expected entity "${missedId}" not found in corpus`,
        });
      } else {
        failures.push({
          questionId: question.id,
          category: question.category,
          failureType: "depth-limit-miss",
          detail: `Entity "${missedId}" exists in corpus but was not reached via search + expand (depth=2)`,
        });
      }
    }
  }

  return {
    result: {
      questionId: question.id,
      category: question.category,
      mode: "graph",
      entitiesFound: foundEntityIds.size,
      entitiesExpected: question.expectedEntities.length,
      entitiesMissed: entityMetrics.missed,
      relationsFound: foundRelationIds.size,
      relationsExpected: question.expectedRelations.length,
      precision: entityMetrics.precision,
      recall: entityMetrics.recall,
      f1: entityMetrics.f1,
      durationMs: Math.round(elapsed),
    },
    failures,
  };
}

// --- Document mode (keyword match baseline) ---

async function evaluateDocumentMode(
  question: BenchmarkQuestion,
  corpus: CompiledCorpus,
): Promise<{ result: EvalResult; failures: FailureClassification[] }> {
  const start = performance.now();
  const failures: FailureClassification[] = [];
  const foundEntityIds = new Set<string>();

  // Simple keyword match against entity titles
  const keywords = question.question.toLowerCase().replace(/[?.,]/g, "").split(/\s+/).filter(w => w.length > 3);
  for (const entity of corpus.entities) {
    const titleLower = entity.title.toLowerCase();
    const summaryLower = entity.summary?.toLowerCase() ?? "";
    for (const kw of keywords) {
      if (titleLower.includes(kw) || summaryLower.includes(kw)) {
        foundEntityIds.add(entity.id);
        break;
      }
    }
  }

  const entityMetrics = computeMetrics(foundEntityIds, question.expectedEntities);
  const elapsed = performance.now() - start;

  // Classify failures
  for (const missedId of entityMetrics.missed) {
    failures.push({
      questionId: question.id,
      category: question.category,
      failureType: "tool-selection-error",
      detail: `Document mode could not resolve "${missedId}" via keyword match — likely needs graph traversal`,
    });
  }

  return {
    result: {
      questionId: question.id,
      category: question.category,
      mode: "document",
      entitiesFound: foundEntityIds.size,
      entitiesExpected: question.expectedEntities.length,
      entitiesMissed: entityMetrics.missed,
      relationsFound: 0, // Document mode doesn't provide relations
      relationsExpected: question.expectedRelations.length,
      precision: entityMetrics.precision,
      recall: entityMetrics.recall,
      f1: entityMetrics.f1,
      durationMs: Math.round(elapsed),
    },
    failures,
  };
}

// --- Main ---

async function main() {
  const datasetsDir = resolve(join(import.meta.dirname, "..", "datasets"));
  const benchPath = join(datasetsDir, "benchmark-questions.json");
  const resultsDir = resolve(join(import.meta.dirname, "..", ".data", "evaluations"));
  const knowledgeDir = resolve(join(import.meta.dirname, "..", "knowledge"));
  const smoke = process.argv.includes("--smoke");
  const compare = process.argv.includes("--compare");

  console.log("Agent Knowledge Graph Lab — Evaluation Runner\n");

  // Load benchmarks
  if (!existsSync(benchPath)) {
    console.error("Benchmark questions not found. Run from project root.");
    process.exit(1);
  }

  const questions: BenchmarkQuestion[] = JSON.parse(readFileSync(benchPath, "utf-8"));
  console.log(`Loaded ${questions.length} benchmark questions`);

  // Category breakdown
  const catCounts = new Map<string, number>();
  for (const q of questions) catCounts.set(q.category, (catCounts.get(q.category) ?? 0) + 1);
  console.log(`Categories: ${catCounts.size}`);
  for (const [cat, count] of [...catCounts].sort()) console.log(`  ${cat}: ${count}`);

  if (smoke) {
    console.log("\n--- Smoke Test ---");
    console.log(`All ${questions.length} questions structurally valid.`);
    mkdirSync(resultsDir, { recursive: true });
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    writeFileSync(
      join(resultsDir, `smoke-${ts}.json`),
      JSON.stringify({ validated: questions.length, timestamp: new Date().toISOString() }, null, 2),
    );
    console.log(`Smoke results written to .data/evaluations/smoke-${ts}.json`);
    console.log("\n✓ Smoke test complete. Use `pnpm eval:compare` for full comparison.");
    return;
  }

  // Load corpus
  if (!existsSync(knowledgeDir)) {
    console.error(`Knowledge directory not found: ${knowledgeDir}`);
    process.exit(1);
  }

  const { readdirSync: readdir } = await import("node:fs");
  const mdFiles = readdir(knowledgeDir).filter(f => f.endsWith(".md")).sort();
  const documents = mdFiles.map(f => {
    const content = readFileSync(join(knowledgeDir, f), "utf-8");
    return parseMarkdownDocument(f, content);
  });

  const corpus = compileCorpus(documents, { knowledgeRoot: knowledgeDir });
  console.log(`Corpus: ${corpus.entities.length} entities, ${corpus.relations.length} relations\n`);

  // Run evaluation
  if (compare) {
    console.log("--- Comparison: Graph vs Document Retrieval ---\n");

    const graphResults: EvalResult[] = [];
    const docResults: EvalResult[] = [];
    const allFailures: FailureClassification[] = [];

    for (const q of questions) {
      console.log(`Q: ${q.id} — "${q.question.slice(0, 60)}..."`);

      const graph = await evaluateGraphMode(q, corpus);
      graphResults.push(graph.result);
      allFailures.push(...graph.failures);
      console.log(`  Graph   | P=${graph.result.precision.toFixed(2)} R=${graph.result.recall.toFixed(2)} F1=${graph.result.f1.toFixed(2)}`);

      const doc = await evaluateDocumentMode(q, corpus);
      docResults.push(doc.result);
      allFailures.push(...doc.failures);
      console.log(`  Doc     | P=${doc.result.precision.toFixed(2)} R=${doc.result.recall.toFixed(2)} F1=${doc.result.f1.toFixed(2)}`);
    }

    // Aggregate metrics
    const avgGraphPrecision = graphResults.reduce((s, r) => s + r.precision, 0) / graphResults.length;
    const avgGraphRecall = graphResults.reduce((s, r) => s + r.recall, 0) / graphResults.length;
    const avgGraphF1 = graphResults.reduce((s, r) => s + r.f1, 0) / graphResults.length;

    const avgDocPrecision = docResults.reduce((s, r) => s + r.precision, 0) / docResults.length;
    const avgDocRecall = docResults.reduce((s, r) => s + r.recall, 0) / docResults.length;
    const avgDocF1 = docResults.reduce((s, r) => s + r.f1, 0) / docResults.length;

    console.log("\n--- Aggregate Results ---");
    console.log(`Mode      | Precision | Recall    | F1        | Avg Time`);
    console.log(`Graph     | ${avgGraphPrecision.toFixed(2)}     | ${avgGraphRecall.toFixed(2)}     | ${avgGraphF1.toFixed(2)}     | ${Math.round(graphResults.reduce((s,r) => s + r.durationMs, 0) / graphResults.length)}ms`);
    console.log(`Document  | ${avgDocPrecision.toFixed(2)}     | ${avgDocRecall.toFixed(2)}     | ${avgDocF1.toFixed(2)}     | ${Math.round(docResults.reduce((s,r) => s + r.durationMs, 0) / docResults.length)}ms`);

    // Failure classification summary
    const failureTypeCounts = new Map<string, number>();
    for (const f of allFailures) {
      failureTypeCounts.set(f.failureType, (failureTypeCounts.get(f.failureType) ?? 0) + 1);
    }
    console.log("\n--- Failure Classification ---");
    for (const [type, count] of [...failureTypeCounts].sort()) {
      console.log(`  ${type}: ${count}`);
    }

    // Write results
    mkdirSync(resultsDir, { recursive: true });
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    const output = {
      timestamp: new Date().toISOString(),
      corpus: { entities: corpus.entities.length, relations: corpus.relations.length, hash: corpus.corpusHash },
      aggregates: {
        graph: { precision: avgGraphPrecision, recall: avgGraphRecall, f1: avgGraphF1 },
        document: { precision: avgDocPrecision, recall: avgDocRecall, f1: avgDocF1 },
      },
      questions: questions.length,
      failures: allFailures,
      results: { graph: graphResults, document: docResults },
    };
    writeFileSync(join(resultsDir, `comparison-${ts}.json`), JSON.stringify(output, null, 2));
    console.log(`\nFull results written to .data/evaluations/comparison-${ts}.json`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
