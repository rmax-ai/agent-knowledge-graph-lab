import { defineAgent } from "eve";

export default defineAgent({
  description:
    "Explores the knowledge graph: searches for entities, expands neighborhoods, finds paths, and discovers connections. Use for broad exploration and multi-hop traversal.",
  model: "openai/gpt-5.4-mini",
});
