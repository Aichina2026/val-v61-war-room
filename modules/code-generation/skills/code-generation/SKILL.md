# Code Generation 技能

## 技能描述
集成2026年最新AI代码生成技术和高级工作流到OpenClaw 4.1系统，包括：
1. free-code项目（Claude code纯洁版）集成
2. Oh-my-Codex高级工作流编排
3. $team模式：多AI模型并行代码审查
4. $ri模式：持久执行循环验证
5. 架构师级生产验证

## 非侵入性原则
- 不修改OpenClaw核心代码
- 通过技能和MCP工具扩展
- 支持国内网络环境
- 不影响系统升级

## 工具列表

### 1. free-code-integrate
集成GitHub free-code项目功能

### 2. omc-workflow
Oh-my-Codex端到端工作流编排

### 3. team-mode
多AI模型并行代码审查

### 4. ri-mode
持久执行循环验证

### 5. architect-validate
生产级架构验证

## 使用方式

### 环境配置
```bash
# 设置国内友好的环境变量
export CODER_AUTH_MODE=local
export GITHUB_MIRROR=ghproxy.com
```

### 基本调用
```bash
# 使用代码生成技能
node /root/.openclaw/workspace/skills/code-generation/free-code-integration.js "你的代码需求"
```

### 高级工作流
```bash
# Oh-my-Codex完整工作流
node /root/.openclaw/workspace/skills/code-generation/omc-workflow.js --input=project --output=production

# $team模式并行审查
node /root/.openclaw/workspace/skills/code-generation/team-mode.js --models=3 --task="代码审查"

# $ri模式持续优化
node /root/.openclaw/workspace/skills/code-generation/ri-mode.js --iterations=10 --validate=true
```

## 依赖项
- Python 3.8+
- Node.js 16+
- Git
- 本地AI模型支持（可选）

## 故障处理
1. 网络问题：自动使用GitHub镜像
2. 模型失败：降级到本地模型
3. 验证失败：启动自愈循环

## 安全注意事项
- 不存储敏感API密钥
- 代码审查在本地进行
- 支持离线模式