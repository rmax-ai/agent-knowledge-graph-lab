import { NextRequest, NextResponse } from "next/server";
import { getGraphStore } from "~/lib/graph-store";

export const runtime = "nodejs";

const VALID_KINDS = [
  "concept", "claim", "evidence", "source", "decision", "technology", "project",
] as const;

// POST /api/graph/search
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const store = await getGraphStore();

    const results = await store.searchEntities({
      query: body.query ?? "",
      kinds: body.kinds,
      tags: body.tags,
      limit: body.limit ?? 20,
    });

    return NextResponse.json({
      count: results.length,
      results: results.map((r) => ({
        id: r.entity.id,
        kind: r.entity.kind,
        title: r.entity.title,
        summary: r.entity.summary,
        status: r.entity.status,
        confidence: r.entity.confidence,
        tags: r.entity.tags,
        score: r.score,
        matchReason: r.matchReason,
      })),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}
