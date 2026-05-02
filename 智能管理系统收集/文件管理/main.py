#!/usr/bin/env python3
"""
智能系统资源管理器 Agent
实时监控、分析和优化系统资源的智能代理
"""

import asyncio
import logging
import json
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import psutil
import aiohttp
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
import uvicorn
import redis.asyncio as redis
import yaml

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/var/log/resource_manager.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="智能系统资源管理器 Agent",
    description="实时系统资源监控、分析和优化代理",
    version="1.0.0"
)

class SystemSensor:
    """系统传感器基类"""
    
    async def collect(self) -> Dict:
        """采集数据"""
        raise NotImplementedError

class CPUSensor(SystemSensor):
    """CPU 传感器"""
    
    async def collect(self) -> Dict:
        """采集 CPU 数据"""
        try:
            # CPU 使用率
            cpu_percent = psutil.cpu_percent(interval=0.1, percpu=True)
            cpu_count = psutil.cpu_count()
            
            # 负载平均值
            load_avg = psutil.getloadavg()
            
            # CPU 频率
            cpu_freq = psutil.cpu_freq()
            
            # CPU 时间
            cpu_times = psutil.cpu_times_percent()
            
            return {
                "utilization_percent": cpu_percent,
                "average_utilization": sum(cpu_percent) / len(cpu_percent),
                "cpu_count": cpu_count,
                "load_average": {
                    "1min": load_avg[0],
                    "5min": load_avg[1],
                    "15min": load_avg[2]
                },
                "frequency": {
                    "current": cpu_freq.current if cpu_freq else 0,
                    "min": cpu_freq.min if cpu_freq else 0,
                    "max": cpu_freq.max if cpu_freq else 0
                },
                "times": {
                    "user": getattr(cpu_times, 'user', 0),
                    "system": getattr(cpu_times, 'system', 0),
                    "idle": getattr(cpu_times, 'idle', 0)
                },
                "timestamp": time.time()
            }
        except Exception as e:
            logger.error(f"CPU 数据采集失败: {e}")
            return {"error": str(e)}

class MemorySensor(SystemSensor):
    """内存传感器"""
    
    async def collect(self) -> Dict:
        """采集内存数据"""
        try:
            mem = psutil.virtual_memory()
            swap = psutil.swap_memory()
            
            return {
                "total_mb": mem.total / (1024 * 1024),
                "available_mb": mem.available / (1024 * 1024),
                "used_mb": mem.used / (1024 * 1024),
                "free_mb": mem.free / (1024 * 1024),
                "usage_percent": mem.percent,
                "swap_total_mb": swap.total / (1024 * 1024),
                "swap_used_mb": swap.used / (1024 * 1024),
                "swap_free_mb": swap.free / (1024 * 1024),
                "swap_usage_percent": swap.percent,
                "cached_mb": getattr(mem, 'cached', 0) / (1024 * 1024),
                "buffers_mb": getattr(mem, 'buffers', 0) / (1024 * 1024),
                "timestamp": time.time()
            }
        except Exception as e:
            logger.error(f"内存数据采集失败: {e}")
            return {"error": str(e)}

class DiskSensor(SystemSensor):
    """磁盘传感器"""
    
    async def collect(self) -> Dict:
        """采集磁盘数据"""
        try:
            disk_usage = psutil.disk_usage('/')
            disk_io = psutil.disk_io_counters()
            
            # 获取所有分区信息
            partitions = []
            for partition in psutil.disk_partitions():
                try:
                    usage = psutil.disk_usage(partition.mountpoint)
                    partitions.append({
                        "device": partition.device,
                        "mountpoint": partition.mountpoint,
                        "fstype": partition.fstype,
                        "total_gb": usage.total / (1024**3),
                        "used_gb": usage.used / (1024**3),
                        "free_gb": usage.free / (1024**3),
                        "usage_percent": usage.percent
                    })
                except Exception as e:
                    logger.warning(f"无法获取分区 {partition.mountpoint} 信息: {e}")
                    
            return {
                "root": {
                    "total_gb": disk_usage.total / (1024**3),
                    "used_gb": disk_usage.used / (1024**3),
                    "free_gb": disk_usage.free / (1024**3),
                    "usage_percent": disk_usage.percent
                },
                "io": {
                    "read_bytes": disk_io.read_bytes,
                    "write_bytes": disk_io.write_bytes,
                    "read_count": disk_io.read_count,
                    "write_count": disk_io.write_count
                } if disk_io else {},
                "partitions": partitions,
                "timestamp": time.time()
            }
        except Exception as e:
            logger.error(f"磁盘数据采集失败: {e}")
            return {"error": str(e)}

class NetworkSensor(SystemSensor):
    """网络传感器"""
    
    async def collect(self) -> Dict:
        """采集网络数据"""
        try:
            net_io = psutil.net_io_counters()
            net_connections = psutil.net_connections()
            net_if_addrs = psutil.net_if_addrs()
            net_if_stats = psutil.net_if_stats()
            
            # 统计连接状态
            connection_stats = {}
            for conn in net_connections:
                status = conn.status
                connection_stats[status] = connection_stats.get(status, 0) + 1
                
            # 接口信息
            interfaces = {}
            for iface, addrs in net_if_addrs.items():
                interfaces[iface] = {
                    "addresses": [str(addr.address) for addr in addrs],
                    "status": "up" if net_if_stats.get(iface, {}).get('isup', False) else "down",
                    "speed_mbps": net_if_stats.get(iface, {}).get('speed', 0)
                }
                
            return {
                "bytes_sent": net_io.bytes_sent,
                "bytes_recv": net_io.bytes_recv,
                "packets_sent": net_io.packets_sent,
                "packets_recv": net_io.packets_recv,
                "errin": net_io.errin,
                "errout": net_io.errout,
                "dropin": net_io.dropin,
                "dropout": net_io.dropout,
                "connections": connection_stats,
                "total_connections": len(net_connections),
                "interfaces": interfaces,
                "timestamp": time.time()
            }
        except Exception as e:
            logger.error(f"网络数据采集失败: {e}")
            return {"error": str(e)}

class ProcessSensor(SystemSensor):
    """进程传感器"""
    
    async def collect(self) -> Dict:
        """采集进程数据"""
        try:
            processes = []
            for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent', 'status']):
                try:
                    pinfo = proc.info
                    processes.append({
                        "pid": pinfo['pid'],
                        "name": pinfo['name'],
                        "cpu_percent": pinfo['cpu_percent'],
                        "memory_percent": pinfo['memory_percent'],
                        "status": pinfo['status']
                    })
                except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                    pass
                    
            # 按 CPU 和内存排序
            processes.sort(key=lambda x: x.get('cpu_percent', 0), reverse=True)
            top_cpu = processes[:10]
            
            processes.sort(key=lambda x: x.get('memory_percent', 0), reverse=True)
            top_memory = processes[:10]
            
            # 进程统计
            stats = {}
            for proc in processes:
                status = proc.get('status', 'unknown')
                stats[status] = stats.get(status, 0) + 1
                
            return {
                "total_count": len(processes),
                "stats": stats,
                "top_cpu": top_cpu,
                "top_memory": top_memory,
                "timestamp": time.time()
            }
        except Exception as e:
            logger.error(f"进程数据采集失败: {e}")
            return {"error": str(e)}

class DataCollector:
    """数据采集器"""
    
    def __init__(self):
        self.sensors = {
            "cpu": CPUSensor(),
            "memory": MemorySensor(),
            "disk": DiskSensor(),
            "network": NetworkSensor(),
            "process": ProcessSensor()
        }
        self.collection_interval = 5  # 默认5秒采集一次
        self.history = []  # 历史数据缓存
        self.max_history = 1000
        
    async def collect_all(self) -> Dict:
        """采集所有数据"""
        results = {}
        
        for name, sensor in self.sensors.items():
            try:
                data = await sensor.collect()
                if "error" not in data:
                    results[name] = data
                else:
                    logger.warning(f"传感器 {name} 返回错误: {data['error']}")
            except Exception as e:
                logger.error(f"传感器 {name} 采集失败: {e}")
                
        # 添加系统信息
        results["system"] = {
            "hostname": psutil.users()[0].name if psutil.users() else "unknown",
            "uptime_seconds": time.time() - psutil.boot_time(),
            "timestamp": time.time(),
            "datetime": datetime.now().isoformat()
        }
        
        # 添加到历史记录
        self.history.append(results)
        if len(self.history) > self.max_history:
            self.history.pop(0)
            
        return results
        
    async def collect_with_interval(self, interval: int = None):
        """按间隔采集数据"""
        if interval is None:
            interval = self.collection_interval
            
        while True:
            try:
                data = await self.collect_all()
                yield data
                await asyncio.sleep(interval)
            except Exception as e:
                logger.error(f"数据采集失败: {e}")
                await asyncio.sleep(interval)

class AnomalyDetector:
    """异常检测器"""
    
    def __init__(self, thresholds: Dict = None):
        self.thresholds = thresholds or {
            "cpu": {
                "warning": 70,
                "critical": 90
            },
            "memory": {
                "warning": 80,
                "critical": 90
            },
            "disk": {
                "warning": 80,
                "critical": 95
            }
        }
        self.baseline_history = []
        
    async def detect(self, current_data: Dict) -> Dict:
        """检测异常"""
        anomalies = {
            "cpu": [],
            "memory": [],
            "disk": [],
            "network": [],
            "process": []
        }
        
        # CPU 异常检测
        cpu_data = current_data.get("cpu", {})
        if "average_utilization" in cpu_data:
            util = cpu_data["average_utilization"]
            if util > self.thresholds["cpu"]["critical"]:
                anomalies["cpu"].append({
                    "type": "high_utilization",
                    "value": util,
                    "level": "critical",
                    "message": f"CPU使用率过高: {util:.1f}%"
                })
            elif util > self.thresholds["cpu"]["warning"]:
                anomalies["cpu"].append({
                    "type": "high_utilization",
                    "value": util,
                    "level": "warning",
                    "message": f"CPU使用率偏高: {util:.1f}%"
                })
                
        # 内存异常检测
        mem_data = current_data.get("memory", {})
        if "usage_percent" in mem_data:
            usage = mem_data["usage_percent"]
            if usage > self.thresholds["memory"]["critical"]:
                anomalies["memory"].append({
                    "type": "high_usage",
                    "value": usage,
                    "level": "critical",
                    "message": f"内存使用率过高: {usage:.1f}%"
                })
            elif usage > self.thresholds["memory"]["warning"]:
                anomalies["memory"].append({
                    "type": "high_usage",
                    "value": usage,
                    "level": "warning",
                    "message": f"内存使用率偏高: {usage:.1f}%"
                })
                
        # 磁盘异常检测
        disk_data = current_data.get("disk", {})
        if "root" in disk_data:
            usage = disk_data["root"].get("usage_percent", 0)
            if usage > self.thresholds["disk"]["critical"]:
                anomalies["disk"].append({
                    "type": "low_space",
                    "value": usage,
                    "level": "critical",
                    "message": f"磁盘空间不足: {usage:.1f}% 已使用"
                })
            elif usage > self.thresholds["disk"]["warning"]:
                anomalies["disk"].append({
                    "type": "low_space",
                    "value": usage,
                    "level": "warning",
                    "message": f"磁盘空间紧张: {usage:.1f}% 已使用"
                })
                
        # 进程异常检测
        proc_data = current_data.get("process", {})
        if "top_cpu" in proc_data:
            for proc in proc_data["top_cpu"][:3]:
                cpu_percent = proc.get("cpu_percent", 0)
                if cpu_percent > 50:  # 单个进程占用超过50%
                    anomalies["process"].append({
                        "type": "high_cpu_process",
                        "pid": proc.get("pid"),
                        "name": proc.get("name"),
                        "value": cpu_percent,
                        "level": "warning",
                        "message": f"进程 {proc.get('name')}({proc.get('pid')}) CPU占用过高: {cpu_percent:.1f}%"
                    })
                    
        return anomalies

class ResourceOptimizer:
    """资源优化器"""
    
    def __init__(self):
        self.optimization_history = []
        
    async def analyze_and_optimize(self, current_data: Dict, anomalies: Dict) -> List[Dict]:
        """分析并生成优化建议"""
        optimizations = []
        
        # CPU 优化建议
        if anomalies.get("cpu"):
            cpu_anomalies = anomalies["cpu"]
            for anomaly in cpu_anomalies:
                if anomaly["type"] == "high_utilization":
                    optimizations.append({
                        "type": "cpu_optimization",
                        "priority": "high" if anomaly["level"] == "critical" else "medium",
                        "action": "identify_high_cpu_processes",
                        "description": "识别并优化高CPU使用率进程",
                        "command": "ps aux --sort=-%cpu | head -10"
                    })
                    
        # 内存优化建议
        if anomalies.get("memory"):
            mem_anomalies = anomalies["memory"]
            for anomaly in mem_anomalies:
                if anomaly["type"] == "high_usage":
                    optimizations.append({
                        "type": "memory_optimization",
                        "priority": "high" if anomaly["level"] == "critical" else "medium",
                        "action": "clear_memory_cache",
                        "description": "清理内存缓存",
                        "command": "sync && echo 3 > /proc/sys/vm/drop_caches"
                    })
                    
        # 磁盘优化建议
        if anomalies.get("disk"):
            disk_anomalies = anomalies["disk"]
            for anomaly in disk_anomalies:
                if anomaly["type"] == "low_space":
                    optimizations.append({
                        "type": "disk_optimization",
                        "priority": "high" if anomaly["level"] == "critical" else "medium",
                        "action": "find_large_files",
                        "description": "查找大文件并清理",
                        "command": "find / -type f -size +100M -exec ls -lh {} \\; 2>/dev/null | head -20"
                    })
                    
        # 进程优化建议
        if anomalies.get("process"):
            proc_anomalies = anomalies["process"]
            for anomaly in proc_anomalies:
                if anomaly["type"] == "high_cpu_process":
                    optimizations.append({
                        "type": "process_optimization",
                        "priority": "medium",
                        "action": "kill_high_cpu_process",
                        "description": f"结束高CPU进程 {anomaly['name']}({anomaly['pid']})",
                        "command": f"kill -9 {anomaly['pid']}",
                        "warning": "谨慎操作，可能影响系统稳定性"
                    })
                    
        # 记录优化历史
        if optimizations:
            self.optimization_history.append({
                "timestamp": time.time(),
                "optimizations": optimizations,
                "data_snapshot": current_data
            })
            
        return optimizations

class ResourceManagerAgent:
    """资源管理器 Agent"""
    
    def __init__(self, config_path: str = None):
        self.config = self._load_config(config_path)
        self.collector = DataCollector()
        self.detector = AnomalyDetector(self.config.get("thresholds"))
        self.optimizer = ResourceOptimizer()
        self.redis_client = None
        self.websocket_clients = []
        self.is_running = False
        
    def _load_config(self, config_path: str) -> Dict:
        """加载配置"""
        default_config = {
            "redis": {
                "host": "localhost",
                "port": 6379,
                "db": 0
            },
            "thresholds": {
                "cpu": {"warning": 70, "critical": 90},
                "memory": {"warning": 80, "critical": 90},
                "disk": {"warning": 80, "critical": 95}
            },
            "monitoring": {
                "interval_seconds": 5,
                "history_size": 1000
            }
        }
        
        if config_path:
            try:
                with open(config_path, 'r') as f:
                    user_config = yaml.safe_load(f)
                    # 合并配置
                    import copy
                    config = copy.deepcopy(default_config)
                    self._merge_config(config, user_config)
                    return config
            except Exception as e:
                logger.warning(f"加载配置文件失败: {e}")
                
        return default_config
        
    def _merge_config(self, base: Dict, update: Dict):
        """递归合并配置"""
        for key, value in update.items():
            if key in base and isinstance(base[key], dict) and isinstance(value, dict):
                self._merge_config(base[key], value)
            else:
                base[key] = value
                
    async def initialize_redis(self):
        """初始化 Redis 连接"""
        try:
            redis_config = self.config.get("redis", {})
            self.redis_client = redis.Redis(
                host=redis_config.get("host", "localhost"),
                port=redis_config.get("port", 6379),
                db=redis_config.get("db", 0),
                decode_responses=True
            )
            await self.redis_client.ping()
            logger.info("Redis 连接成功")
        except Exception as e:
            logger.error(f"Redis 连接失败: {e}")
            self.redis_client = None
            
    async def start(self):
        """启动 Agent"""
        if self.is_running:
            logger.warning("Agent 已经在运行")
            return
            
        logger.info("启动资源管理器 Agent...")
        
        # 初始化 Redis
        await self.initialize_redis()
        
        # 启动监控循环
        self.is_running = True
        asyncio.create_task(self._monitoring_loop())
        
        logger.info("资源管理器 Agent 启动完成")
        
    async def stop(self):
        """停止 Agent"""
        logger.info("停止资源管理器 Agent...")
        self.is_running = False
        
    async def _monitoring_loop(self):
        """监控循环"""
        interval = self.config.get("monitoring", {}).get("interval_seconds", 5)
        
        while self.is_running:
            try:
                # 采集数据
                data = await self.collector.collect_all()
                
                # 检测异常
                anomalies = await self.detector.detect(data)
                
                # 生成优化建议
                optimizations = await self.optimizer.analyze_and_optimize(data, anomalies)
                
                # 保存到 Redis
                if self.redis_client:
                    await self._save_to_redis(data, anomalies, optimizations)
                    
                # 广播到 WebSocket 客户端
                await self._broadcast_to_clients(data, anomalies, optimizations)
                
                # 记录日志
                if anomalies or optimizations:
                    await self._log_important_events(data, anomalies, optimizations)
                    
            except Exception as e:
                logger.error(f"监控循环出错: {e}")
                
            await asyncio.sleep(interval)
            
    async def _save_to_redis(self, data: Dict, anomalies: Dict, optimizations: List[Dict]):
        """保存数据到 Redis"""
        try:
            timestamp = int(time.time())
            
            # 保存当前状态
            await self.redis_client.setex(
                f"resource:current:{timestamp}",
                300,  # 5分钟过期
                json.dumps({
                    "data": data,
                    "anomalies": anomalies,
                    "optimizations": optimizations
                })
            )
            
            # 保存历史记录
            history_key = "resource:history"
            history_entry = {
                "timestamp": timestamp,
                "data_summary": {
                    "cpu": data.get("cpu", {}).get("average_utilization", 0),
                    "memory": data.get("memory", {}).get("usage_percent", 0),
                    "disk": data.get("disk", {}).get("root", {}).get("usage_percent", 0)
                },
                "anomaly_count": sum(len(v) for v in anomalies.values())
            }
            
            await self.redis_client.lpush(history_key, json.dumps(history_entry))
            await self.redis_client.ltrim(history_key, 0, 999)  # 保留最近1000条
            
        except Exception as e:
            logger.error(f"保存到 Redis 失败: {e}")
            
    async def _broadcast_to_clients(self, data: Dict, anomalies: Dict, optimizations: List[Dict]):
        """广播数据到 WebSocket 客户端"""
        if not self.websocket_clients:
            return
            
        message = {
            "type": "update",
            "timestamp": time.time(),
            "data": {
                "cpu": data.get("cpu", {}).get("average_utilization", 0),
                "memory": data.get("memory", {}).get("usage_percent", 0),
                "disk": data.get("disk", {}).get("root", {}).get("usage_percent", 0)
            },
            "anomalies": sum(len(v) for v in anomalies.values()),
            "optimizations": len(optimizations)
        }
        
        message_json = json.dumps(message)
        
        for client in self.websocket_clients:
            try:
                await client.send_text(message_json)
            except Exception as e:
                logger.error(f"WebSocket 发送失败: {e}")
                
    async def _log_important_events(self, data: Dict, anomalies: Dict, optimizations: List[Dict]):
        """记录重要事件"""
        if anomalies:
            logger.warning(f"检测到异常: {anomalies}")
            
        if optimizations:
            logger.info(f"生成优化建议: {len(optimizations)} 条")
            
    async def get_current_state(self) -> Dict:
        """获取当前状态"""
        data = await self.collector.collect_all()
        anomalies = await self.detector.detect(data)
        optimizations = await self.optimizer.analyze_and_optimize(data, anomalies)
        
        return {
            "timestamp": time.time(),
            "data": data,
            "anomalies": anomalies,
            "optimizations": optimizations,
            "agent": {
                "running": self.is_running,
                "clients": len(self.websocket_clients)
            }
        }
        
    async def get_history(self, limit: int = 100) -> List[Dict]:
        """获取历史数据"""
        if self.redis_client:
            try:
                history = await self.redis_client.lrange("resource:history", 0, limit-1)
                return [json.loads(item) for item in history]
            except Exception as e:
                logger.error(f"获取历史数据失败: {e}")
                
        return []
        
    def register_websocket_client(self, websocket: WebSocket):
        """注册 WebSocket 客户端"""
        self.websocket_clients.append(websocket)
        
    def unregister_websocket_client(self, websocket: WebSocket):
        """注销 WebSocket 客户端"""
        if websocket in self.websocket_clients:
            self.websocket_clients.remove(websocket)

# 全局 Agent 实例
agent = ResourceManagerAgent()

@app.on_event("startup")
async def startup_event():
    """应用启动事件"""
    logger.info("启动智能系统资源管理器 Agent...")
    await agent.start()
    
@app.on_event("shutdown")
async def shutdown_event():
    """应用关闭事件"""
    logger.info("停止智能系统资源管理器 Agent...")
    await agent.stop()

@app.get("/")
async def root():
    """根路径"""
    return {
        "name": "智能系统资源管理器 Agent",
        "version": "1.0.0",
        "description": "实时系统资源监控、分析和优化代理",
        "endpoints": {
            "/health": "健康检查",
            "/state": "获取当前状态",
            "/history": "获取历史数据",
            "/ws": "WebSocket 实时数据",
            "/optimize": "执行优化"
        }
    }

@app.get("/health")
async def health():
    """健康检查"""
    try:
        # 检查 Agent 状态
        state = await agent.get_current_state()
        
        # 检查关键指标
        cpu_util = state["data"].get("cpu", {}).get("average_utilization", 0)
        mem_util = state["data"].get("memory", {}).get("usage_percent", 0)
        
        status = "healthy"
        if cpu_util > 90 or mem_util > 90:
            status = "warning"
        if cpu_util > 95 or mem_util > 95:
            status = "critical"
            
        return {
            "status": status,
            "timestamp": time.time(),
            "agent_running": agent.is_running,
            "metrics": {
                "cpu_utilization": cpu_util,
                "memory_utilization": mem_util
            }
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "timestamp": time.time()
        }

@app.get("/state")
async def get_state():
    """获取当前系统状态"""
    try:
        state = await agent.get_current_state()
        return state
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/history")
async def get_history(limit: int = 100):
    """获取历史数据"""
    try:
        history = await agent.get_history(limit)
        return {
            "count": len(history),
            "data": history,
            "timestamp": time.time()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/optimize")
async def execute_optimization(optimization_type: str = None):
    """执行优化操作"""
    try:
        state = await agent.get_current_state()
        optimizations = state.get("optimizations", [])
        
        if not optimizations:
            return {"message": "当前没有需要执行的优化", "timestamp": time.time()}
            
        # 如果指定了优化类型，只执行该类型
        if optimization_type:
            optimizations = [o for o in optimizations if o.get("type") == optimization_type]
            
        # 这里可以添加实际的优化执行逻辑
        # 目前只返回建议
        
        return {
            "message": f"找到 {len(optimizations)} 个优化建议",
            "optimizations": optimizations,
            "timestamp": time.time(),
            "note": "实际执行需要安全验证"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket 实时数据"""
    await websocket.accept()
    agent.register_websocket_client(websocket)
    
    try:
        # 发送初始状态
        state = await agent.get_current_state()
        await websocket.send_json({
            "type": "init",
            "state": state
        })
        
        # 保持连接
        while True:
            # 定期发送心跳
            await asyncio.sleep(30)
            await websocket.send_json({
                "type": "heartbeat",
                "timestamp": time.time()
            })
            
    except WebSocketDisconnect:
        logger.info("WebSocket 客户端断开连接")
    except Exception as e:
        logger.error(f"WebSocket 错误: {e}")
    finally:
        agent.unregister_websocket_client(websocket)

@app.get("/metrics")
async def get_metrics():
    """获取监控指标（Prometheus格式）"""
    try:
        state = await agent.get_current_state()
        data = state["data"]
        
        metrics = []
        
        # CPU 指标
        cpu_data = data.get("cpu", {})
        if "average_utilization" in cpu_data:
            metrics.append(f'system_cpu_utilization{{type="average"}} {cpu_data["average_utilization"]}')
            
        # 内存指标
        mem_data = data.get("memory", {})
        if "usage_percent" in mem_data:
            metrics.append(f'system_memory_utilization {mem_data["usage_percent"]}')
            
        # 磁盘指标
        disk_data = data.get("disk", {})
        if "root" in disk_data:
            root_usage = disk_data["root"].get("usage_percent", 0)
            metrics.append(f'system_disk_usage{{mount="/"}} {root_usage}')
            
        return "\n".join(metrics)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8001,
        log_level="info"
    )