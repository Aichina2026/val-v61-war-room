# Production AI Platform - Multi-Agent DAG System

## Hardware Detection
- **Cores**: 2 (Dynamic concurrency scaling enabled)
- **RAM**: 3917M (< 4000M, SQLite WAL mode + chunked memory streaming forced)

## Architecture Overview
This is a bleeding-edge, asynchronous production stack for multi-agent DAG orchestration.

## Technology Stack
- **Frontend**: Next.js 15 + Tailwind CSS + shadcn/ui
- **Backend**: FastAPI (Python) + Celery + Redis
- **Agents**: Multi-AI orchestration with confidence scoring
- **Memory**: SQLite WAL mode with vector embeddings
- **Deployment**: Docker Compose + Nginx

## Core Principles
1. **Multi-AI Governance**: Arbiter/Worker/Runner architecture
2. **High Accuracy**: >95% confidence requirement for commits
3. **Autonomous OODA Loop**: Observe-Orient-Decide-Act automation
4. **Production Ready**: Async, scalable, monitored