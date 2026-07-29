"use client";

import { useState } from "react";

interface EvidenceItem {
  entityId: string;
  entityTitle: string;
  entityKind: string;
  relationKind: string;
  relevanceScore: number;
  sourceFile: string;
}

interface EvidenceData {
  claimId: string;
  supportingCount: number;
  contradictingCount: number;
  unresolved: boolean;
  supporting: EvidenceItem[];
  contradicting: EvidenceItem[];
}

export default function EvidenceDrawer() {
  const [claimId, setClaimId] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<EvidenceData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!claimId.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/graph/evidence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimId: claimId.trim() }),
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      setData(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-950 text-gray-100">
      <h2 className="text-lg font-semibold mb-4">Evidence Inspector</h2>

      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={claimId}
          onChange={(e) => setClaimId(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Enter claim entity ID..."
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
        <button
          onClick={handleSearch}
          disabled={loading || !claimId.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg px-4 py-2 text-sm font-medium"
        >
          {loading ? "Loading..." : "Inspect"}
        </button>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-800 text-red-400 rounded-lg p-3 text-sm mb-4">
          {error}
        </div>
      )}

      {data && (
        <div className="space-y-4">
          <div className="flex gap-4 text-sm">
            <div className="bg-green-900/30 border border-green-800 rounded-lg px-3 py-2">
              <span className="text-green-400 font-medium">{data.supportingCount}</span>
              <span className="text-gray-500 ml-1">supporting</span>
            </div>
            <div className="bg-red-900/30 border border-red-800 rounded-lg px-3 py-2">
              <span className="text-red-400 font-medium">{data.contradictingCount}</span>
              <span className="text-gray-500 ml-1">contradicting</span>
            </div>
            {data.unresolved && (
              <div className="bg-yellow-900/30 border border-yellow-800 rounded-lg px-3 py-2">
                <span className="text-yellow-400 text-xs">unresolved</span>
              </div>
            )}
          </div>

          {data.supporting.length > 0 && (
            <section>
              <h3 className="text-sm font-medium text-green-400 mb-2">Supporting Evidence</h3>
              <div className="space-y-2">
                {data.supporting.map((item, i) => (
                  <div key={i} className="bg-gray-900 border border-gray-800 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded">
                        {item.entityKind}
                      </span>
                      <span className="text-xs text-green-500">[{item.relationKind}]</span>
                      <span className="text-xs text-gray-600 ml-auto">
                        score: {item.relevanceScore.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300">{item.entityTitle}</p>
                    <p className="text-xs text-gray-600 mt-1">Source: {item.sourceFile}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {data.contradicting.length > 0 && (
            <section>
              <h3 className="text-sm font-medium text-red-400 mb-2">Contradicting Evidence</h3>
              <div className="space-y-2">
                {data.contradicting.map((item, i) => (
                  <div key={i} className="bg-gray-900 border border-red-900/30 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded">
                        {item.entityKind}
                      </span>
                      <span className="text-xs text-red-500">[{item.relationKind}]</span>
                      <span className="text-xs text-gray-600 ml-auto">
                        score: {item.relevanceScore.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300">{item.entityTitle}</p>
                    <p className="text-xs text-gray-600 mt-1">Source: {item.sourceFile}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {!data && !loading && !error && (
        <p className="text-sm text-gray-600">
          Enter a claim entity ID to inspect supporting and contradicting evidence.
          Example: <code className="bg-gray-800 px-1 rounded">claim-graph-retrieval-outperforms-document</code>
        </p>
      )}
    </div>
  );
}
