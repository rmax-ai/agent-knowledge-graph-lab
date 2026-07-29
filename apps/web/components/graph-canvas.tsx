"use client";

import { useEffect, useRef, useState } from "react";
import cytoscape, { type Core } from "cytoscape";

const KIND_COLORS: Record<string, string> = {
  concept: "#3b82f6",  // blue
  claim: "#eab308",    // yellow
  evidence: "#22c55e", // green
  source: "#a855f7",   // purple
  decision: "#f97316", // orange
  technology: "#06b6d4", // cyan
  project: "#ec4899",  // pink
};

const RELATION_COLORS: Record<string, string> = {
  SUPPORTS: "#22c55e",
  CONTRADICTS: "#ef4444",
  DERIVED_FROM: "#a855f7",
  MENTIONS: "#6b7280",
  DEPENDS_ON: "#3b82f6",
  SELECTS: "#22c55e",
  REJECTS: "#ef4444",
  IMPLEMENTS: "#06b6d4",
  RELATED_TO: "#6b7280",
  SUPERSEDES: "#f97316",
};

interface GraphData {
  entities: Array<{
    id: string;
    kind: string;
    title: string;
    status: string;
    confidence?: number;
  }>;
  relations: Array<{
    id: string;
    kind: string;
    from: string;
    to: string;
  }>;
}

interface Props {
  data: GraphData;
  onNodeClick?: (entityId: string) => void;
}

export default function GraphCanvas({ data, onNodeClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Build Cytoscape elements
    const nodes = data.entities.map((e) => ({
      data: {
        id: e.id,
        label: e.title.length > 30 ? e.title.slice(0, 27) + "..." : e.title,
        fullTitle: e.title,
        kind: e.kind,
        status: e.status,
        confidence: e.confidence,
      },
    }));

    const edges = data.relations.map((r) => ({
      data: {
        id: r.id,
        source: r.from,
        target: r.to,
        label: r.kind,
        kind: r.kind,
      },
    }));

    const cy = cytoscape({
      container: containerRef.current,
      elements: [...nodes, ...edges],
      style: [
        {
          selector: "node",
          style: {
            "background-color": "#374151",
            label: "data(label)",
            "text-valign": "bottom",
            "text-halign": "center",
            "font-size": "10px",
            color: "#d1d5db",
            "text-background-color": "#111827",
            "text-background-opacity": 0.7,
            "text-background-padding": "2px",
            "text-wrap": "wrap",
            "text-max-width": "120px",
          },
        },
        ...Object.entries(KIND_COLORS).map(([kind, color]) => ({
          selector: `node[kind="${kind}"]`,
          style: { "background-color": color },
        })),
        {
          selector: "edge",
          style: {
            width: 1.5,
            "line-color": "#4b5563",
            "target-arrow-color": "#4b5563",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            label: "data(label)",
            "font-size": "8px",
            color: "#6b7280",
            "text-background-color": "#111827",
            "text-background-opacity": 0.7,
            "text-background-padding": "1px",
            "text-rotation": "autorotate",
          },
        },
        ...Object.entries(RELATION_COLORS).map(([kind, color]) => ({
          selector: `edge[kind="${kind}"]`,
          style: {
            "line-color": color,
            "target-arrow-color": color,
          },
        })),
        {
          selector: "node:selected",
          style: {
            "border-width": 3,
            "border-color": "#fbbf24",
            "border-opacity": 0.8,
          },
        },
      ],
      layout: {
        name: "cose",
        animate: false,
        nodeRepulsion: () => 8000,
        idealEdgeLength: () => 120,
        gravity: 0.3,
      } as any,
      minZoom: 0.3,
      maxZoom: 3,
    });

    cy.on("tap", "node", (evt) => {
      const node = evt.target;
      const entityId = node.data("id") as string;
      setSelectedNode(entityId);
      onNodeClick?.(entityId);
    });

    cy.on("tap", (evt) => {
      if (evt.target === cy) {
        setSelectedNode(null);
      }
    });

    cyRef.current = cy;

    return () => {
      cy.destroy();
    };
  }, [data]);

  // Find the selected entity
  const selected = selectedNode
    ? data.entities.find((e) => e.id === selectedNode)
    : null;

  return (
    <div className="flex h-full">
      {/* Graph canvas */}
      <div className="flex-1 relative">
        <div ref={containerRef} className="absolute inset-0 bg-gray-950" />
      </div>

      {/* Entity details sidebar */}
      {selected && (
        <div className="w-80 border-l border-gray-800 bg-gray-900 overflow-y-auto p-4 shrink-0">
          <div className="flex items-center gap-2 mb-3">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: KIND_COLORS[selected.kind] ?? "#6b7280" }}
            />
            <span className="text-xs text-gray-500 uppercase">{selected.kind}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded ml-auto ${
              selected.status === "accepted" ? "bg-green-900/50 text-green-400" :
              selected.status === "reviewed" ? "bg-blue-900/50 text-blue-400" :
              "bg-gray-800 text-gray-400"
            }`}>
              {selected.status}
            </span>
          </div>

          <h3 className="text-sm font-medium text-gray-200 mb-2">{selected.title}</h3>

          {selected.confidence !== undefined && (
            <div className="mb-3">
              <div className="text-xs text-gray-500 mb-1">
                Confidence: {(selected.confidence * 100).toFixed(0)}%
              </div>
              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${selected.confidence * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Relations from/to this entity */}
          <div className="mt-4">
            <h4 className="text-xs font-medium text-gray-500 mb-2 uppercase">Connections</h4>
            {data.relations
              .filter((r) => r.from === selectedNode || r.to === selectedNode)
              .slice(0, 20)
              .map((r) => {
                const otherId = r.from === selectedNode ? r.to : r.from;
                const other = data.entities.find((e) => e.id === otherId);
                const direction = r.from === selectedNode ? "→" : "←";
                return (
                  <div key={r.id} className="text-xs py-1 border-b border-gray-800/50">
                    <span className="text-gray-600">{direction} </span>
                    <span
                      className="cursor-pointer hover:text-blue-400"
                      onClick={() => setSelectedNode(otherId)}
                    >
                      {other?.title ?? otherId}
                    </span>
                    <span
                      className="ml-1 px-1 rounded text-[10px]"
                      style={{ color: RELATION_COLORS[r.kind] ?? "#6b7280" }}
                    >
                      [{r.kind}]
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
