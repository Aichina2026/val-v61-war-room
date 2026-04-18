#!/usr/bin/env python3
"""
VAL V6.1 OS - FastAPI Full-Duplex Router Engine
Next.js 15 + React 19 Backend Integration
"""

from fastapi import FastAPI, WebSocket, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import subprocess
import json
import asyncio
import os

# Import native swarm engine
from core.swarm import SwarmDebate

app = FastAPI(
    title="VAL V6.1 OS",
    version="2026-04-17",
    description="Multi-AI High-Accuracy Orchestration System"
)

# CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize swarm engine
swarm = SwarmDebate()

class QueryRequest(BaseModel):
    raw_query: str
    layer: str = "L1_Architecture"

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": "2026-04-17",
        "services": {
            "swarm": "ready",
            "parallel_ai": "mounted",
            "judge": "mounted",
            "zero_error": "mounted"
        }
    }

@app.post("/api/plan")
async def create_plan(query: QueryRequest):
    """
    Trigger L0 & L1 Multi-AI Joint Architecture
    Returns consensus result waiting for user approval
    """
    try:
        result = await swarm.run_parallel_debate(query.layer, query.raw_query)
        return {
            "status": "consensus_reached",
            "opinions": result["opinions"],
            "consensus": result["consensus"],
            "approval_required": True
        }
    except ValueError as e:
        # Confidence below 95%
        raise HTTPException(status_code=422, detail=str(e))
    except RuntimeError as e:
        # System error, auto-healed
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/approve/{task_id}")
async def approve_and_execute(task_id: str):
    """
    User approval endpoint
    Triggers physical execution via free-code tool
    """
    # Execute free-code tool via subprocess
    cmd = ["python", "/app/mcp_tools/free-code/executor.py", "--task", task_id]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        return {
            "status": "executing",
            "task_id": task_id,
            "output": result.stdout if result.returncode == 0 else result.stderr
        }
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=504, detail="Execution timeout")

@app.websocket("/ws/openclaw")
async def openclaw_stream(websocket: WebSocket):
    """
    Real-time streaming of parallel_ai_skill logs to console
    """
    await websocket.accept()
    await websocket.send_text("(SYSTEM) 原生工具已接管，多AI辩论数据流就绪...")
    
    try:
        while True:
            # Listen for client messages
            data = await websocket.receive_text()
            
            # Echo back with system prefix
            await websocket.send_text(f"[OPENCLAW] {data}")
            
    except Exception:
        await websocket.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
