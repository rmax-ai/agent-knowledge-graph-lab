import { defineAgent } from "eve";

export default defineAgent({
  description:
    "Verifies claims by inspecting evidence, detecting contradictions, and tracing provenance. Use when factual accuracy, source verification, or contradiction detection is needed.",
  model: "openai/gpt-5.4-mini",
});
