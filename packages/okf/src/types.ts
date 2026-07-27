import type { JsonValue } from "@agkl/domain";

/** Raw parsed OKF document before compilation. */
export interface OkfFrontmatter {
  id: string;
  kind: string;
  title: string;
  status: string;
  confidence?: number;
  tags?: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export interface ParsedDocument {
  file: string;
  frontmatter: OkfFrontmatter;
  body: string;
  sourceSpans: SourceSpan[];
  contentHash: string;
}

export interface SourceSpan {
  heading?: string;
  startLine: number;
  endLine: number;
  text: string;
}
