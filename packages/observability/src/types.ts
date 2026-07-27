export interface TraceEvent {
  timestamp: string;
  traceId: string;
  runId: string;
  eventType: string;
  durationMs?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: Record<string, any>;
}
