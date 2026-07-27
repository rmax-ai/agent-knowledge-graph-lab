# TS_ARCHITECTURE.md — TypeScript Monorepo Architecture

Workspace layout, module boundaries, and build configuration.

## Package Dependency Direction

```
config ───────────────────────────────┐ (standalone)
domain ───────────────────────────────┤ (standalone)
okf ──────► domain, config            │
compiler ─► domain, okf               │
graph-store ► domain, compiler        │
retrieval ► domain, graph-store       │
agent-runtime ► graph-store, retrieval│
evals ───► domain, retrieval          │
observability ► domain                │
                                      ▼
apps/web ► agent-runtime, evals, observability, config, domain
```

**Rule:** Dependencies flow downward. No package may import from a package above it. No circular dependencies.

## Workspace Protocol

All internal dependencies use `workspace:*`:

```json
{
  "dependencies": {
    "@agkl/domain": "workspace:*",
    "@agkl/graph-store": "workspace:*"
  }
}
```

## Package Exports

Each package declares its public API via `exports` in `package.json`:

```json
{
  "name": "@agkl/domain",
  "exports": {
    ".": "./src/index.ts",
    "./types": "./src/types.ts"
  }
}
```

Internal modules not in `exports` are inaccessible to other packages.

## TypeScript Project References

Root `tsconfig.base.json` → each package `tsconfig.json` extends it with `composite: true`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*.ts"],
  "references": [
    { "path": "../domain" }
  ]
}
```

Use `tsc --build` for incremental compilation respecting dependency order.

## Build Order

1. `packages/config` (no deps)
2. `packages/domain` (no deps)
3. `packages/okf` → `packages/compiler` → `packages/graph-store` (chain)
4. `packages/retrieval` → `packages/agent-runtime` (chain)
5. `packages/evals`, `packages/observability` (parallel)
6. `apps/web` (depends on all packages)

Root build script handles this order.

## Next.js Integration

- `apps/web` uses Next.js 16 App Router
- Graph-backed routes declare `export const runtime = "nodejs"`
- Eve integration via `withEve()` in `next.config.ts`
- `@agkl/*` packages are imported directly via workspace protocol — Next.js resolves them from source (no pre-build needed in dev)
- For production build, packages must be built first (`tsc --build`)

## Package Boundaries Enforcement

ESLint `import/no-restricted-paths` or `@nx/enforce-module-boundaries` to prevent:
- `packages/domain` importing from `packages/graph-store`
- Any package importing from `apps/web`
- `packages/okf` importing from `packages/agent-runtime`

## Node.js Runtime

- `apps/web` API routes: Node.js runtime (not Edge)
- LadybugDB native module: Node.js only (no Edge, no browser)
- `packages/graph-store`: Ladybug native binding loads only at runtime, wrapped in try/catch for graceful fallback to `MemoryGraphStore`
