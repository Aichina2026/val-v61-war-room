"""
Production Backend - FastAPI Async Event-driven Engine
Supports multi-agent DAG orchestration with confidence scoring
"""

import asyncio
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import redis.asyncio as redis
import sqlite3
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Models
class TaskRequest(BaseModel):
    """Task request model for DAG execution"""
    task_id: str = Field(..., description="Unique task identifier")
    task_type: str = Field(..., description="Task type: intent, coding, review, test, deploy")
    payload: Dict[str, Any] = Field(..., description="Task payload")
    priority: int = Field(1, description="Task priority (1-10)")
    dependencies: List[str] = Field([], description="Task dependencies")
    confidence_threshold: float = Field(0.95, description="Minimum confidence score required")

class TaskResponse(BaseModel):
    """Task response model"""
    task_id: str
    status: str  # pending, processing, completed, failed
    result: Optional[Dict[str, Any]] = None
    confidence_score: Optional[float] = None
    execution_time: Optional[float] = None
    error_message: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.now)

class AgentMetrics(BaseModel):
    """Agent performance metrics"""
    agent_id: str
    task_count: int
    success_rate: float
    avg_confidence: float
    avg_response_time: float
    last_active: datetime

# Database setup (SQLite WAL mode for RAM < 4000M)
class DatabaseManager:
    def __init__(self, db_path: str = "memory/ai_platform.db"):
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """Initialize SQLite database with WAL mode"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Enable WAL mode for better concurrency
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA synchronous=NORMAL")
        cursor.execute("PRAGMA cache_size=-2000")  # 2MB cache for low RAM
        
        # Create tables
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS tasks (
            task_id TEXT PRIMARY KEY,
            task_type TEXT NOT NULL,
            status TEXT NOT NULL,
            payload TEXT NOT NULL,
            result TEXT,
            confidence_score REAL,
            execution_time REAL,
            error_message TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)
        
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS agent_metrics (
            agent_id TEXT PRIMARY KEY,
            task_count INTEGER DEFAULT 0,
            success_rate REAL DEFAULT 0.0,
            avg_confidence REAL DEFAULT 0.0,
            avg_response_time REAL DEFAULT 0.0,
            last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)
        
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS dag_executions (
            dag_id TEXT PRIMARY KEY,
            tasks TEXT NOT NULL,
            status TEXT NOT NULL,
            start_time TIMESTAMP,
            end_time TIMESTAMP,
            total_confidence REAL
        )
        """)
        
        conn.commit()
        conn.close()
        logger.info(f"Database initialized at {self.db_path} with WAL mode")

# Redis connection pool
redis_pool = None

async def get_redis():
    """Get Redis connection from pool"""
    global redis_pool
    if redis_pool is None:
        redis_pool = redis.ConnectionPool.from_url(
            "redis://localhost:6379", 
            decode_responses=True,
            max_connections=10
        )
    return redis.Redis(connection_pool=redis_pool)

# Lifespan manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan"""
    # Startup
    logger.info("Starting AI Platform Backend...")
    
    # Initialize database
    db_manager = DatabaseManager()
    
    # Initialize Redis
    await get_redis()
    
    yield
    
    # Shutdown
    logger.info("Shutting down AI Platform Backend...")
    if redis_pool:
        await redis_pool.disconnect()

# Create FastAPI app
app = FastAPI(
    title="AI Platform Backend",
    description="Async Event-driven Engine for Multi-Agent DAG Orchestration",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket connections
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
    
    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
    
    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                pass

manager = ConnectionManager()

# Routes
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "status": "online",
        "service": "AI Platform Backend",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    redis_conn = await get_redis()
    try:
        await redis_conn.ping()
        redis_status = "healthy"
    except:
        redis_status = "unhealthy"
    
    return {
        "status": "healthy",
        "components": {
            "api": "healthy",
            "redis": redis_status,
            "database": "healthy"
        },
        "timestamp": datetime.now().isoformat()
    }

@app.post("/tasks", response_model=TaskResponse)
async def create_task(task_request: TaskRequest):
    """Create a new task for DAG execution"""
    logger.info(f"Creating task: {task_request.task_id}")
    
    # Store task in database
    conn = sqlite3.connect("memory/ai_platform.db")
    cursor = conn.cursor()
    
    cursor.execute("""
    INSERT INTO tasks (task_id, task_type, status, payload)
    VALUES (?, ?, ?, ?)
    """, (
        task_request.task_id,
        task_request.task_type,
        "pending",
        json.dumps(task_request.payload)
    ))
    
    conn.commit()
    conn.close()
    
    # Publish task to Redis queue
    redis_conn = await get_redis()
    await redis_conn.publish("task_queue", json.dumps({
        "task_id": task_request.task_id,
        "task_type": task_request.task_type,
        "priority": task_request.priority
    }))
    
    # Broadcast to WebSocket clients
    await manager.broadcast(json.dumps({
        "type": "task_created",
        "task_id": task_request.task_id,
        "task_type": task_request.task_type,
        "timestamp": datetime.now().isoformat()
    }))
    
    return TaskResponse(
        task_id=task_request.task_id,
        status="pending",
        timestamp=datetime.now()
    )

@app.get("/tasks/{task_id}", response_model=TaskResponse)
async def get_task(task_id: str):
    """Get task status and results"""
    conn = sqlite3.connect("memory/ai_platform.db")
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM tasks WHERE task_id = ?", (task_id,))
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return TaskResponse(
        task_id=row[0],
        status=row[2],
        result=json.loads(row[4]) if row[4] else None,
        confidence_score=row[5],
        execution_time=row[6],
        error_message=row[7],
        timestamp=datetime.fromisoformat(row[8])
    )

@app.get("/metrics")
async def get_metrics():
    """Get system and agent metrics"""
    conn = sqlite3.connect("memory/ai_platform.db")
    cursor = conn.cursor()
    
    # Get task statistics
    cursor.execute("""
    SELECT 
        COUNT(*) as total_tasks,
        AVG(confidence_score) as avg_confidence,
        AVG(execution_time) as avg_execution_time,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks
    FROM tasks
    """)
    
    stats = cursor.fetchone()
    
    # Get agent metrics
    cursor.execute("SELECT * FROM agent_metrics")
    agent_rows = cursor.fetchall()
    
    conn.close()
    
    agents = []
    for row in agent_rows:
        agents.append(AgentMetrics(
            agent_id=row[0],
            task_count=row[1],
            success_rate=row[2],
            avg_confidence=row[3],
            avg_response_time=row[4],
            last_active=datetime.fromisoformat(row[5])
        ))
    
    return {
        "system_stats": {
            "total_tasks": stats[0],
            "avg_confidence": stats[1],
            "avg_execution_time": stats[2],
            "completion_rate": stats[3] / stats[0] if stats[0] > 0 else 0
        },
        "agents": agents,
        "timestamp": datetime.now().isoformat()
    }

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time updates"""
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Echo back for now, can be extended for bidirectional communication
            await websocket.send_text(f"Message received: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# Agent endpoints
@app.post("/agents/{agent_id}/task")
async def assign_task_to_agent(agent_id: str, task_request: TaskRequest):
    """Assign a task to a specific agent"""
    logger.info(f"Assigning task {task_request.task_id} to agent {agent_id}")
    
    # Store assignment in Redis
    redis_conn = await get_redis()
    await redis_conn.hset(
        f"agent:{agent_id}:assignments",
        task_request.task_id,
        json.dumps({
            "task_type": task_request.task_type,
            "assigned_at": datetime.now().isoformat(),
            "confidence_threshold": task_request.confidence_threshold
        })
    )
    
    return {
        "status": "assigned",
        "agent_id": agent_id,
        "task_id": task_request.task_id,
        "timestamp": datetime.now().isoformat()
    }

@app.post("/agents/{agent_id}/complete")
async def complete_task(agent_id: str, task_response: TaskResponse):
    """Agent reports task completion"""
    logger.info(f"Agent {agent_id} completed task {task_response.task_id}")
    
    # Update task in database
    conn = sqlite3.connect("memory/ai_platform.db")
    cursor = conn.cursor()
    
    cursor.execute("""
    UPDATE tasks 
    SET status = ?, result = ?, confidence_score = ?, execution_time = ?, error_message = ?, updated_at = ?
    WHERE task_id = ?
    """, (
        task_response.status,
        json.dumps(task_response.result) if task_response.result else None,
        task_response.confidence_score,
        task_response.execution_time,
        task_response.error_message,
        datetime.now().isoformat(),
        task_response.task_id
    ))
    
    # Update agent metrics
    cursor.execute("""
    INSERT OR REPLACE INTO agent_metrics (agent_id, task_count, success_rate, avg_confidence, avg_response_time, last_active)
    VALUES (
        ?,
        COALESCE((SELECT task_count FROM agent_metrics WHERE agent_id = ?), 0) + 1,
        COALESCE((SELECT success_rate FROM agent_metrics WHERE agent_id = ?), 0),
        COALESCE((SELECT avg_confidence FROM agent_metrics WHERE agent_id = ?), 0),
        COALESCE((SELECT avg_response_time FROM agent_metrics WHERE agent_id = ?), 0),
        ?
    )
    """, (agent_id, agent_id, agent_id, agent_id, agent_id, datetime.now().isoformat()))
    
    conn.commit()
    conn.close()
    
    # Remove from Redis assignments
    redis_conn = await get_redis()
    await redis_conn.hdel(f"agent:{agent_id}:assignments", task_response.task_id)
    
    # Broadcast completion
    await manager.broadcast(json.dumps({
        "type": "task_completed",
        "agent_id": agent_id,
        "task_id": task_response.task_id,
        "confidence_score": task_response.confidence_score,
        "status": task_response.status,
        "timestamp": datetime.now().isoformat()
    }))
    
    return {"status": "recorded", "task_id": task_response.task_id}

# DAG execution endpoints
@app.post("/dag/execute")
async def execute_dag(tasks: List[TaskRequest]):
    """Execute a DAG of tasks"""
    dag_id = f"dag_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
    logger.info(f"Executing DAG: {dag_id} with {len(tasks)} tasks")
    
    # Store DAG execution
    conn = sqlite3.connect("memory/ai_platform.db")
    cursor = conn.cursor()
    
    cursor.execute("""
    INSERT INTO dag_executions (dag_id, tasks, status, start_time)
    VALUES (?, ?, ?, ?)
    """, (
        dag_id,
        json.dumps([task.dict() for task in tasks]),
        "running",
        datetime.now().isoformat()
    ))
    
    conn.commit()
    conn.close()
    
    # Create individual tasks
    task_responses = []
    for task in tasks:
        response = await create_task(task)
        task_responses.append(response)
    
    return {
        "dag_id": dag_id,
        "status": "initiated",
        "tasks": len(tasks),
        "task_responses": task_responses,
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )