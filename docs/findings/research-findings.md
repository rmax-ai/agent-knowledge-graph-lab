# agent-knowledge-graph-lab: Technology Research Findings

> **Project**: agent-knowledge-graph-lab — a research environment evaluating typed knowledge graphs for agent retrieval.
> **Date**: 2026-07-27
> **Context**: ARM64 Linux (Debian 13), Node.js 22+/24, pnpm workspace, ESM, TypeScript 5.x strict.

---

## Table of Contents

1. [Eve Agent Framework](#1-eve-agent-framework)
2. [LadybugDB](#2-ladybugdb)
3. [OKF (Open Knowledge Format)](#3-okf-open-knowledge-format)
4. [pnpm Monorepo with TypeScript](#4-pnpm-monorepo-with-typescript)
5. [Next.js App Router + SSE](#5-nextjs-app-router--sse)
6. [Cytoscape.js + React](#6-cytoscapejs--react)
7. [Zod Patterns for Domain Modeling](#7-zod-patterns-for-domain-modeling)

---

## 1. Eve Agent Framework

### Overview

Eve (npm: `eve`, by Vercel) is a filesystem-first framework for durable AI agents.
**Status**: Public beta — APIs may change before GA.
**Required runtime**: Node.js 24+ (per docs; Node.js 22+ appears to work in practice).
**License**: Open source (MIT on GitHub).

### Key npm Packages

| Package | Import Path | Purpose |
|---------|-------------|---------|
| `eve` | `eve` | Core framework, `defineAgent` |
| `eve/tools` | `eve/tools` | `defineTool`, `disableTool`, `experimental_workflow` |
| `eve/tools/defaults` | `eve/tools/defaults` | Built-in tools: `bash`, `readFile`, `writeFile`, `glob`, `grep`, `webFetch`, `webSearch`, `todo`, `loadSkill` |
| `eve/skills` | `eve/skills` | `defineSkill`, `defineDynamic` |
| `eve/connections` | `eve/connections` | `defineMcpClientConnection`, `defineOpenAPIConnection` |
| `eve/sandbox` | `eve/sandbox` | `defineSandbox`, `defaultBackend` |
| `eve/channels` | `eve/channels` | `defineChannel`, route verbs |
| `eve/channels/eve` | `eve/channels/eve` | `eveChannel` — web chat channel |
| `eve/next` | `eve/next` | Next.js integration plugin (`withEve`) |
| `eve/react` | `eve/react` | React hooks (`useEveAgent`) |
| `eve/evals` | `eve/evals` | `defineEval`, `defineEvalConfig`, `mockModel` |
| `eve/hooks` | `eve/hooks` | `defineHook` — lifecycle hooks |
| `eve/context` | `eve/context` | `defineState` — session state |
| `eve/models/openai` | `eve/models/openai` | `experimental_chatgpt()` — OpenAI via Codex login |

### Minimal Agent Definition (TypeScript)

```
my-agent/
├── agent/
│   ├── agent.ts              # Runtime config (optional)
│   ├── instructions.md       # Required: system prompt
│   ├── tools/
│   │   └── get_weather.ts    # One tool per file
│   ├── skills/               # On-demand procedures
│   ├── subagents/            # Child agents
│   │   └── researcher/
│   │       └── agent.ts
│   ├── channels/             # Entry points
│   └── sandbox/              # Isolated compute
└── package.json
```

**`agent/agent.ts`**:
```typescript
import { defineAgent } from "eve";

export default defineAgent({
  model: "openai/gpt-5.4-mini", // or anthropic/claude-sonnet-5
  reasoning: "high",            // optional: "none" | "low" | "medium" | "high"
});
```

**`agent/instructions.md`**:
```markdown
You are a knowledge graph agent. Help users explore and query graph data.
```

**`agent/tools/get_weather.ts`**:
```typescript
import { defineTool } from "eve/tools";
import { z } from "zod";

// Filename becomes the tool name: "get_weather"
export default defineTool({
  description: "Get the current weather for a city.",
  inputSchema: z.object({
    city: z.string().describe("City name"),
  }),
  async execute(input) {
    // `input` is typed as { city: string }
    return { city: input.city, condition: "Sunny", temperatureF: 72 };
  },
});
```

### Embedding Eve in Next.js (withEve)

Eve does **not** embed inside a Route Handler. Instead, Eve wraps the entire Next.js config:

```typescript
// next.config.ts
import { withEve } from "eve/next";

const nextConfig = {
  // your existing config
};

export default withEve(nextConfig);
```

This mounts Eve's HTTP routes at `/eve/v1/session`, `/eve/v1/session/:id/stream`, etc. alongside your app. It shares the same dev server and deploy target. No CORS, no URL env vars needed.

For **self-hosted deployment** (non-Vercel):
- `eve build` + `eve start` runs the built Nitro server
- Sessions persist state to `.eve/.workflow-data` by default
- Forward both `/eve/` and `/.well-known/workflow/` through your reverse proxy
- Use direct AI SDK provider packages + API keys (no Vercel AI Gateway dependency)

### Subagent Definition

```typescript
// agent/subagents/researcher/agent.ts
import { defineAgent } from "eve";

export default defineAgent({
  description: "Investigate questions about graph data",
  model: "openai/gpt-5.4-mini",
});
```

Subagents must have a `description` field. They inherit nothing from the root agent — they have their own instructions, tools, sandbox, and state. Nested subagents are supported.

### Preventing Filesystem/DB Access

Eve's security model:
1. **Sandbox isolation**: Every agent has exactly one sandbox — an isolated bash-style compute environment. Framework tools (`bash`, `readFile`, `writeFile`) target only the sandbox, not the host.
2. **Define a custom sandbox** with restricted tools — don't include the default `readFile`/`writeFile`/`bash` tools from `eve/tools/defaults`.
3. **Sandbox backends**: `vercelSandboxBackend` (microVMs), Docker, or custom `SandboxBackend` adapter.
4. **LadybugDB access**: Since LadybugDB runs in-process, it's accessible from tool `execute()` functions. Restrict by omitting DB-related built-in tools and only exposing custom tools that use the DB through controlled schemas.

### Key Pitfalls

- **Eve wraps your app**, not the other way around. Route Handler integration is not the "embed in a handler" pattern — it's the framework-based approach.
- **Node.js 24+ required** per official docs (may work on 22+).
- **Eve is in beta** — APIs may break. Pin exact versions.
- **Vercel dependency**: Several features default to Vercel services (Workflows, Sandbox, AI Gateway). Self-hosting requires explicit configuration.
- **No built-in `import { Eve } from "eve"`** programmatic runtime class — Eve runs as a service, not a library you instantiate.
- Workflow state path must be on persistent storage.

---

## 2. LadybugDB

### Overview

LadybugDB is the open-source successor to KuzuDB (acquired by Apple). It's an embedded, columnar graph database with Cypher query language, ACID transactions, full-text search, and vector indices.

**npm package confusion**: There are **two packages**:
- **`@ladybugdb/core`** (official, latest: 0.18.1) — the correct package for Node.js. Has optional per-platform binaries: `@ladybugdb/core-linux-arm64`.
- **`lbug`** (v0.14.3, separate maintainer) — an older/alternative package, **not** the official one.

### Key npm Packages

| Package | Version | Purpose |
|---------|---------|---------|
| `@ladybugdb/core` | 0.15.2+ (latest 0.18.1) | Official Node.js native binding |
| `@ladybugdb/core-linux-arm64` | bundled optional dep | Prebuilt binary for ARM64 Linux |

### Installation

```bash
pnpm add @ladybugdb/core
```

The package bundles prebuilt binaries for all platforms including ARM64 Linux. If no prebuilt binary matches, it falls back to building from source (requires CMake ≥ 3.15, Python 3, C++20 compiler).

### API: Minimum Viable Pattern

```typescript
import { Database, Connection } from "@ladybugdb/core";

// 1. Initialize — path is a directory, not a file
const db = new Database("/path/to/graph-db");
const conn = new Connection(db);

// 2. Define schema (Cypher DDL)
await conn.query(`
  CREATE NODE TABLE Concept(
    id STRING,
    name STRING,
    type STRING,
    PRIMARY KEY (id)
  );
`);
await conn.query(`
  CREATE REL TABLE RelatesTo(
    FROM Concept TO Concept,
    weight DOUBLE
  );
`);

// 3. Insert data
await conn.query(
  `CREATE (c:Concept {id: $id, name: $name, type: $type})`,
  { id: "c1", name: "Machine Learning", type: "topic" }
);

// 4. Query
const result = await conn.query(
  `MATCH (c:Concept) RETURN c.name, c.type ORDER BY c.name LIMIT 10;`
);
const rows = result.getAll();
for (const row of rows) {
  console.log(row); // { c_name: string, c_type: string }
}

// 5. Clean up
conn.close();
db.close();
```

### API Surface

| Class | Constructor | Key Methods |
|-------|-------------|-------------|
| `Database` | `new Database(path: string)` | `close()` |
| `Connection` | `new Connection(db: Database)` | `query(cypher: string, params?: object): Promise<QueryResult>` |
| `QueryResult` | (returned from query) | `getAll(): Promise<any[]>`, `getNext(): Promise<any>` |

### Transactions, Nodes, Edges

- **Nodes**: `CREATE (n:Label {prop: value})`
- **Edges**: `CREATE (a)-[:REL_TYPE {prop: value}]->(b)`
- **Transactions**: Each `conn.query()` is an implicit transaction. Use `BEGIN TRANSACTION` / `COMMIT` for explicit multi-statement transactions.
- **Query params**: Positional `$param` syntax for parameterized queries.

### Kuzu/Cypher Compatibility

LadybugDB is a full Kuzu fork. Cypher dialect is **very close** to Kuzu's, including:
- `CREATE NODE TABLE`, `CREATE REL TABLE` (DDL)
- `MATCH`, `RETURN`, `WHERE`, `ORDER BY`, `LIMIT`, `SKIP`
- Property graph model (labels on nodes, relationship types on edges)
- `FROM ... TO ...` syntax for relationship direction
- `COPY FROM` for CSV bulk loading

### ARM64 Linux Support

✅ **Confirmed supported**. The package `@ladybugdb/core` ships optional deps:
```
@ladybugdb/core-linux-arm64
@ladybugdb/core-linux-x64
@ladybugdb/core-darwin-arm64
@ladybugdb/core-win32-x64
```

ARM64 binary is included in the 0.15.2+ releases.

### Key Pitfalls

- **⚠️ Package naming confusion**: Use `@ladybugdb/core`, NOT `lbug`.
- **Database path is a directory**, not a file. Ladybug creates a database directory at the given path. Ensure the parent directory exists and is writable.
- **No in-memory-only mode** (unlike SQLite `:memory:`). Always writes to disk.
- **Native addon**: Requires native binary compilation or prebuilt. ARM64 prebuilt binaries exist since v0.15.2.
- **Disk space**: The npm package is large (~500MB unpacked for all platform binaries, but only the relevant one is used at install time).
- **Cypher strings use `$param`** for parameterized queries (not `?` or `:param`).
- **No schema migration** — you define the schema at DB creation and must handle migrations externally.
- **Thread safety**: One database instance should be used from one process. Use a connection pool or singleton pattern.
- **No built-in vector index query** in Node.js API yet (available in Python/Rust).

---

## 3. OKF (Open Knowledge Format)

### Overview

OKF is an open specification from Google Cloud (published June 2026, v0.1/v0.2) for packaging knowledge as a directory of Markdown files with YAML frontmatter. It formalizes the "LLM-wiki" pattern into a portable, vendor-neutral format.

**Specification location**: https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md

### Structure

```
okf-bundle/
├── index.md          # Directory listing (reserved filename)
├── log.md            # Optional change log (reserved filename)
├── concepts/
│   ├── index.md
│   ├── machine-learning.md
│   └── knowledge-graph.md
└── tables/
    ├── index.md
    └── orders.md
```

### Frontmatter Schema

```yaml
---
type: <Type name>                  # REQUIRED — non-empty string
title: <Display name>              # Recommended — human-readable
description: <One-line summary>    # Recommended — for search/preview
resource: <Canonical URI>          # Recommended — URL or identifier
tags: [tag1, tag2]                 # Recommended — list of strings
timestamp: <ISO 8601 datetime>     # Recommended — last modified
# ... any producer-defined keys    # Optional — consumers MUST preserve unknown keys
---
```

### Conformance Rules (v0.2)

1. Every non-reserved `.md` file must have parseable YAML frontmatter.
2. Every frontmatter block must contain a non-empty `type` field.
3. Reserved filenames (`index.md`, `log.md`) follow specified conventions when present.
4. Consumers MUST tolerate unknown `type` values (treat as generic concepts).
5. Consumers MUST preserve unknown frontmatter keys (forward compatibility).

### Zod Schema for Frontmatter Validation

```typescript
import { z } from "zod";

// Minimal OKF frontmatter
const OkfFrontmatterSchema = z.object({
  type: z.string().min(1, "type is required"),
  title: z.string().optional(),
  description: z.string().optional(),
  resource: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
  timestamp: z.string().datetime().optional(),
}).passthrough(); // allow extra producer-specific keys

// Full OKF document parser
const OkfDocumentSchema = z.object({
  frontmatter: OkfFrontmatterSchema,
  body: z.string(),
  filePath: z.string(),
});

export type OkfDocument = z.infer<typeof OkfDocumentSchema>;
export type OkfFrontmatter = z.infer<typeof OkfFrontmatterSchema>;
```

### Parsing Pattern (gray-matter + yaml)

```typescript
import matter from "gray-matter";
import { OkfFrontmatterSchema, OkfDocument } from "./schemas";

function parseOkfFile(content: string, filePath: string): OkfDocument {
  const parsed = matter(content);
  const frontmatter = OkfFrontmatterSchema.parse(parsed.data);
  return { frontmatter, body: parsed.content, filePath };
}
```

### Recommended npm Packages

| Package | Purpose |
|---------|---------|
| `gray-matter` | Parse YAML frontmatter from Markdown |
| `yaml` or `js-yaml` | YAML parsing (used by gray-matter under the hood) |
| `zod` | Schema validation for frontmatter |
| `glob` or `fast-glob` | Walk OKF bundle directories |
| `mdsmith` | OKF-aware Markdown linter (has an `okf` starter) |

### Key Pitfalls

- **OKF is NOT a schema registry** — there is no central `type` enum. Producers choose their own types.
- **`type` is required**, but the value is arbitrary. Use descriptive strings like `"Concept"`, `"API Endpoint"`, `"Metric"`.
- **Cross-links** are standard Markdown links using bundle-relative paths starting with `/` (recommended for stability): `[orders](/tables/orders.md)`.
- **No `links:` frontmatter field**. Links are inline Markdown only.
- **No standard index.md format** — convention is a bullet list of `[Title](path) - description`.
- OKF is very new (June 2026). Reference implementations are sparse. The `mdsmith` tool has the most mature OKF support.

---

## 4. pnpm Monorepo with TypeScript

### Recommended Configuration

#### `pnpm-workspace.yaml`
```yaml
packages:
  - "packages/*"
  - "apps/*"
```

#### Root `package.json`
```json
{
  "name": "agent-knowledge-graph-lab",
  "private": true,
  "scripts": {
    "build": "pnpm -r build",
    "dev": "pnpm --parallel -r dev",
    "test": "pnpm -r test",
    "typecheck": "pnpm -r typecheck",
    "lint": "pnpm -r lint",
    "clean": "pnpm -r exec rm -rf dist"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "vitest": "^3.0.0"
  },
  "engines": {
    "node": ">=22",
    "pnpm": ">=9"
  },
  "packageManager": "pnpm@10.0.0"
}
```

#### `tsconfig.base.json` (root)
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "lib": ["ES2022"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "exclude": ["node_modules", "dist"]
}
```

#### Per-package `tsconfig.json` (e.g., `packages/domain/`)
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "composite": true
  },
  "include": ["src"],
  "references": [
    { "path": "../okf" }
  ]
}
```

#### Per-package `package.json` (e.g., `packages/domain/`)
```json
{
  "name": "@akgl/domain",
  "version": "0.1.0",
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc --build",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "@akgl/okf": "workspace:*",
    "zod": "^4.0.0"
  }
}
```

### Workspace Protocol Best Practices

- Use `workspace:*` for tightly coupled internal packages (exact version pin on publish).
- Use `workspace:^` for loosely coupled internal packages.
- `pnpm publish` automatically replaces `workspace:*` with the real version number in published artifacts.
- For a **research project** that won't publish: `workspace:*` is fine. No publishing infrastructure needed.

### Build Order

- `pnpm -r build` runs builds respecting topological order (dependencies built first).
- Use `tsc --build` (project references) for incremental builds.
- Root `tsconfig.json` for IDE:
  ```json
  {
    "files": [],
    "references": [
      { "path": "packages/domain" },
      { "path": "packages/okf" },
      { "path": "packages/graph-store" },
      { "path": "packages/retrieval" },
      { "path": "apps/web" }
    ]
  }
  ```

### Key Pitfalls

- **Phantom dependencies**: pnpm's strict `node_modules` prevents accessing undeclared dependencies. Every import must have a matching declaration in `package.json`. Run `pnpm ls --depth 0` to audit.
- **Never use `shamefully-hoist=true`** — it breaks pnpm's strictness guarantee. Use `hoist-pattern[]` for specific packages if necessary.
- **`prepublishOnly` hook**: Always add `"prepublishOnly": "pnpm build"` to publishable packages to avoid publishing stale `dist/`.
- **`files` field**: Explicitly list what gets published: `"files": ["dist", "README.md"]`.
- **TypeScript project references** are optional but recommended for incremental builds. Without them, `tsc` rebuilds everything.
- **Vitest workspace**: Use `vitest.workspace.ts` to run tests across all packages.
- **Disk space**: pnpm's content-addressable store saves space. Regular `pnpm store prune` clears old versions.

---

## 5. Next.js App Router + SSE

### Route Handler Pattern

```typescript
// apps/web/app/api/agent/stream/route.ts
export const dynamic = "force-dynamic";  // NEVER cache this route
export const runtime = "nodejs";         // SSE needs Node.js, NOT Edge

export async function GET(request: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Helper: send SSE-formatted events
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      // Initial connection event
      send("connected", { message: "Stream established" });

      // Subscribe to your event source (agent runtime emits)
      const unsubscribe = agentRuntime.onEvent((event) => {
        try {
          send(event.type, event.payload);
        } catch {
          // Controller may be closed
        }
      });

      // Heartbeat keeps connection alive through proxies (every 25s)
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          clearInterval(heartbeat);
        }
      }, 25_000);

      // Cleanup on client disconnect
      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        unsubscribe();
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",      // Disable nginx buffering
    },
  });
}
```

### Client-Side Consumption

```typescript
// apps/web/hooks/useAgentStream.ts
"use client";

import { useEffect, useRef, useState } from "react";

interface StreamEvent {
  type: string;
  payload: unknown;
}

export function useAgentStream() {
  const [events, setEvents] = useState<StreamEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const es = new EventSource("/api/agent/stream");
    eventSourceRef.current = es;

    es.onopen = () => setConnected(true);

    // Named events
    es.addEventListener("turn_start", (event) => {
      setEvents((prev) => [...prev, { type: "turn_start", payload: JSON.parse(event.data) }]);
    });

    es.addEventListener("tool_call", (event) => {
      setEvents((prev) => [...prev, { type: "tool_call", payload: JSON.parse(event.data) }]);
    });

    // Fallback for unnamed events
    es.onmessage = (event) => {
      setEvents((prev) => [...prev, { type: "message", payload: JSON.parse(event.data) }]);
    };

    es.onerror = () => {
      setConnected(false);
      // EventSource auto-reconnects — no manual handling needed
    };

    return () => {
      es.close();
      setConnected(false);
    };
  }, []);

  return { events, connected };
}
```

### Integrating with Agent Runtime

Since Eve runs as a service (via `withEve()`), a Next.js Route Handler cannot **embed** it directly. The integration patterns are:

1. **Frontend → Next.js Route Handler → Eve HTTP API**: Your Route Handler acts as a proxy/translator between the client's EventSource and Eve's `/eve/v1/session/:id/stream` endpoint.
2. **Frontend → Eve directly (in-process)**: Not possible with current Eve architecture — Eve owns the server, not vice versa.
3. **Custom event bus**: For research/experimentation, you can build an in-process event bus that the Route Handler subscribes to.

### Edge vs Node.js Runtime

| Concern | Node.js Runtime | Edge Runtime |
|---------|----------------|--------------|
| SSE stability | ✅ Stable, long-lived connections | ❌ Connection drops on some deployments |
| Node.js APIs | ✅ Full access (`fs`, crypto, DB) | ❌ No Node.js APIs |
| Vercel timeout | 60s (Pro) or configurable `maxDuration` | Longer (no hard timeout for streaming) |
| Native addons | ✅ Works (LadybugDB) | ❌ Cannot load native modules |
| **Recommendation** | **✅ USE THIS** | ❌ Avoid for SSE + DB |

**Critical rule**: SSE in Next.js 15 requires:
```typescript
export const runtime = "nodejs";   // NOT "edge"
export const dynamic = "force-dynamic";
```

### SSE Format Reference

```
event: connected\ndata: {}\n\n                                          ← Named event
data: {"type":"update","progress":0.5}\n\n                                ← Unnamed event
: heartbeat\n\n                                                           ← Comment (ignored by listener)
event: complete\ndata: {"result":"done"}\n\n                              ← Terminal event
retry: 5000\n\n                                                           ← Reconnection delay
id: 42\ndata: {"msg":"resumable"}\n\n                                      ← With event ID for resumability
```

- Each event **must** end with `\n\n` (double newline).
- Named events use `event: name\n` before `data: ...\n\n`.
- The browser's `EventSource` auto-reconnects with `Last-Event-ID` header.

---

## 6. Cytoscape.js + React

### Recommended Packages

| Package | Version | Purpose |
|---------|---------|---------|
| `cytoscape` | ^3.28+ | Core Cytoscape.js graph library |
| `react-cytoscapejs` | ^2.0+ | React wrapper (CytoscapeComponent) |
| `cytoscape-cose-bilkent` | optional | Layout extension |
| `cytoscape-dagre` | optional | DAG layout for directed graphs |

**Note**: `cytoscape` is a **peer dependency** of `react-cytoscapejs` (since v2.0.0). Install both.

### Next.js Pattern: Client Component with SSR Disabled

⚠️ `react-cytoscapejs` references `window` on import — it **cannot** be rendered on the server. Must use `next/dynamic` with `ssr: false`.

#### 1. Create a Client Component wrapper

```typescript
// apps/web/components/GraphVisualization/GraphViewer.tsx
"use client";

import React from "react";
import dynamic from "next/dynamic";

// Dynamic import with SSR disabled
const CytoscapeComponent = dynamic(
  () => import("react-cytoscapejs"),
  { ssr: false }
);

// CYTOSCAPE is a peer dep — import and register layouts here
import Cytoscape from "cytoscape";
// import COSEBilkent from "cytoscape-cose-bilkent";
// Cytoscape.use(COSEBilkent);

interface GraphViewerProps {
  elements: Cytoscape.ElementDefinition[];
  layout?: Cytoscape.LayoutOptions;
  style?: React.CSSProperties;
  onNodeClick?: (nodeId: string) => void;
}

export default function GraphViewer({
  elements,
  layout = { name: "cose" },
  style = { width: "100%", height: "600px" },
  onNodeClick,
}: GraphViewerProps) {
  const [cyRef, setCyRef] = React.useState<cytoscape.Core | null>(null);

  const handleMount = React.useCallback((cy: cytoscape.Core) => {
    setCyRef(cy);
    if (onNodeClick) {
      cy.on("tap", "node", (evt) => {
        onNodeClick(evt.target.id());
      });
    }
  }, [onNodeClick]);

  // Cleanup
  React.useEffect(() => {
    return () => {
      cyRef?.destroy();
    };
  }, [cyRef]);

  if (typeof window === "undefined") {
    return <div style={style}>Loading graph visualization...</div>;
  }

  return (
    <CytoscapeComponent
      elements={elements}
      layout={layout}
      style={style}
      cy={handleMount}
      autounselectify={false}
      boxSelectionEnabled={true}
      wheelSensitivity={0.3}
    />
  );
}
```

#### 2. Usage from a Server Component

```typescript
// apps/web/app/graph/page.tsx
import GraphViewer from "@/components/GraphVisualization/GraphViewer";

// Fetch data server-side
async function getGraphElements() {
  // ... fetch from graph-store API
  return [
    { data: { id: "c1", label: "Machine Learning" } },
    { data: { id: "c2", label: "Knowledge Graphs" } },
    { data: { source: "c1", target: "c2", label: "related_to" } },
  ];
}

export default async function GraphPage() {
  const elements = await getGraphElements();

  return (
    <main>
      <h1>Knowledge Graph</h1>
      <GraphViewer elements={elements} />
    </main>
  );
}
```

### Key Props for `CytoscapeComponent`

| Prop | Type | Description |
|------|------|-------------|
| `elements` | `ElementDefinition[]` | Nodes + edges data |
| `layout` | `LayoutOptions` | Default: `{ name: "cose" }` |
| `style` | `CSSProperties` | Container dimensions (must set w/h) |
| `cy` | `(cy: Core) => void` | Callback with cytoscape instance ref |
| `autoungrabify` | `boolean` | Prevent node dragging |
| `wheelSensitivity` | `number` | Zoom sensitivity (default: 1) |
| `stylesheet` | `Stylesheet[]` | Custom styling |

### Element Data Format

```typescript
interface GraphElements {
  nodes: Array<{
    data: {
      id: string;
      label: string;
      // Custom properties for tooltips, colors, etc.
      type?: string;       // Concept, API, Metric, etc.
      description?: string;
      weight?: number;     // For node sizing
    };
    position?: { x: number; y: number };  // Optional — layout computes if omitted
  }>;
  edges: Array<{
    data: {
      id: string;
      source: string;
      target: string;
      label?: string;
      weight?: number;  // For edge thickness
    };
  }>;
}
```

### Key Pitfalls

- **❌ SSR hydration errors**: `react-cytoscapejs` references `window` at module scope. Must use `dynamic(() => import(...), { ssr: false })`.
- **❌ `ssr: false` in Server Component**: `next/dynamic` with `ssr: false` can only be used in a **Client Component** (`"use client"`). Wrap in a Client Component first, then use it from your Server Component.
- **Layout extensions** (e.g., `cytoscape-cose-bilkent`) must be registered **before** CytoscapeComponent mounts: `Cytoscape.use(Extension)`.
- **Container dimensions**: The container `div` must have explicit width/height.
- `cytoscape` package **must** be installed as a direct dependency (peer dep of `react-cytoscapejs`).
- No TypeScript types for `react-cytoscapejs` — may need `.d.ts` declaration or `@ts-ignore`.

---

## 7. Zod Patterns for Domain Modeling

### Type Inference (z.infer)

```typescript
import { z } from "zod";

// Define once — gets both runtime validation + TypeScript type
export const ConceptSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  type: z.string().min(1),
  description: z.string().max(2000).optional(),
  createdAt: z.coerce.date(),
});

export type Concept = z.infer<typeof ConceptSchema>;
// { id: string; name: string; type: string; description?: string; createdAt: Date }
```

### Discriminated Unions for Entity Kinds

```typescript
import { z } from "zod";

// Base properties shared by all knowledge entities
const BaseEntitySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

// Each variant has a unique `kind` literal
export const ConceptEntitySchema = BaseEntitySchema.extend({
  kind: z.literal("concept"),
  domain: z.string(),
  relatedConcepts: z.array(z.string()).default([]),
});

export const ApiEntitySchema = BaseEntitySchema.extend({
  kind: z.literal("api"),
  endpoint: z.string().url(),
  method: z.enum(["GET", "POST", "PUT", "DELETE"]),
});

export const MetricEntitySchema = BaseEntitySchema.extend({
  kind: z.literal("metric"),
  unit: z.string(),
  formula: z.string().optional(),
});

// Discriminated union — O(1) branch lookup
export const KnowledgeEntitySchema = z.discriminatedUnion("kind", [
  ConceptEntitySchema,
  ApiEntitySchema,
  MetricEntitySchema,
]);

export type KnowledgeEntity = z.infer<typeof KnowledgeEntitySchema>;
// => ConceptEntity | ApiEntity | MetricEntity  (TypeScript narrows on .kind)
```

### Schema Composition

```typescript
const TimestampSchema = z.object({
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
});

const ProvenanceSchema = z.object({
  source: z.string(),
  confidence: z.number().min(0).max(1).optional(),
});

// Compose via extend
export const FullConceptSchema = ConceptEntitySchema
  .extend(TimestampSchema.shape)
  .extend(ProvenanceSchema.shape);

// Compose via merge
export const FullConceptSchema2 = ConceptEntitySchema
  .merge(TimestampSchema)
  .merge(ProvenanceSchema);

// Pick/omit for API variants
export const ConceptResponseSchema = FullConceptSchema.omit({
  createdAt: true,
});

// Partial for PATCH
export const ConceptUpdateSchema = FullConceptSchema.partial();
```

### Input/Output Pattern with Transforms

```typescript
// Input schema (what the API receives)
const CreateConceptInputSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  description: z.string().optional(),
});

// Domain schema (what the application uses — transformed)
const CreateConceptDomainSchema = CreateConceptInputSchema.transform((input) => ({
  ...input,
  id: crypto.randomUUID(),
  createdAt: new Date(),
  normalizedName: input.name.toLowerCase().trim(),
}));

export type CreateConceptInput = z.input<typeof CreateConceptDomainSchema>;
export type CreateConceptDomain = z.output<typeof CreateConceptDomainSchema>;
```

### Validation Performance Considerations

| Technique | Performance | When to Use |
|-----------|-------------|-------------|
| `z.union()` | O(n) — tries each branch | Schemas without a shared discriminator field |
| `z.discriminatedUnion()` | O(1) — direct branch lookup | **Preferred** — objects sharing a literal discriminator |
| `.pipe()` | Sequential pipeline | Chained transforms (Zod v4 native) |
| `.superRefine()` | After validation | Complex multi-field business rules |
| `z.lazy()` | Deferred evaluation | Recursive schemas (tree structures) |

**Zod v4 (2025)**: ~10-20x faster parsing than v3, better tree-shaking, native `.pipe()`, `z.interface()` for recursive types, branded types via `z.brand()`. If possible, use Zod v4.

### Key Pitfalls

- **❌ `z.union()` vs `z.discriminatedUnion()`**: Always prefer `discriminatedUnion` when objects share a literal field. `z.union()` tries every branch — slow and gives confusing errors.
- **`z.infer` gives output type** — if you use transforms, the input type may differ. Use `z.input<>` and `z.output<>` explicitly.
- **Recursive schemas** require `z.lazy()` to avoid infinite reference loop.
- **Always add `maxDepth` guard** to recursive schemas to prevent DoS via deeply nested payloads.
- Use `.passthrough()` for OKF frontmatter (allows unknown producer keys).
- `z.coerce.date()` is convenient but can mask errors — validate after coercion.
- For performance-sensitive code paths, use `.safeParse()` over `.parse()` (avoid try/catch flow control).

---

## Quick Reference: Package Versions

| Package | Recommended Version | npm Name |
|---------|-------------------|----------|
| Eve | latest (beta, pin exact) | `eve` |
| LadybugDB | 0.15.2+ | `@ladybugdb/core` |
| Zod | 4.x (or 3.23+) | `zod` |
| Next.js | 15.x | `next` |
| Cytoscape.js | ^3.28 | `cytoscape` |
| react-cytoscapejs | ^2.0 | `react-cytoscapejs` |
| pnpm | 10.x | — (package manager) |
| gray-matter | ^4.0 | `gray-matter` |
| vitest | ^3.0 | `vitest` |
| TypeScript | 5.7+ | `typescript` |

---

## Known Incompatibilities & Blockers

| Issue | Severity | Details |
|-------|----------|---------|
| Eve requires Node.js 24+ | ⚠️ HIGH | Official docs state Node 24+. Current env has Node 22+ for testing. May work on 22 but not guaranteed. |
| Eve beta API instability | ⚠️ MEDIUM | APIs may change before GA. Pin exact version. |
| LadybugDB native addon build | ⚠️ MEDIUM | Falls back to source build if prebuilt missing. Requires CMake, Python 3, C++20. ~500MB npm package. |
| LadybugDB `@ladybugdb/core` vs `lbug` | ⚠️ HIGH | Two packages with similar names. Use `@ladybugdb/core`. |
| `react-cytoscapejs` SSR incompatibility | ⚠️ HIGH | Requires `next/dynamic` with `ssr: false` inside Client Component. |
| Eve cannot be embedded in Route Handler | ⚠️ HIGH | Eve wraps the entire Next.js config via `withEve()`. Not a programmatic library. |
| Edge Runtime + SSE | ✅ AVOID | SSE must use Node.js runtime. Edge runtime causes connection drops. |
| Disk space | ⚠️ HIGH | Only ~214MB free. LadybugDB npm package is ~500MB (unpacked all platforms). Use `pnpm store prune`. |
| OKF is very new (June 2026) | ⚠️ LOW | Spec may evolve. No mature ecosystem yet. |

---

## Architecture Recommendations

```
┌─────────────────────────────────────────────────────────┐
│                    apps/web (Next.js 15)                  │
│  ┌──────────────┐  ┌────────────────┐  ┌──────────────┐  │
│  │ Server        │  │ Route Handler │  │ Client       │  │
│  │ Components    │  │ (SSE / API)   │  │ Components   │  │
│  │ (data fetch)  │  │               │  │ (GraphViz)   │  │
│  └──────┬───────┘  └──────┬─────────┘  └──────┬───────┘  │
│         │                 │                   │          │
└─────────┼─────────────────┼───────────────────┼──────────┘
          │                 │                   │
┌─────────┴─────────────────┴───────────────────┴──────────┐
│                   Packages (@akgl/*)                      │
│  ┌──────────┐ ┌──────┐ ┌────────────┐ ┌──────────┐      │
│  │ domain   │ │ okf  │ │ graph-store│ │retrieval │      │
│  │ (types,  │ │      │ │(LadybugDB  │ │(query    │      │
│  │ schemas) │ │      │ │ wrapper)   │ │ builder) │      │
│  └──────────┘ └──────┘ └────────────┘ └──────────┘      │
│  ┌─────────────┐ ┌─────────────┐ ┌────────────┐         │
│  │ agent-      │ │ evals       │ │ config     │         │
│  │ runtime     │ │ (Eve evals) │ │            │         │
│  └─────────────┘ └─────────────┘ └────────────┘         │
└─────────────────────────────────────────────────────────┘
```

1. **`domain`** — Central Zod schemas + TypeScript types (no runtime deps beyond `zod`).
2. **`okf`** — OKF bundle parser/validator (gray-matter + zod).
3. **`graph-store`** — LadybugDB wrapper (singleton Database, typed query builders).
4. **`retrieval`** — Query construction, embedding, and retrieval logic.
5. **`agent-runtime`** — Eve agent tools and session management.
6. **`evals`** — Eve eval definitions for benchmarking.
7. **`config`** — Shared configuration (LadybugDB path, model settings, OKF bundle path).
8. **`apps/web`** — Next.js 15 with SSE endpoints, Cytoscape graph visualization, Eve integration.
