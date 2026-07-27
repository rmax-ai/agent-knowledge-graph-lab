// @agkl/okf — Open Knowledge Format parser
// Reads Markdown files, parses YAML frontmatter, extracts source spans.

export { parseMarkdownDocument } from "./parser.js";
export { validateOkfFrontmatter } from "./validator.js";
export { generateDocumentHash } from "./hashing.js";
export type { ParsedDocument, OkfFrontmatter } from "./types.js";
