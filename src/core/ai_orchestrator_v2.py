#!/usr/bin/env python3
"""
AI编排器增强版 - 集成数据库和缓存
2026年4月最新架构设计
"""

import json
import time
import logging
import asyncio
import uuid
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, field
from enum import Enum
import numpy as np
from datetime import datetime

# 导入数据库和缓存模块
try:
    from database.models import DatabaseManager, TaskStatus
    from database.cache_manager import CacheManager, ModelResponseCache, SearchResultCache
    DB_AVAILABLE = True
except ImportError:
    DB_AVAILABLE = False
    print("警告: 数据库模块未导入，使用内存模式")

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TaskType(Enum):
    """任务类型枚举"""
    TEXT_GENERATION = "text_generation"
    CODE_GENERATION = "code_generation"
    MATH_REASONING = "math_reasoning"
    VISION_UNDERSTANDING = "vision_understanding"
    SPEECH_RECOGNITION = "speech_recognition"
    IMAGE_GENERATION = "image_generation"
    DATA_ANALYSIS = "data_analysis"
    SEARCH_QUERY = "search_query"
    MULTIMODAL = "multimodal"

class ModelCapability(Enum):
    """模型能力枚举"""
    LONG_CONTEXT = "long_context"  # 长上下文处理
    REASONING = "reasoning"  # 复杂推理
    CODING = "coding"  # 代码生成
    MATH = "math"  # 数学计算
    VISION = "vision"  # 视觉理解
    SPEECH = "speech"  # 语音处理
    MULTILINGUAL = "multilingual"  # 多语言
    LOW_LATENCY = "low_latency"  # 低延迟
    LOW_COST = "low_cost"  # 低成本

@dataclass
class AIModel:
    """AI模型定义"""
    name: str
    provider: str
    model_id: str
    capabilities: List[ModelCapability]
    max_tokens: int
    context_window: int
    cost_per_1k_tokens: float  # 美元/千token
    latency_ms: float  # 毫秒延迟
    accuracy_score: float  # 准确率评分 (0-1)
    availability: float  # 可用性 (0-1)
    deployment_type: str  # cloud, local, edge
    
    # 性能指标
    total_calls: int = 0
    total_tokens: int = 0
    success_rate: float = 1.0
    avg_latency: float = 0.0

@dataclass
class TaskRequest:
    """任务请求"""
    task_id: str
    task_type: TaskType
    input_text: str
    input_files: List[str] = field(default_factory=list)
    requirements: Dict[str, Any] = field(default_factory=dict)
    constraints: Dict[str, Any] = field(default_factory=lambda: {
        "max_tokens": 4000,
        "max_latency_ms": 5000,
        "max_cost_usd": 0.1,
        "min_accuracy": 0.8
    })
    user_id: str = None
    session_id: str = None
    project_id: str = None
    tags: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)
    callback_url: str = None

@dataclass
class TaskResult:
    """任务结果"""
    task_id: str
    model_used: str
    output_text: str
    output_files: List[str] = field(default_factory=list)
    metrics: Dict[str, Any] = field(default_factory=lambda: {
        "total_tokens": 0,
        "latency_ms": 0,
        "cost_usd": 0,
        "accuracy_score": 0,
        "quality_score": 0
    })
    status: str = "success"  # success, partial, failed
    error_message: str = ""

class EnhancedAISystemOrchestrator:
    """增强版AI系统编排器 - 集成数据库和缓存"""
    
    def __init__(self, database_url: str = None, redis_url: str = None):
        """
        初始化编排器
        
        Args:
            database_url: PostgreSQL数据库URL
            redis_url: Redis连接URL
        """
        # 初始化数据库
        self.db_manager = None
        if DB_AVAILABLE and database_url:
            try:
                self.db_manager = DatabaseManager(database_url)
                logger.info("数据库管理器初始化成功")
            except Exception as e:
                logger.error(f"数据库管理器初始化失败: {e}")
        
        # 初始化缓存
        self.cache_manager = None
        self.model_cache = None
        self.search_cache = None
        
        if redis_url:
            try:
                from database.cache_manager import CacheManager, ModelResponseCache, SearchResultCache
                self.cache_manager = CacheManager()
                self.model_cache = ModelResponseCache(self.cache_manager)
                self.search_cache = SearchResultCache(self.cache_manager)
                logger.info("缓存管理器初始化成功")
            except Exception as e:
                logger.error(f"缓存管理器初始化失败: {e}")
        
        # 初始化核心组件
        self.registry = ModelRegistry()
        self.router = ModelRouter(self.registry)
        self.search = EnhancedSearch()
        self.monitor = SystemMonitor()
        
        # 性能统计
        self.performance_stats = {
            "total_requests": 0,
            "cache_hits": 0,
            "db_operations": 0
        }
        
        logger.info("增强版AI系统编排器初始化完成")
    
    async def process_request(self, request: TaskRequest) -> TaskResult:
        """处理任务请求 - 增强版，集成数据库和缓存"""
        start_time = time.time()
        task_id = request.task_id or f"task_{uuid.uuid4().hex[:8]}"
        
        try:
            # 0. 保存任务到数据库
            if self.db_manager:
                await self._save_task_to_db(request)
                self.performance_stats["db_operations"] += 1
            
            # 1. 检查缓存
            cached_result = await self._check_cache(request)
            if cached_result:
                self.performance_stats["cache_hits"] += 1
                logger.info(f"任务 {task_id} 使用缓存结果")
                return cached_result
            
            # 2. 更新任务状态为处理中
            if self.db_manager:
                await self.db_manager.update_task_status(
                    task_id=task_id,
                    status=TaskStatus.PROCESSING,
                    progress=0.1
                )
            
            # 3. 意图识别
            task_type = await self.identify_intent(request)
            request.task_type = task_type
            
            # 4. 增强搜索（如果需要）
            search_context = {}
            if self.needs_search(request):
                # 检查搜索缓存
                cached_search = await self._check_search_cache(request)
                if cached_search:
                    search_context = {"search_results": cached_search}
                    logger.info(f"任务 {task_id} 使用缓存搜索")
                else:
                    search_results = await self.search.search(request.input_text, {})
                    search_context = {"search_results": search_results}
                    
                    # 缓存搜索结果
                    if self.search_cache:
                        await self.search_cache.cache_results(
                            query=request.input_text,
                            results=search_results,
                            ttl=300  # 5分钟
                        )
            
            # 5. 模型路由
            selected_model = self.router.select_model(request)
            
            if not selected_model:
                result = TaskResult(
                    task_id=task_id,
                    model_used="none",
                    output_text="无法找到合适的模型处理此请求",
                    status="failed",
                    error_message="No suitable model available"
                )
                
                if self.db_manager:
                    await self.db_manager.update_task_status(
                        task_id=task_id,
                        status=TaskStatus.FAILED,
                        error_message=result.error_message
                    )
                
                return result
            
            # 6. 更新任务进度
            if self.db_manager:
                await self.db_manager.update_task_status(
                    task_id=task_id,
                    status=TaskStatus.PROCESSING,
                    progress=0.5,
                    model_selected=selected_model.model_id
                )
            
            # 7. 执行模型调用
            model_output = await self.call_model(selected_model, request, search_context)
            
            # 8. 结果评估
            evaluation = self.evaluate_result(model_output, request)
            
            # 9. 更新模型性能统计
            self.update_model_stats(selected_model, evaluation)
            
            # 10. 生成最终结果
            latency_ms = (time.time() - start_time) * 1000
            estimated_tokens = len(model_output) // 4
            
            result = TaskResult(
                task_id=task_id,
                model_used=selected_model.model_id,
                output_text=model_output,
                metrics={
                    "total_tokens": estimated_tokens,
                    "latency_ms": latency_ms,
                    "cost_usd": selected_model.cost_per_1k_tokens * (estimated_tokens / 1000),
                    "accuracy_score": evaluation.get("accuracy", 0.8),
                    "quality_score": evaluation.get("quality", 0.8),
                    "search_used": bool(search_context),
                    "cache_hit": cached_result is not None
                }
            )
            
            # 11. 缓存结果
            await self._cache_result(request, selected_model, result)
            
            # 12. 更新数据库
            if self.db_manager:
                await self.db_manager.update_task_status(
                    task_id=task_id,
                    status=TaskStatus.COMPLETED,
                    progress=1.0,
                    output_text=result.output_text,
                    metrics=result.metrics
                )
                
                # 更新模型性能到数据库
                await self.db_manager.update_model_performance(
                    model_id=selected_model.model_id,
                    task_metrics=result.metrics,
                    success=(result.status == "success")
                )
            
            # 13. 监控记录
            self.monitor.record_request(request, result, selected_model)
            
            # 14. 更新性能统计
            self.performance_stats["total_requests"] += 1
            
            logger.info(f"任务 {task_id} 处理完成 - 延迟: {latency_ms:.0f}ms, 成本: ${result.metrics['cost_usd']:.4f}")
            
            return result
            
        except Exception as e:
            logger.error(f"处理请求失败: {e}", exc_info=True)
            
            error_result = TaskResult(
                task_id=task_id,
                model_used="error",
                output_text=f"处理请求时发生错误: {str(e)}",
                status="failed",
                error_message=str(e)
            )
            
            if self.db_manager:
                await self.db_manager.update_task_status(
                    task_id=task_id,
                    status=TaskStatus.FAILED,
                    error_message=str(e)
                )
            
            return error_result
    
    async def _save_task_to_db(self, request: TaskRequest):
        """保存任务到数据库"""
        task_data = {
            "task_id": request.task_id,
            "task_type": request.task_type.value,
            "input_text": request.input_text,
            "input_files": request.input_files,
            "requirements": request.requirements,
            "constraints": request.constraints,
            "user_id": request.user_id,
            "session_id": request.session_id,
            "project_id": request.project_id,
            "tags": request.tags,
            "metadata": request.metadata,
            "callback_url": request.callback_url,
            "status": TaskStatus.PENDING.value
        }
        
        await self.db_manager.save_task(task_data)
    
    async def _check_cache(self, request: TaskRequest) -> Optional[TaskResult]:
        """检查缓存"""
        if not self.model_cache:
            return None
        
        # 检查模型响应缓存
        for model in self.registry.models.values():
            cached_response = await self.model_cache.get_response(
                model_id=model.model_id,
                input_text=request.input_text,
                parameters=request.requirements
            )
            
            if cached_response:
                # 验证缓存是否满足约束条件
                if self._check_cache_constraints(cached_response, request.constraints):
                    return TaskResult(
                        task_id=request.task_id,
                        model_used=model.model_id,
                        output_text=cached_response.get("answer", ""),
                        metrics={
                            "total_tokens": cached_response.get("tokens", 0),
                            "latency_ms": 10,  # 缓存读取延迟
                            "cost_usd": 0.0001,  # 缓存成本极低
                            "accuracy_score": cached_response.get("confidence", 0.8),
                            "quality_score": cached_response.get("quality", 0.8),
                            "cache_hit": True
                        },
                        status="success"
                    )
        
        return None
    
    async def _check_search_cache(self, request: TaskRequest) -> Optional[Dict[str, Any]]:
        """检查搜索缓存"""
        if not self.search_cache:
            return None
        
        return await self.search_cache.get_results(
            query=request.input_text,
            sources=request.requirements.get("sources"),
            filters=request.requirements.get("filters")
        )
    
    async def _cache_result(self, request: TaskRequest, model: AIModel, result: TaskResult):
        """缓存结果"""
        if not self.model_cache:
            return
        
        cache_data = {
            "answer": result.output_text,
            "tokens": result.metrics.get("total_tokens", 0),
            "confidence": result.metrics.get("accuracy_score", 0.8),
            "quality": result.metrics.get("quality_score", 0.8),
            "model_id": model.model_id,
            "task_type": request.task_type.value
        }
        
        # 根据任务类型设置不同的TTL
        ttl_map = {
            TaskType.TEXT_GENERATION: 3600,  # 1小时
            TaskType.CODE_GENERATION: 7200,   # 2小时
            TaskType.MATH_REASONING: 86400,   # 1天
            TaskType.SEARCH_QUERY: 300,       # 5分钟
        }
        
        ttl = ttl_map.get(request.task_type, 1800)  # 默认30分钟
        
        await self.model_cache.cache_response(
            model_id=model.model_id,
            input_text=request.input_text,
            response=cache_data,
            parameters=request.requirements,
            ttl=ttl
        )
    
    def _check_cache_constraints(self, cached_response: Dict[str, Any], 
                               constraints: Dict[str, Any]) -> bool:
        """检查缓存是否满足约束条件"""
        # 检查准确率约束
        min_accuracy = constraints.get("min_accuracy", 0.7)
        cached_accuracy = cached_response.get("confidence", 0.0)
        
        if cached_accuracy < min_accuracy:
            return False
        
        # 可以添加更多约束检查
        # 如：最大令牌数、时间敏感性等
        
        return True
    
    async def get_task_status(self, task_id: str) -> Optional[Dict[str, Any]]:
        """获取任务状态"""
        if not self.db_manager:
            return None
        
        return await self.db_manager.get_task(task_id)
    
    async def get_model_stats(self, model_id: str, time_window: str = "all") -> Optional[Dict[str, Any]]:
        """获取模型统计信息"""
        if not self.db_manager:
            return None
        
        return await self.db_manager.get_model_stats(model_id, time_window)
    
    async def get_system_stats(self) -> Dict[str, Any]:
        """获取系统统计信息"""
        stats = {
            "performance": self.performance_stats.copy(),
            "monitor": self.monitor.get_report(),
            "cache_stats": None,
            "db_connected": self.db_manager is not None,
            "cache_connected": self.cache_manager is not None
        }
        
        # 获取缓存统计
        if self.cache_manager:
            try:
                cache_stats = await self.cache_manager.get_stats()
                stats["cache_stats"] = cache_stats
            except Exception as e:
                stats["cache_stats_error"] = str(e)
        
        # 计算缓存命中率
        total_requests = self.performance_stats["total_requests"]
        cache_hits = self.performance_stats["cache_hits"]
        
        if total_requests > 0:
            stats["cache_hit_rate"] = cache_hits / total_requests
        else:
            stats["cache_hit_rate"] = 0
        
        return stats
    
    async def clear_cache(self, model_id: str = None) -> Dict[str, Any]:
        """清除缓存"""
        result = {
            "model_cache_cleared": 0,
            "search_cache_cleared": 0
        }
        
        if model_id and self.model_cache:
            result["model_cache_cleared"] = await self.model_cache.clear_model_cache(model_id)
        
        # 注意：搜索缓存通常不清除，因为它是基于查询的
        
        return result
    
    # 以下方法从原版AI编排器继承
    async def identify_intent(self, request: TaskRequest) -> TaskType:
        """识别任务意图"""
        text = request.input_text.lower()
        
        # 简单的关键词识别（实际应该使用更复杂的NLP模型）
        if any(keyword in text for keyword in ["代码", "编程", "function", "class", "def "]):
            return TaskType.CODE_GENERATION
        elif any(keyword in text for keyword in ["数学", "计算", "solve", "equation", "calculate"]):
            return TaskType.MATH_REASONING
        elif any(keyword in text for keyword in ["图片", "图像", "照片", "image", "photo"]):
            return TaskType.IMAGE_GENERATION
        elif any(keyword in text for keyword in ["搜索", "查找", "search", "find"]):
            return TaskType.SEARCH_QUERY
        else:
            return TaskType.TEXT_GENERATION
    
    def needs_search(self, request: TaskRequest) -> bool:
        """判断是否需要搜索"""
        text = request.input_text.lower()
        search_keywords = ["最新", "新闻", "搜索", "查找", "信息", "what", "how", "why"]
        return any(keyword in text for keyword in search_keywords)
    
    async def call_model(self, model: AIModel, request: TaskRequest, context: Dict[str, Any]) -> str:
        """调用模型（模拟）"""
        # 模拟API调用延迟
        await asyncio.sleep(model.latency_ms / 1000)
        
        # 基于模型类型生成模拟响应
        if "codellama" in model.model_id:
            return f"""```python
# {request.input_text}
def solution():
    # 这里是生成的代码
    return "Code generated by {model.name}"
```"""
        elif "mathglm" in model.model_id:
            return f"数学问题解答: {request.input_text}\n\n解: 经过计算，结果为42。"
        elif "qwen-vl" in model.model_id:
            return f"视觉理解结果: 图像中包含与'{request.input_text}'相关的内容。"
        else:
            return f"""基于您的问题: "{request.input_text}"

回答: 这是由{model.name}生成的回答。根据当前信息，建议您进一步研究此话题。

上下文信息: {json.dumps(context.get('search_results', {}), ensure_ascii=False)[:200]}..."""
    
    def evaluate_result(self, output: str, request: TaskRequest) -> Dict[str, float]:
        """评估结果质量"""
        # 简单的评估逻辑
        evaluation = {
            "accuracy": 0.8 + np.random.random() * 0.15,  # 0.8-0.95
            "relevance": 0.7 + np.random.random() * 0.25,  # 0.7-0.95
            "coherence": 0.75 + np.random.random() * 0.2,  # 0.75-0.95
            "quality": 0.0
        }
        
        # 计算综合质量评分
        weights = {"accuracy": 0.4, "relevance": 0.3, "coherence": 0.3}
        evaluation["quality"] = sum(weights[k] * evaluation[k] for k in weights)
        
        return evaluation
    
    def update_model_stats(self, model: AIModel, evaluation: Dict[str, float]):
        """更新模型统计信息"""
        model.total_calls += 1
        model.total_tokens += 1000  # 模拟
        
        # 更新成功率
        if evaluation["quality"] > 0.7:
            success_count = model.success_rate * (model.total_calls - 1) + 1
            model.success_rate = success_count / model.total_calls
        else:
            success_count = model.success_rate * (model.total_calls - 1)
            model.success_rate = success_count / model.total_calls

# 以下是从原版AI编排器导入的类（为了完整性）
class ModelRegistry:
    """模型注册表"""
    def __init__(self):
        self.models: Dict[str, AIModel] = {}
        self.load_models()
    
    def load_models(self):
        """加载预定义模型"""
        # 基于调研的33个模型
        model_definitions = [
            # 大语言模型
            AIModel(
                name="Llama 4",
                provider="Meta",
                model_id="llama-4-400b",
                capabilities=[ModelCapability.LONG_CONTEXT, ModelCapability.REASONING, ModelCapability.MULTILINGUAL],
                max_tokens=128000,
                context_window=131072,
                cost_per_1k_tokens=0.08,
                latency_ms=1200,
                accuracy_score=0.92,
                availability=0.99,
                deployment_type="cloud"
            ),
            # ... 其他模型定义
        ]
        
        for model in model_definitions:
            self.models[model.model_id] = model

class ModelRouter:
    """模型路由器"""
    def __init__(self, registry: ModelRegistry):
        self.registry = registry
        self.history = []
    
    def select_model(self, request: TaskRequest) -> Optional[AIModel]:
        """选择最适合的模型"""
        # 简化的实现
        candidate_models = list(self.registry.models.values())
        return candidate_models[0] if candidate_models else None

class EnhancedSearch:
    """增强搜索系统"""
    def __init__(self):
        self.search_sources = ["web_search", "academic_papers", "code_repositories"]
    
    async def search(self, query: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """执行增强搜索"""
        # 简化的实现
        return {
            "query": query,
            "results": [{"title": f"Result for: {query}", "content": "Sample content"}]
        }

class SystemMonitor:
    """系统监控器"""
    def __init__(self):
        self.metrics = {
            "total_requests": 0,
            "successful_requests": 0,
            "failed_requests": 0
        }
    
    def record_request(self, request: TaskRequest, result: TaskResult, model: AIModel):
        """记录请求信息"""
        self.metrics["total_requests"] += 1
        if result.status == "success":
            self.metrics["successful_requests"] += 1
        else:
            self.metrics["failed_requests"] += 1
    
    def get_report(self) -> Dict[str, Any]:
        """获取监控报告"""
        report = self.metrics.copy()
        if report["total_requests"] > 0:
            report["success_rate"] = report["successful_requests"] / report["total_requests"]
        else:
            report["success_rate"] = 0
        return report

# 测试函数
async def test_enhanced_orchestrator():
    """测试增强版编排器"""
    print("测试增强版AI编排器...")
    
    # 使用内存模式测试
    orchestrator = EnhancedAISystemOrchestrator()
    
    # 创建测试请求
    requests = [
        TaskRequest(
            task_id=f"test_{i:03d}",
            task_type=TaskType.TEXT_GENERATION,
            input_text=f"测试请求 {i}: 人工智能的基本概念",
            user_id="test_user",
            tags=["test", f"iteration_{i}"],
            constraints={
                "max_tokens": 2000,
                "max_latency_ms": 5000,
                "max_cost_usd": 0.1,
                "min_accuracy": 0.7
            }
        )
        for i in range(3)
    ]
    
    # 处理请求
    results = []
    for request in requests:
        print(f"\n处理请求: {request.task_id}")
        result = await orchestrator.process_request(request)
        results.append(result)
        
        print(f"  使用模型: {result.model_used}")
        print(f"  状态: {result.status}")
        print(f"  延迟: {result.metrics['latency_ms']:.0f}ms")
        print(f"  成本: ${result.metrics['cost_usd']:.4f}")
        print(f"  质量: {result.metrics['quality_score']:.2f}")
        
        # 测试缓存
        if i == 0:
            print(f"  首次请求，应无缓存")
        else:
            print(f"  后续请求，可能有缓存")
    
    # 获取系统统计
    stats = await orchestrator.get_system_stats()
    print(f"\n系统统计:")
    print(f"  总请求数: {stats['performance']['total_requests']}")
    print(f"  缓存命中数: {stats['performance']['cache_hits']}")
    if 'cache_hit_rate' in stats:
        print(f"  缓存命中率: {stats['cache_hit_rate']:.1%}")
    
    print("\n🎉 增强版编排器测试完成!")

if __name__ == "__main__":
    # 运行测试
    asyncio.run(test_enhanced_orchestrator())