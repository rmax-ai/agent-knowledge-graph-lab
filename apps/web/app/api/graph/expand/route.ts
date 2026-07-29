import { NextRequest, NextResponse } from "next/server";
import { getGraphStore } from "~/lib/graph-store";

export const runtime = "nodejs";

// POST /api/graph/expand
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const store = await getGraphStore();

    const result = await store.expand({
      entityId: body.entityId,
      direction: body.direction ?? "both",
      relationKinds: body.relationKinds,
      depth: body.depth ?? 1,
      limit: body.limit ?? 50,
    });

    return NextResponse.json({
      rootEntityId: body.entityId,
      entityCount: result.entities.length,
      relationCount: result.relations.length,
      truncated: result.truncated,
      entities: result.entities.map((e) => ({
        id: e.id,
        kind: e.kind,
        title: e.title,
        summary: e.summary,
        status: e.status,
        confidence: e.confidence,
        tags: e.tags,
      })),
      relations: result.relations.map((r) => ({
        id: r.id,
        kind: r.kind,
        from: r.from,
        to: r.to,
        status: r.status,
        confidence: r.confidence,
      })),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}
