# VAL V6.1 Multi-AI War Room

[![VAL](https://img.shields.io/badge/VAL-V6.1-blue)](https://github.com)
[![Accuracy](https://img.shields.io/badge/Confidence-95%25-green)](https://github.com)
[![Stack](https://img.shields.io/badge/Stack-Next.js%2015%20%7C%20React%2019%20%7C%20FastAPI-purple)](https://github.com)

> **Multi-AI High-Accuracy Orchestration System** - 原生工具深度整合的多AI指挥部

## 🎯 核心特性

- **三模型并行论证** - 同时调用多个顶级大模型进行协同推理
- **95% 准确率红线** - 强制 4AI 工作流裁判共识，不达标不流转
- **物理拦截机制** - 人工批准后才执行物理操作
- **原生工具挂载** - Docker Volume 深度整合宿主机工具链

## 🏗️ 架构

```
Frontend (Next.js 15 + React 19)
    ↓
Backend (FastAPI + Python 3.12)
    ↓
Native Tools (/app/mcp_tools)
    ├── parallel_ai_skill/    # 多模型并行调用
    ├── 4AI工作流/            # 共识裁判
    ├── free-code/            # 物理代码执行
    └── zero_error_system/    # 自治愈系统
```

## 🚀 快速开始

### 环境要求

- Docker & Docker Compose
- API Keys (OpenAI, Anthropic, Google)

### 配置

创建 `.env` 文件：

```bash
OPENAI_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here
GEMINI_API_KEY=your_key_here
```

### 启动

```bash
cd val-nexus
docker compose up -d
```

访问 http://localhost:3000 进入 War Room

## 📁 项目结构

```
val-nexus/
├── backend/
│   ├── main.py              # FastAPI 全双工路由
│   └── core/
│       └── swarm.py         # 多AI编排核心
├── frontend/
│   └── app/
│       └── page.tsx         # War Room 主界面
└── docker-compose.yml       # 原生工具挂载编排
```

## 🔧 核心机制

### 1. 并行论证 (parallel_ai_skill)

```python
models = "claude-4.5,gemini-2.5-pro,gpt-5"
# 物理并行调用，非 asyncio.gather 模拟
```

### 2. 共识裁判 (4AI工作流)

```python
if confidence < 0.95:
    raise ValueError("准确率未达 95% 红线，打回重组！")
```

### 3. 自治愈 (zero_error_system)

```python
# 任何错误自动转交自愈系统
subprocess.run(["python", "/app/mcp_tools/zero_error_system/heal.py"])
```

## 🛡️ 安全设计

- **环境变量隔离** - 所有 API Key 通过 `.env` 注入
- **只读挂载** - 原生工具以 `:ro` 模式挂载
- **人工批准** - 物理执行前必须人工确认

## 📜 协议

MIT License - 开源供 AI 社区借鉴使用

---

**Built for VAI Platform V6.1** | 2026-04-18
