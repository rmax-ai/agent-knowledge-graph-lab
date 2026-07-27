# TS_DEVELOPMENT.md — TypeScript Development Conventions

Day-to-day engineering idioms for the Agent Knowledge Graph Lab.

## Module System

- **ESM exclusively.** `"type": "module"` in every `package.json`. Use `import`/`export`, never `require`.
- `verbatimModuleSyntax: true` in tsconfig — type imports must use `import type`.
- Extensions required in relative imports: `import { foo } from "./bar.js"` (yes, `.js` even in `.ts` files).

## TypeScript Strictness

All strict flags are on. Key consequences:

```typescript
// noUncheckedIndexedAccess — every index access is T | undefined
const first = items[0]; // type: Item | undefined
if (first) { /* use first */ }

// exactOptionalPropertyTypes — ? means "may be absent", not "may be undefined"
interface Config {
  path?: string; // can be omitted, but if present must be a string
}

// useUnknownInCatchVariables
try { ... } catch (error) {
  if (error instanceof KnowledgeValidationError) { /* typed */ }
}
```

## Error Handling

Use typed domain errors, never throw strings:

```typescript
// packages/domain/src/errors.ts
export class KnowledgeValidationError extends Error {
  constructor(
    message: string,
    public readonly diagnostics: CompilerDiagnostic[],
  ) {
    super(message);
    this.name = "KnowledgeValidationError";
  }
}
```

Domain packages throw typed errors. Route handlers catch and convert to HTTP error envelopes. Eve tools catch and convert to structured tool failures.

## Async Patterns

- `async`/`await` throughout. No raw promises without `await`.
- GraphStore operations are async (database I/O). Compiler and parser are sync (pure functions over strings).
- No top-level `await` in library packages. Permitted in scripts and app entry points.

## Testing

```typescript
// Vitest with type imports
import { describe, it, expect, beforeEach } from "vitest";
import { Compiler } from "@agkl/compiler";
```

- Fixture data lives in `fixtures/`. Each test creates its own graph instance.
- Contract tests use `describe.each` over GraphStore implementations.
- Never mock the graph — use `MemoryGraphStore` for unit tests, Ladybug fixtures for integration.

## Logging

Use `@agkl/observability` for structured events:

```typescript
import { trace } from "@agkl/observability";

trace("graph.query.completed", {
  queryType: "searchEntities",
  durationMs: 42,
  resultCount: matches.length,
});
```

Never `console.log` in library packages. The web app may use `console` for dev convenience.

## Imports

Import order (enforced by ESLint):
1. Node builtins
2. External packages
3. Workspace packages (`@agkl/*`)
4. Relative imports

## Environment Variables

```typescript
// packages/config/src/env.ts
import { z } from "zod";

export const env = z
  .object({
    GRAPH_DATABASE_PATH: z.string().min(1),
    KNOWLEDGE_ROOT: z.string().min(1),
    ...
  })
  .parse(process.env);
```

Startup must fail immediately for invalid config. Route handlers import `env` — it's validated once at module load.

## Zod Conventions

```typescript
// Define schema → infer type
export const KnowledgeEntitySchema = z.object({ ... });
export type KnowledgeEntity = z.infer<typeof KnowledgeEntitySchema>;

// Runtime validation at boundaries
const parsed = KnowledgeEntitySchema.parse(untrustedInput);
```

Schemas are the source of truth. Manual type declarations are an anti-pattern.
