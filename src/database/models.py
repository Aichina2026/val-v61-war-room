#!/usr/bin/env python3
"""
数据库模型定义
支持PostgreSQL + SQLAlchemy ORM
"""

import uuid
import datetime
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from enum import Enum

# SQLAlchemy imports
try:
    from sqlalchemy import create_engine, Column, String, Integer, Float, Boolean, Text, JSON, DateTime, ForeignKey, Index
    from sqlalchemy.ext.declarative import declarative_base
    from sqlalchemy.orm import sessionmaker, relationship, Session
    from sqlalchemy.dialects.postgresql import UUID, ARRAY
    SQLALCHEMY_AVAILABLE = True
except ImportError:
    SQLALCHEMY_AVAILABLE = False
    # 定义模拟类
    class declarative_base:
        def __init__(self, *args, **kwargs):
            pass
    
    class Column:
        def __init__(self, *args, **kwargs):
            pass
    
    class String:
        pass
    
    class Integer:
        pass
    
    class Float:
        pass
    
    class Boolean:
        pass
    
    class Text:
        pass
    
    class JSON:
        pass
    
    class DateTime:
        pass
    
    class ForeignKey:
        def __init__(self, *args, **kwargs):
            pass
    
    class UUID:
        pass
    
    class ARRAY:
        pass

Base = declarative_base()

class TaskStatus(str, Enum):
    """任务状态枚举"""
    PENDING = "pending"          # 等待处理
    PROCESSING = "processing"    # 处理中
    COMPLETED = "completed"      # 已完成
    FAILED = "failed"            # 失败
    CANCELLED = "cancelled"      # 已取消
    PARTIAL = "partial"          # 部分完成

class ModelDeploymentType(str, Enum):
    """模型部署类型"""
    CLOUD = "cloud"              # 云端部署
    LOCAL = "local"              # 本地部署
    EDGE = "edge"                # 边缘部署
    HYBRID = "hybrid"            # 混合部署

class Task(Base):
    """任务表"""
    __tablename__ = "tasks"
    
    # 主键和标识
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    task_id = Column(String(64), unique=True, nullable=False, index=True)  # 外部任务ID
    external_id = Column(String(128), index=True)  # 外部系统ID
    
    # 任务基本信息
    task_type = Column(String(32), nullable=False, index=True)
    input_text = Column(Text, nullable=False)
    input_files = Column(JSON, default=list)  # JSON数组
    requirements = Column(JSON, default=dict)  # JSON对象
    constraints = Column(JSON, default=dict)   # JSON对象
    
    # 状态信息
    status = Column(String(16), default=TaskStatus.PENDING.value, index=True)
    status_message = Column(Text)
    progress = Column(Float, default=0.0)  # 0.0 - 1.0
    current_step = Column(String(32))
    
    # 模型信息
    model_selected = Column(String(128))
    model_candidates = Column(JSON, default=list)
    
    # 结果信息
    output_text = Column(Text)
    output_files = Column(JSON, default=list)
    error_message = Column(Text)
    metrics = Column(JSON, default=dict)
    
    # 搜索信息
    search_query = Column(Text)
    search_results = Column(JSON, default=dict)
    
    # 时间戳
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    started_at = Column(DateTime)
    completed_at = Column(DateTime, index=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    # 元数据
    user_id = Column(String(64), index=True)
    session_id = Column(String(64), index=True)
    project_id = Column(String(64), index=True)
    tags = Column(JSON, default=list)
    metadata = Column(JSON, default=dict)
    
    # 回调信息
    callback_url = Column(String(512))
    callback_attempts = Column(Integer, default=0)
    callback_last_attempt = Column(DateTime)
    
    # 索引
    __table_args__ = (
        Index('idx_tasks_user_status', 'user_id', 'status'),
        Index('idx_tasks_created_status', 'created_at', 'status'),
        Index('idx_tasks_model_completed', 'model_selected', 'completed_at'),
    )
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典"""
        return {
            "id": str(self.id),
            "task_id": self.task_id,
            "task_type": self.task_type,
            "status": self.status,
            "progress": self.progress,
            "model_selected": self.model_selected,
            "input_text": self.input_text[:100] + "..." if self.input_text and len(self.input_text) > 100 else self.input_text,
            "output_text": self.output_text[:100] + "..." if self.output_text and len(self.output_text) > 100 else self.output_text,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "metrics": self.metrics,
            "user_id": self.user_id,
            "tags": self.tags
        }

class ModelPerformance(Base):
    """模型性能统计表"""
    __tablename__ = "model_performance"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    model_id = Column(String(128), nullable=False, index=True)
    model_name = Column(String(128))
    provider = Column(String(64))
    
    # 性能指标
    total_calls = Column(Integer, default=0)
    successful_calls = Column(Integer, default=0)
    failed_calls = Column(Integer, default=0)
    total_tokens = Column(Integer, default=0)
    total_cost = Column(Float, default=0.0)  # 美元
    
    # 延迟统计
    total_latency_ms = Column(Float, default=0.0)
    min_latency_ms = Column(Float, default=0.0)
    max_latency_ms = Column(Float, default=0.0)
    avg_latency_ms = Column(Float, default=0.0)
    
    # 质量统计
    total_accuracy_score = Column(Float, default=0.0)
    total_quality_score = Column(Float, default=0.0)
    avg_accuracy = Column(Float, default=0.0)
    avg_quality = Column(Float, default=0.0)
    
    # 时间窗口
    time_window = Column(String(16), default="all")  # hour, day, week, month, all
    window_start = Column(DateTime)
    window_end = Column(DateTime)
    
    # 计算指标
    success_rate = Column(Float, default=0.0)
    avg_cost_per_call = Column(Float, default=0.0)
    avg_tokens_per_call = Column(Float, default=0.0)
    
    # 时间戳
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    # 索引
    __table_args__ = (
        Index('idx_model_performance_model_time', 'model_id', 'time_window', 'window_end'),
        Index('idx_model_performance_updated', 'updated_at'),
    )
    
    def update_metrics(self, task_metrics: Dict[str, Any], success: bool = True):
        """更新性能指标"""
        self.total_calls += 1
        
        if success:
            self.successful_calls += 1
        else:
            self.failed_calls += 1
        
        # 更新令牌和成本
        tokens = task_metrics.get("total_tokens", 0)
        cost = task_metrics.get("cost_usd", 0.0)
        latency = task_metrics.get("latency_ms", 0.0)
        accuracy = task_metrics.get("accuracy_score", 0.0)
        quality = task_metrics.get("quality_score", 0.0)
        
        self.total_tokens += tokens
        self.total_cost += cost
        self.total_latency_ms += latency
        self.total_accuracy_score += accuracy
        self.total_quality_score += quality
        
        # 更新最小/最大延迟
        if self.min_latency_ms == 0 or latency < self.min_latency_ms:
            self.min_latency_ms = latency
        if latency > self.max_latency_ms:
            self.max_latency_ms = latency
        
        # 重新计算平均值
        if self.total_calls > 0:
            self.avg_latency_ms = self.total_latency_ms / self.total_calls
            self.avg_accuracy = self.total_accuracy_score / self.total_calls
            self.avg_quality = self.total_quality_score / self.total_calls
            self.success_rate = self.successful_calls / self.total_calls
            self.avg_cost_per_call = self.total_cost / self.total_calls
            self.avg_tokens_per_call = self.total_tokens / self.total_calls
        
        self.updated_at = datetime.datetime.utcnow()

class SystemMetrics(Base):
    """系统指标表"""
    __tablename__ = "system_metrics"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    metric_name = Column(String(64), nullable=False, index=True)
    metric_type = Column(String(32))  # counter, gauge, histogram, summary
    
    # 数值
    value = Column(Float)
    value_int = Column(Integer)
    value_str = Column(String(512))
    value_json = Column(JSON)
    
    # 标签
    labels = Column(JSON, default=dict)
    
    # 时间窗口
    time_window = Column(String(16))
    window_start = Column(DateTime, index=True)
    window_end = Column(DateTime, index=True)
    
    # 时间戳
    collected_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    
    # 索引
    __table_args__ = (
        Index('idx_system_metrics_name_time', 'metric_name', 'window_end'),
        Index('idx_system_metric_labels', 'metric_name', 'labels'),
    )

class UserQuota(Base):
    """用户配额表"""
    __tablename__ = "user_quotas"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String(64), nullable=False, index=True)
    
    # 配额限制
    quota_type = Column(String(32), nullable=False)  # daily_tokens, monthly_cost, concurrent_tasks, etc.
    limit_value = Column(Float, nullable=False)
    current_value = Column(Float, default=0.0)
    reset_period = Column(String(16))  # hour, day, week, month
    
    # 时间信息
    period_start = Column(DateTime, nullable=False)
    period_end = Column(DateTime, nullable=False)
    
    # 状态
    is_active = Column(Boolean, default=True)
    is_exceeded = Column(Boolean, default=False)
    
    # 通知
    warning_threshold = Column(Float, default=0.8)  # 80%
    warning_sent = Column(Boolean, default=False)
    
    # 时间戳
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    # 索引
    __table_args__ = (
        Index('idx_user_quotas_user_type', 'user_id', 'quota_type', 'period_end'),
        Index('idx_user_quotas_exceeded', 'is_exceeded', 'period_end'),
    )

class APIAccessLog(Base):
    """API访问日志表"""
    __tablename__ = "api_access_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # 请求信息
    request_id = Column(String(64), unique=True, index=True)
    method = Column(String(8), nullable=False)
    endpoint = Column(String(256), nullable=False)
    path = Column(String(512))
    query_params = Column(JSON)
    
    # 用户信息
    user_id = Column(String(64), index=True)
    api_key_id = Column(String(64), index=True)
    ip_address = Column(String(45))  # IPv6支持
    user_agent = Column(String(512))
    
    # 请求详情
    request_body_size = Column(Integer)  # 字节
    request_headers = Column(JSON)
    
    # 响应信息
    status_code = Column(Integer, index=True)
    response_body_size = Column(Integer)
    response_time_ms = Column(Float)
    
    # 错误信息
    error_code = Column(String(32))
    error_message = Column(Text)
    
    # 时间戳
    requested_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    responded_at = Column(DateTime)
    
    # 索引
    __table_args__ = (
        Index('idx_access_logs_user_time', 'user_id', 'requested_at'),
        Index('idx_access_logs_endpoint_time', 'endpoint', 'requested_at'),
        Index('idx_access_logs_status_time', 'status_code', 'requested_at'),
    )

class ModelCache(Base):
    """模型缓存表"""
    __tablename__ = "model_cache"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # 缓存键
    cache_key = Column(String(512), nullable=False, unique=True, index=True)
    cache_type = Column(String(32))  # model_response, embedding, search_result
    
    # 缓存内容
    cache_value = Column(JSON, nullable=False)
    cache_value_hash = Column(String(64), index=True)
    
    # 元数据
    model_id = Column(String(128), index=True)
    task_type = Column(String(32), index=True)
    input_hash = Column(String(64), index=True)
    
    # 过期控制
    ttl_seconds = Column(Integer)  # 生存时间（秒）
    expires_at = Column(DateTime, index=True)
    
    # 使用统计
    hit_count = Column(Integer, default=0)
    last_accessed = Column(DateTime)
    
    # 时间戳
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    # 索引
    __table_args__ = (
        Index('idx_model_cache_expires', 'expires_at'),
        Index('idx_model_cache_input', 'model_id', 'input_hash'),
    )

class DatabaseManager:
    """数据库管理器"""
    
    def __init__(self, database_url: str = None):
        """
        初始化数据库管理器
        
        Args:
            database_url: 数据库连接URL，例如：
                postgresql://user:password@localhost:5432/dbname
        """
        if not SQLALCHEMY_AVAILABLE:
            raise ImportError("SQLAlchemy未安装，请运行: pip install sqlalchemy psycopg2-binary")
        
        self.database_url = database_url or "postgresql://ai_user:ai_password@localhost:5432/ai_orchestrator"
        self.engine = create_engine(
            self.database_url,
            pool_size=20,
            max_overflow=10,
            pool_pre_ping=True,
            pool_recycle=3600,  # 1小时
            echo=False  # 设置为True可查看SQL日志
        )
        
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        
    def init_database(self, drop_existing: bool = False):
        """初始化数据库（创建表）"""
        if drop_existing:
            Base.metadata.drop_all(bind=self.engine)
        
        Base.metadata.create_all(bind=self.engine)
        print(f"✅ 数据库初始化完成: {self.database_url}")
    
    def get_session(self) -> Session:
        """获取数据库会话"""
        return self.SessionLocal()
    
    def close_session(self, session: Session):
        """关闭数据库会话"""
        session.close()
    
    async def save_task(self, task_data: Dict[str, Any]) -> str:
        """保存任务到数据库"""
        from sqlalchemy.exc import IntegrityError
        
        session = self.get_session()
        try:
            # 创建任务记录
            task = Task(
                task_id=task_data.get("task_id", str(uuid.uuid4())),
                task_type=task_data.get("task_type", "unknown"),
                input_text=task_data.get("input_text", ""),
                input_files=task_data.get("input_files", []),
                requirements=task_data.get("requirements", {}),
                constraints=task_data.get("constraints", {}),
                status=task_data.get("status", TaskStatus.PENDING.value),
                user_id=task_data.get("user_id"),
                session_id=task_data.get("session_id"),
                project_id=task_data.get("project_id"),
                tags=task_data.get("tags", []),
                metadata=task_data.get("metadata", {}),
                callback_url=task_data.get("callback_url")
            )
            
            session.add(task)
            session.commit()
            session.refresh(task)
            
            return str(task.id)
            
        except IntegrityError as e:
            session.rollback()
            # 如果是任务ID冲突，尝试使用现有记录
            if "task_id" in str(e).lower():
                existing_task = session.query(Task).filter_by(task_id=task_data["task_id"]).first()
                if existing_task:
                    return str(existing_task.id)
            raise e
        finally:
            session.close()
    
    async def update_task_status(self, task_id: str, status: TaskStatus, 
                               progress: float = None, model_selected: str = None,
                               metrics: Dict[str, Any] = None, output_text: str = None,
                               error_message: str = None):
        """更新任务状态"""
        session = self.get_session()
        try:
            task = session.query(Task).filter_by(task_id=task_id).first()
            if not task:
                raise ValueError(f"任务不存在: {task_id}")
            
            task.status = status.value
            task.updated_at = datetime.datetime.utcnow()
            
            if progress is not None:
                task.progress = progress
            
            if model_selected is not None:
                task.model_selected = model_selected
            
            if metrics is not None:
                task.metrics = metrics
            
            if output_text is not None:
                task.output_text = output_text
            
            if error_message is not None:
                task.error_message = error_message
            
            # 更新开始和完成时间
            if status == TaskStatus.PROCESSING and not task.started_at:
                task.started_at = datetime.datetime.utcnow()
            elif status in [TaskStatus.COMPLETED, TaskStatus.FAILED, TaskStatus.CANCELLED]:
                if not task.completed_at:
                    task.completed_at = datetime.datetime.utcnow()
            
            session.commit()
            
        finally:
            session.close()
    
    async def get_task(self, task_id: str) -> Optional[Dict[str, Any]]:
        """获取任务信息"""
        session = self.get_session()
        try:
            task = session.query(Task).filter_by(task_id=task_id).first()
            if not task:
                return None
            
            return {
                "id": str(task.id),
                "task_id": task.task_id,
                "task_type": task.task_type,
                "status": task.status,
                "progress": task.progress,
                "model_selected": task.model_selected,
                "input_text": task.input_text,
                "output_text": task.output_text,
                "error_message": task.error_message,
                "metrics": task.metrics,
                "created_at": task.created_at.isoformat() if task.created_at else None,
                "started_at": task.started_at.isoformat() if task.started_at else None,
                "completed_at": task.completed_at.isoformat() if task.completed_at else None,
                "user_id": task.user_id,
                "tags": task.tags,
                "metadata": task.metadata
            }
        finally:
            session.close()
    
    async def update_model_performance(self, model_id: str, task_metrics: Dict[str, Any], 
                                     success: bool = True, time_window: str = "all"):
        """更新模型性能统计"""
        session = self.get_session()
        try:
            # 查找或创建性能记录
            performance = session.query(ModelPerformance).filter_by(
                model_id=model_id, 
                time_window=time_window
            ).first()
            
            if not performance:
                performance = ModelPerformance(
                    model_id=model_id,
                    model_name=model_id.split("-")[0] if "-" in model_id else model_id,
                    time_window=time_window,
                    window_start=datetime.datetime.utcnow(),
                    window_end=None
                )
                session.add(performance)
            
            # 更新指标
            performance.update_metrics(task_metrics, success)
            
            session.commit()
            
        finally:
            session.close()
    
    async def get_model_stats(self, model_id: str, time_window: str = "all") -> Optional[Dict[str, Any]]:
        """获取模型统计信息"""
        session = self.get_session()
        try:
            stats = session.query(ModelPerformance).filter_by(
                model_id=model_id, 
                time_window=time_window
            ).first()
            
            if not stats:
                return None
            
            return {
                "model_id": stats.model_id,
                "model_name": stats.model_name,
                "total_calls": stats.total_calls,
                "successful_calls": stats.successful_calls,
                "failed_calls": stats.failed_calls,
                "success_rate": stats.success_rate,
                "total_tokens": stats.total_tokens,
                "avg_tokens_per_call": stats.avg_tokens_per_call,
                "total_cost": stats.total_cost,
                "avg_cost_per_call": stats.avg_cost_per_call,
                "avg_latency_ms": stats.avg_latency_ms,
                "min_latency_ms": stats.min_latency_ms,
                "max_latency_ms": stats.max_latency_ms,
                "avg_accuracy": stats.avg_accuracy,
                "avg_quality": stats.avg_quality,
                "updated_at": stats.updated_at.isoformat() if stats.updated_at else None
            }
        finally:
            session.close()
    
    async def log_api_access(self, log_data: Dict[str, Any]):
        """记录API访问日志"""
        session = self.get_session()
        try:
            log = APIAccessLog(
                request_id=log_data.get("request_id", str(uuid.uuid4())),
                method=log_data.get("method", "GET"),
                endpoint=log_data.get("endpoint", ""),
                path=log_data.get("path", ""),
                query_params=log_data.get("query_params", {}),
                user_id=log_data.get("user_id"),
                api_key_id=log_data.get("api_key_id"),
                ip_address=log_data.get("ip_address"),
                user_agent=log_data.get("user_agent", ""),
                request_body_size=log_data.get("request_body_size", 0),
                request_headers=log_data.get("request_headers", {}),
                status_code=log_data.get("status_code", 200),
                response_body_size=log_data.get("response_body_size", 0),
                response_time_ms=log_data.get("response_time_ms", 0.0),
                error_code=log_data.get("error_code"),
                error_message=log_data.get("error_message"),
                requested_at=log_data.get("requested_at", datetime.datetime.utcnow()),
                responded_at=log_data.get("responded_at")
            )
            
            session.add(log)
            session.commit()
            
        finally:
            session.close()

# 测试函数
def test_database_models():
    """测试数据库模型"""
    print("测试数据库模型...")
    
    # 创建内存数据库进行测试
    test_db_url = "sqlite:///:memory:"
    db_manager = DatabaseManager(test_db_url)
    
    try:
        # 初始化数据库
        db_manager.init_database()
        print("✅ 数据库初始化成功")
        
        # 测试任务保存
        import asyncio
        
        async def test_save_task():
            task_data = {
                "task_id": "test_task_001",
                "task_type": "text_generation",
                "input_text": "测试数据库集成",
                "user_id": "user_123",
                "tags": ["test", "database"]
            }
            
            task_id = await db_manager.save_task(task_data)
            print(f"✅ 任务保存成功: {task_id}")
            
            # 测试任务查询
            task = await db_manager.get_task("test_task_001")
            if task:
                print(f"✅ 任务查询成功: {task['task_id']} - {task['status']}")
            else:
                print("❌ 任务查询失败")
            
            # 测试状态更新
            await db_manager.update_task_status(
                task_id="test_task_001",
                status=TaskStatus.PROCESSING,
                progress=0.5,
                model_selected="test-model-1"
            )
            print("✅ 任务状态更新成功")
            
            # 测试模型性能更新
            metrics = {
                "total_tokens": 1500,
                "cost_usd": 0.018,
                "latency_ms": 1234,
                "accuracy_score": 0.92,
                "quality_score": 0.88
            }
            await db_manager.update_model_performance("test-model-1", metrics, success=True)
            print("✅ 模型性能更新成功")
            
            # 测试模型统计查询
            stats = await db_manager.get_model_stats("test-model-1")
            if stats:
                print(f"✅ 模型统计查询成功: {stats['model_id']} - {stats['total_calls']}次调用")
            else:
                print("❌ 模型统计查询失败")
        
        asyncio.run(test_save_task())
        
        print("🎉 所有数据库测试通过!")
        
    except Exception as e:
        print(f"❌ 数据库测试失败: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_database_models()