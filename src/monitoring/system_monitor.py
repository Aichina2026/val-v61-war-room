#!/usr/bin/env python3
"""
系统监控器
集成Prometheus指标和健康检查
"""

import time
import json
import psutil
import asyncio
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from collections import deque
import logging

try:
    from prometheus_client import Counter, Gauge, Histogram, Summary, generate_latest, REGISTRY
    from prometheus_client.core import GaugeMetricFamily, CounterMetricFamily
    PROMETHEUS_AVAILABLE = True
except ImportError:
    PROMETHEUS_AVAILABLE = False
    print("警告: prometheus_client未安装，监控功能将受限")

# 配置日志
logger = logging.getLogger(__name__)

@dataclass
class MetricConfig:
    """指标配置"""
    # 收集间隔
    collection_interval_seconds: int = 30
    
    # 保留时间
    retention_hours: int = 24
    
    # 告警阈值
    cpu_threshold_percent: float = 80.0
    memory_threshold_percent: float = 85.0
    disk_threshold_percent: float = 90.0
    latency_threshold_ms: float = 5000.0
    error_rate_threshold: float = 0.05  # 5%
    
    # Prometheus设置
    enable_prometheus: bool = True
    prometheus_port: int = 8080

@dataclass
class SystemMetric:
    """系统指标数据点"""
    timestamp: datetime
    metric_name: str
    value: float
    labels: Dict[str, str] = field(default_factory=dict)
    metadata: Dict[str, Any] = field(default_factory=dict)

class HealthStatus:
    """健康状态枚举"""
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"
    UNKNOWN = "unknown"

class SystemMonitor:
    """系统监控器"""
    
    def __init__(self, config: MetricConfig = None):
        self.config = config or MetricConfig()
        self.metrics_history = {}  # 指标历史数据
        self.health_checks = {}   # 健康检查
        self.alerts = []          # 告警列表
        self.start_time = datetime.now()
        
        # 初始化Prometheus指标
        if PROMETHEUS_AVAILABLE and self.config.enable_prometheus:
            self._init_prometheus_metrics()
        
        # 初始化指标收集器
        self._init_metrics_collectors()
        
        logger.info(f"系统监控器初始化完成 - Prometheus: {PROMETHEUS_AVAILABLE}")
    
    def _init_prometheus_metrics(self):
        """初始化Prometheus指标"""
        # 请求指标
        self.requests_total = Counter(
            'ai_orchestrator_requests_total',
            '总请求数',
            ['task_type', 'model', 'status']
        )
        
        self.requests_duration = Histogram(
            'ai_orchestrator_request_duration_seconds',
            '请求处理时间',
            ['task_type', 'model'],
            buckets=(0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0, 60.0)
        )
        
        self.request_tokens = Histogram(
            'ai_orchestrator_request_tokens',
            '请求令牌数',
            ['task_type', 'model'],
            buckets=(100, 500, 1000, 2000, 5000, 10000, 20000, 50000)
        )
        
        self.request_cost = Histogram(
            'ai_orchestrator_request_cost_usd',
            '请求成本（美元）',
            ['task_type', 'model'],
            buckets=(0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1.0, 5.0)
        )
        
        # 模型指标
        self.model_calls_total = Counter(
            'ai_orchestrator_model_calls_total',
            '模型调用总数',
            ['model_id', 'provider', 'deployment_type']
        )
        
        self.model_success_rate = Gauge(
            'ai_orchestrator_model_success_rate',
            '模型成功率',
            ['model_id']
        )
        
        self.model_latency = Gauge(
            'ai_orchestrator_model_latency_seconds',
            '模型延迟（秒）',
            ['model_id']
        )
        
        self.model_cost_rate = Gauge(
            'ai_orchestrator_model_cost_rate_usd_per_token',
            '模型成本率（美元/令牌）',
            ['model_id']
        )
        
        # 系统指标
        self.system_cpu_usage = Gauge(
            'ai_orchestrator_system_cpu_usage_percent',
            '系统CPU使用率'
        )
        
        self.system_memory_usage = Gauge(
            'ai_orchestrator_system_memory_usage_percent',
            '系统内存使用率'
        )
        
        self.system_disk_usage = Gauge(
            'ai_orchestrator_system_disk_usage_percent',
            '系统磁盘使用率',
            ['mount_point']
        )
        
        self.system_uptime = Gauge(
            'ai_orchestrator_system_uptime_seconds',
            '系统运行时间'
        )
        
        # 缓存指标
        self.cache_hits_total = Counter(
            'ai_orchestrator_cache_hits_total',
            '缓存命中总数',
            ['cache_type']
        )
        
        self.cache_misses_total = Counter(
            'ai_orchestrator_cache_misses_total',
            '缓存未命中总数',
            ['cache_type']
        )
        
        # 错误指标
        self.errors_total = Counter(
            'ai_orchestrator_errors_total',
            '错误总数',
            ['error_type', 'severity']
        )
        
        # 队列指标
        self.queue_size = Gauge(
            'ai_orchestrator_queue_size',
            '任务队列大小',
            ['queue_name']
        )
        
        self.queue_wait_time = Histogram(
            'ai_orchestrator_queue_wait_time_seconds',
            '队列等待时间',
            ['queue_name'],
            buckets=(0.1, 0.5, 1.0, 5.0, 10.0, 30.0, 60.0, 300.0)
        )
    
    def _init_metrics_collectors(self):
        """初始化指标收集器"""
        # 预定义要收集的指标
        self.metrics_history = {
            "system": deque(maxlen=2880),  # 保留30天的数据（假设每15分钟收集一次）
            "requests": deque(maxlen=2880),
            "models": {},
            "cache": deque(maxlen=2880),
            "errors": deque(maxlen=1440)  # 保留15天的错误数据
        }
    
    async def collect_system_metrics(self):
        """收集系统指标"""
        try:
            timestamp = datetime.now()
            metrics = []
            
            # CPU使用率
            cpu_percent = psutil.cpu_percent(interval=0.1)
            metrics.append(SystemMetric(
                timestamp=timestamp,
                metric_name="system.cpu.usage",
                value=cpu_percent,
                labels={"type": "percent"}
            ))
            
            # 内存使用率
            memory = psutil.virtual_memory()
            metrics.append(SystemMetric(
                timestamp=timestamp,
                metric_name="system.memory.usage",
                value=memory.percent,
                labels={"type": "percent"}
            ))
            
            # 内存详情
            metrics.append(SystemMetric(
                timestamp=timestamp,
                metric_name="system.memory.used",
                value=memory.used / 1024 / 1024,  # MB
                labels={"unit": "mb"}
            ))
            
            metrics.append(SystemMetric(
                timestamp=timestamp,
                metric_name="system.memory.available",
                value=memory.available / 1024 / 1024,  # MB
                labels={"unit": "mb"}
            ))
            
            # 磁盘使用率
            for partition in psutil.disk_partitions():
                try:
                    usage = psutil.disk_usage(partition.mountpoint)
                    metrics.append(SystemMetric(
                        timestamp=timestamp,
                        metric_name="system.disk.usage",
                        value=usage.percent,
                        labels={"mountpoint": partition.mountpoint, "type": "percent"}
                    ))
                except Exception as e:
                    logger.warning(f"无法获取磁盘使用率 {partition.mountpoint}: {e}")
            
            # 网络I/O
            net_io = psutil.net_io_counters()
            metrics.append(SystemMetric(
                timestamp=timestamp,
                metric_name="system.network.bytes_sent",
                value=net_io.bytes_sent,
                labels={"direction": "sent"}
            ))
            
            metrics.append(SystemMetric(
                timestamp=timestamp,
                metric_name="system.network.bytes_recv",
                value=net_io.bytes_recv,
                labels={"direction": "received"}
            ))
            
            # 进程信息
            process = psutil.Process()
            metrics.append(SystemMetric(
                timestamp=timestamp,
                metric_name="system.process.cpu_percent",
                value=process.cpu_percent(interval=0.1),
                labels={"pid": str(process.pid)}
            ))
            
            metrics.append(SystemMetric(
                timestamp=timestamp,
                metric_name="system.process.memory_percent",
                value=process.memory_percent(),
                labels={"pid": str(process.pid)}
            ))
            
            metrics.append(SystemMetric(
                timestamp=timestamp,
                metric_name="system.process.threads",
                value=process.num_threads(),
                labels={"pid": str(process.pid)}
            ))
            
            # 保存到历史
            for metric in metrics:
                self._add_to_history("system", metric)
            
            # 更新Prometheus指标
            if PROMETHEUS_AVAILABLE:
                self.system_cpu_usage.set(cpu_percent)
                self.system_memory_usage.set(memory.percent)
                self.system_uptime.set((timestamp - self.start_time).total_seconds())
            
            logger.debug(f"收集系统指标完成: {len(metrics)}个指标")
            return metrics
            
        except Exception as e:
            logger.error(f"收集系统指标失败: {e}")
            return []
    
    async def collect_request_metrics(self, request_data: Dict[str, Any], 
                                    result_data: Dict[str, Any], 
                                    model_data: Dict[str, Any]):
        """收集请求指标"""
        try:
            timestamp = datetime.now()
            metrics = []
            
            # 基本请求指标
            task_type = request_data.get("task_type", "unknown")
            model_id = model_data.get("model_id", "unknown")
            status = result_data.get("status", "unknown")
            
            metrics.append(SystemMetric(
                timestamp=timestamp,
                metric_name="request.count",
                value=1,
                labels={"task_type": task_type, "model": model_id, "status": status}
            ))
            
            # 延迟指标
            latency_ms = result_data.get("latency_ms", 0)
            metrics.append(SystemMetric(
                timestamp=timestamp,
                metric_name="request.latency",
                value=latency_ms,
                labels={"task_type": task_type, "model": model_id, "unit": "ms"}
            ))
            
            # 令牌数
            tokens = result_data.get("total_tokens", 0)
            metrics.append(SystemMetric(
                timestamp=timestamp,
                metric_name="request.tokens",
                value=tokens,
                labels={"task_type": task_type, "model": model_id}
            ))
            
            # 成本
            cost = result_data.get("cost_usd", 0)
            metrics.append(SystemMetric(
                timestamp=timestamp,
                metric_name="request.cost",
                value=cost,
                labels={"task_type": task_type, "model": model_id, "unit": "usd"}
            ))
            
            # 质量评分
            quality = result_data.get("quality_score", 0)
            metrics.append(SystemMetric(
                timestamp=timestamp,
                metric_name="request.quality",
                value=quality,
                labels={"task_type": task_type, "model": model_id}
            ))
            
            # 保存到历史
            for metric in metrics:
                self._add_to_history("requests", metric)
            
            # 更新Prometheus指标
            if PROMETHEUS_AVAILABLE:
                self.requests_total.labels(
                    task_type=task_type,
                    model=model_id,
                    status=status
                ).inc()
                
                self.requests_duration.labels(
                    task_type=task_type,
                    model=model_id
                ).observe(latency_ms / 1000)  # 转换为秒
                
                self.request_tokens.labels(
                    task_type=task_type,
                    model=model_id
                ).observe(tokens)
                
                self.request_cost.labels(
                    task_type=task_type,
                    model=model_id
                ).observe(cost)
            
            logger.debug(f"收集请求指标完成: {len(metrics)}个指标")
            return metrics
            
        except Exception as e:
            logger.error(f"收集请求指标失败: {e}")
            return []
    
    async def collect_model_metrics(self, model_id: str, metrics_data: Dict[str, Any]):
        """收集模型指标"""
        try:
            timestamp = datetime.now()
            
            # 初始化模型指标存储
            if model_id not in self.metrics_history["models"]:
                self.metrics_history["models"][model_id] = deque(maxlen=1440)
            
            # 创建指标
            metric = SystemMetric(
                timestamp=timestamp,
                metric_name="model.performance",
                value=1.0,  # 计数
                labels={
                    "model_id": model_id,
                    "total_calls": str(metrics_data.get("total_calls", 0)),
                    "success_rate": str(metrics_data.get("success_rate", 0)),
                    "avg_latency": str(metrics_data.get("avg_latency_ms", 0)),
                    "avg_cost": str(metrics_data.get("avg_cost_per_call", 0))
                }
            )
            
            # 保存到历史
            self.metrics_history["models"][model_id].append(metric)
            
            # 更新Prometheus指标
            if PROMETHEUS_AVAILABLE:
                self.model_calls_total.labels(
                    model_id=model_id,
                    provider=metrics_data.get("provider", "unknown"),
                    deployment_type=metrics_data.get("deployment_type", "unknown")
                ).inc()
                
                self.model_success_rate.labels(model_id=model_id).set(
                    metrics_data.get("success_rate", 0)
                )
                
                self.model_latency.labels(model_id=model_id).set(
                    metrics_data.get("avg_latency_ms", 0) / 1000  # 转换为秒
                )
                
                self.model_cost_rate.labels(model_id=model_id).set(
                    metrics_data.get("avg_cost_per_token", 0)
                )
            
            logger.debug(f"收集模型指标完成: {model_id}")
            
        except Exception as e:
            logger.error(f"收集模型指标失败: {e}")
    
    async def collect_cache_metrics(self, cache_stats: Dict[str, Any]):
        """收集缓存指标"""
        try:
            timestamp = datetime.now()
            metrics = []
            
            # 缓存命中率
            hits = cache_stats.get("cache_hits", 0)
            misses = cache_stats.get("cache_misses", 0)
            total = hits + misses
            
            if total > 0:
                hit_rate = hits / total
                metrics.append(SystemMetric(
                    timestamp=timestamp,
                    metric_name="cache.hit_rate",
                    value=hit_rate,
                    labels={"type": "rate"}
                ))
            
            # 缓存大小
            memory_size = cache_stats.get("memory_cache_size", 0)
            metrics.append(SystemMetric(
                timestamp=timestamp,
                metric_name="cache.memory_size",
                value=memory_size,
                labels={"type": "memory"}
            ))
            
            # Redis内存使用
            redis_memory = cache_stats.get("redis_used_memory", 0)
            if redis_memory:
                metrics.append(SystemMetric(
                    timestamp=timestamp,
                    metric_name="cache.redis_memory",
                    value=redis_memory,
                    labels={"type": "redis", "unit": "bytes"}
                ))
            
            # 保存到历史
            for metric in metrics:
                self._add_to_history("cache", metric)
            
            # 更新Prometheus指标
            if PROMETHEUS_AVAILABLE:
                cache_type = cache_stats.get("cache_type", "general")
                self.cache_hits_total.labels(cache_type=cache_type).inc(hits)
                self.cache_misses_total.labels(cache_type=cache_type).inc(misses)
            
            logger.debug(f"收集缓存指标完成: {len(metrics)}个指标")
            return metrics
            
        except Exception as e:
            logger.error(f"收集缓存指标失败: {e}")
            return []
    
    def _add_to_history(self, category: str, metric: SystemMetric):
        """添加指标到历史记录"""
        if category in self.metrics_history:
            self.metrics_history[category].append(metric)
    
    async def check_health(self) -> Dict[str, Any]:
        """检查系统健康状态"""
        health_report = {
            "status": HealthStatus.HEALTHY,
            "timestamp": datetime.now().isoformat(),
            "checks": {},
            "issues": []
        }
        
        try:
            # 检查CPU
            cpu_percent = psutil.cpu_percent(interval=0.1)
            cpu_healthy = cpu_percent < self.config.cpu_threshold_percent
            health_report["checks"]["cpu"] = {
                "status": HealthStatus.HEALTHY if cpu_healthy else HealthStatus.UNHEALTHY,
                "value": cpu_percent,
                "threshold": self.config.cpu_threshold_percent
            }
            
            if not cpu_healthy:
                health_report["issues"].append(f"CPU使用率过高: {cpu_percent:.1f}%")
                health_report["status"] = HealthStatus.DEGRADED
            
            # 检查内存
            memory = psutil.virtual_memory()
            memory_healthy = memory.percent < self.config.memory_threshold_percent
            health_report["checks"]["memory"] = {
                "status": HealthStatus.HEALTHY if memory_healthy else HealthStatus.UNHEALTHY,
                "value": memory.percent,
                "threshold": self.config.memory_threshold_percent,
                "available_mb": memory.available / 1024 / 1024
            }
            
            if not memory_healthy:
                health_report["issues"].append(f"内存使用率过高: {memory.percent:.1f}%")
                health_report["status"] = HealthStatus.DEGRADED
            
            # 检查磁盘
            for partition in psutil.disk_partitions():
                try:
                    usage = psutil.disk_usage(partition.mountpoint)
                    disk_healthy = usage.percent < self.config.disk_threshold_percent
                    
                    health_report["checks"][f"disk_{partition.mountpoint.replace('/', '_')}"] = {
                        "status": HealthStatus.HEALTHY if disk_healthy else HealthStatus.UNHEALTHY,
                        "value": usage.percent,
                        "threshold": self.config.disk_threshold_percent,
                        "free_gb": usage.free / 1024 / 1024 / 1024
                    }
                    
                    if not disk_healthy:
                        health_report["issues"].append(f"磁盘使用率过高 ({partition.mountpoint}): {usage.percent:.1f}%")
                        health_report["status"] = HealthStatus.DEGRADED
                except Exception as e:
                    logger.warning(f"检查磁盘健康失败 {partition.mountpoint}: {e}")
            
            # 检查进程
            try:
                process = psutil.Process()
                process_healthy = process.is_running()
                health_report["checks"]["process"] = {
                    "status": HealthStatus.HEALTHY if process_healthy else HealthStatus.UNHEALTHY,
                    "pid": process.pid,
                    "uptime": (datetime.now() - datetime.fromtimestamp(process.create_time())).total_seconds()
                }
                
                if not process_healthy:
                    health_report["issues"].append("主进程未运行")
                    health_report["status"] = HealthStatus.UNHEALTHY
            except Exception as e:
                logger.warning(f"检查进程健康失败: {e}")
                health_report["checks"]["process"] = {
                    "status": HealthStatus.UNKNOWN,
                    "error": str(e)
                }
            
            # 检查服务依赖（如果有）
            # 这里可以添加数据库、缓存等服务的健康检查
            
        except Exception as e:
            logger.error(f"健康检查失败: {e}")
            health_report["status"] = HealthStatus.UNKNOWN
            health_report["error"] = str(e)
        
        return health_report
    
    async def check_alerts(self) -> List[Dict[str, Any]]:
        """检查告警条件"""
        alerts = []
        timestamp = datetime.now()
        
        try:
            # 检查系统指标告警
            if "system" in self.metrics_history and self.metrics_history["system"]:
                # 获取最新的系统指标
                recent_metrics = list(self.metrics_history["system"])[-10:]  # 最近10个
                
                # 检查CPU告警
                cpu_metrics = [m for m in recent_metrics if m.metric_name == "system.cpu.usage"]
                if cpu_metrics:
                    avg_cpu = sum(m.value for m in cpu_metrics) / len(cpu_metrics)
                    if avg_cpu > self.config.cpu_threshold_percent:
                        alerts.append({
                            "id": f"alert_cpu_{timestamp.timestamp()}",
                            "severity": "warning",
                            "title": "CPU使用率过高",
                            "message": f"平均CPU使用率: {avg_cpu:.1f}% (阈值: {self.config.cpu_threshold_percent}%)",
                            "timestamp": timestamp.isoformat(),
                            "metric": "system.cpu.usage",
                            "value": avg_cpu,
                            "threshold": self.config.cpu_threshold_percent
                        })
                
                # 检查内存告警
                memory_metrics = [m for m in recent_metrics if m.metric_name == "system.memory.usage"]
                if memory_metrics:
                    avg_memory = sum(m.value for m in memory_metrics) / len(memory_metrics)
                    if avg_memory > self.config.memory_threshold_percent:
                        alerts.append({
                            "id": f"alert_memory_{timestamp.timestamp()}",
                            "severity": "warning",
                            "title": "内存使用率过高",
                            "message": f"平均内存使用率: {avg_memory:.1f}% (阈值: {self.config.memory_threshold_percent}%)",
                            "timestamp": timestamp.isoformat(),
                            "metric": "system.memory.usage",
                            "value": avg_memory,
                            "threshold": self.config.memory_threshold_percent
                        })
            
            # 检查错误率告警
            if "requests" in self.metrics_history and self.metrics_history["requests"]:
                recent_requests = list(self.metrics_history["requests"])[-100:]  # 最近100个请求
                if recent_requests:
                    error_requests = [r for r in recent_requests if "error" in r.labels.get("status", "").lower()]
                    error_rate = len(error_requests) / len(recent_requests)
                    
                    if error_rate > self.config.error_rate_threshold:
                        alerts.append({
                            "id": f"alert_error_rate_{timestamp.timestamp()}",
                            "severity": "critical",
                            "title": "错误率过高",
                            "message": f"请求错误率: {error_rate:.1%} (阈值: {self.config.error_rate_threshold:.1%})",
                            "timestamp": timestamp.isoformat(),
                            "metric": "request.error_rate",
                            "value": error_rate,
                            "threshold": self.config.error_rate_threshold
                        })
            
            # 检查延迟告警
            if "requests" in self.metrics_history and self.metrics_history["requests"]:
                latency_metrics = [m for m in list(self.metrics_history["requests"])[-50:] 
                                 if m.metric_name == "request.latency"]
                if latency_metrics:
                    avg_latency = sum(m.value for m in latency_metrics) / len(latency_metrics)
                    if avg_latency > self.config.latency_threshold_ms:
                        alerts.append({
                            "id": f"alert_latency_{timestamp.timestamp()}",
                            "severity": "warning",
                            "title": "请求延迟过高",
                            "message": f"平均请求延迟: {avg_latency:.0f}ms (阈值: {self.config.latency_threshold_ms:.0f}ms)",
                            "timestamp": timestamp.isoformat(),
                            "metric": "request.latency",
                            "value": avg_latency,
                            "threshold": self.config.latency_threshold_ms
                        })
            
            # 保存新告警
            for alert in alerts:
                self.alerts.append({
                    **alert,
                    "acknowledged": False,
                    "resolved": False
                })
            
            # 限制告警数量
            if len(self.alerts) > 100:
                self.alerts = self.alerts[-100:]
        
        except Exception as e:
            logger.error(f"检查告警失败: {e}")
        
        return alerts
    
    def get_metrics_summary(self, time_range: str = "1h") -> Dict[str, Any]:
        """获取指标摘要"""
        summary = {
            "timestamp": datetime.now().isoformat(),
            "time_range": time_range,
            "system": {},
            "requests": {},
            "models": {},
            "cache": {}
        }
        
        try:
            # 计算时间范围
            if time_range == "1h":
                cutoff_time = datetime.now() - timedelta(hours=1)
            elif time_range == "24h":
                cutoff_time = datetime.now() - timedelta(hours=24)
            elif time_range == "7d":
                cutoff_time = datetime.now() - timedelta(days=7)
            else:
                cutoff_time = datetime.now() - timedelta(hours=1)
            
            # 系统指标
            system_metrics = [m for m in self.metrics_history.get("system", []) 
                            if m.timestamp > cutoff_time]
            
            if system_metrics:
                cpu_metrics = [m for m in system_metrics if m.metric_name == "system.cpu.usage"]
                memory_metrics = [m for m in system_metrics if m.metric_name == "system.memory.usage"]
                
                summary["system"] = {
                    "avg_cpu": sum(m.value for m in cpu_metrics) / len(cpu_metrics) if cpu_metrics else 0,
                    "avg_memory": sum(m.value for m in memory_metrics) / len(memory_metrics) if memory_metrics else 0,
                    "metric_count": len(system_metrics)
                }
            
            # 请求指标
            request_metrics = [m for m in self.metrics_history.get("requests", []) 
                             if m.timestamp > cutoff_time]
            
            if request_metrics:
                total_requests = len([m for m in request_metrics if m.metric_name == "request.count"])
                success_requests = len([m for m in request_metrics 
                                      if m.metric_name == "request.count" and 
                                      m.labels.get("status") == "success"])
                
                latency_metrics = [m for m in request_metrics if m.metric_name == "request.latency"]
                token_metrics = [m for m in request_metrics if m.metric_name == "request.tokens"]
                cost_metrics = [m for m in request_metrics if m.metric_name == "request.cost"]
                
                summary["requests"] = {
                    "total": total_requests,
                    "success_rate": success_requests / total_requests if total_requests > 0 else 0,
                    "avg_latency_ms": sum(m.value for m in latency_metrics) / len(latency_metrics) if latency_metrics else 0,
                    "avg_tokens": sum(m.value for m in token_metrics) / len(token_metrics) if token_metrics else 0,
                    "total_cost": sum(m.value for m in cost_metrics) if cost_metrics else 0,
                    "avg_cost_per_request": sum(m.value for m in cost_metrics) / total_requests if total_requests > 0 else 0
                }
            
            # 模型指标
            for model_id, metrics in self.metrics_history.get("models", {}).items():
                model_metrics = [m for m in metrics if m.timestamp > cutoff_time]
                if model_metrics:
                    summary["models"][model_id] = {
                        "calls": len(model_metrics),
                        "latest_timestamp": max(m.timestamp for m in model_metrics).isoformat() if model_metrics else None
                    }
            
            # 缓存指标
            cache_metrics = [m for m in self.metrics_history.get("cache", []) 
                           if m.timestamp > cutoff_time]
            
            if cache_metrics:
                hit_rate_metrics = [m for m in cache_metrics if m.metric_name == "cache.hit_rate"]
                summary["cache"] = {
                    "avg_hit_rate": sum(m.value for m in hit_rate_metrics) / len(hit_rate_metrics) if hit_rate_metrics else 0,
                    "metric_count": len(cache_metrics)
                }
        
        except Exception as e:
            logger.error(f"获取指标摘要失败: {e}")
            summary["error"] = str(e)
        
        return summary
    
    async def start_monitoring(self):
        """启动监控服务"""
        logger.info("启动监控服务...")
        
        # 启动指标收集循环
        async def collect_loop():
            while True:
                try:
                    await self.collect_system_metrics()
                    await self.check_alerts()
                except Exception as e:
                    logger.error(f"监控收集循环错误: {e}")
                
                await asyncio.sleep(self.config.collection_interval_seconds)
        
        # 启动健康检查循环
        async def health_check_loop():
            while True:
                try:
                    health = await self.check_health()
                    if health["status"] != HealthStatus.HEALTHY:
                        logger.warning(f"系统健康状态: {health['status']} - 问题: {health.get('issues', [])}")
                except Exception as e:
                    logger.error(f"健康检查循环错误: {e}")
                
                await asyncio.sleep(60)  # 每分钟检查一次
        
        # 启动任务
        asyncio.create_task(collect_loop())
        asyncio.create_task(health_check_loop())
        
        logger.info("监控服务已启动")

# 测试函数
async def test_system_monitor():
    """测试系统监控器"""
    print("测试系统监控器...")
    
    monitor = SystemMonitor()
    
    # 收集系统指标
    system_metrics = await monitor.collect_system_metrics()
    print(f"✅ 收集系统指标: {len(system_metrics)}个")
    
    # 模拟请求指标
    request_data = {
        "task_type": "text_generation",
        "input_text": "测试请求"
    }
    
    result_data = {
        "status": "success",
        "latency_ms": 1234,
        "total_tokens": 1500,
        "cost_usd": 0.018,
        "quality_score": 0.92
    }
    
    model_data = {
        "model_id": "test-model-1",
        "provider": "Test",
        "deployment_type": "cloud"
    }
    
    request_metrics = await monitor.collect_request_metrics(request_data, result_data, model_data)
    print(f"✅ 收集请求指标: {len(request_metrics)}个")
    
    # 收集模型指标
    model_metrics = {
        "total_calls": 100,
        "success_rate": 0.95,
        "avg_latency_ms": 1234,
        "avg_cost_per_call": 0.018,
        "avg_cost_per_token": 0.000012,
        "provider": "Test",
        "deployment_type": "cloud"
    }
    
    await monitor.collect_model_metrics("test-model-1", model_metrics)
    print(f"✅ 收集模型指标")
    
    # 收集缓存指标
    cache_stats = {
        "cache_hits": 85,
        "cache_misses": 15,
        "memory_cache_size": 42,
        "cache_type": "model_response"
    }
    
    cache_metrics = await monitor.collect_cache_metrics(cache_stats)
    print(f"✅ 收集缓存指标: {len(cache_metrics)}个")
    
    # 检查健康状态
    health = await monitor.check_health()
    print(f"✅ 健康检查: {health['status']}")
    
    # 检查告警
    alerts = await monitor.check_alerts()
    print(f"✅ 告警检查: {len(alerts)}个告警")
    
    # 获取指标摘要
    summary = monitor.get_metrics_summary("1h")
    print(f"✅ 指标摘要: {summary.get('requests', {}).get('total', 0)}个请求")
    
    print("\n🎉 系统监控器测试完成!")

if __name__ == "__main__":
    # 运行测试
    asyncio.run(test_system_monitor())