import type { TraceEvent } from "./types.js";

const LOG_LEVELS = ["debug", "info", "warn", "error"] as const;
type LogLevel = (typeof LOG_LEVELS)[number];

const currentLevel: LogLevel =
  (process.env.LOG_LEVEL as LogLevel | undefined) ?? "info";

const levelRank: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

function shouldLog(level: LogLevel): boolean {
  return levelRank[level] >= levelRank[currentLevel];
}

export function log(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
  if (!shouldLog(level)) return;
  const entry = { timestamp: new Date().toISOString(), level, message, ...meta };
  if (level === "error") {
    console.error(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

export function trace(eventType: string, metadata: Record<string, unknown> = {}): void {
  const event: TraceEvent = {
    timestamp: new Date().toISOString(),
    traceId: metadata.traceId as string ?? "unknown",
    runId: metadata.runId as string ?? "unknown",
    eventType,
    metadata,
  };
  log("debug", `trace: ${eventType}`, event as unknown as Record<string, unknown>);
}
