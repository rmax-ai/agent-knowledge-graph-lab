/**
 * Validates all OKF Markdown documents in the knowledge/ directory.
 * Checks: YAML frontmatter schema, required fields, entity kind validity, status validity.
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { parseMarkdownDocument, validateOkfFrontmatter } from "@agkl/okf";

const VALID_KINDS = new Set([
  "concept", "claim", "evidence", "source", "decision", "technology", "project",
]);

interface ValidationError {
  file: string;
  message: string;
}

function validateKnowledgeDir(dir: string): {
  documents: number;
  errors: ValidationError[];
} {
  if (!existsSync(dir)) {
    return { documents: 0, errors: [{ file: dir, message: "Knowledge directory does not exist" }] };
  }

  const mdFiles = readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .sort();

  if (mdFiles.length === 0) {
    return { documents: 0, errors: [{ file: dir, message: "No Markdown files found in knowledge directory" }] };
  }

  const errors: ValidationError[] = [];

  for (const file of mdFiles) {
    const filePath = join(dir, file);
    try {
      const content = readFileSync(filePath, "utf-8");
      const doc = parseMarkdownDocument(file, content);

      // Zod schema validation
      const result = validateOkfFrontmatter(doc.frontmatter);
      if (!result.success) {
        for (const issue of result.error.issues) {
          errors.push({
            file,
            message: `Schema validation: ${issue.path.join(".")} — ${issue.message}`,
          });
        }
        continue;
      }

      const fm = result.data;

      // Kind must be one of the valid kinds
      if (!VALID_KINDS.has(fm.kind)) {
        errors.push({
          file,
          message: `Invalid kind "${fm.kind}". Must be one of: ${[...VALID_KINDS].join(", ")}`,
        });
      }

      // Confidence check
      if (fm.confidence !== undefined && (fm.confidence < 0 || fm.confidence > 1)) {
        errors.push({
          file,
          message: `Confidence ${fm.confidence} out of range [0, 1]`,
        });
      }
    } catch (err) {
      errors.push({
        file,
        message: `Parse error: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  }

  return { documents: mdFiles.length, errors };
}

// --- Main ---
const knowledgeDir = resolve(process.argv[2] ?? join(import.meta.dirname, "..", "knowledge"));
console.log(`Validating knowledge documents in: ${knowledgeDir}\n`);

const { documents, errors } = validateKnowledgeDir(knowledgeDir);

console.log(`Documents found: ${documents}`);
console.log(`Errors: ${errors.length}`);

if (errors.length > 0) {
  console.log("\n--- Validation Errors ---");
  for (const e of errors) {
    console.log(`  ${e.file}: ${e.message}`);
  }
  process.exit(1);
} else {
  console.log("\n✓ All documents valid.");
}
