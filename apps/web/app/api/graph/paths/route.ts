import { NextRequest, NextResponse } from "next/server";
import { getGraphStore } from "~/lib/graph-store";

export const runtime = "nodejs";

// POST /api/graph/paths
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const store = await getGraphStore();

    const paths = await store.findPaths({
      fromId: body.fromId,
      toId: body.toId,
      allowedRelations: body.allowedRelations,
      maxDepth: body.maxDepth ?? 4,
      limit: body.limit ?? 5,
    });

    return NextResponse.json({
      fromId: body.fromId,
      toId: body.toId,
      pathCount: paths.length,
      paths: paths.map((p) => ({
        length: p.length,
        entities: p.entities.map((e) => ({ id: e.id, kind: e.kind, title: e.title })),
        relations: p.relations.map((r) => ({ id: r.id, kind: r.kind, from: r.from, to: r.to })),
      })),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}
