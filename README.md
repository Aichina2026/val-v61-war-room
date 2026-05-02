# 4AI Autonomous Framework V2.0

完整的4AI自主触发系统，包含并行推演、零错误系统、自主规划和经验学习。

## 核心组件

### 1. 4AI并行推演系统
- `parallel_ai_skill_optimized.js` - 四阶段并行推演 (Clarifier→Builder→Reviewer→Arbiter)
- `zero_error_system_optimized.cjs` - 零错误自治系统 (2-3轮对抗审查)
- `verify_4ai_keys.js` - API密钥验证工具

### 2. 自主触发系统V2.0
- `AutonomousPlanner.js` - 自主决策层，自动判断复杂度并选择工作流
- `AgentEventLoop.js` - 事件循环，7×24常驻，支持定时/文件/webhook触发
- `ReActAgent.js` - 工具使用层，支持8种工具自主调用
- `ExperienceLearner.js` - 经验学习，基于执行历史自我优化

### 3. 配置与调度
- `unified-ai-config.json` - 统一AI配置（安全模板，无真实密钥）
- `scheduler-config.json` - 任务调度配置
- `cron-jobs-template.json` - 定时任务模板
- `unified-ai-cli.js` - 统一CLI入口

## 快速开始

### 1. 配置API密钥
```bash
nano ~/.openclaw/workspace/unified-ai-config.json
# 填入您的4SAPI/阿里/Kimi/ARK密钥
```

### 2. 测试系统
```bash
# 测试4AI工作流
node parallel_ai_skill_optimized.js "设计一个API网关"

# 测试自主规划
node AutonomousPlanner.js "分析当前系统状态" --verbose

# 测试工具使用
node ReActAgent.js "搜索最新AI进展" --verbose
```

### 3. 启动事件循环
```bash
# 启动常驻事件循环
node AgentEventLoop.js start --verbose

# 查看状态
node AgentEventLoop.js status
```

## 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│               4AI Autonomy Framework V2.0                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  触发源层          感知决策层             执行引擎层       │
│  ├─ Cron定时器 → ├─ AutonomousPlanner → ├─ 4AI并行推演     │
│  ├─ Heartbeat   → ├─ ReActAgent       → ├─ ReAct工具链     │
│  ├─ 文件监控    → └─ 策略优化器      → ├─ 零错误系统       │
│  └─ Webhook     →                    → └─ 经验学习         │
│                                                             │
│  反馈闭环: ExperienceLearner → 持续自我优化                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 安全特性

✅ 所有配置文件使用占位符 (YOUR_XXX_KEY_HERE)
✅ 无真实API密钥泄露风险
✅ 首次使用前必须填入用户自己的密钥
✅ 完整的错误处理和日志记录

## 许可证

MIT License
