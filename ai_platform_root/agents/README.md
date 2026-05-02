# Multi-Agent Production Matrix

## Agent Architecture
- **Arbiter** (4SAPI/Claude/GPT-4o): Global logic, conflict resolution, code review
- **Worker** (Aliyun Qwen-Max): Heavy coding, DAG execution, tech-stack generation
- **Runner** (Volcano Doubao): Fast NLP parsing, UI generation, QA testing

## Confidence Scoring Rule
NO code is committed without Arbiter's >95% confidence score.

## Agent Responsibilities

### Arbiter Agent
- Global orchestration and decision making
- Conflict resolution between agents
- Code review with confidence scoring
- Quality assurance and compliance checks

### Worker Agent
- Heavy coding and implementation
- DAG execution pipeline
- Technology stack generation
- Production deployment scripts

### Runner Agent
- Fast NLP parsing and intent recognition
- UI/UX generation and validation
- QA testing and bug detection
- Performance benchmarking

## Communication Protocol
- gRPC for high-performance inter-agent communication
- Redis pub/sub for event-driven messaging
- WebSocket for real-time updates
- REST API for external integrations