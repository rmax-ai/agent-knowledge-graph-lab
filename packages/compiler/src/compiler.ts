import { createHash } from "node:crypto";
import type { CompiledCorpus, CompiledDocument, CompilerDiagnostic, KnowledgeEntity, KnowledgeRelation } from "@agkl/domain";
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
  const compiledDocs: CompiledDocument[] = [];

  for (const doc of documents) {
    try {
      const entity = compileDocument(doc);
      entities.push(entity);

      // Extract relations from frontmatter
      const docRelations = extractRelations(doc, entity);
      relations.push(...docRelations);

      compiledDocs.push({
        file: doc.file,
        documentId: entity.id,
        contentHash: doc.contentHash,
        entityIds: [entity.id],
        relationIds: docRelations.map((r) => r.id),
      });
    } catch (err) {
      diagnostics.push({
        level: "error",
        message: err instanceof Error ? err.message : String(err),
        file: doc.file,
      });
    }
  }

  // Post-compilation validation: check relation targets exist
  const entityIds = new Set(entities.map((e) => e.id));
  for (const rel of relations) {
    if (!entityIds.has(rel.to)) {
      diagnostics.push({
        level: "warning",
        message: `Relation target "${rel.to}" not found in corpus. Relation: ${rel.from} --[${rel.kind}]--> ${rel.to}`,
        file: rel.provenance.sourceFile,
        entityId: rel.from,
      });
    }
    if (!entityIds.has(rel.from)) {
      diagnostics.push({
        level: "warning",
        message: `Relation source "${rel.from}" not found in corpus.`,
        file: rel.provenance.sourceFile,
        entityId: rel.from,
      });
    }
  }

  const corpusHash = generateCorpusHash(entities, relations);

  return {
    entities,
    relations,
    documents: compiledDocs,
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
    status: (frontmatter.status as KnowledgeEntity["status"]) ?? "draft",
    ...(typeof frontmatter.confidence === "number" ? { confidence: frontmatter.confidence } : {}),
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

interface FrontmatterRelation {
  type: string;
  target: string;
}

function extractRelations(doc: ParsedDocument, sourceEntity: KnowledgeEntity): KnowledgeRelation[] {
  const rawRelations = doc.frontmatter.relations;
  if (!Array.isArray(rawRelations)) return [];

  const relations: KnowledgeRelation[] = [];

  for (let i = 0; i < rawRelations.length; i++) {
    const rel = rawRelations[i] as unknown as FrontmatterRelation;
    if (!rel.type || !rel.target) continue;

    const relationId = generateRelationId(sourceEntity.id, rel.type, rel.target, i);

    relations.push({
      id: relationId,
      kind: rel.type as KnowledgeRelation["kind"],
      from: sourceEntity.id,
      to: rel.target,
      provenance: {
        sourceFile: doc.file,
        sourceDocumentId: sourceEntity.id,
        assertedBy: "human", // frontmatter relations are human-authored
        evidenceText: `Declared in ${doc.file} frontmatter`,
      },
      status: "asserted",
    });
  }

  return relations;
}

function generateRelationId(from: string, kind: string, to: string, index: number): string {
  const h = createHash("sha256");
  h.update(`${from}:${kind}:${to}:${index}`);
  return `rel-${h.digest("hex").slice(0, 12)}`;
}

function generateCorpusHash(entities: readonly KnowledgeEntity[], relations: readonly KnowledgeRelation[]): string {
  const h = createHash("sha256");
  h.update(JSON.stringify({ entityCount: entities.length, relationCount: relations.length }));
  return h.digest("hex").slice(0, 16);
}
