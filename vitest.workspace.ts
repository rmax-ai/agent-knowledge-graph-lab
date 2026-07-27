import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
  "packages/domain/vitest.config.ts",
  "packages/graph-store/vitest.config.ts",
  "apps/web/vitest.config.ts",
]);
