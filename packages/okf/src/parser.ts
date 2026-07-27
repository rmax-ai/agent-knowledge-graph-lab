import { readFileSync } from "node:fs";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import { parse as parseYaml } from "yaml";
import type { ParsedDocument } from "./types.js";
import { generateDocumentHash } from "./hashing.js";

export function parseMarkdownDocument(filePath: string, content: string): ParsedDocument {
  const tree = unified().use(remarkParse).use(remarkFrontmatter, ["yaml"]).use(remarkGfm).parse(content);

  // Extract YAML frontmatter
  let frontmatter: Record<string, unknown> = {};
  let bodyStart = 0;

  const firstChild = tree.children[0];
  if (firstChild?.type === "yaml") {
    frontmatter = parseYaml(firstChild.value) as Record<string, unknown>;
    bodyStart = firstChild.position?.end?.line ?? 0;
  }

  const body = content.split("\n").slice(bodyStart).join("\n");

  return {
    file: filePath,
    frontmatter: frontmatter as ParsedDocument["frontmatter"],
    body,
    sourceSpans: [],
    contentHash: generateDocumentHash(content),
  };
}

export function readMarkdownFile(filePath: string): ParsedDocument {
  const content = readFileSync(filePath, "utf-8");
  return parseMarkdownDocument(filePath, content);
}
