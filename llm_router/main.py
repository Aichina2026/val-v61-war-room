#!/usr/bin/env python3
"""
OpenClaw LLM 路由系统主入口
轻量级、高可用的多提供商 AI 路由网关
"""

import asyncio
import json
import logging
from typing import Dict, List, Optional, Any
import time
import hashlib

import aiohttp
import redis.asyncio as redis
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import StreamingResponse
import yaml

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="OpenClaw LLM Router",
    description="多提供商 AI 路由网关",
    version="1.0.0"
)

class LLMProvider:
    """LLM 提供商基类"""
    
    def __init__(self, name: str, base_url: str, api_keys: List[str], 
                 priority: int = 1, timeout: int = 120, 
                 max_retries: int = 3):
        self.name = name
        self.base_url = base_url
        self.api_keys = api_keys
        if not api_keys:
            self.enabled = False
            logger.warning(f"{name} 未配置 API Key，已禁用")
        else:
            self.enabled = True
            
        self.priority = priority
        self.timeout = timeout
        self.max_retries = max_retries
        # 轮询索引
        self.key_index = 0
        self.key_errors = {}  # 记录每个 Key 的错误次数
        self.circuit_breaker = {}  # 熔断器状态
        
    def get_next_key(self) -> Optional[str]:
        """获取下一个可用的 API Key"""
        if not self.enabled or not self.api_keys:
            return None
            
        # 检查熔断器
        if self.key_index in self.circuit_breaker:
            # 检查是否可以恢复
            if time.time() > self.circuit_breaker[self.key_index]:
                del self.circuit_breaker[self.key_index]
                self.key_errors[self.key_index] = 0
            else:
                # 跳过被熔断的 Key
                self.key_index = (self.key_index + 1) % len(self.api_keys)
        
        key = self.api_keys[self.key_index]
        self.key_index = (self.key_index + 1) % len(self.api_keys)
        return key
        
    async def make_request(self, endpoint: str, data: Dict, 
                          api_key: str = None) -> Dict:
        """向提供商发送请求"""
        raise NotImplementedError
        
    async def stream_request(self, endpoint: str, data: Dict,
                           api_key: str = None) -> Any:
        """流式请求"""
        raise NotImplementedError

class OpenAICloneProvider(LLMProvider):
    """兼容 OpenAI API 的提供商"""
    
    async def make_request(self, endpoint: str, data: Dict, 
                          api_key: str = None) -> Dict:
        """发送请求到兼容 OpenAI API 的端点"""
        if not api_key:
            api_key = self.get_next_key()
            if not api_key:
                raise ValueError(f"{self.name} 没有可用的 API Key")
                
        url = f"{self.base_url}/{endpoint}" if endpoint else self.base_url
        
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        async with aiohttp.ClientSession() as session:
            try:
                async with session.post(
                    url, 
                    json=data, 
                    headers=headers,
                    timeout=aiohttp.ClientTimeout(total=self.timeout)
                ) as response:
                    
                    if response.status != 200:
                        error_text = await response.text()
                        logger.error(f"{self.name} 请求失败: {error_text}")
                        
                        # 记录错误
                        key_idx = self.api_keys.index(api_key)
                        self.key_errors[key_idx] = self.key_errors.get(key_idx, 0) + 1
                        
                        if self.key_errors[key_idx] >= 3:
                            # 触发熔断，冷却 60 秒
                            self.circuit_breaker[key_idx] = time.time() + 60
                            
                        raise HTTPException(
                            status_code=response.status,
                            detail=f"{self.name} 错误: {error_text}"
                        )
                        
                    result = await response.json()
                    return result
                    
            except asyncio.TimeoutError:
                logger.error(f"{self.name} 请求超时")
                raise HTTPException(status_code=504, detail="请求超时")
            except Exception as e:
                logger.error(f"{self.name} 请求异常: {e}")
                raise HTTPException(status_code=500, detail=str(e))
                
    async def stream_request(self, endpoint: str, data: Dict,
                           api_key: str = None):
        """流式请求"""
        if not api_key:
            api_key = self.get_next_key()
            if not api_key:
                raise ValueError(f"{self.name} 没有可用的 API Key")
                
        url = f"{self.base_url}/{endpoint}" if endpoint else self.base_url
        
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        session = aiohttp.ClientSession()
        try:
            response = await session.post(
                url,
                json=data,
                headers=headers,
                timeout=aiohttp.ClientTimeout(total=self.timeout)
            )
            
            if response.status != 200:
                error_text = await response.text()
                await session.close()
                raise HTTPException(
                    status_code=response.status,
                    detail=f"{self.name} 错误: {error_text}"
                )
                
            return response
            
        except Exception as e:
            await session.close()
            raise

class RouterManager:
    """路由管理器"""
    
    def __init__(self, config_path: str = "config/settings.yaml"):
        self.providers: Dict[str, LLMProvider] = {}
        self.redis_client: Optional[redis.Redis] = None
        self.cache_enabled = True
        self.config = self.load_config(config_path)
        self.initialize_redis()
        self.initialize_providers()
        
    def load_config(self, config_path: str) -> Dict:
        """加载配置文件"""
        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                return yaml.safe_load(f)
        except FileNotFoundError:
            logger.warning(f"配置文件 {config_path} 不存在，使用默认配置")
            return self.get_default_config()
        except Exception as e:
            logger.error(f"加载配置文件失败: {e}")
            return self.get_default_config()
            
    def get_default_config(self) -> Dict:
        """获取默认配置"""
        return {
            "redis": {
                "host": "localhost",
                "port": 6379,
                "password": None,
                "db": 0
            },
            "cache": {
                "enabled": True,
                "ttl": 3600,
                "max_size": 10000
            },
            "providers": {
                "foursapi": {
                    "name": "4Sapi NewAPI",
                    "base_url": "https://4sapi.com/v1",
                    "api_keys": [],  # 需要用户配置
                    "priority": 1,
                    "timeout": 120,
                    "max_retries": 3,
                    "enabled": True
                },
                "openrouter": {
                    "name": "OpenRouter",
                    "base_url": "https://openrouter.ai/api/v1",
                    "api_keys": [],
                    "priority": 2,
                    "timeout": 150,
                    "max_retries": 3,
                    "enabled": True
                }
            }
        }
        
    def initialize_redis(self):
        """初始化 Redis 连接"""
        try:
            redis_config = self.config.get("redis", {})
            self.redis_client = redis.Redis(
                host=redis_config.get("host", "localhost"),
                port=redis_config.get("port", 6379),
                password=redis_config.get("password"),
                db=redis_config.get("db", 0),
                decode_responses=True
            )
            
            # 测试连接
            loop = asyncio.get_event_loop()
            if loop.is_running():
                # 如果是运行中的事件循环，创建新任务
                loop.create_task(self.test_redis())
            else:
                # 否则直接运行
                loop.run_until_complete(self.test_redis())
                
        except Exception as e:
            logger.error(f"Redis 连接失败: {e}")
            self.cache_enabled = False
            
    async def test_redis(self):
        """测试 Redis 连接"""
        try:
            await self.redis_client.ping()
            logger.info("Redis 连接成功")
        except Exception as e:
            logger.error(f"Redis 连接测试失败: {e}")
            self.cache_enabled = False
            
    def initialize_providers(self):
        """初始化提供商"""
        providers_config = self.config.get("providers", {})
        
        for key, config in providers_config.items():
            if not config.get("enabled", True):
                continue
                
            api_keys = config.get("api_keys", [])
            if not api_keys:
                logger.warning(f"{config.get('name', key)} 未配置 API Key，跳过")
                continue
                
            provider = OpenAICloneProvider(
                name=config.get("name", key),
                base_url=config.get("base_url", ""),
                api_keys=api_keys,
                priority=config.get("priority", 1),
                timeout=config.get("timeout", 120),
                max_retries=config.get("max_retries", 3)
            )
            
            self.providers[key] = provider
            logger.info(f"初始化提供商: {provider.name}")
            
    def generate_cache_key(self, request_data: Dict) -> str:
        """生成缓存键"""
        # 序列化请求数据
        data_str = json.dumps(request_data, sort_keys=True)
        
        # 计算哈希
        hash_obj = hashlib.md5(data_str.encode())
        
        # 生成缓存键
        cache_key = f"llm_cache:{hash_obj.hexdigest()}"
        
        return cache_key
        
    async def get_cached_response(self, cache_key: str) -> Optional[Dict]:
        """获取缓存的响应"""
        if not self.cache_enabled or not self.redis_client:
            return None
            
        try:
            cached_data = await self.redis_client.get(cache_key)
            if cached_data:
                logger.info(f"缓存命中: {cache_key}")
                return json.loads(cached_data)
        except Exception as e:
            logger.error(f"获取缓存失败: {e}")
            
        return None
        
    async def set_cached_response(self, cache_key: str, 
                                 response_data: Dict,
                                 ttl: int = 3600):
        """设置缓存响应"""
        if not self.cache_enabled or not self.redis_client:
            return
            
        try:
            cache_data = json.dumps(response_data)
            await self.redis_client.setex(cache_key, ttl, cache_data)
            logger.info(f"缓存设置: {cache_key}")
        except Exception as e:
            logger.error(f"设置缓存失败: {e}")
            
    async def route_request(self, model: str, messages: List[Dict],
                          stream: bool = False, **kwargs) -> Any:
        """路由请求到合适的提供商"""
        
        # 1. 生成缓存键
        request_data = {
            "model": model,
            "messages": messages,
            "stream": stream,
            **kwargs
        }
        
        cache_key = self.generate_cache_key(request_data)
        
        # 2. 检查缓存（非流式请求）
        if not stream:
            cached_response = await self.get_cached_response(cache_key)
            if cached_response:
                return cached_response
                
        # 3. 选择合适的提供商
        # 这里简化处理，实际可以根据模型名称、提供商优先级等选择
        provider = None
        
        # 先尝试 4Sapi
        if "foursapi" in self.providers:
            provider = self.providers["foursapi"]
        # 其次 OpenRouter
        elif "openrouter" in self.providers:
            provider = self.providers["openrouter"]
        else:
            # 取第一个可用的提供商
            for prov in self.providers.values():
                if prov.enabled:
                    provider = prov
                    break
                    
        if not provider:
            raise HTTPException(status_code=503, 
                              detail="没有可用的 AI 提供商")
                              
        # 4. 发送请求
        api_key = provider.get_next_key()
        
        if stream:
            # 流式响应
            response = await provider.stream_request(
                endpoint="chat/completions",
                data=request_data,
                api_key=api_key
            )
            
            async def stream_generator():
                try:
                    buffer = ""
                    async for chunk in response.content.iter_chunks():
                        chunk_bytes, _ = chunk
                        
                        # 处理流式数据
                        try:
                            buffer += chunk_bytes.decode('utf-8')
                            
                            # 按行分割
                            lines = buffer.split('\n')
                            buffer = lines[-1]  # 保存未完成的行
                            
                            for line in lines[:-1]:
                                line = line.strip()
                                if line.startswith('data: '):
                                    data = line[6:]
                                    if data == '[DONE]':
                                        break
                                        
                                    try:
                                        json_data = json.loads(data)
                                        yield f"data: {json.dumps(json_data)}\n\n"
                                    except:
                                        pass
                                        
                        except UnicodeDecodeError:
                            # 等待更多数据
                            continue
                            
                finally:
                    if response:
                        response.close()
                        
            return StreamingResponse(
                stream_generator(),
                media_type="text/event-stream"
            )
            
        else:
            # 非流式响应
            response = await provider.make_request(
                endpoint="chat/completions",
                data=request_data,
                api_key=api_key
            )
            
            # 5. 缓存响应
            if self.cache_enabled:
                await self.set_cached_response(cache_key, response)
                
            return response
            
    async def health_check(self) -> Dict:
        """健康检查"""
        status = {
            "status": "healthy",
            "timestamp": time.time(),
            "providers": {},
            "cache": "enabled" if self.cache_enabled else "disabled"
        }
        
        # 检查提供商状态
        for key, provider in self.providers.items():
            provider_status = {
                "enabled": provider.enabled,
                "available_keys": len(provider.api_keys) 
                if provider.api_keys else 0
            }
            
            status["providers"][key] = provider_status
            
        # 检查缓存状态
        if self.cache_enabled and self.redis_client:
            try:
                await self.redis_client.ping()
                status["cache"] = "connected"
            except:
                status["cache"] = "disconnected"
                
        return status

# 全局路由管理器实例
router: Optional[RouterManager] = None

@app.on_event("startup")
async def startup_event():
    """应用启动事件"""
    global router
    
    logger.info("启动 OpenClaw LLM 路由系统...")
    
    # 初始化路由管理器
    router = RouterManager()
    
    # 检查提供商状态
    if not router.providers:
        logger.warning("没有可用的 AI 提供商，请配置 API Key")
        
    logger.info("OpenClaw LLM 路由系统启动完成")
    
@app.get("/")
async def root():
    """根路径"""
    return {
        "name": "OpenClaw LLM Router",
        "version": "1.0.0",
        "description": "多提供商 AI 路由网关",
        "status": "running"
    }
    
@app.get("/health")
async def health():
    """健康检查端点"""
    if router:
        return await router.health_check()
    else:
        return {"status": "initializing"}
        
@app.post("/v1/chat/completions")
async def chat_completions(request: Request):
    """Chat completions 端点，兼容 OpenAI API"""
    
    if not router:
        raise HTTPException(status_code=503, detail="路由器正在初始化")
        
    # 解析请求数据
    try:
        request_data = await request.json()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"无效的请求数据: {e}")
        
    # 提取必要字段
    model = request_data.get("model", "gpt-3.5-turbo")
    messages = request_data.get("messages", [])
    stream = request_data.get("stream", False)
    
    if not messages:
        raise HTTPException(status_code=400, detail="messages 字段不能为空")
        
    # 路由请求
    try:
        response = await router.route_request(
            model=model,
            messages=messages,
            stream=stream,
            **request_data
        )
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"路由请求失败: {e}")
        raise HTTPException(status_code=500, detail=f"内部服务器错误: {e}")
        
@app.get("/stats")
async def get_stats():
    """获取统计信息"""
    if not router or not router.redis_client:
        return {"error": "路由器未初始化"}
        
    try:
        # 获取缓存统计
        stats = {}
        
        # 获取缓存键数（示例）
        keys = await router.redis_client.keys("llm_cache:*")
        stats["cache_keys"] = len(keys)
        
        # 获取提供商状态
        providers_stats = {}
        for key, provider in router.providers.items():
            providers_stats[key] = {
                "enabled": provider.enabled,
                "key_count": len(provider.api_keys),
                "priority": provider.priority
            }
            
        stats["providers"] = providers_stats
        
        return stats
        
    except Exception as e:
        logger.error(f"获取统计信息失败: {e}")
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    
    # 启动服务
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )