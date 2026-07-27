# TypeScript Development Conventions — Agent Knowledge Graph Lab

> Companion to AGENTS.md. Language-specific idioms for TypeScript 5.x in this project.

## Module System

- **ESM only.** Use `"type": "module"` in package.json, `.js` extensions in imports.
- `verbatimModuleSyntax: true` — use `import type` for type-only imports.
- No `require()`, no `module.exports`.

```typescript
// ✅ Correct
import { KnowledgeEntity } from "./entity.js";
import type { EntityKind } from "./types.js";

// ❌ Wrong
import { KnowledgeEntity } from "./entity";       // missing .js
import { type EntityKind } from "./types";         // inline type import
const { something } = require("./something");      // CJS
```

## Strictness

All strict flags are **non-negotiable**. Build fails on any violation.

```jsonc
{
  "strict": true,
  "noUncheckedIndexedAccess": true,  // array[0] is T | undefined
  "exactOptionalPropertyTypes": true, // { x?: string } ≠ { x?: string | undefined }
  "noImplicitOverride": true,         // must use 'override' keyword
  "useUnknownInCatchVariables": true  // catch (e: unknown)
}
```

### Handling `noUncheckedIndexedAccess`

```typescript
// ✅ Correct — guard the access
const first = items[0];
if (first) {
  console.log(first.title);
}

// ✅ Correct — non-null assertion when you KNOW it exists
const first = items[0]!;

// ❌ Wrong — compile error
const first = items[0];
console.log(first.title); // 'first' is possibly 'undefined'
```

### Handling `exactOptionalPropertyTypes`

```typescript
// ✅ Correct
interface Config {
  path?: string; // string | undefined only via omission
}

// ❌ Wrong — cannot assign explicit undefined
const cfg: Config = { path: undefined }; // Error!
```

## Naming Conventions

| Element | Convention | Example |
|---|---|---|
| Types/Interfaces | PascalCase | `KnowledgeEntity`, `GraphStore` |
| Variables/functions | camelCase | `searchEntities`, `entityId` |
| Constants | UPPER_SNAKE or camelCase | `MAX_GRAPH_DEPTH` |
| Files | kebab-case | `knowledge-entity.ts`, `graph-store.ts` |
| Directories | kebab-case | `graph-store/`, `agent-runtime/` |
| Enums (avoid) | Use union types instead | `type Status = "draft" \| "reviewed"` |
| Type parameters | Single uppercase, descriptive if needed | `T`, `TEntity extends KnowledgeEntity` |

## Error Handling

Use typed domain errors — never throw generic strings.

```typescript
// ✅ Correct — typed error classes
export class KnowledgeNotFoundError extends Error {
  constructor(public readonly entityId: string) {
    super(`Knowledge entity not found: ${entityId}`);
    this.name = "KnowledgeNotFoundError";
  }
}

// In tools — convert to structured failures
function toolError(code: string, message: string) {
  return { error: { code, message } };
}
```

**Rule:** Domain packages throw typed errors. Route Handlers map them to HTTP status codes. Eve tools map them to structured `{ error: { code, message } }` responses.

## Async Patterns

- Prefer `async/await` over raw promises.
- All I/O functions return `Promise<T>`.
- Use `readonly T[]` for returned arrays (prevents mutation at call site).
- Avoid `any` in async signatures.

```typescript
// ✅ Correct
async function getEntity(id: string): Promise<KnowledgeEntity | null> {
  return this.store.get(id);
}

// ❌ Wrong
function getEntity(id: string): Promise<any> { ... }
```

## Testing

- **Vitest** for all non-browser tests.
- Test files: `*.test.ts` alongside source, or `__tests__/` directory.
- Contract tests: abstract test factory `defineGraphStoreTests(createStore)`.
- Fixtures: TypeScript modules that export typed test data arrays.

```typescript
// graph-store.contract.test.ts
export function defineGraphStoreTests(
  createStore: () => Promise<GraphStore>
) {
  describe("GraphStore contract", () => {
    let store: GraphStore;
    beforeEach(async () => { store = await createStore(); });
    afterEach(async () => { await store.close(); });

    it("initializes an empty graph", async () => {
      await store.initialize();
      const health = await store.health();
      expect(health.initialized).toBe(true);
    });
  });
}
```

## Package Exports

Every package must have a clean public API:

```jsonc
// packages/domain/package.json
{
  "name": "@agkl/domain",
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./types": "./src/types.ts"
  }
}
```

Internal files not in `exports` are inaccessible to other packages.

## Performance Patterns

- **Don't allocate in hot paths.** Pre-allocate arrays, reuse objects.
- **Use `for...of` over `.forEach()`** — avoids closure allocation.
- **Avoid spread in loops** — `[...arr, item]` allocates a new array each time.
- **String building:** Use array `.push()` + `.join()` for large concatenations.
- **Map/Set over array `.includes()`** for membership checks.

## Observability

Every significant operation logs with structured data:

```typescript
import { trace } from "@agkl/observability";

const span = trace.start("graph.query", { queryType: "search" });
try {
  const result = await store.searchEntities(request);
  span.succeed({ resultCount: result.length });
  return result;
} catch (err) {
  span.fail(err);
  throw err;
}
```

Never log: API keys, full env vars, raw user filesystem paths outside knowledge root, unredacted sensitive documents.
