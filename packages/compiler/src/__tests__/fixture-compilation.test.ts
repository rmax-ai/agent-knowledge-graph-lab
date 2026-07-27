import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { parseMarkdownDocument } from "@agkl/okf";
import { compileCorpus } from "@agkl/compiler";

const FIXTURES_DIR = join(import.meta.dirname, "..", "..", "..", "..", "fixtures", "knowledge");

describe("Fixture corpus compilation", () => {
  it("parses all fixture documents", () => {
    const files = readdirSync(FIXTURES_DIR).filter((f) => f.endsWith(".md"));
    expect(files.length).toBeGreaterThanOrEqual(15);

    const documents = files.map((file) => {
      const content = readFileSync(join(FIXTURES_DIR, file), "utf-8");
      return parseMarkdownDocument(file, content);
    });

    expect(documents.length).toBe(files.length);

    // Every document must have an ID
    for (const doc of documents) {
      expect(doc.frontmatter.id).toBeTruthy();
      expect(doc.frontmatter.kind).toBeTruthy();
      expect(doc.frontmatter.title).toBeTruthy();
    }
  });

  it("compiles fixture corpus into entities", () => {
    const files = readdirSync(FIXTURES_DIR).filter((f) => f.endsWith(".md"));
    const documents = files.map((file) => {
      const content = readFileSync(join(FIXTURES_DIR, file), "utf-8");
      return parseMarkdownDocument(file, content);
    });

    const corpus = compileCorpus(documents, { knowledgeRoot: FIXTURES_DIR });

    expect(corpus.entities.length).toBe(files.length);
    expect(corpus.diagnostics.length).toBe(0);
    expect(corpus.corpusHash).toBeTruthy();

    // Verify entity kinds present
    const kinds = new Set(corpus.entities.map((e) => e.kind));
    expect(kinds.has("concept")).toBe(true);
    expect(kinds.has("claim")).toBe(true);
    expect(kinds.has("evidence")).toBe(true);
    expect(kinds.has("source")).toBe(true);
    expect(kinds.has("decision")).toBe(true);
    expect(kinds.has("technology")).toBe(true);
    expect(kinds.has("project")).toBe(true);
  });

  it("compilation is deterministic", () => {
    const files = readdirSync(FIXTURES_DIR).filter((f) => f.endsWith(".md"));
    const documents = files.map((file) => {
      const content = readFileSync(join(FIXTURES_DIR, file), "utf-8");
      return parseMarkdownDocument(file, content);
    });

    const corpus1 = compileCorpus(documents, { knowledgeRoot: FIXTURES_DIR });
    const corpus2 = compileCorpus(documents, { knowledgeRoot: FIXTURES_DIR });

    expect(corpus1.corpusHash).toBe(corpus2.corpusHash);
    expect(corpus1.entities.length).toBe(corpus2.entities.length);
  });
});
