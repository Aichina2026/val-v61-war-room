#!/usr/bin/env python3
"""
Redis缓存管理器
提供高性能缓存服务
"""

import json
import pickle
import hashlib
import datetime
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, field
import asyncio

try:
    import redis.asyncio as redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    print("警告: redis-py未安装，缓存功能将受限")

@dataclass
class CacheConfig:
    """缓存配置"""
    # Redis连接
    host: str = "localhost"
    port: int = 6379
    db: int = 0
    password: str = None
    ssl: bool = False
    
    # 连接池
    max_connections: int = 10
    socket_timeout: int = 5
    socket_connect_timeout: int = 5
    
    # 缓存策略
    default_ttl: int = 3600  # 默认1小时
    max_ttl: int = 86400 * 7  # 最大7天
    min_ttl: int = 60  # 最小1分钟
    
    # 内存缓存
    enable_memory_cache: bool = True
    memory_cache_size: int = 1000
    memory_cache_ttl: int = 300  # 5分钟

class CacheManager:
    """缓存管理器"""
    
    def __init__(self, config: CacheConfig = None):
        self.config = config or CacheConfig()
        self.redis_client = None
        self.memory_cache = {}
        self.cache_hits = 0
        self.cache_misses = 0
        
        if REDIS_AVAILABLE:
            self._init_redis_client()
    
    def _init_redis_client(self):
        """初始化Redis客户端"""
        try:
            self.redis_client = redis.Redis(
                host=self.config.host,
                port=self.config.port,
                db=self.config.db,
                password=self.config.password,
                ssl=self.config.ssl,
                max_connections=self.config.max_connections,
                socket_timeout=self.config.socket_timeout,
                socket_connect_timeout=self.config.socket_connect_timeout,
                decode_responses=False,  # 保留原始字节
                health_check_interval=30
            )
            print(f"✅ Redis客户端初始化成功: {self.config.host}:{self.config.port}")
        except Exception as e:
            print(f"❌ Redis客户端初始化失败: {e}")
            self.redis_client = None
    
    async def ping(self) -> bool:
        """检查Redis连接"""
        if not self.redis_client:
            return False
        
        try:
            return await self.redis_client.ping()
        except Exception:
            return False
    
    def _generate_cache_key(self, prefix: str, *args, **kwargs) -> str:
        """生成缓存键"""
        # 序列化参数
        key_parts = [prefix]
        
        # 添加位置参数
        for arg in args:
            if isinstance(arg, (str, int, float, bool)):
                key_parts.append(str(arg))
            else:
                key_parts.append(hashlib.md5(str(arg).encode()).hexdigest()[:8])
        
        # 添加关键字参数
        if kwargs:
            sorted_kwargs = sorted(kwargs.items())
            for key, value in sorted_kwargs:
                if isinstance(value, (str, int, float, bool)):
                    key_parts.append(f"{key}:{value}")
                else:
                    val_hash = hashlib.md5(str(value).encode()).hexdigest()[:8]
                    key_parts.append(f"{key}:{val_hash}")
        
        return ":".join(key_parts)
    
    def _serialize_value(self, value: Any) -> bytes:
        """序列化值"""
        try:
            # 尝试JSON序列化
            return json.dumps(value, ensure_ascii=False).encode('utf-8')
        except (TypeError, ValueError):
            # 回退到pickle
            return pickle.dumps(value)
    
    def _deserialize_value(self, data: bytes) -> Any:
        """反序列化值"""
        if not data:
            return None
        
        try:
            # 尝试JSON反序列化
            return json.loads(data.decode('utf-8'))
        except (json.JSONDecodeError, UnicodeDecodeError):
            try:
                # 回退到pickle
                return pickle.loads(data)
            except pickle.UnpicklingError:
                return data
    
    async def get(self, key: str, default: Any = None) -> Any:
        """获取缓存值"""
        # 先检查内存缓存
        if self.config.enable_memory_cache:
            cache_entry = self.memory_cache.get(key)
            if cache_entry:
                if cache_entry['expires_at'] > datetime.datetime.now():
                    self.cache_hits += 1
                    return cache_entry['value']
                else:
                    # 内存缓存已过期
                    del self.memory_cache[key]
        
        # 检查Redis缓存
        if self.redis_client:
            try:
                data = await self.redis_client.get(key)
                if data is not None:
                    value = self._deserialize_value(data)
                    
                    # 更新内存缓存
                    if self.config.enable_memory_cache:
                        self.memory_cache[key] = {
                            'value': value,
                            'expires_at': datetime.datetime.now() + datetime.timedelta(
                                seconds=self.config.memory_cache_ttl
                            )
                        }
                        # 限制内存缓存大小
                        if len(self.memory_cache) > self.config.memory_cache_size:
                            # 移除最旧的条目
                            oldest_key = min(
                                self.memory_cache.keys(), 
                                key=lambda k: self.memory_cache[k]['expires_at']
                            )
                            del self.memory_cache[oldest_key]
                    
                    self.cache_hits += 1
                    return value
            except Exception as e:
                print(f"❌ Redis获取失败: {e}")
        
        self.cache_misses += 1
        return default
    
    async def set(self, key: str, value: Any, ttl: int = None) -> bool:
        """设置缓存值"""
        if ttl is None:
            ttl = self.config.default_ttl
        
        # 限制TTL范围
        ttl = max(self.config.min_ttl, min(ttl, self.config.max_ttl))
        
        # 更新内存缓存
        if self.config.enable_memory_cache:
            self.memory_cache[key] = {
                'value': value,
                'expires_at': datetime.datetime.now() + datetime.timedelta(
                    seconds=min(ttl, self.config.memory_cache_ttl)
                )
            }
        
        # 更新Redis缓存
        if self.redis_client:
            try:
                data = self._serialize_value(value)
                result = await self.redis_client.setex(key, ttl, data)
                return bool(result)
            except Exception as e:
                print(f"❌ Redis设置失败: {e}")
                return False
        
        return True
    
    async def delete(self, key: str) -> bool:
        """删除缓存值"""
        # 从内存缓存删除
        if key in self.memory_cache:
            del self.memory_cache[key]
        
        # 从Redis删除
        if self.redis_client:
            try:
                result = await self.redis_client.delete(key)
                return bool(result)
            except Exception as e:
                print(f"❌ Redis删除失败: {e}")
        
        return True
    
    async def exists(self, key: str) -> bool:
        """检查键是否存在"""
        # 检查内存缓存
        if self.config.enable_memory_cache and key in self.memory_cache:
            if self.memory_cache[key]['expires_at'] > datetime.datetime.now():
                return True
            else:
                del self.memory_cache[key]
        
        # 检查Redis
        if self.redis_client:
            try:
                return await self.redis_client.exists(key) > 0
            except Exception as e:
                print(f"❌ Redis存在检查失败: {e}")
        
        return False
    
    async def expire(self, key: str, ttl: int) -> bool:
        """设置过期时间"""
        if self.redis_client:
            try:
                return await self.redis_client.expire(key, ttl)
            except Exception as e:
                print(f"❌ Redis设置过期时间失败: {e}")
        
        return False
    
    async def increment(self, key: str, amount: int = 1) -> Optional[int]:
        """递增计数器"""
        if self.redis_client:
            try:
                return await self.redis_client.incrby(key, amount)
            except Exception as e:
                print(f"❌ Redis递增失败: {e}")
        
        return None
    
    async def get_stats(self) -> Dict[str, Any]:
        """获取缓存统计信息"""
        stats = {
            "cache_hits": self.cache_hits,
            "cache_misses": self.cache_misses,
            "hit_rate": self.cache_hits / (self.cache_hits + self.cache_misses) 
                if (self.cache_hits + self.cache_misses) > 0 else 0,
            "memory_cache_size": len(self.memory_cache),
            "redis_connected": await self.ping() if self.redis_client else False
        }
        
        # 获取Redis内存信息
        if self.redis_client and await self.ping():
            try:
                info = await self.redis_client.info('memory')
                stats.update({
                    "redis_used_memory": info.get('used_memory', 0),
                    "redis_used_memory_human": info.get('used_memory_human', '0B'),
                    "redis_maxmemory": info.get('maxmemory', 0),
                    "redis_maxmemory_human": info.get('maxmemory_human', '0B')
                })
            except Exception as e:
                stats["redis_info_error"] = str(e)
        
        return stats

class ModelResponseCache:
    """模型响应缓存"""
    
    def __init__(self, cache_manager: CacheManager = None):
        self.cache = cache_manager or CacheManager()
        self.cache_prefix = "model_response"
    
    def _generate_input_hash(self, model_id: str, input_text: str, 
                           parameters: Dict[str, Any] = None) -> str:
        """生成输入哈希"""
        input_data = f"{model_id}:{input_text}"
        if parameters:
            # 排序参数以确保一致性
            sorted_params = json.dumps(parameters, sort_keys=True)
            input_data += f":{sorted_params}"
        
        return hashlib.sha256(input_data.encode()).hexdigest()[:32]
    
    async def get_response(self, model_id: str, input_text: str, 
                         parameters: Dict[str, Any] = None) -> Optional[Dict[str, Any]]:
        """获取缓存的模型响应"""
        input_hash = self._generate_input_hash(model_id, input_text, parameters)
        cache_key = f"{self.cache_prefix}:{model_id}:{input_hash}"
        
        cached_data = await self.cache.get(cache_key)
        if cached_data:
            # 检查是否过期
            if cached_data.get('expires_at', 0) > datetime.datetime.now().timestamp():
                return cached_data.get('response')
        
        return None
    
    async def cache_response(self, model_id: str, input_text: str, 
                           response: Dict[str, Any], parameters: Dict[str, Any] = None,
                           ttl: int = 3600) -> bool:
        """缓存模型响应"""
        input_hash = self._generate_input_hash(model_id, input_text, parameters)
        cache_key = f"{self.cache_prefix}:{model_id}:{input_hash}"
        
        cache_data = {
            'response': response,
            'model_id': model_id,
            'input_hash': input_hash,
            'cached_at': datetime.datetime.now().isoformat(),
            'expires_at': (datetime.datetime.now() + datetime.timedelta(seconds=ttl)).timestamp(),
            'parameters': parameters or {}
        }
        
        return await self.cache.set(cache_key, cache_data, ttl)
    
    async def clear_model_cache(self, model_id: str) -> int:
        """清除特定模型的缓存"""
        if not self.cache.redis_client:
            return 0
        
        try:
            # 使用Redis的SCAN命令查找并删除相关键
            pattern = f"{self.cache_prefix}:{model_id}:*"
            deleted_count = 0
            
            async for key in self.cache.redis_client.scan_iter(match=pattern):
                await self.cache.delete(key)
                deleted_count += 1
            
            return deleted_count
        except Exception as e:
            print(f"❌ 清除模型缓存失败: {e}")
            return 0

class SearchResultCache:
    """搜索结果缓存"""
    
    def __init__(self, cache_manager: CacheManager = None):
        self.cache = cache_manager or CacheManager()
        self.cache_prefix = "search_result"
    
    def _generate_query_hash(self, query: str, sources: List[str] = None, 
                           filters: Dict[str, Any] = None) -> str:
        """生成查询哈希"""
        query_data = query
        if sources:
            query_data += f":{','.join(sorted(sources))}"
        if filters:
            sorted_filters = json.dumps(filters, sort_keys=True)
            query_data += f":{sorted_filters}"
        
        return hashlib.sha256(query_data.encode()).hexdigest()[:32]
    
    async def get_results(self, query: str, sources: List[str] = None,
                         filters: Dict[str, Any] = None) -> Optional[Dict[str, Any]]:
        """获取缓存的搜索结果"""
        query_hash = self._generate_query_hash(query, sources, filters)
        cache_key = f"{self.cache_prefix}:{query_hash}"
        
        cached_data = await self.cache.get(cache_key)
        if cached_data:
            # 检查是否过期（搜索结果TTL较短）
            if cached_data.get('expires_at', 0) > datetime.datetime.now().timestamp():
                return cached_data.get('results')
        
        return None
    
    async def cache_results(self, query: str, results: Dict[str, Any], 
                          sources: List[str] = None, filters: Dict[str, Any] = None,
                          ttl: int = 300) -> bool:  # 搜索结果默认5分钟
        """缓存搜索结果"""
        query_hash = self._generate_query_hash(query, sources, filters)
        cache_key = f"{self.cache_prefix}:{query_hash}"
        
        cache_data = {
            'results': results,
            'query': query,
            'query_hash': query_hash,
            'sources': sources or [],
            'filters': filters or {},
            'cached_at': datetime.datetime.now().isoformat(),
            'expires_at': (datetime.datetime.now() + datetime.timedelta(seconds=ttl)).timestamp()
        }
        
        return await self.cache.set(cache_key, cache_data, ttl)

class RateLimiter:
    """速率限制器"""
    
    def __init__(self, cache_manager: CacheManager = None):
        self.cache = cache_manager or CacheManager()
        self.cache_prefix = "rate_limit"
    
    async def check_rate_limit(self, key: str, limit: int, window: int) -> Dict[str, Any]:
        """
        检查速率限制
        
        Args:
            key: 限制键（如user_id:endpoint）
            limit: 时间窗口内允许的最大请求数
            window: 时间窗口（秒）
        
        Returns:
            Dict包含是否允许、剩余请求数等信息
        """
        cache_key = f"{self.cache_prefix}:{key}"
        
        # 获取当前计数
        current_count = await self.cache.get(cache_key) or 0
        
        if current_count >= limit:
            # 超过限制
            return {
                "allowed": False,
                "limit": limit,
                "remaining": 0,
                "reset_in": await self._get_reset_time(cache_key, window),
                "current": current_count
            }
        
        # 增加计数（如果是第一次，设置过期时间）
        if current_count == 0:
            await self.cache.set(cache_key, 1, window)
        else:
            await self.cache.increment(cache_key)
        
        return {
            "allowed": True,
            "limit": limit,
            "remaining": limit - current_count - 1,
            "reset_in": await self._get_reset_time(cache_key, window),
            "current": current_count + 1
        }
    
    async def _get_reset_time(self, cache_key: str, window: int) -> int:
        """获取重置时间（剩余秒数）"""
        if self.cache.redis_client:
            try:
                ttl = await self.cache.redis_client.ttl(cache_key)
                return max(0, ttl)
            except Exception:
                pass
        
        return window

# 测试函数
async def test_cache_manager():
    """测试缓存管理器"""
    print("测试缓存管理器...")
    
    # 创建缓存管理器
    cache = CacheManager()
    
    # 测试基本操作
    test_key = "test:basic"
    test_value = {"message": "Hello, Cache!", "timestamp": datetime.datetime.now().isoformat()}
    
    # 设置缓存
    success = await cache.set(test_key, test_value, ttl=60)
    print(f"✅ 设置缓存: {success}")
    
    # 获取缓存
    cached_value = await cache.get(test_key)
    print(f"✅ 获取缓存: {cached_value == test_value}")
    
    # 检查存在性
    exists = await cache.exists(test_key)
    print(f"✅ 检查存在: {exists}")
    
    # 获取统计信息
    stats = await cache.get_stats()
    print(f"✅ 缓存统计: {stats}")
    
    # 测试模型响应缓存
    model_cache = ModelResponseCache(cache)
    
    model_id = "test-model-1"
    input_text = "什么是人工智能？"
    response = {
        "answer": "人工智能是模拟人类智能的计算机系统...",
        "confidence": 0.92,
        "sources": ["source1", "source2"]
    }
    
    # 缓存响应
    await model_cache.cache_response(model_id, input_text, response, ttl=30)
    print("✅ 模型响应已缓存")
    
    # 获取缓存的响应
    cached_response = await model_cache.get_response(model_id, input_text)
    print(f"✅ 获取缓存响应: {cached_response is not None}")
    
    # 测试搜索结果缓存
    search_cache = SearchResultCache(cache)
    
    query = "2026年AI趋势"
    results = {
        "total": 150,
        "results": [
            {"title": "趋势1", "score": 0.95},
            {"title": "趋势2", "score": 0.88}
        ]
    }
    
    # 缓存搜索结果
    await search_cache.cache_results(query, results, ttl=30)
    print("✅ 搜索结果已缓存")
    
    # 获取缓存的搜索结果
    cached_results = await search_cache.get_results(query)
    print(f"✅ 获取缓存搜索结果: {cached_results is not None}")
    
    # 测试速率限制
    rate_limiter = RateLimiter(cache)
    
    limit_key = "user123:/api/tasks"
    limit_result = await rate_limiter.check_rate_limit(limit_key, limit=5, window=60)
    print(f"✅ 速率限制检查: {limit_result}")
    
    print("🎉 所有缓存测试通过!")

if __name__ == "__main__":
    # 运行测试
    asyncio.run(test_cache_manager())