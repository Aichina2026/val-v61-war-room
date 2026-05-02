# AI编排系统API参考文档
版本: 1.0.0 | 更新时间: 2026-04-14

## 概述
AI编排系统提供RESTful API接口，支持多模型路由、增强搜索和全链条监管。

## 基础信息
- **基础URL**: `https://api.ai-system.com/v1`
- **认证**: Bearer Token
- **响应格式**: JSON
- **编码**: UTF-8

## 认证
所有API请求都需要在Header中包含认证令牌：

```http
Authorization: Bearer YOUR_API_KEY
```

## 状态码
| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 认证失败 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 429 | 请求频率限制 |
| 500 | 服务器内部错误 |

## 核心API端点

### 1. 健康检查
检查服务状态。

**端点**: `GET /health`

**响应**:
```json
{
  "status": "healthy",
  "timestamp": "2026-04-14T07:34:00Z",
  "version": "1.0.0",
  "uptime": "12h34m56s",
  "services": {
    "database": "healthy",
    "redis": "healthy",
    "models": "healthy"
  }
}
```

### 2. 任务处理
提交任务进行处理。

**端点**: `POST /tasks`

**请求体**:
```json
{
  "task_type": "text_generation",
  "input_text": "请解释量子计算的基本原理",
  "input_files": ["https://example.com/image.jpg"],
  "requirements": {
    "language": "zh",
    "format": "markdown"
  },
  "constraints": {
    "max_tokens": 2000,
    "max_latency_ms": 5000,
    "max_cost_usd": 0.1,
    "min_accuracy": 0.85
  },
  "callback_url": "https://your-service.com/callback",
  "metadata": {
    "user_id": "user_123",
    "session_id": "session_456"
  }
}
```

**响应** (同步):
```json
{
  "task_id": "task_abc123",
  "status": "processing",
  "estimated_completion_time": "2026-04-14T07:34:30Z",
  "model_selected": "deepseek-v3-671b",
  "cost_estimate": 0.024
}
```

### 3. 获取任务结果
查询任务处理结果。

**端点**: `GET /tasks/{task_id}`

**响应**:
```json
{
  "task_id": "task_abc123",
  "status": "completed",
  "created_at": "2026-04-14T07:34:00Z",
  "completed_at": "2026-04-14T07:34:25Z",
  "model_used": "deepseek-v3-671b",
  "output_text": "量子计算是利用量子力学原理进行计算的一种新型计算模式...",
  "output_files": ["https://storage.ai-system.com/results/task_abc123.pdf"],
  "metrics": {
    "total_tokens": 1200,
    "latency_ms": 2450,
    "cost_usd": 0.024,
    "accuracy_score": 0.92,
    "quality_score": 0.88,
    "search_queries": 3,
    "models_considered": 5
  },
  "error_message": null
}
```

### 4. 批量处理
批量提交多个任务。

**端点**: `POST /tasks/batch`

**请求体**:
```json
{
  "tasks": [
    {
      "task_id": "task_001",
      "task_type": "text_generation",
      "input_text": "第一个任务"
    },
    {
      "task_id": "task_002",
      "task_type": "code_generation",
      "input_text": "写一个排序算法"
    }
  ],
  "batch_config": {
    "concurrency_limit": 5,
    "fail_fast": false
  }
}
```

**响应**:
```json
{
  "batch_id": "batch_xyz789",
  "total_tasks": 2,
  "accepted_tasks": 2,
  "rejected_tasks": 0,
  "estimated_completion_time": "2026-04-14T07:35:00Z",
  "individual_responses": [
    {
      "task_id": "task_001",
      "status": "accepted",
      "queue_position": 1
    },
    {
      "task_id": "task_002",
      "status": "accepted",
      "queue_position": 2
    }
  ]
}
```

### 5. 增强搜索
执行增强搜索。

**端点**: `POST /search`

**请求体**:
```json
{
  "query": "2026年AI芯片发展趋势",
  "search_sources": ["web", "academic", "internal"],
  "filters": {
    "language": "zh",
    "date_range": {
      "from": "2025-01-01",
      "to": "2026-04-14"
    },
    "max_results": 20
  },
  "context": {
    "user_interests": ["人工智能", "硬件"],
    "previous_queries": ["AI加速器"]
  }
}
```

**响应**:
```json
{
  "query": "2026年AI芯片发展趋势",
  "search_id": "search_123456",
  "total_results": 187,
  "results": [
    {
      "title": "2026年AI芯片市场分析报告",
      "content": "根据最新研究，2026年AI芯片市场规模预计达到...",
      "source": "academic",
      "url": "https://scholar.example.com/paper123",
      "relevance_score": 0.92,
      "date": "2026-03-15",
      "authors": ["研究员A", "研究员B"]
    },
    {
      "title": "新一代AI芯片技术突破",
      "content": "某公司发布全新AI芯片，性能提升200%...",
      "source": "web",
      "url": "https://news.example.com/article456",
      "relevance_score": 0.87,
      "date": "2026-04-10"
    }
  ],
  "sources_summary": {
    "web": {"count": 125, "avg_score": 0.78},
    "academic": {"count": 42, "avg_score": 0.85},
    "internal": {"count": 20, "avg_score": 0.91}
  }
}
```

### 6. 系统监控
获取系统监控数据。

**端点**: `GET /monitoring`

**查询参数**:
- `time_range`: 时间范围 (1h, 24h, 7d, 30d)
- `metric`: 指标类型 (requests, latency, cost, accuracy)

**响应**:
```json
{
  "time_range": "24h",
  "timestamp": "2026-04-14T07:34:00Z",
  "metrics": {
    "total_requests": 12543,
    "successful_requests": 12201,
    "failed_requests": 342,
    "success_rate": 0.9727,
    "avg_latency_ms": 1234,
    "p95_latency_ms": 2345,
    "p99_latency_ms": 4567,
    "total_cost_usd": 245.67,
    "avg_cost_per_request": 0.0196,
    "requests_per_second": 0.145
  },
  "by_task_type": {
    "text_generation": {"count": 6543, "avg_latency": 1456},
    "code_generation": {"count": 3210, "avg_latency": 987},
    "math_reasoning": {"count": 1890, "avg_latency": 654},
    "vision_understanding": {"count": 890, "avg_latency": 2345}
  },
  "by_model": {
    "deepseek-v3-671b": {"calls": 5432, "success_rate": 0.98, "avg_cost": 0.025},
    "llama-4-400b": {"calls": 3210, "success_rate": 0.97, "avg_cost": 0.032},
    "codellama-70b": {"calls": 1890, "success_rate": 0.96, "avg_cost": 0.018}
  }
}
```

### 7. 模型管理
管理可用模型。

**端点**: `GET /models`

**响应**:
```json
{
  "total_models": 33,
  "models": [
    {
      "model_id": "deepseek-v3-671b",
      "name": "DeepSeek-V3",
      "provider": "DeepSeek",
      "capabilities": ["text_generation", "code_generation", "reasoning"],
      "max_tokens": 256000,
      "context_window": 262144,
      "cost_per_1k_tokens": 0.12,
      "latency_ms": 1500,
      "accuracy_score": 0.94,
      "availability": 0.98,
      "deployment_type": "cloud",
      "status": "active",
      "total_calls": 5432,
      "success_rate": 0.98,
      "avg_latency_ms": 1456
    },
    {
      "model_id": "tinyllama-2b",
      "name": "TinyLlama-2B",
      "provider": "Zhang Peiyuan",
      "capabilities": ["text_generation", "low_latency", "low_cost"],
      "max_tokens": 4000,
      "context_window": 4096,
      "cost_per_1k_tokens": 0.001,
      "latency_ms": 100,
      "accuracy_score": 0.75,
      "availability": 0.99,
      "deployment_type": "edge",
      "status": "active",
      "total_calls": 12345,
      "success_rate": 0.95,
      "avg_latency_ms": 89
    }
  ]
}
```

### 8. 路由策略配置
配置模型路由策略。

**端点**: `PUT /routing/policy`

**请求体**:
```json
{
  "policy_name": "cost_optimized",
  "weights": {
    "accuracy": 0.3,
    "latency": 0.2,
    "cost": 0.5
  },
  "constraints": {
    "min_accuracy": 0.7,
    "max_latency_ms": 10000,
    "max_cost_usd": 0.05
  },
  "model_blacklist": ["experimental-model-1"],
  "model_whitelist": ["tinyllama-2b", "phi-4"],
  "fallback_strategy": "relax_constraints"
}
```

**响应**:
```json
{
  "policy_id": "policy_789",
  "status": "active",
  "applied_at": "2026-04-14T07:34:00Z",
  "affected_models": 28
}
```

## WebSocket实时接口

### 实时任务状态
通过WebSocket获取实时任务状态更新。

**连接URL**: `wss://api.ai-system.com/v1/ws/tasks/{task_id}`

**消息格式**:
```json
{
  "type": "status_update",
  "task_id": "task_abc123",
  "status": "processing",
  "progress": 0.65,
  "current_step": "model_execution",
  "estimated_remaining_ms": 1234,
  "timestamp": "2026-04-14T07:34:15Z"
}
```

## 回调机制

### 任务完成回调
当任务完成时，系统会向指定的callback_url发送POST请求。

**请求体**:
```json
{
  "task_id": "task_abc123",
  "status": "completed",
  "output_text": "任务结果...",
  "metrics": {
    "total_tokens": 1200,
    "latency_ms": 2450,
    "cost_usd": 0.024
  },
  "signature": "hmac_sha256_signature"
}
```

## 错误处理

### 错误响应格式
```json
{
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "参数验证失败",
    "details": {
      "field": "max_tokens",
      "issue": "必须大于0"
    },
    "request_id": "req_123456",
    "timestamp": "2026-04-14T07:34:00Z"
  }
}
```

### 常见错误码
| 错误码 | 说明 | HTTP状态码 |
|--------|------|------------|
| AUTH_REQUIRED | 需要认证 | 401 |
| INVALID_TOKEN | 令牌无效 | 401 |
| RATE_LIMITED | 请求频率限制 | 429 |
| INVALID_PARAMETER | 参数无效 | 400 |
| MODEL_UNAVAILABLE | 模型不可用 | 503 |
| TASK_TIMEOUT | 任务超时 | 504 |
| INTERNAL_ERROR | 服务器内部错误 | 500 |

## 速率限制

| 端点 | 限制 | 周期 |
|------|------|------|
| POST /tasks | 100次 | 每分钟 |
| POST /tasks/batch | 10次 | 每分钟 |
| POST /search | 50次 | 每分钟 |
| GET /monitoring | 30次 | 每分钟 |
| 其他端点 | 1000次 | 每分钟 |

## 客户端SDK示例

### Python
```python
from ai_orchestrator_client import AIClient

client = AIClient(
    api_key="your_api_key",
    base_url="https://api.ai-system.com/v1"
)

# 提交任务
task = client.submit_task(
    task_type="text_generation",
    input_text="请解释人工智能的基本概念",
    constraints={"max_tokens": 2000}
)

print(f"任务ID: {task.id}")
print(f"预计成本: ${task.estimated_cost}")

# 等待结果
result = task.wait_for_completion(timeout=60)
print(f"结果: {result.output_text}")
print(f"实际成本: ${result.metrics['cost_usd']}")
```

### JavaScript
```javascript
import { AIClient } from '@ai-system/client';

const client = new AIClient({
  apiKey: 'your_api_key',
  baseUrl: 'https://api.ai-system.com/v1'
});

// 提交任务
const task = await client.submitTask({
  taskType: 'text_generation',
  inputText: '请解释人工智能的基本概念',
  constraints: { maxTokens: 2000 }
});

console.log(`任务ID: ${task.id}`);

// 监听实时状态
task.on('status', (status) => {
  console.log(`状态更新: ${status}`);
});

// 获取结果
const result = await task.getResult();
console.log(`结果: ${result.outputText}`);
```

## 更新日志

### v1.0.0 (2026-04-14)
- 初始版本发布
- 支持多模型路由
- 增强搜索功能
- 全链条监管
- WebSocket实时接口
- 批量处理支持

---

*文档最后更新: 2026年4月14日*