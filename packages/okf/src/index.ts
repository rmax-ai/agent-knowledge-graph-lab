// @agkl/okf — Open Knowledge Format parser
// Reads Markdown files, parses YAML frontmatter, extracts source spans.

export { parseMarkdownDocument } from "./parser";
export { validateOkfFrontmatter } from "./validator";
export { generateDocumentHash } from "./hashing";
export type { ParsedDocument, OkfFrontmatter } from "./types";
