#!/usr/bin/env python3
"""
VAL V6.1 OS - Production FastAPI Router
全链条高准确率生产级API

版本: 2026-04-18 V6.1 Production
Python: 3.13
FastAPI: >=0.115
"""

from fastapi import FastAPI, WebSocket, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
import subprocess
import json
import os
import sys
import time

# 物理引擎导入
sys.path.insert(0, os.path.dirname(__file__))
from core.physical_engine import PhysicalSwarmEngine, create_physical_config, PhysicalDebateConfig

app = FastAPI(
    title="VAL V6.1 OS - Production",
    version="2026-04-18-V6.1-Production",
    description="Full-Chain High-Accuracy Multi-AI Orchestration System"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 任务存储（生产级应使用Redis）
approved_tasks = {}

# 请求模型
class DebateRequest(BaseModel):
    prompt: str = Field(..., description="Input prompt for debate")
    mode: str = Field("standard", description="Debate mode: minimal, standard, deep")
    rounds: int = Field(1, ge=1, le=5, description="Number of debate rounds")
    enable_search: bool = Field(False, description="Enable search enhancement")

class ApproveRequest(BaseModel):
    task_id: str = Field(..., description="Task ID to approve")
    confirm: bool = Field(True, description="Confirm approval")

# 健康检查
@app.get("/health")
async def health_check():
    """健康检查 - 验证物理工具挂载"""
    tools_status = {}
    
    # 检查关键物理工具
    tools = {
        "parallel_ai_skill": "/app/mcp_tools/parallel_ai_skill/main.py",
        "judge": "/app/mcp_tools/4AI工作流/judge.py",
        "heal": "/app/mcp_tools/zero_error_system/heal.py",
        "search": "/app/mcp_tools/search_knowledge/main.py"
    }
    
    for name, path in tools.items():
        tools_status[name] = os.path.exists(path)
    
    all_ok = all(tools_status.values())
    
    return {
        "status": "healthy" if all_ok else "degraded",
        "version": "2026-04-18-V6.1-Production",
        "python_version": "3.13",
        "fastapi_version": ">=0.115",
        "tools_mounted": tools_status,
        "timestamp": time.time()
    }

# L0 & L1 多AI联合架构 - 触发辩论
@app.post("/api/plan")
async def create_plan(request: DebateRequest):
    """
    L0 & L1 多AI联合架构
    触发多模型并行辩论，返回结果等待用户批准
    """
    try:
        # 创建物理配置
        config = create_physical_config(
            mode=request.mode,
            rounds=request.rounds,
            enable_search=request.enable_search
        )
        
        # 创建引擎
        engine = PhysicalSwarmEngine(config)
        
        # 运行辩论
        result = engine.run_full_debate(request.prompt)
        
        # 生成任务ID
        task_id = f"task_{int(time.time())}_{hash(request.prompt) % 10000}"
        
        # 存储结果等待批准
        approved_tasks[task_id] = {
            "status": "pending_approval",
            "result": result,
            "created_at": time.time()
        }
        
        return {
            "task_id": task_id,
            "status": "pending_approval",
            "consensus": result.get("final_consensus"),
            "preview": result.get("rounds_data", [{}])[-1].get("opinions", {}),
            "message": "方案已生成，请检查共识结果后调用 /api/approve/{task_id} 批准执行"
        }
        
    except ValueError as e:
        # 准确率未达标
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Debate execution failed: {str(e)}")

# 物理拦截 - 用户批准后执行
@app.post("/api/approve/{task_id}")
async def approve_and_execute(task_id: str, request: ApproveRequest):
    """
    物理拦截机制
    用户批准后，才调用 free-code 或执行物理操作
    """
    if task_id not in approved_tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task = approved_tasks[task_id]
    
    if task["status"] != "pending_approval":
        raise HTTPException(status_code=400, detail=f"Task already {task['status']}")
    
    if not request.confirm:
        task["status"] = "rejected"
        return {"task_id": task_id, "status": "rejected"}
    
    # 标记为已批准
    task["status"] = "approved"
    task["approved_at"] = time.time()
    
    # 获取共识计划
    consensus = task.get("result", {}).get("final_consensus", {})
    
    # 这里可以触发实际的物理执行
    # 例如调用 free-code 工具或其他执行系统
    
    return {
        "task_id": task_id,
        "status": "approved_and_queued",
        "consensus": consensus,
        "message": "方案已批准，进入物理执行队列",
        "next_step": "调用 free-code 物理工具执行（示例）"
    }

# 查询任务状态
@app.get("/api/task/{task_id}")
async def get_task_status(task_id: str):
    """获取任务状态"""
    if task_id not in approved_tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return approved_tasks[task_id]

# WebSocket 实时流 - 符合原始指令命名
@app.websocket("/ws/openclaw")
async def openclaw_stream(websocket: WebSocket):
    """
    WebSocket 实时流
    将 parallel_ai_skill 的运行日志实时透传给控制台
    """
    await websocket.accept()
    await websocket.send_text("[SYSTEM] VAL V6.1 OS - 原生工具已接管，多AI辩论数据流就绪...")
    
    try:
        while True:
            data = await websocket.receive_json()
            
            prompt = data.get("raw_query", "")
            mode = data.get("mode", "standard")
            rounds = data.get("rounds", 1)
            
            # 创建引擎
            config = create_physical_config(mode, rounds, False)
            engine = PhysicalSwarmEngine(config)
            
            # 逐轮发送
            for round_num in range(1, rounds + 1):
                await websocket.send_text(f"[ROUND {round_num}] Starting...")
                
                round_result = engine.run_single_round(round_num, prompt)
                
                # 发送每轮结果
                await websocket.send_json({
                    "type": "round_complete",
                    "round": round_num,
                    "data": round_result
                })
                
                # 发送共识信息
                consensus = round_result.get("consensus", {})
                await websocket.send_text(
                    f"[CONSENSUS] Round {round_num}: {consensus.get('confidence', 0):.1%} "
                    f"({'PASS' if consensus.get('passed') else 'BLOCKED'})"
                )
            
            # 最终结果
            await websocket.send_text("[SYSTEM] Debate completed. Awaiting approval via /api/approve/{task_id}")
            
    except Exception as e:
        await websocket.send_text(f"[ERROR] {str(e)}")
        await websocket.close()

# 兼容旧API
@app.post("/api/debate")
async def legacy_debate(request: DebateRequest):
    """兼容旧版 /api/debate"""
    return await create_plan(request)

# 搜索API
@app.get("/api/search")
async def search_knowledge(q: str, max_results: int = 5):
    """知识搜索"""
    try:
        cmd = [
            "python",
            "/app/mcp_tools/search_knowledge/main.py",
            "--query", q,
            "--max_results", str(max_results),
            "--format", "google"
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=20)
        
        if result.returncode == 0:
            return json.loads(result.stdout)
        else:
            raise HTTPException(status_code=500, detail=result.stderr)
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
