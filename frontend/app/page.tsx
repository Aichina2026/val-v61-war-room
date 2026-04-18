"use client"; // Next.js 15 + React 19 规范

import { useState } from "react";

export default function WarRoom() {
  const [query, setQuery] = useState("");
  const [debateData, setDebateData] = useState(null);
  const [loading, setLoading] = useState(false);

  const startDebate = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      // 调用后端触发原生 parallel_ai_skill
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw_query: query, layer: "L1_Architecture" })
      });
      
      if (!res.ok) {
        const err = await res.json();
        alert(`Error: ${err.detail || "Unknown error"}`);
        return;
      }
      
      const data = await res.json();
      setDebateData(data);
    } catch (e) {
      alert(`Network error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          VAL V6.1 多AI指挥部 (War Room)
        </h1>
        <p className="text-gray-400 mt-2">
          Native Tool Integration | Multi-Model Parallel | 95% Confidence Gate
        </p>
      </header>

      <div className="flex gap-4 mb-8">
        <input
          className="flex-1 bg-gray-800 border border-gray-700 p-4 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="输入需求，召集多AI论证... (例如: 设计一个高并发消息队列系统)"
          onKeyDown={(e) => e.key === "Enter" && startDebate()}
        />
        <button
          onClick={startDebate}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 px-8 py-4 rounded-lg font-bold transition-all"
        >
          {loading ? "⏳ 论证中..." : "🚀 发起高准确率论证"}
        </button>
      </div>

      {debateData && (
        <div className="space-y-6">
          {/* 三模型并发展示区 */}
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(debateData.opinions || {}).map(([model, data]) => (
              <div
                key={model}
                className="bg-gray-800 border border-gray-700 rounded-lg p-4 h-96 overflow-y-auto"
              >
                <h3 className="text-blue-400 font-bold border-b border-gray-700 pb-2 mb-2">
                  {model}
                </h3>
                <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </div>
            ))}
          </div>

          {/* 共识裁判与物理拦截区 */}
          <div className="bg-green-900/20 border-2 border-green-600 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-green-400">
                ✅ 4AI工作流共识结论
              </h2>
              <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                置信度: {(debateData.consensus?.confidence * 100)?.toFixed(1) || 0}%
              </span>
            </div>
            
            <pre className="bg-gray-900 p-4 rounded-lg text-sm text-green-300 overflow-x-auto">
              {JSON.stringify(debateData.consensus, null, 2)}
            </pre>
            
            {debateData.approval_required && (
              <button
                className="mt-6 w-full bg-green-600 hover:bg-green-500 py-4 rounded-lg font-bold text-lg transition-all shadow-lg shadow-green-600/30"
                onClick={async () => {
                  const res = await fetch("/api/approve/123", { method: "POST" });
                  const result = await res.json();
                  alert(`Execution started: ${JSON.stringify(result)}`);
                }}
              >
                🛡️ 方案已阅，立刻批准调用 free-code 物理执行
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
