import { defineProject } from "vitest/config";
import path from "node:path";
export default defineProject({
    test: {
        environment: "node",
        globals: true,
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./app"),
        },
    },
});
//# sourceMappingURL=vitest.config.js.map