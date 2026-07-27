import type { GraphStore } from "@agkl/domain";

export interface AgentContext {
  runId: string;
  traceId: string;
  store: GraphStore;
}

export interface TraceEvent {
  timestamp: string;
  traceId: string;
  runId: string;
  eventType: string;
  durationMs?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: Record<string, any>;
}

let contextCounter = 0;

export function createAgentContext(store: GraphStore): AgentContext {
  const id = `run-${++contextCounter}-${Date.now()}`;
  return {
    runId: id,
    traceId: `trace-${id}`,
    store,
  };
}
