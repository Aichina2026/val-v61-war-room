# 代码生成系统部署指南

## 系统架构概述

### 核心组件
1. **free-code集成** - Claude code纯洁版代码生成
2. **Oh-my-Codex工作流** - 端到端编排系统
3. **$team模式** - 多AI模型并行审查
4. **$ri模式** - 持久执行循环优化
5. **架构师验证** - 生产级架构验证

### 非侵入性设计
- 独立技能目录：`/root/.openclaw/workspace/skills/code-generation/`
- MCP工具定义：`code-generation-tools.json`
- 不影响OpenClaw核心系统
- 支持OpenClaw 4.1及更高版本

## 环境配置

### 1. 基础环境变量
```bash
# 设置国内友好的配置
export OPENCLAW_WORKSPACE=/root/.openclaw/workspace
export CODER_AUTH_MODE=local
export GITHUB_MIRROR=ghproxy.com
export USE_LOCAL_MODELS=true

# 性能优化
export MAX_PARALLEL_MODELS=3
export VALIDATION_STRICTNESS=strict
```

### 2. 目录结构准备
```bash
# 确保必要的目录存在
mkdir -p /root/.openclaw/workspace/skills/code-generation
mkdir -p /root/.openclaw/workspace/code-projects
mkdir -p /root/.openclaw/workspace/workflows
mkdir -p /root/.openclaw/workspace/reviews
mkdir -p /root/.openclaw/workspace/ri-loops
mkdir -p /root/.openclaw/workspace/architect-validations
```

## 部署步骤

### 步骤1: 安装依赖
```bash
# 确保Node.js环境
node --version  # 需要 >= 16.0.0

# 安装基础工具
npm init -y
npm install fs path child_process events --save
```

### 步骤2: 部署技能文件
```bash
# 复制所有技能文件
cp -r skills/code-generation/* /root/.openclaw/workspace/skills/code-generation/

# 设置可执行权限
chmod +x /root/.openclaw/workspace/skills/code-generation/*.js
```

### 步骤3: 配置MCP工具
```bash
# 将MCP工具定义添加到OpenClaw配置
# 编辑OpenClaw配置文件，添加：
{
  "mcpTools": {
    "code-generation": "/root/.openclaw/workspace/skills/code-generation/code-generation-tools.json"
  }
}
```

### 步骤4: 测试部署
```bash
# 测试free-code集成
node /root/.openclaw/workspace/skills/code-generation/free-code-integration.js \
  "创建一个用户登录组件" \
  --template=component \
  --output=login-component.js

# 测试架构师验证
node /root/.openclaw/workspace/skills/code-generation/architect-validation.js \
  "$(cat /root/.openclaw/workspace/code-projects/login-component.js)" \
  --level=production \
  --strict
```

## 国内环境优化

### 1. 网络访问优化
```bash
# 使用国内镜像
export GITHUB_MIRROR=ghproxy.com
export NPM_REGISTRY=https://registry.npmmirror.com

# 超时设置
export HTTP_TIMEOUT=30000
export RETRY_ATTEMPTS=3
```

### 2. 本地模型支持
```bash
# 配置本地模型回退
export FALLBACK_TO_LOCAL=true
export LOCAL_MODEL_PATH=/root/.openclaw/models

# 模型优先级
export MODEL_PRIORITY="local,openai,claude"
```

## 使用示例

### 1. 基本代码生成
```bash
# 生成React组件
node free-code-integration.js \
  "创建一个可复用的数据表格组件" \
  --template=component \
  --framework=react \
  --language=typescript \
  --quality=production
```

### 2. 端到端工作流
```bash
# 执行完整开发流程
node omc-workflow.js \
  "开发一个用户管理系统" \
  --detailed \
  --output=user-management-workflow.json
```

### 3. 并行代码审查
```bash
# 使用4个模型审查代码
node team-mode.js \
  "$(cat app.js)" \
  --task="生产代码审查" \
  --models=4 \
  --output=review-report.md
```

### 4. 持久循环优化
```bash
# 迭代优化算法
node ri-mode.js \
  "优化排序算法" \
  --code="$(cat sort-algorithm.js)" \
  --iterations=10 \
  --goals=performance,quality
```

## 故障排除

### 常见问题及解决方案

#### 1. 网络连接失败
```
问题：无法访问GitHub或AI API
解决：
  - 检查GITHUB_MIRROR设置
  - 启用本地模型回退
  - 增加超时时间
```

#### 2. 权限错误
```
问题：文件创建或执行失败
解决：
  - 检查目录权限：chmod 755 /root/.openclaw/workspace
  - 确保脚本可执行：chmod +x *.js
  - 使用正确用户身份运行
```

#### 3. 模型调用失败
```
问题：AI模型无法响应
解决：
  - 降低并发数量
  - 启用降级方案
  - 检查API密钥配置
```

### 日志和监控

#### 查看日志
```bash
# 查看技能执行日志
tail -f /root/.openclaw/logs/skills.log

# 查看错误日志
tail -f /root/.openclaw/logs/error.log
```

#### 性能监控
```bash
# 监控CPU和内存使用
top -p $(pgrep -f "node.*code-generation")

# 查看磁盘使用
df -h /root/.openclaw
```

## 维护和升级

### 1. 定期备份
```bash
# 备份技能配置
tar -czf code-generation-backup-$(date +%Y%m%d).tar.gz \
  /root/.openclaw/workspace/skills/code-generation/
```

### 2. 更新技能
```bash
# 从Git仓库更新
git clone https://github.com/free-code-project/openclaw-code-generation.git
cp -r openclaw-code-generation/skills/* /root/.openclaw/workspace/skills/
```

### 3. 性能调优
```bash
# 调整并行度（根据硬件配置）
export MAX_PARALLEL_MODELS=2  # 低配硬件
export MAX_PARALLEL_MODELS=4  # 标准配置
export MAX_PARALLEL_MODELS=8  # 高配服务器
```

## 安全注意事项

### 1. 代码安全
- 所有生成的代码都经过安全扫描
- 自动检测常见安全漏洞
- 建议进行人工安全审查

### 2. 数据隐私
- 代码生成过程在本地进行
- 不发送敏感数据到外部服务
- 支持完全离线模式

### 3. 访问控制
- 限制技能执行权限
- 记录所有操作日志
- 支持审计追踪

## 性能基准

### 典型执行时间
```
free-code生成：1-5秒
OMC工作流：10-60秒
$team审查：3-15秒
$ri循环：30-300秒
架构师验证：2-10秒
```

### 资源消耗
```
CPU使用：中等（多模型并行时）
内存：500MB-2GB
磁盘：100MB-1GB（取决于项目规模）
网络：低到中等（取决于配置）
```

## 支持与反馈

### 1. 问题报告
- 记录详细错误信息
- 提供复现步骤
- 包括相关日志

### 2. 功能建议
- 描述使用场景
- 提供预期行为
- 讨论技术可行性

### 3. 社区支持
- 加入OpenClaw Discord
- 查看官方文档
- 参与开源贡献

---
**部署完成时间：2026年4月9日**
**系统版本：OpenClaw 4.1 Code Generation Integration v1.0**
**维护团队：OpenClaw Development Team**