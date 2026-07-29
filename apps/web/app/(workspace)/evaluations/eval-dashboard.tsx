"use client";

import { useState, useMemo } from "react";

interface EvalReport {
  timestamp: string;
  corpus: { entities: number; relations: number; hash: string };
  aggregates: {
    graph: { precision: number; recall: number; f1: number };
    document: { precision: number; recall: number; f1: number };
  };
  failures: Array<{
    questionId: string;
    category: string;
    failureType: string;
    detail: string;
  }>;
}

interface MergedQuestion {
  questionId: string;
  question: string;
  category: string;
  expectedEntities: number;
  expectedRelations: number;
  graphPrecision: number;
  graphRecall: number;
  graphF1: number;
  graphFound: number;
  graphMissed: string[];
  docPrecision: number;
  docRecall: number;
  docF1: number;
  docFound: number;
  docMissed: string[];
}

interface Props {
  report: EvalReport;
  merged: MergedQuestion[];
  failureEntries: [string, number][];
  graphBetter: number;
  docBetter: number;
  tied: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  "project-overview": "bg-blue-900/30 text-blue-400",
  "retrieval-comparison": "bg-purple-900/30 text-purple-400",
  "evidence-tracing": "bg-green-900/30 text-green-400",
  provenance: "bg-cyan-900/30 text-cyan-400",
  "contradiction-detection": "bg-red-900/30 text-red-400",
  "agent-safety": "bg-yellow-900/30 text-yellow-400",
  "graph-structure": "bg-indigo-900/30 text-indigo-400",
  "compilation-pipeline": "bg-orange-900/30 text-orange-400",
  "knowledge-integrity": "bg-pink-900/30 text-pink-400",
  "observation-decisions": "bg-teal-900/30 text-teal-400",
  "evidence-synthesis": "bg-emerald-900/30 text-emerald-400",
  "retrieval-modes": "bg-violet-900/30 text-violet-400",
  benchmarking: "bg-amber-900/30 text-amber-400",
};

const FAILURE_COLORS: Record<string, string> = {
  "depth-limit-miss": "bg-yellow-900/40 text-yellow-400",
  "tool-selection-error": "bg-red-900/40 text-red-400",
  "entity-resolution-failure": "bg-orange-900/40 text-orange-400",
};

export default function EvalDashboard({
  report,
  merged,
  failureEntries,
  graphBetter,
  docBetter,
  tied,
}: Props) {
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [sortKey, setSortKey] = useState<"graphF1" | "docF1" | "questionId" | "category">("graphF1");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [expandedQ, setExpandedQ] = useState<string | null>(null);

  const categories = useMemo(() => {
    const cats = new Set(merged.map((m) => m.category));
    return ["all", ...[...cats].sort()];
  }, [merged]);

  const filtered = useMemo(() => {
    let items = filterCategory === "all" ? merged : merged.filter((m) => m.category === filterCategory);
    items = [...items].sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      if (typeof va === "number" && typeof vb === "number") {
        return sortDir === "asc" ? va - vb : vb - va;
      }
      return sortDir === "asc"
        ? String(va).localeCompare(String(vb))
        : String(vb).localeCompare(String(va));
    });
    return items;
  }, [merged, filterCategory, sortKey, sortDir]);

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const fmt = (n: number) => (n * 100).toFixed(1) + "%";
  const delta = (g: number, d: number) => {
    const diff = g - d;
    if (diff === 0) return null;
    const cls = diff > 0 ? "text-green-400" : "text-red-400";
    const sign = diff > 0 ? "+" : "";
    return <span className={`text-xs ml-1 ${cls}`}>{sign}{fmt(diff)}</span>;
  };

  return (
    <>
      {/* Aggregate Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          label="Graph F1"
          value={fmt(report.aggregates.graph.f1)}
          detail={`P ${fmt(report.aggregates.graph.precision)} · R ${fmt(report.aggregates.graph.recall)}`}
          color="blue"
        />
        <MetricCard
          label="Document F1"
          value={fmt(report.aggregates.document.f1)}
          detail={`P ${fmt(report.aggregates.document.precision)} · R ${fmt(report.aggregates.document.recall)}`}
          color="gray"
        />
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="text-xs text-gray-500 mb-1 uppercase">Head-to-Head</div>
          <div className="flex gap-4 text-sm">
            <div><span className="text-green-400 font-medium">{graphBetter}</span><span className="text-gray-600 ml-1">Graph wins</span></div>
            <div><span className="text-gray-400 font-medium">{docBetter}</span><span className="text-gray-600 ml-1">Doc wins</span></div>
            <div><span className="text-gray-500">{tied}</span><span className="text-gray-600 ml-1">tied</span></div>
          </div>
          <div className="mt-2 h-2 bg-gray-800 rounded-full overflow-hidden flex">
            <div className="bg-green-600 h-full" style={{ width: `${(graphBetter / merged.length) * 100}%` }} />
            <div className="bg-gray-600 h-full" style={{ width: `${(tied / merged.length) * 100}%` }} />
            <div className="bg-gray-500 h-full" style={{ width: `${(docBetter / merged.length) * 100}%` }} />
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="text-xs text-gray-500 mb-1 uppercase">Failures</div>
          <div className="text-lg font-medium text-gray-200">{report.failures.length}</div>
          <div className="text-xs text-gray-600 mt-1">
            {failureEntries.slice(0, 2).map(([type, count]) => (
              <span key={type} className="mr-2">
                {type}: {count}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Per-Question Table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Per-Question Results</h2>
          <div className="flex gap-2">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-300"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === "all" ? "All Categories" : c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-850 border-b border-gray-800">
              <tr className="text-gray-500 text-xs uppercase">
                <th className="px-4 py-3 text-left w-8">#</th>
                <th className="px-4 py-3 text-left">Question</th>
                <th
                  className="px-4 py-3 text-left cursor-pointer hover:text-gray-300"
                  onClick={() => toggleSort("category")}
                >
                  Category {sortKey === "category" && (sortDir === "asc" ? "↑" : "↓")}
                </th>
                <th className="px-4 py-3 text-center">Expected</th>
                <th
                  className="px-4 py-3 text-center cursor-pointer hover:text-gray-300"
                  onClick={() => toggleSort("graphF1")}
                >
                  Graph F1 {sortKey === "graphF1" && (sortDir === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="px-4 py-3 text-center cursor-pointer hover:text-gray-300"
                  onClick={() => toggleSort("docF1")}
                >
                  Doc F1 {sortKey === "docF1" && (sortDir === "asc" ? "↑" : "↓")}
                </th>
                <th className="px-4 py-3 text-center">Δ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m, i) => (
                <>
                  <tr
                    key={m.questionId}
                    className={`border-b border-gray-800/50 hover:bg-gray-800/30 cursor-pointer ${
                      expandedQ === m.questionId ? "bg-gray-800/50" : ""
                    }`}
                    onClick={() => setExpandedQ(expandedQ === m.questionId ? null : m.questionId)}
                  >
                    <td className="px-4 py-3 text-gray-600">{i + 1}</td>
                    <td className="px-4 py-3 max-w-md truncate">{m.question}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded ${CATEGORY_COLORS[m.category] ?? "bg-gray-800 text-gray-400"}`}>
                        {m.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-500">
                      {m.expectedEntities}E {m.expectedRelations}R
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={m.graphF1 > 0.5 ? "text-green-400" : m.graphF1 > 0 ? "text-yellow-400" : "text-gray-600"}>
                        {fmt(m.graphF1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={m.docF1 > 0.5 ? "text-green-400" : m.docF1 > 0 ? "text-yellow-400" : "text-gray-600"}>
                        {fmt(m.docF1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {m.graphF1 > m.docF1 ? (
                        <span className="text-green-400">+{fmt(m.graphF1 - m.docF1)}</span>
                      ) : m.docF1 > m.graphF1 ? (
                        <span className="text-red-400">-{fmt(m.docF1 - m.graphF1)}</span>
                      ) : (
                        <span className="text-gray-600">=</span>
                      )}
                    </td>
                  </tr>
                  {expandedQ === m.questionId && (
                    <tr key={`${m.questionId}-expanded`} className="bg-gray-800/30">
                      <td colSpan={7} className="px-4 py-4">
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <h4 className="text-gray-500 uppercase mb-2">Graph Mode</h4>
                            <div className="space-y-1">
                              <div>
                                Found: <span className="text-gray-300">{m.graphFound}</span>{" "}
                                <span className="text-gray-600">/ {m.expectedEntities} expected</span>
                              </div>
                              {m.graphMissed.length > 0 && (
                                <div className="text-red-400">
                                  Missed: {m.graphMissed.map((id) => (
                                    <code key={id} className="ml-1 bg-gray-800 px-1 rounded text-[11px]">{id}</code>
                                  ))}
                                </div>
                              )}
                              <div className="text-gray-600">
                                P: {fmt(m.graphPrecision)} · R: {fmt(m.graphRecall)} · F1: {fmt(m.graphF1)}
                              </div>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-gray-500 uppercase mb-2">Document Mode</h4>
                            <div className="space-y-1">
                              <div>
                                Found: <span className="text-gray-300">{m.docFound}</span>{" "}
                                <span className="text-gray-600">/ {m.expectedEntities} expected</span>
                              </div>
                              {m.docMissed.length > 0 && (
                                <div className="text-red-400">
                                  Missed: {m.docMissed.map((id) => (
                                    <code key={id} className="ml-1 bg-gray-800 px-1 rounded text-[11px]">{id}</code>
                                  ))}
                                </div>
                              )}
                              <div className="text-gray-600">
                                P: {fmt(m.docPrecision)} · R: {fmt(m.docRecall)} · F1: {fmt(m.docF1)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Failure Classification */}
      {failureEntries.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Failure Classification</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {failureEntries.map(([type, count]) => (
              <div
                key={type}
                className={`rounded-lg p-3 ${FAILURE_COLORS[type] ?? "bg-gray-900/40 text-gray-400"}`}
              >
                <div className="text-lg font-medium">{count}</div>
                <div className="text-xs mt-0.5">{type}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function MetricCard({
  label,
  value,
  detail,
  color,
}: {
  label: string;
  value: string;
  detail: string;
  color: "blue" | "gray";
}) {
  return (
    <div className={`bg-gray-900 border ${color === "blue" ? "border-blue-800" : "border-gray-800"} rounded-lg p-4`}>
      <div className="text-xs text-gray-500 mb-1 uppercase">{label}</div>
      <div className={`text-2xl font-bold ${color === "blue" ? "text-blue-400" : "text-gray-200"}`}>
        {value}
      </div>
      <div className="text-xs text-gray-600 mt-1">{detail}</div>
    </div>
  );
}
