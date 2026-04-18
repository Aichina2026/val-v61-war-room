#!/usr/bin/env python3
"""
VAL V6.2 OS - Flexible FastAPI Router
可配置化多AI高准确率编排系统
"""

from fastapi import FastAPI, WebSocket, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
import subprocess
import json
import asyncio
import os
import sys

# 添加core目录到路径
sys.path.insert(0, os.path.dirname(__file__))
from core.flexible_engine import FlexibleDebateEngine, create_config, DebateConfig

app = FastAPI(
    title="VAL V6.2 OS - Flexible",
    version="2026-04-18",
    description="Configurable Multi-AI High-Accuracy Orchestration"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 请求模型
class DebateRequest(BaseModel):
    prompt: str = Field(..., description="Input prompt for debate")
    mode: str = Field("standard", description="Debate mode: minimal, standard, deep, custom")
    roles: Optional[List[str]] = Field(None, description="Custom roles (for custom mode)")
    rounds: Optional[int] = Field(None, description="Number of debate rounds")
    models: Optional[Dict[str, str]] = Field(None, description="Role to model mapping")
    enable_search: bool = Field(False, description="Enable search enhancement")

class HealthResponse(BaseModel):
    status: str
    version: str
    available_nodes: List[str]
    available_models: int

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """健康检查"""
    # 检查可用节点
    nodes = ["4SAPI"]  # 默认至少4SAPI可用
    if os.getenv("ALIYUN_KEY"):
        nodes.append("Aliyun")
    if os.getenv("MOONSHOT_KEY"):
        nodes.append("Moonshot")
    
    return {
        "status": "healthy",
        "version": "2026-04-18-V6.2",
        "available_nodes": nodes,
        "available_models": 15
    }

@app.get("/api/config/options")
async def get_config_options():
    """获取所有配置选项"""
    return {
        "modes": ["minimal", "standard", "deep", "custom"],
        "roles": [
            {"id": "clarifier", "name": "Clarifier", "description": "需求分析专家", "models": ["glm-5.1", "gemini-2.5-pro"]},
            {"id": "builder", "name": "Builder", "description": "系统架构师", "models": ["gpt-5.3-codex-xhigh", "deepseek-v3.2", "qwen-coder-plus"]},
            {"id": "reviewer", "name": "Reviewer", "description": "安全审计专家", "models": ["claude-opus-4-6", "claude-opus-4-7", "kimi-k2.5"]},
            {"id": "arbiter", "name": "Arbiter", "description": "终极仲裁官", "models": ["gpt-5.4", "gpt-5.4-xhigh", "qwen-max"]},
        ],
        "nodes": [
            {"id": "4SAPI", "name": "4SAPI", "status": "available", "models": 12},
            {"id": "Aliyun", "name": "阿里百炼", "status": "available" if os.getenv("ALIYUN_KEY") else "needs_key", "models": 4},
            {"id": "Moonshot", "name": "Moonshot", "status": "available" if os.getenv("MOONSHOT_KEY") else "needs_key", "models": 2},
        ],
        "max_rounds": 5,
        "confidence_thresholds": {
            "minimal": 0.90,
            "standard": 0.95,
            "deep": 0.97,
            "custom": 0.95
        }
    }

@app.post("/api/debate")
async def run_debate(request: DebateRequest):
    """
    运行可配置化多AI辩论
    """
    try:
        # 创建配置
        config = create_config(
            mode=request.mode,
            custom_roles=request.roles,
            custom_models=request.models,
            rounds=request.rounds,
            enable_search=request.enable_search
        )
        
        # 更新自定义模型映射
        if request.models:
            config.models.update(request.models)
        
        # 创建引擎并运行
        engine = FlexibleDebateEngine(config)
        result = await engine.run_debate(request.prompt)
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/debate/legacy")
async def run_legacy_debate(query: dict):
    """
    兼容旧版API (V6.1)
    """
    try:
        config = create_config(mode="standard", enable_search=False)
        engine = FlexibleDebateEngine(config)
        result = await engine.run_debate(query.get("raw_query", ""))
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.websocket("/ws/debate")
async def debate_stream(websocket: WebSocket):
    """
    WebSocket 实时辩论流
    """
    await websocket.accept()
    await websocket.send_text("(SYSTEM) VAL V6.2 Flexible Debate Stream Ready")
    
    try:
        while True:
            data = await websocket.receive_json()
            
            config = create_config(
                mode=data.get("mode", "standard"),
                rounds=data.get("rounds", 1),
                enable_search=data.get("enable_search", False)
            )
            
            engine = FlexibleDebateEngine(config)
            
            # 逐轮发送结果
            enhanced_prompt = await engine.search_and_contextualize(data.get("prompt", ""))
            if enhanced_prompt != data.get("prompt", ""):
                await websocket.send_json({
                    "type": "search_enhanced",
                    "prompt": enhanced_prompt[:200] + "..."
                })
            
            for round_num in range(1, config.rounds + 1):
                round_result = await engine.run_round(round_num, enhanced_prompt)
                await websocket.send_json({
                    "type": "round_complete",
                    "round": round_num,
                    "result": round_result
                })
            
            # 最终共识
            consensus = engine.calculate_consensus(engine.context_history)
            await websocket.send_json({
                "type": "consensus",
                "consensus": consensus
            })
            
    except Exception as e:
        await websocket.send_json({"type": "error", "message": str(e)})
        await websocket.close()

@app.post("/api/search")
async def search_knowledge(query: dict):
    """
    搜索知识 (Google标准格式)
    """
    try:
        cmd = [
            "python",
            "/app/mcp_tools/search_knowledge/main.py",
            "--query", query.get("q", ""),
            "--max_results", str(query.get("max_results", 5)),
            "--format", "google"
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
        
        if result.returncode == 0:
            return json.loads(result.stdout)
        else:
            raise HTTPException(status_code=500, detail=result.stderr)
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
