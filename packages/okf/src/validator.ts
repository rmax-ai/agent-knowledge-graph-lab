import { z } from "zod";

export const OkfFrontmatterSchema = z.object({
  id: z.string().min(1),
  kind: z.string().min(1),
  title: z.string().min(1),
  status: z.enum(["draft", "reviewed", "accepted", "deprecated"]),
  confidence: z.number().min(0).max(1).optional(),
  tags: z.array(z.string()).optional(),
  relations: z
    .array(
      z.object({
        type: z.string(),
        target: z.string(),
      }),
    )
    .optional(),
});

export function validateOkfFrontmatter(frontmatter: unknown) {
  return OkfFrontmatterSchema.safeParse(frontmatter);
}
