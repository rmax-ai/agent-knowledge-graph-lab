/**
 * Smoke test: verify MemoryGraphStore methods work with real compiled corpus.
 * Run: tsx scripts/smoke-test-graph.ts
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { MemoryGraphStore } from "@agkl/graph-store";
import type { CompiledCorpus } from "@agkl/domain";

const corpusPath = join(import.meta.dirname, "..", ".data", "compiled-corpus.json");

async function main() {
  if (!existsSync(corpusPath)) {
    console.error("Run `pnpm graph:build` first.");
    process.exit(1);
  }

  const corpus = JSON.parse(readFileSync(corpusPath, "utf-8")) as CompiledCorpus;
  const store = new MemoryGraphStore();
  await store.initialise();
  await store.rebuild(corpus);

  console.log(`Loaded ${corpus.entities.length} entities, ${corpus.relations.length} relations\n`);

  // 1. Search
  const search = await store.searchEntities({ query: "graph", limit: 5 });
  console.log(`search("graph"): ${search.length} results`);
  for (const r of search) console.log(`  [${r.entity.kind}] ${r.entity.title} (score: ${r.score})`);

  // 2. Expand
  const expand = await store.expand({ entityId: "concept-graph-retrieval", depth: 2 });
  console.log(`\nexpand("concept-graph-retrieval", depth=2): ${expand.entities.length} entities, ${expand.relations.length} relations`);
  for (const e of expand.entities) console.log(`  ${e.id} [${e.kind}]`);

  // 3. Find evidence
  const evidence = await store.findEvidence({ claimId: "claim-graph-retrieval-outperforms-document" });
  console.log(`\nfindEvidence("claim-graph-retrieval-outperforms-document"): supporting=${evidence.supporting.length}, contradicting=${evidence.contradicting.length}`);
  for (const e of evidence.supporting) console.log(`  + ${e.entity.id} via ${e.relation.kind}`);

  // 4. Find contradictions
  const conts = await store.findContradictions({ entityId: "claim-graph-reduces-context-window" });
  console.log(`\nfindContradictions("claim-graph-reduces-context-window"): ${conts.length}`);
  for (const c of conts) console.log(`  ${c.claimA.title} CONTRADICTS ${c.claimB.title}`);

  // 5. Find paths
  const paths = await store.findPaths({ fromId: "concept-graph-retrieval", toId: "decision-use-ladybugdb", maxDepth: 4 });
  console.log(`\nfindPaths("concept-graph-retrieval" → "decision-use-ladybugdb"): ${paths.length}`);
  for (const p of paths) {
    console.log(`  path length=${p.length}: ${p.entities.map(e => e.title).join(" → ")}`);
  }

  // 6. Trace provenance
  const trace = await store.traceProvenance({ entityId: "claim-graph-retrieval-outperforms-document", maxDepth: 5 });
  console.log(`\ntraceProvenance("claim-graph-retrieval-outperforms-document"): chain=${trace.chain.length}, incomplete=${trace.incomplete}`);
  for (const r of trace.chain) console.log(`  ${r.source.id} via ${r.relation.kind} (depth ${r.depth})`);

  // 7. Get entity
  const entity = await store.getEntity("concept-semantic-graph-tools");
  console.log(`\ngetEntity("concept-semantic-graph-tools"): ${entity ? entity.title : "NOT FOUND"}`);

  await store.close();
  console.log("\n✓ Smoke test complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
