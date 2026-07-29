// @agkl/graph-store — Graph database abstraction
// Export only the interface. Implementations are internal.

export type { GraphStore } from "@agkl/domain";
export { MemoryGraphStore } from "./memory-graph-store";
export { LadybugGraphStore } from "./ladybug-graph-store";
