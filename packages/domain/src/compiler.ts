import type { KnowledgeEntity } from "./entities.js";
import type { KnowledgeRelation } from "./relations.js";

export interface CompilerDiagnostic {
  level: "info" | "warning" | "error";
  message: string;
  file?: string;
  line?: number;
  entityId?: string;
}

export interface CompiledDocument {
  file: string;
  documentId: string;
  contentHash: string;
  entityIds: readonly string[];
  relationIds: readonly string[];
}

export interface CompiledCorpus {
  entities: readonly KnowledgeEntity[];
  relations: readonly KnowledgeRelation[];
  documents: readonly CompiledDocument[];
  diagnostics: readonly CompilerDiagnostic[];
  corpusHash: string;
}
