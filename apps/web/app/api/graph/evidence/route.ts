import { NextRequest, NextResponse } from "next/server";
import { getGraphStore } from "~/lib/graph-store";

export const runtime = "nodejs";

// POST /api/graph/evidence
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const store = await getGraphStore();

    const evidence = await store.findEvidence({
      claimId: body.claimId,
      includeContradicting: body.includeContradicting ?? true,
    });

    return NextResponse.json({
      claimId: body.claimId,
      supportingCount: evidence.supporting.length,
      contradictingCount: evidence.contradicting.length,
      unresolved: evidence.unresolved,
      supporting: evidence.supporting.map((e) => ({
        entityId: e.entity.id,
        entityTitle: e.entity.title,
        entityKind: e.entity.kind,
        relationKind: e.relation.kind,
        relevanceScore: e.relevanceScore,
        sourceFile: e.entity.source.file,
      })),
      contradicting: evidence.contradicting.map((e) => ({
        entityId: e.entity.id,
        entityTitle: e.entity.title,
        entityKind: e.entity.kind,
        relationKind: e.relation.kind,
        relevanceScore: e.relevanceScore,
        sourceFile: e.entity.source.file,
      })),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}
