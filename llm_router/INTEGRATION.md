# OpenClaw LLM 路由系统集成指南

## 概述
本文档介绍如何将 LLM 路由系统集成到现有的 OpenClaw 系统中，包括配置、替换方案和迁移策略。

## 1. 系统兼容性

### 1.1 当前系统状态
- **OpenClaw 版本**: 2026.4.8
- **运行状态**: Gateway 运行中 (ws://127.0.0.1:18789)
- **资源配置**: 2核4GB
- **存储目录**: `/root/.openclaw/`

### 1.2 重叠组件分析

| 当前组件 | 功能描述 | 路由系统替代 | 替换策略 |
|---------|---------|------------|---------|
| `provider-stream.js` | 提供商流式处理 | `OpenAICloneProvider` | 渐进替换，保持API兼容 |
| `prepare.js` | 请求预处理 | `RouterManager.route_request()` | 功能合并，代码迁移 |
| `http-registry.js` | HTTP请求管理 | 集成到路由系统中 | 接口适配层 |

## 2. 集成步骤

### 2.1 阶段一: 并行部署 (1-2周)

#### 步骤 1: 安装路由系统
```bash
# 进入 OpenClaw 工作目录
cd /root/.openclaw/workspace

# 部署路由系统
cd llm_router
chmod +x deploy.sh
./deploy.sh
```

#### 步骤 2: 配置提供商 API Key
编辑 `config/settings.yaml`:
```yaml
providers:
  foursapi:
    api_keys:
      - "你的实际Key1"
      - "你的实际Key2"
      - "你的实际Key3"
      - "你的实际Key4"
      - "你的实际Key5"
    enabled: true
```

#### 步骤 3: 创建 API 代理层
```python
# 在 /root/.openclaw/workspace/llm_router/api_proxy.py
from fastapi import FastAPI, HTTPException
import httpx

app = FastAPI()

# 代理到旧系统和新系统的中间件
class APIRouter:
    def __init__(self):
        self.legacy_url = "http://localhost:18789"
        self.new_router_url = "http://localhost:8000"
        self.traffic_split = 0.2  # 20% 流量到新系统
        
    async def route_request(self, request_data: dict):
        # 根据配置分配流量
        if random.random() < self.traffic_split:
            # 发送到新路由系统
            return await self.forward_to_new_router(request_data)
        else:
            # 发送到旧系统
            return await self.forward_to_legacy(request_data)
```

### 2.2 阶段二: 流量切换 (3-4周)

#### 步骤 1: 增加新系统流量
```yaml
# config/settings.yaml
routing:
  traffic_split: 0.5  # 50% 流量到新系统
  # 监控指标
  metrics:
    enable: true
    legacy_success_rate: 95%
    new_success_rate: 98%
```

#### 步骤 2: 逐步替换核心功能
```bash
# 1. 替换消息预处理
cp /root/.openclaw/workspace/llm_router/core/preprocess.py \
   /usr/lib/node_modules/openclaw/dist/legacy_prepare.js

# 2. 替换提供商接口
cp /root/.openclaw/workspace/llm_router/core/provider_adapter.py \
   /usr/lib/node_modules/openclaw/dist/legacy_provider.js
```

### 2.3 阶段三: 完整替换 (5-6周)

#### 步骤 1: 禁用旧路由功能
```javascript
// /usr/lib/node_modules/openclaw/dist/legacy_provider.js
module.exports = {
  handleRequest: async function(request) {
    // 直接转发到新路由系统
    const response = await fetch('http://localhost:8000/v1/chat/completions', {
      method: 'POST',
      body: JSON.stringify(request)
    });
    
    return response.json();
  }
};
```

#### 步骤 2: 数据迁移
```python
# 迁移缓存数据
import redis
import json

old_redis = redis.Redis(host='localhost', port=6379, db=0)
new_redis = redis.Redis(host='localhost', port=6379, db=1)

# 迁移缓存数据
for key in old_redis.keys('cache:*'):
    data = old_redis.get(key)
    new_redis.set(key, data, ex=3600)
```

## 3. 配置示例

### 3.1 环境变量配置
```bash
# .env 文件
OPENCLAW_LLM_ROUTER_HOST=localhost
OPENCLAW_LLM_ROUTER_PORT=8000

# Redis 配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# 提供商配置
FOURSAPI_KEYS=key1,key2,key3,key4,key5
OPENROUTER_KEYS=key1,key2,key3,key4,key5
```

### 3.2 OpenClaw 集成配置
```json
// /root/.openclaw/openclaw.json
{
  "llm_router": {
    "enabled": true,
    "host": "localhost",
    "port": 8000,
    "fallback_to_legacy": true,
    "enable_caching": true,
    "cache_ttl": 3600,
    "providers": {
      "foursapi": {
        "enabled": true,
        "priority": 1
      },
      "openrouter": {
        "enabled": true,
        "priority": 2
      }
    }
  }
}
```

## 4. 迁移检查清单

### ✅ 准备阶段
- [ ] 备份当前 OpenClaw 配置和数据
- [ ] 确认 Redis 服务正常运行
- [ ] 配置提供商 API Key
- [ ] 测试新路由系统基础功能

### 🔄 集成阶段
- [ ] 部署路由系统并验证健康检查
- [ ] 配置流量分配策略
- [ ] 启用监控指标收集
- [ ] 测试故障转移机制



### 🚀 切换阶段
- [ ] 逐步增加新系统流量 (20% → 50% → 80% → 100%)
- [ ] 监控性能和错误率
- [ ] 优化配置参数
- [ ] 验证数据一致性



### 🎉 完成阶段
- [ ] 确认新系统稳定运行
- [ ] 停用旧路由组件
- [ ] 清理临时文件和配置
- [ ] 更新系统文档

## 5. 故障排除

### 5.1 常见问题

#### 问题 1: 连接 Redis 失败
```
症状: Redis connection failed
解决:
1. 检查 Redis 服务是否运行: systemctl status redis
2. 检查网络连接: telnet localhost 6379
3. 验证配置文件中的 host 和 port
```

#### 问题 2: 提供商 API Key 无效
```
症状: Provider authentication failed
解决:
1. 验证 API Key 是否正确
2. 检查提供商服务状态
3. 确认 Key 有足够的额度
```

#### 问题 3: 缓存不生效
```
症状: Cache not working
解决:
1. 确认 cache.enabled 为 true
2. 检查 Redis 连接状态
3. 验证缓存 Key 生成逻辑
```

### 5.2 回滚步骤

如果遇到问题需要回滚到旧系统:

```bash
# 1. 停止新路由系统
docker stop openclaw-llm-router

# 2. 恢复旧路由配置
cp /root/.openclaw/openclaw.json.backup \
   /root/.openclaw/openclaw.json

# 3. 重启 OpenClaw Gateway
openclaw gateway restart
```

## 6. 性能监控

### 6.1 关键指标
- **请求成功率**: > 99%
- **平均响应时间**: < 2s
- **缓存命中率**: > 40%
- **提供商可用性**: > 98%

### 6.2 监控命令
```bash
# 检查服务健康
curl http://localhost:8000/health

# 获取统计信息
curl http://localhost:8000/stats

# 监控缓存命中率
redis-cli info stats | grep keyspace_hits_rate
```

## 7. 优化建议

### 7.1 缓存策略优化
```yaml
cache:
  # 根据请求类型设置不同TTL
  ttl_strategy:
    general: 3600  # 普通请求
    realtime: 300  # 实时信息
    stable: 86400  # 稳定信息
```

### 7.2 负载均衡优化
```yaml
providers:
  foursapi:
    load_balancing:
      strategy: "round_robin"
      health_check_interval: 30
      circuit_breaker_threshold: 5
```

## 8. 下一步计划

### 短期 (1-2个月)
- [ ] 完成全面集成和测试
- [ ] 优化性能配置
- [ ] 建立监控告警体系

### 中期 (3-6个月)
- [ ] 实现智能路由策略
- [ ] 增加更多提供商支持
- [ ] 构建管理控制台


### 长期 (6个月以上)
- [ ] 实现分布式部署
- [ ] 构建AI模型管理系统
- [ ] 开发开放平台API

---

**📞 支持**
如果遇到问题，请参考：
1. OpenClaw 官方文档: https://docs.openclaw.ai
2. GitHub Issues: [项目链接]
3. 社区讨论: [Discord链接]