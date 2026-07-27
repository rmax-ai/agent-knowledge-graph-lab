const nextConfig = {
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
    serverExternalPackages: ["lbug"],
};
export default nextConfig;
//# sourceMappingURL=next.config.js.map