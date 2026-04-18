# VAL V6.1 OS - 全链条高准确率生产级多AI系统

## 版本信息
- **版本**: V6.1 Production
- **发布日期**: 2026-04-18
- **Python**: 3.13
- **FastAPI**: >=0.115
- **Next.js**: 15
- **React**: 19

## 核心特性

### ✅ 已修复问题
| 问题 | 修复方案 | 状态 |
|------|----------|------|
| 模拟执行 | `physical_engine.py` 强制 subprocess 调用 | ✅ |
| ≥3模型并发 | 每个角色强制3模型并行 (ThreadPoolExecutor) | ✅ |
| 准确率红线 | 强制调用 `judge.py`，<95% 阻断 | ✅ |
| Python 3.13 | docker-compose 更新 python:3.13-slim | ✅ |
| /api/approve | 新增物理拦截端点 | ✅ |
| WebSocket命名 | `/ws/openclaw` 符合原始指令 | ✅ |
| 自愈系统 | 失败自动转交 `zero_error_system` | ✅ |

### 🏗️ 架构

```
Frontend (Next.js 15 + React 19)
    ↓ POST /api/plan
Backend (FastAPI + Python 3.13)
    ↓ PhysicalSwarmEngine
    ├─ parallel_ai_skill (subprocess)  ≥3模型并行
    ├─ 4AI工作流/judge.py  共识计算
    ├─ 准确率红线检查 (≥95%)
    └─ zero_error_system  自愈
    ↓ 等待批准
    ↓ POST /api/approve/{task_id}
    ↓ 物理执行
```

## API 端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/health` | GET | 健康检查 + 工具挂载验证 |
| `/api/plan` | POST | L0&L1 多AI联合架构 |
| `/api/approve/{task_id}` | POST | 物理拦截批准 |
| `/api/task/{task_id}` | GET | 查询任务状态 |
| `/ws/openclaw` | WS | 实时数据流 |

## 模型配置

### 角色集群 (每个角色 ≥3 模型)
| 角色 | 模型1 | 模型2 | 模型3 | 类型 |
|------|-------|-------|-------|------|
| Clarifier | GLM-5.1 | Gemini-2.5-pro | Kimi-K2.5 | 多模态分析 |
| Builder | GPT-5.3-Codex | DeepSeek-V3.2 | Qwen-Coder | 代码生成 |
| Reviewer | Claude-Opus-4.6 | Claude-Opus-4.7 | Kimi-K2.5 | 深度推理 |
| Arbiter | GPT-5.4 | GPT-5.4-xhigh | Qwen-Max | 综合决策 |

## 准确率红线

```
共识计算 → Judge.py 调用
         ↓
    confidence >= 0.95?
         ↓
    YES → 允许批准
    NO  → ValueError (阻断)
```

## 启动

```bash
cp .env.example .env  # 填入 API Keys
docker compose up -d
```

## 状态

✅ **生产级就绪** - 全链条高准确率机制已激活
