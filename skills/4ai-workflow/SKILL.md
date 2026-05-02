# 4AI Workflow Skill

## Description

4AI并行推演与零错误审查系统 - 生产级多Agent编排器。

## Usage

Trigger keywords: `4AI`, `并行推演`, `零错误审查`, `多模型分析`

## Roles

| Role | Model | Purpose |
|------|-------|---------|
| Scout | gpt-5.5 | 信息收集与关联分析 |
| Clarifier | gemini-3.1-pro-preview | 需求分析与边界定义 |
| Builder | gpt-5.5 | 架构设计与代码生成 |
| Reviewer | claude-opus-4-7 | 安全审查与极限测试 |
| Arbiter | gemini-3.1-pro-preview | 综合裁决与冲突解决 |

## Architecture

```
User Request
    ↓
[Scout] 信息收集 → memory_search + web_fetch + query
    ↓
[Clarifier] 需求分析 (并行)
[Builder]   架构设计 (并行)
[Reviewer]  安全审查 (并行)
    ↓
[Arbiter] 综合裁决 → Final Output
```

## Configuration

See `config.json` for model and timeout settings.

## Files

- `index.js` - Main entry point
- `lib/` - Core modules
- `tools/` - Tool definitions
- `config.json` - Role configuration
