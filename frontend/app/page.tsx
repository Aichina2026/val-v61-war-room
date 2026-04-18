"use client";
/**
 * VAL V6.2 Flexible War Room - 简化版
 * 可配置化多AI辩论界面
 */

import { useState } from "react";

// 预定义配置选项
const MODES = [
  { id: "minimal", name: "极简", desc: "2角色1轮", roles: ["builder", "reviewer"], rounds: 1 },
  { id: "standard", name: "标准", desc: "4角色1轮", roles: ["clarifier", "builder", "reviewer", "arbiter"], rounds: 1 },
  { id: "deep", name: "深度", desc: "4角色3轮", roles: ["clarifier", "builder", "reviewer", "arbiter"], rounds: 3 },
];

const ROLES = [
  { id: "clarifier", name: "Clarifier", desc: "需求分析", models: ["glm-5.1", "gemini-2.5-pro"] },
  { id: "builder", name: "Builder", desc: "架构设计", models: ["gpt-5.3-codex-xhigh", "deepseek-v3.2"] },
  { id: "reviewer", name: "Reviewer", desc: "安全审计", models: ["claude-opus-4-6", "claude-opus-4-7"] },
  { id: "arbiter", name: "Arbiter", desc: "终极仲裁", models: ["gpt-5.4", "gpt-5.4-xhigh"] },
];

const NODES = [
  { id: "4SAPI", name: "4SAPI", status: "available" },
  { id: "Aliyun", name: "阿里百炼", status: "needs_key" },
  { id: "Moonshot", name: "Moonshot", status: "needs_key" },
];

export default function FlexibleWarRoom() {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState("standard");
  const [customRoles, setCustomRoles] = useState<string[]>(["clarifier", "builder", "reviewer", "arbiter"]);
  const [customRounds, setCustomRounds] = useState(1);
  const [enableSearch, setEnableSearch] = useState(false);
  const [selectedModels, setSelectedModels] = useState<Record<string, string>>({
    clarifier: "glm-5.1",
    builder: "gpt-5.3-codex-xhigh",
    reviewer: "claude-opus-4-6",
    arbiter: "gpt-5.4",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const runDebate = async () => {
    if (!query.trim()) return;
    setLoading(true);

    try {
      const res = await fetch("/api/debate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: query,
          mode,
          roles: mode === "custom" ? customRoles : undefined,
          rounds: mode === "custom" ? customRounds : undefined,
          models: selectedModels,
          enable_search: enableSearch,
        }),
      });

      const data = await res.json();
      setResult(data);
    } catch (e) {
      alert(`Error: ${e}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 font-mono text-sm">
      {/* Header */}
      <header className="mb-6 border-b border-gray-700 pb-4">
        <h1 className="text-xl font-bold">VAL V6.2 Flexible War Room</h1>
        <p className="text-gray-500">可配置化多AI辩论系统 | 节点可选 | 模型可选 | 轮次可选</p>
      </header>

      {/* Configuration Panel */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Mode Selection */}
        <div className="bg-gray-800 p-4 rounded border border-gray-700">
          <h3 className="text-yellow-400 font-bold mb-3">1. 选择模式</h3>
          <div className="space-y-2">
            {MODES.map((m) => (
              <label key={m.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-700 p-1 rounded">
                <input
                  type="radio"
                  name="mode"
                  value={m.id}
                  checked={mode === m.id}
                  onChange={() => setMode(m.id)}
                />
                <span className={mode === m.id ? "text-green-400" : ""}>
                  {m.name} <span className="text-gray-500">({m.desc})</span>
                </span>
              </label>
            ))}
            <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-700 p-1 rounded">
              <input
                type="radio"
                name="mode"
                value="custom"
                checked={mode === "custom"}
                onChange={() => setMode("custom")}
              />
              <span className={mode === "custom" ? "text-green-400" : ""}>自定义</span>
            </label>
          </div>
        </div>

        {/* Role & Model Selection */}
        <div className="bg-gray-800 p-4 rounded border border-gray-700">
          <h3 className="text-yellow-400 font-bold mb-3">2. 角色与模型</h3>
          {ROLES.map((role) => (
            <div key={role.id} className="mb-3">
              <label className="flex items-center gap-2 mb-1">
                <input
                  type="checkbox"
                  checked={customRoles.includes(role.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setCustomRoles([...customRoles, role.id]);
                    } else {
                      setCustomRoles(customRoles.filter((r) => r !== role.id));
                    }
                  }}
                />
                <span className={customRoles.includes(role.id) ? "text-white" : "text-gray-600"}>
                  {role.name} <span className="text-gray-500">({role.desc})</span>
                </span>
              </label>
              {customRoles.includes(role.id) && (
                <select
                  className="ml-6 bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs"
                  value={selectedModels[role.id]}
                  onChange={(e) => setSelectedModels({ ...selectedModels, [role.id]: e.target.value })}
                >
                  {role.models.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              )}
            </div>
          ))}
        </div>

        {/* Rounds & Search */}
        <div className="bg-gray-800 p-4 rounded border border-gray-700">
          <h3 className="text-yellow-400 font-bold mb-3">3. 高级选项</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-gray-400 mb-1">辩论轮次</label>
              <input
                type="number"
                min={1}
                max={5}
                value={customRounds}
                onChange={(e) => setCustomRounds(parseInt(e.target.value))}
                className="bg-gray-900 border border-gray-600 rounded px-2 py-1 w-20"
              />
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={enableSearch}
                onChange={(e) => setEnableSearch(e.target.checked)}
              />
              <span className={enableSearch ? "text-green-400" : "text-gray-400"}>
                启用搜索增强 (Google标准)
              </span>
            </label>
          </div>
        </div>

        {/* Node Status */}
        <div className="bg-gray-800 p-4 rounded border border-gray-700">
          <h3 className="text-yellow-400 font-bold mb-3">4. 节点状态</h3>
          <div className="space-y-1">
            {NODES.map((n) => (
              <div key={n.id} className="flex justify-between text-xs">
                <span>{n.name}</span>
                <span className={n.status === "available" ? "text-green-400" : "text-yellow-400"}>
                  {n.status === "available" ? "✅ 可用" : "⚠️ 需配置Key"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Query Input */}
      <div className="mb-6">
        <textarea
          className="w-full bg-gray-800 border border-gray-700 rounded p-3 h-24 resize-none"
          placeholder="输入需求，召集多AI论证... (例如: 设计一个高并发消息队列系统)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          onClick={runDebate}
          disabled={loading || !query.trim()}
          className="mt-2 w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 py-2 rounded font-bold"
        >
          {loading ? "辩论进行中..." : "🚀 启动多AI辩论"}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="bg-gray-800 rounded border border-gray-700 overflow-hidden">
          {/* Consensus Header */}
          <div className="bg-gray-700 p-3 flex justify-between items-center">
            <span className="font-bold">
              共识置信度: {result.consensus?.confidence}
            </span>
            <span className={result.consensus?.passed ? "text-green-400" : "text-yellow-400"}>
              {result.consensus?.passed ? "✅ 通过" : "⚠️ 未达阈值"}
            </span>
          </div>

          {/* Search Context (if enabled) */}
          {result.enhanced_prompt && (
            <div className="p-3 border-b border-gray-700 bg-blue-900/20">
              <h4 className="text-blue-400 font-bold mb-2">搜索增强上下文</h4>
              <pre className="text-xs text-gray-400 whitespace-pre-wrap">{result.enhanced_prompt.substring(0, 500)}...</pre>
            </div>
          )}

          {/* Rounds */}
          <div className="p-3">
            <h4 className="text-yellow-400 font-bold mb-2">辩论过程 ({result.rounds?.length}轮)</h4>
            {result.rounds?.map((round: any, idx: number) => (
              <div key={idx} className="mb-4 border-l-2 border-gray-600 pl-3">
                <h5 className="text-gray-400 text-xs mb-2">Round {idx + 1}</h5>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(round).map(([role, data]: [string, any]) => (
                    <div key={role} className="bg-gray-900 p-2 rounded text-xs">
                      <div className="text-gray-500 uppercase">{role}</div>
                      <div className="text-white">{data?.model || "N/A"}</div>
                      <div className="text-gray-600 truncate">{data?.opinion?.substring(0, 50)}...</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Raw JSON Toggle */}
          <details className="border-t border-gray-700">
            <summary className="p-3 cursor-pointer hover:bg-gray-700">查看完整JSON</summary>
            <pre className="p-3 text-xs text-gray-400 overflow-auto max-h-64">
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
