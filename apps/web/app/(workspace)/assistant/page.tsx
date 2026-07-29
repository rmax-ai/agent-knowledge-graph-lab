"use client";

import { useEveAgent } from "eve/react";
import { useState, useRef, useEffect } from "react";

export default function AssistantPage() {
  const { data, send, status } = useEveAgent();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messages = data?.messages ?? [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || status === "streaming") return;
    send({ message: input.trim() });
    setInput("");
  };

  return (
    <div className="flex h-screen flex-col bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4">
        <h1 className="text-lg font-semibold">Knowledge Assistant</h1>
        <p className="text-sm text-gray-500">Ask questions about the knowledge graph</p>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-600 mt-32">
            <p className="text-lg">Ask a question about the knowledge graph.</p>
            <p className="text-sm mt-2">Example: &quot;How does graph retrieval compare to document retrieval?&quot;</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={msg.id ?? i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-2xl rounded-lg px-4 py-3 ${
                msg.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-200"
              }`}
            >
              {msg.parts?.map((part: any, j: number) => {
                if (part.type === "text") {
                  return <p key={j} className="whitespace-pre-wrap">{part.text}</p>;
                }
                if (part.type === "step-start") {
                  return (
                    <p key={j} className="text-xs text-gray-400 mt-1 italic">
                      {part.text || "Thinking..."}
                    </p>
                  );
                }
                if (part.type === "dynamic-tool") {
                  return (
                    <details key={j} className="mt-2 text-xs">
                      <summary className="text-gray-400 cursor-pointer">
                        Tool: {part.toolName ?? "unknown"}
                      </summary>
                      <pre className="mt-1 bg-gray-900 p-2 rounded text-gray-400 overflow-x-auto">
                        {JSON.stringify(part, null, 2)}
                      </pre>
                    </details>
                  );
                }
                return null;
              })}
              {msg.metadata?.status === "failed" && (
                <p className="text-red-400 text-xs mt-1">Error processing request</p>
              )}
            </div>
          </div>
        ))}
        {status === "streaming" && (
          <div className="flex justify-start">
            <div className="bg-gray-800 rounded-lg px-4 py-3">
              <span className="animate-pulse text-gray-500">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-gray-800 px-6 py-4">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about concepts, claims, evidence, decisions..."
            disabled={status === "streaming"}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={status === "streaming" || !input.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg px-6 py-3 font-medium transition-colors"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
