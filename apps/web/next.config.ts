import type { NextConfig } from "next";
import { withEve } from "eve/next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: [
    "@agkl/domain",
    "@agkl/config",
    "@agkl/graph-store",
    "@agkl/agent-runtime",
    "@agkl/observability",
    "@agkl/evals",
    "@agkl/retrieval",
    "@agkl/okf",
    "@agkl/compiler",
  ],
  serverExternalPackages: ["@ladybugdb/core"],
};

export default withEve(nextConfig);
