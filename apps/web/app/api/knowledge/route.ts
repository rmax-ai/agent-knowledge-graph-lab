import { NextRequest, NextResponse } from "next/server";
import { getGraphStore } from "~/lib/graph-store";

export const runtime = "nodejs";

// GET /api/knowledge?q=query&kind=concept&limit=10
export async function GET(request: NextRequest) {
  try {
    const store = await getGraphStore();
    const { searchParams } = request.nextUrl;

    const query = searchParams.get("q");
    const kindParam = searchParams.get("kind");
    const limitParam = searchParams.get("limit");

    if (query) {
      const results = await store.searchEntities({
        query,
        kinds: kindParam ? kindParam.split(",") as any : undefined,
        limit: limitParam ? parseInt(limitParam, 10) : 20,
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
    }

    // No query — return entity count summary
    const health = await store.health();
    return NextResponse.json({
      entityCount: health.entityCount,
      relationCount: health.relationCount,
      ok: health.ok,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}
