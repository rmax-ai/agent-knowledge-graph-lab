import { NextRequest, NextResponse } from "next/server";
import { getGraphStore } from "~/lib/graph-store";

export const runtime = "nodejs";

// GET /api/knowledge/:id
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const store = await getGraphStore();
    const entity = await store.getEntity(id);

    if (!entity) {
      return NextResponse.json({ error: `Entity "${id}" not found` }, { status: 404 });
    }

    return NextResponse.json({
      id: entity.id,
      kind: entity.kind,
      title: entity.title,
      summary: entity.summary,
      status: entity.status,
      confidence: entity.confidence,
      tags: entity.tags,
      source: entity.source,
      lifecycle: entity.lifecycle,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}
