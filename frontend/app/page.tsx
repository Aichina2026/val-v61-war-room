"use client";
/**
 * VAL V6.1 多AI指挥部 (War Room) - 生产级
 * 
 * 特征:
 * - 三模型并发展示区
 * - 4AI工作流共识显示
 * - 物理拦截批准按钮
 * - 符合原始指令设计
 */

import { useState } from "react";

export default function WarRoom() {
  const [query, setQuery] = useState("");
  const [debateData, setDebateData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [approving, setApproving] = useState(false);
  const [approved, setApproved] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [wsStatus, setWsStatus] = useState("disconnected");

  // 发起辩论
  const startDebate = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setApproved(false);
    
    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: query,
          mode: "standard",
          rounds: 1,
          enable_search: false
        })
      });

      const data = await res.json();
      
      if (res.ok) {
        setTaskId(data.task_id);
        setDebateData(data);
      } else {
        alert(`错误: ${data.detail || '未知错误'}`);
      }
    } catch (e) {
      alert(`网络错误: ${e}`);
    } finally {
      setLoading(false);
    }
  };

  // 批准执行 - 物理拦截机制
  const approveExecution = async () => {
    if (!taskId) return;
    
    setApproving(true);
    try {
      const res = await fetch(`/api/approve/${taskId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: true })
      });

      const data = await res.json();
      
      if (res.ok) {
        setApproved(true);
        setDebateData((prev: any) => ({
          ...prev,
          ...data
        }));
      }
    } catch (e) {
      alert(`批准失败: ${e}`);
    } finally {
      setApproving(false);
    }
  };

  // WebSocket 连接
  const connectWebSocket = () => {
    const ws = new WebSocket("ws://localhost:8000/ws/openclaw");
    
    ws.onopen = () => {
      setWsStatus("connected");
      ws.send(JSON.stringify({ raw_query: query, mode: "standard", rounds: 1 }));
    };
    
    ws.onmessage = (event) => {
      console.log("WS:", event.data);
    };
    
    ws.onclose = () => setWsStatus("disconnected");
    ws.onerror = () => setWsStatus("error");
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-2">VAL V6.1 多AI指挥部</h1>
        <p className="text-gray-400">
          War Room | 全链条高准确率生产级 | 
          WS: <span className={wsStatus === "connected" ? "text-green-400" : "text-gray-500"}>{wsStatus}</span>
        </p>
      </header>

      {/* 输入区 */}
      <div className="flex gap-4 mb-8">
        <input
          className="flex-1 bg-gray-800 border border-gray-700 p-4 rounded text-lg"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="输入需求，召集多AI论证..."
        />
        <button
          onClick={startDebate}
          disabled={loading || !query.trim()}
          className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 px-8 py-4 font-bold rounded"
        >
          {loading ? "论证中..." : "🚀 发起高准确率论证"}
        </button>
        <button
          onClick={connectWebSocket}
          className="bg-purple-600 hover:bg-purple-500 px-4 py-4 rounded"
        >
          🔌 WS
        </button>
      </div>

      {debateData && (
        <div className="space-y-6">
          {/* 置信度状态 */}
          <div className="bg-gray-800 border border-gray-700 p-4 rounded flex justify-between items-center">
            <div>
              <span className="text-gray-400">共识置信度: </span>
              <span className="text-2xl font-bold text-green-400">
                {(debateData.consensus?.confidence * 100).toFixed(1)}%
              </span>
              <span className="text-gray-500 ml-2">(阈值: 95%)</span>
            </div>
            <div className="flex gap-2">
              {debateData.consensus?.passed ? (
                <span className="bg-green-600 px-3 py-1 rounded text-sm">✅ 通过准确率红线</span>
              ) : (
                <span className="bg-red-600 px-3 py-1 rounded text-sm">❌ 未达标</span>
              )}
              <span className="bg-gray-700 px-3 py-1 rounded text-sm">
                任务ID: {taskId}
              </span>
            </div>
          </div>

          {/* 三模型并发展示区 */}
          <div>
            <h2 className="text-xl font-bold mb-4 text-blue-400">三模型并行推理结果</h2>
            <div className="grid grid-cols-3 gap-4">
              {debateData.preview && Object.entries(debateData.preview).map(([role, data]: [string, any]) => (
                <div key={role} className="bg-gray-800 border border-gray-700 rounded h-96 overflow-y-auto">
                  <div className="p-3 border-b border-gray-700 bg-gray-800">
                    <h3 className="font-bold uppercase text-blue-400">{role}</h3>
                    <p className="text-xs text-gray-500">
                      模型: {data.models_used?.join(", ") || "N/A"}
                    </p>
                    <p className="text-xs text-gray-500">
                      成功: {data.successful}/{data.total}
                    </p>
                  </div>
                  <pre className="p-3 text-sm whitespace-pre-wrap text-gray-300">
                    {JSON.stringify(data.opinions, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </div>

          {/* 4AI工作流共识 */}
          <div className="bg-green-900/20 border border-green-600 p-6 rounded">
            <h2 className="text-xl font-bold text-green-400 mb-4">
              ✅ 4AI工作流共识结论
            </h2>
            <pre className="text-sm text-gray-300 mb-4">
              {JSON.stringify(debateData.consensus, null, 2)}
            </pre>
            
            {/* 物理拦截按钮 */}
            {!approved ? (
              <button
                onClick={approveExecution}
                disabled={approving || !debateData.consensus?.passed}
                className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-700 py-4 font-bold rounded text-lg shadow-lg"
              >
                {approving 
                  ? "批准中..." 
                  : debateData.consensus?.passed 
                    ? "🛡️ 方案已阅，立刻批准调用 free-code 物理执行"
                    : "❌ 准确率未达标，禁止执行"
                }
              </button>
            ) : (
              <div className="bg-green-600/30 p-4 rounded text-center">
                <p className="text-green-400 font-bold text-lg">✅ 已批准 - 进入物理执行队列</p>
                <p className="text-gray-400 text-sm mt-2">
                  {debateData.message || "任务已批准，等待物理工具执行"}
                </p>
              </div>
            )}
          </div>

          {/* 原始JSON */}
          <details className="border border-gray-700 rounded">
            <summary className="p-3 cursor-pointer hover:bg-gray-800">查看完整JSON</summary>
            <pre className="p-4 text-xs text-gray-400 overflow-auto max-h-96">
              {JSON.stringify(debateData, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
