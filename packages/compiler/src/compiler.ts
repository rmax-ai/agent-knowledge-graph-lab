import type { CompiledCorpus, CompilerDiagnostic, KnowledgeEntity, KnowledgeRelation } from "@agkl/domain";
import type { ParsedDocument } from "@agkl/okf";

export interface CompileOptions {
  /** Root directory for knowledge documents */
  knowledgeRoot: string;
  /** Maximum number of diagnostics before aborting */
  maxDiagnostics?: number;
}

export function compileCorpus(
  documents: readonly ParsedDocument[],
  options: CompileOptions,
): CompiledCorpus {
  const diagnostics: CompilerDiagnostic[] = [];
  const entities: KnowledgeEntity[] = [];
  const relations: KnowledgeRelation[] = [];

  for (const doc of documents) {
    try {
      const entity = compileDocument(doc);
      entities.push(entity);
    } catch (err) {
      diagnostics.push({
        level: "error",
        message: err instanceof Error ? err.message : String(err),
        file: doc.file,
      });
    }
  }

  const corpusHash = generateCorpusHash(entities, relations);

  return {
    entities,
    relations,
    documents: [],
    diagnostics,
    corpusHash,
  };
}

function compileDocument(doc: ParsedDocument): KnowledgeEntity {
  const { frontmatter } = doc;
  return {
    id: frontmatter.id as string,
    kind: frontmatter.kind as KnowledgeEntity["kind"],
    title: frontmatter.title as string,
    summary: undefined,
    status: (frontmatter.status as KnowledgeEntity["status"]) ?? "draft",
    confidence: typeof frontmatter.confidence === "number" ? frontmatter.confidence : undefined,
    tags: Array.isArray(frontmatter.tags) ? frontmatter.tags : [],
    source: {
      file: doc.file,
      documentId: frontmatter.id as string,
      contentHash: doc.contentHash,
    },
    lifecycle: {},
    metadata: {},
  };
}

function generateCorpusHash(entities: readonly KnowledgeEntity[], relations: readonly KnowledgeRelation[]): string {
  // Deterministic hash for regression testing
  const { createHash } = await_import_crypto();
  const h = createHash("sha256");
  h.update(JSON.stringify({ entityCount: entities.length, relationCount: relations.length }));
  return h.digest("hex").slice(0, 16);
}

// Stub — will be replaced by proper import
function await_import_crypto() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("node:crypto") as typeof import("node:crypto");
}
