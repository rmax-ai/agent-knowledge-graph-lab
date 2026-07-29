"use client";

import { useState, useMemo } from "react";

interface Entity {
  id: string;
  kind: string;
  title: string;
  status: string;
  confidence: number | undefined;
  summary: string;
  tags: readonly string[];
  sourceFile: string;
}

interface Relation {
  id: string;
  kind: string;
  from: string;
  to: string;
  sourceFile: string;
}

interface Props {
  entities: Entity[];
  relations: Relation[];
}

const KIND_COLORS: Record<string, string> = {
  concept: "bg-blue-900/30 text-blue-400 border-blue-800",
  claim: "bg-yellow-900/30 text-yellow-400 border-yellow-800",
  evidence: "bg-green-900/30 text-green-400 border-green-800",
  source: "bg-purple-900/30 text-purple-400 border-purple-800",
  decision: "bg-orange-900/30 text-orange-400 border-orange-800",
  technology: "bg-cyan-900/30 text-cyan-400 border-cyan-800",
  project: "bg-pink-900/30 text-pink-400 border-pink-800",
};

const RELATION_COLORS: Record<string, string> = {
  SUPPORTS: "text-green-400",
  CONTRADICTS: "text-red-400",
  DERIVED_FROM: "text-purple-400",
  MENTIONS: "text-gray-400",
  DEPENDS_ON: "text-blue-400",
  SELECTS: "text-green-300",
  REJECTS: "text-red-300",
  IMPLEMENTS: "text-cyan-400",
  RELATED_TO: "text-gray-400",
  SUPERSEDES: "text-orange-400",
};

const STATUS_COLORS: Record<string, string> = {
  accepted: "bg-green-900/30 text-green-400",
  reviewed: "bg-blue-900/30 text-blue-400",
  draft: "bg-gray-800 text-gray-400",
  proposed: "bg-yellow-900/30 text-yellow-400",
  rejected: "bg-red-900/30 text-red-400",
};

export default function KnowledgeBrowser({ entities, relations }: Props) {
  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const kinds = useMemo(() => {
    const s = new Set(entities.map((e) => e.kind));
    return ["all", ...[...s].sort()];
  }, [entities]);

  const statuses = useMemo(() => {
    const s = new Set(entities.map((e) => e.status));
    return ["all", ...[...s].sort()];
  }, [entities]);

  const filtered = useMemo(() => {
    let items = entities;
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.summary.toLowerCase().includes(q) ||
          e.id.toLowerCase().includes(q) ||
          e.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }
    if (kindFilter !== "all") items = items.filter((e) => e.kind === kindFilter);
    if (statusFilter !== "all") items = items.filter((e) => e.status === statusFilter);
    return items;
  }, [entities, search, kindFilter, statusFilter]);

  const selected = selectedId ? entities.find((e) => e.id === selectedId) : null;
  const selectedRelations = selectedId
    ? relations.filter((r) => r.from === selectedId || r.to === selectedId)
    : [];

  const kindCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of entities) m.set(e.kind, (m.get(e.kind) ?? 0) + 1);
    return m;
  }, [entities]);

  return (
    <div className="flex gap-0 h-[calc(100vh-120px)]">
      {/* Entity list */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Filters */}
        <div className="flex gap-3 mb-4 flex-wrap">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search entities by title, summary, ID, or tags..."
            className="flex-1 min-w-[200px] bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
          <select
            value={kindFilter}
            onChange={(e) => setKindFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300"
          >
            <option value="all">All Kinds ({entities.length})</option>
            {kinds
              .filter((k) => k !== "all")
              .map((k) => (
                <option key={k} value={k}>
                  {k} ({kindCounts.get(k) ?? 0})
                </option>
              ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300"
          >
            <option value="all">All Statuses</option>
            {statuses
              .filter((s) => s !== "all")
              .map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
          </select>
          <span className="text-xs text-gray-600 self-center">
            {filtered.length} of {entities.length}
          </span>
        </div>

        {/* Entity table */}
        <div className="flex-1 overflow-y-auto bg-gray-900 border border-gray-800 rounded-lg">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-900 border-b border-gray-800 z-10">
              <tr className="text-gray-500 text-xs uppercase">
                <th className="px-4 py-3 text-left">Kind</th>
                <th className="px-4 py-3 text-left">Title</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Conf</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">Source</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr
                  key={e.id}
                  className={`border-b border-gray-800/50 hover:bg-gray-800/50 cursor-pointer ${
                    selectedId === e.id ? "bg-gray-800/30 ring-1 ring-inset ring-blue-800/50" : ""
                  }`}
                  onClick={() => setSelectedId(selectedId === e.id ? null : e.id)}
                >
                  <td className="px-4 py-2.5">
                    <span
                      className={`text-xs px-2 py-0.5 rounded border ${KIND_COLORS[e.kind] ?? "bg-gray-800 text-gray-400 border-gray-700"}`}
                    >
                      {e.kind}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="font-medium text-gray-200">{e.title}</div>
                    {e.summary && (
                      <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{e.summary}</div>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${STATUS_COLORS[e.status] ?? "bg-gray-800 text-gray-400"}`}
                    >
                      {e.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    {e.confidence !== undefined ? (
                      <span className={e.confidence >= 0.8 ? "text-green-400" : e.confidence >= 0.5 ? "text-yellow-400" : "text-red-400"}>
                        {(e.confidence * 100).toFixed(0)}%
                      </span>
                    ) : (
                      <span className="text-gray-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 hidden md:table-cell">
                    <code className="text-xs text-gray-600">{e.sourceFile}</code>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-600">
                    No entities match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail drawer */}
      {selected && (
        <div className="w-96 border-l border-gray-800 bg-gray-900 overflow-y-auto p-5 shrink-0">
          <div className="flex items-center gap-2 mb-3">
            <span
              className={`text-xs px-2 py-0.5 rounded border ${KIND_COLORS[selected.kind] ?? "bg-gray-800 text-gray-400 border-gray-700"}`}
            >
              {selected.kind}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded ${STATUS_COLORS[selected.status] ?? "bg-gray-800 text-gray-400"}`}
            >
              {selected.status}
            </span>
            {selected.confidence !== undefined && (
              <span className="text-xs text-gray-500 ml-auto">
                {(selected.confidence * 100).toFixed(0)}% confidence
              </span>
            )}
          </div>

          <h3 className="text-base font-semibold text-gray-100 mb-2">{selected.title}</h3>

          {selected.summary && (
            <p className="text-sm text-gray-400 mb-4 leading-relaxed">{selected.summary}</p>
          )}

          {selected.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {selected.tags.map((t) => (
                <span key={t} className="text-xs bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded">
                  {t}
                </span>
              ))}
            </div>
          )}

          <div className="text-xs text-gray-600 mb-4">
            <div>ID: <code className="bg-gray-800 px-1 rounded">{selected.id}</code></div>
            <div>Source: <code className="bg-gray-800 px-1 rounded">{selected.sourceFile}</code></div>
          </div>

          {/* Relations */}
          <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">
            Relations ({selectedRelations.length})
          </h4>
          {selectedRelations.length === 0 ? (
            <p className="text-xs text-gray-600">No relations.</p>
          ) : (
            <div className="space-y-1.5">
              {selectedRelations.map((r) => {
                const otherId = r.from === selected.id ? r.to : r.from;
                const other = entities.find((e) => e.id === otherId);
                const direction = r.from === selected.id ? "→" : "←";
                return (
                  <div
                    key={r.id}
                    className="flex items-center gap-2 text-xs py-1.5 px-2 rounded bg-gray-800/50 hover:bg-gray-800 cursor-pointer"
                    onClick={() => setSelectedId(otherId)}
                  >
                    <span className="text-gray-600 w-4 shrink-0">{direction}</span>
                    <span className={`font-medium ${RELATION_COLORS[r.kind] ?? "text-gray-400"}`}>
                      [{r.kind}]
                    </span>
                    <span className="text-gray-300 truncate">
                      {other?.title ?? otherId}
                    </span>
                    <span className="text-gray-600 ml-auto shrink-0 text-[10px]">
                      {other?.kind ?? "?"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
