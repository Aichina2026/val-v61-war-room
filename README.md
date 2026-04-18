# VAL V6.2 Flexible War Room

[![VAL](https://img.shields.io/badge/VAL-V6.2-blue)](https://github.com)
[![Accuracy](https://img.shields.io/badge/Confidence-95%25-green)](https://github.com)
[![Stack](https://img.shields.io/badge/Stack-Next.js%2015%20%7C%20React%2019%20%7C%20FastAPI-purple)](https://github.com)

> **可配置化多AI高准确率辩论系统** - 节点/模型/角色/轮次全可选

## 🎯 V6.2 新特性

### 可配置化
- ✅ **节点可选** - 4SAPI / 阿里百炼 / Moonshot
- ✅ **模型可选** - 每个角色独立选择模型
- ✅ **角色可选** - 自定义参与辩论的角色
- ✅ **轮次可选** - 1-5轮辩论

### 搜索增强
- 🔍 **Google标准** - 搜索结果按Google格式处理
- 📚 **上下文支持** - 搜索结果注入辩论上下文
- ⚡ **可选启用** - 按需开启搜索

### 简化界面
- 清晰配置面板
- 实时辩论过程展示
- 折叠式详细JSON

## 🏗️ 架构

```
Frontend (Next.js 15 + React 19)
    ↓ POST /api/debate
Backend (FastAPI + Python 3.12)
    ↓ FlexibleDebateEngine
    ├─ search_knowledge/       # 知识搜索
    ├─ flexible_engine.py      # 可配置化引擎
    │   ├─ 节点管理
    │   ├─ 模型库
    │   ├─ 角色分配
    │   └─ 多轮辩论
    └─ WebSocket 实时流
```

## 🚀 快速开始

### 1. 环境配置

```bash
cp .env.example .env
# 编辑 .env 填入你的 API Keys
```

### 2. 启动服务

```bash
docker compose up -d
```

### 3. 访问界面

打开 http://localhost:3000

## 🎮 使用指南

### 模式选择
| 模式 | 角色 | 轮次 | 阈值 | 适用场景 |
|------|------|------|------|----------|
| 极简 | 2 | 1 | 90% | 快速验证 |
| 标准 | 4 | 1 | 95% | 常规任务 |
| 深度 | 4 | 3 | 97% | 关键决策 |
| 自定义 | 自选 | 自选 | 95% | 特殊需求 |

### 角色模型映射
| 角色 | 默认模型 | 备选模型 |
|------|----------|----------|
| Clarifier | GLM-5.1 | Gemini 2.5 Pro |
| Builder | GPT-5.3 Codex | DeepSeek V3.2 |
| Reviewer | Claude Opus 4.6 | Claude Opus 4.7 |
| Arbiter | GPT-5.4 | GPT-5.4 xhigh |

### API 使用

```bash
# 运行标准辩论
curl -X POST http://localhost:8000/api/debate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "设计一个消息队列系统",
    "mode": "standard",
    "enable_search": true
  }'

# 自定义辩论
curl -X POST http://localhost:8000/api/debate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "评估云原生架构",
    "mode": "custom",
    "roles": ["reviewer", "arbiter"],
    "models": {"reviewer": "claude-opus-4-7", "arbiter": "gpt-5.4-xhigh"},
    "rounds": 2,
    "enable_search": true
  }'
```

## 📁 项目结构

```
val-nexus/
├── backend/
│   ├── main.py                    # FastAPI 路由
│   └── core/
│       ├── flexible_engine.py     # 可配置化辩论引擎
│       └── swarm.py               # V6.1 兼容层
├── frontend/
│   └── app/
│       └── page.tsx               # 简化版 War Room
├── docker-compose.yml
└── .env.example
```

## 🔧 搜索增强

搜索结果按 Google 标准格式化：

```json
{
  "organic_results": [
    {
      "position": 1,
      "title": "...",
      "snippet": "...",
      "url": "...",
      "source": "..."
    }
  ],
  "knowledge_panel": {...},
  "related_questions": [...]
}
```

## 📜 协议

MIT License - 开源供 AI 社区借鉴使用

---

**Built for VAI Platform V6.2** | 2026-04-18
