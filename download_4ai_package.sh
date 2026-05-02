#!/bin/bash

# 4AI完整包下载安装脚本
# 基于用户提供的GitHub文件列表

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# GitHub仓库信息
GITHUB_USER="Aichina2026"
GITHUB_REPO="ai001-core"
BRANCH="master"
PACKAGE_DIR="4ai-complete-package"

# 目标目录
TARGET_DIR="/root/.openclaw/workspace/4ai-autonomy-package"
BACKUP_DIR="/root/.openclaw/workspace/backup-$(date +%Y%m%d_%H%M%S)"

# 文件列表（根据用户提供的信息）
FILES=(
    # 4AI工作流核心组件
    "parallel_ai_skill_optimized.js"
    "zero_error_system_optimized.cjs"
    "verify_4ai_keys.js"
    "unified-ai-config.json"
    
    # 自主触发系统V2.0
    "AutonomousPlanner.js"
    "AgentEventLoop.js"
    "ReActAgent.js"
    "ExperienceLearner.js"
    "cron-jobs-template.json"
    
    # 其他文件
    "unified-ai-cli.js"
    "4ai_workflow_task.cjs"
    "HEARTBEAT.md"
    "scheduler-config.json"
    "STRATEGIES.md"
    "install.sh"
    "README.md"
)

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 创建目录
create_directories() {
    log_info "创建目录结构..."
    
    # 创建备份目录
    mkdir -p "$BACKUP_DIR"
    
    # 创建目标目录
    mkdir -p "$TARGET_DIR"
    
    # 创建必要的子目录
    mkdir -p "$TARGET_DIR/logs"
    mkdir -p "$TARGET_DIR/config"
    mkdir -p "$TARGET_DIR/reports"
    
    log_success "目录创建完成"
}

# 备份现有文件
backup_existing_files() {
    log_info "备份现有文件..."
    
    local backup_count=0
    
    for file in "${FILES[@]}"; do
        local source_file="/root/.openclaw/workspace/$file"
        
        if [ -f "$source_file" ]; then
            cp "$source_file" "$BACKUP_DIR/"
            backup_count=$((backup_count + 1))
            log_info "已备份: $file"
        fi
    done
    
    if [ $backup_count -gt 0 ]; then
        log_success "已备份 $backup_count 个文件到: $BACKUP_DIR"
    else
        log_info "没有需要备份的现有文件"
    fi
}

# 下载单个文件
download_file() {
    local filename="$1"
    
    # 尝试不同的URL格式
    local urls=(
        "https://raw.githubusercontent.com/$GITHUB_USER/$GITHUB_REPO/$BRANCH/$PACKAGE_DIR/$filename"
        "https://raw.githubusercontent.com/$GITHUB_USER/$GITHUB_REPO/$BRANCH/$filename"
        "https://raw.githubusercontent.com/$GITHUB_USER/$GITHUB_REPO/main/$PACKAGE_DIR/$filename"
        "https://raw.githubusercontent.com/$GITHUB_USER/$GITHUB_REPO/main/$filename"
    )
    
    for url in "${urls[@]}"; do
        log_info "尝试下载: $filename (从: ${url:0:60}...)"
        
        if curl -s -f -o "$TARGET_DIR/$filename" "$url" 2>/dev/null; then
            if [ -s "$TARGET_DIR/$filename" ]; then
                log_success "下载成功: $filename"
                return 0
            fi
        fi
    done
    
    log_warning "无法下载: $filename"
    return 1
}

# 下载所有文件
download_all_files() {
    log_info "开始下载4AI完整包..."
    
    local success_count=0
    local fail_count=0
    
    for file in "${FILES[@]}"; do
        if download_file "$file"; then
            success_count=$((success_count + 1))
        else
            fail_count=$((fail_count + 1))
        fi
    done
    
    log_info "下载完成: $success_count 成功, $fail_count 失败"
    
    if [ $success_count -eq 0 ]; then
        log_error "没有文件下载成功，请检查网络或仓库URL"
        return 1
    fi
    
    return 0
}

# 创建配置文件
create_config_files() {
    log_info "创建配置文件..."
    
    # 创建统一的AI配置（使用占位符）
    cat > "$TARGET_DIR/unified-ai-config.json" << 'EOF'
{
  "name": "4AI Unified Configuration",
  "version": "2.0.0",
  "description": "统一AI配置 - 首次使用前请填入您的API密钥",
  
  "apiKeys": {
    "4sapi": {
      "baseUrl": "https://4sapi.com/v1",
      "apiKey": "YOUR_4SAPI_KEY_HERE",
      "enabled": true
    },
    "alibailian": {
      "baseUrl": "https://dashscope.aliyuncs.com/compatible-mode/v1",
      "apiKey": "YOUR_ALIBABAILIAN_KEY_HERE",
      "enabled": true
    },
    "kimi": {
      "baseUrl": "https://api.moonshot.cn/v1",
      "apiKey": "YOUR_KIMI_KEY_HERE",
      "enabled": true
    },
    "ark": {
      "baseUrl": "https://ark.cn-beijing.volces.com/api/coding/v3",
      "apiKey": "YOUR_ARK_KEY_HERE",
      "enabled": true
    }
  },
  
  "models": {
    "default": "gpt-5.4",
    "fallbackOrder": [
      "gemini-3.1-pro-preview",
      "claude-opus-4.6",
      "gpt-4o",
      "qwen3-max"
    ]
  },
  
  "workflow": {
    "maxParallelTasks": 2,
    "timeout": 30000,
    "retryAttempts": 3
  },
  
  "security": {
    "encryptKeys": false,
    "logLevel": "info",
    "sanitizeInput": true
  },
  
  "monitoring": {
    "enable": true,
    "logDir": "./logs",
    "metricsInterval": 3600000
  }
}
EOF
    
    log_success "配置文件已创建: unified-ai-config.json"
    
    # 创建调度配置
    cat > "$TARGET_DIR/scheduler-config.json" << 'EOF'
{
  "scheduler": {
    "name": "4AI Autonomous Scheduler",
    "version": "1.0.0",
    
    "jobs": [
      {
        "name": "daily_optimization",
        "description": "每日优化检查",
        "schedule": "0 9 * * *",
        "command": "node 4ai_workflow_task.cjs --task optimization",
        "enabled": true
      },
      {
        "name": "heartbeat_check",
        "description": "心跳检查",
        "schedule": "*/30 * * * *",
        "command": "node AgentEventLoop.js heartbeat",
        "enabled": true
      },
      {
        "name": "experience_learning",
        "description": "经验学习",
        "schedule": "0 2 * * *",
        "command": "node ExperienceLearner.js process",
        "enabled": true
      }
    ],
    
    "monitoring": {
      "enable": true,
      "alertOnFailure": true,
      "maxRetries": 3
    }
  }
}
EOF
    
    log_success "调度配置已创建: scheduler-config.json"
}

# 创建缺失的核心文件
create_core_files() {
    log_info "创建核心系统文件..."
    
    # 检查哪些文件下载失败
    local missing_files=()
    
    for file in "${FILES[@]}"; do
        if [ ! -f "$TARGET_DIR/$file" ] || [ ! -s "$TARGET_DIR/$file" ]; then
            missing_files+=("$file")
        fi
    done
    
    if [ ${#missing_files[@]} -eq 0 ]; then
        log_success "所有文件都已下载"
        return 0
    fi
    
    log_warning "以下文件需要手动创建: ${missing_files[*]}"
    
    # 创建基本的README文件
    if [[ " ${missing_files[*]} " =~ " README.md " ]]; then
        cat > "$TARGET_DIR/README.md" << 'EOF'
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
EOF
        log_success "README.md 已创建"
    fi
    
    # 创建基本的安装脚本
    if [[ " ${missing_files[*]} " =~ " install.sh " ]]; then
        cat > "$TARGET_DIR/install.sh" << 'EOF'
#!/bin/bash

# 4AI Autonomous Framework 安装脚本

set -e

echo "🚀 开始安装4AI自主框架..."

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js未安装，请先安装Node.js"
    exit 1
fi

echo "✅ Node.js版本: $(node --version)"

# 创建工作空间
WORKSPACE="$HOME/.openclaw/workspace"
mkdir -p "$WORKSPACE/4ai-system"

# 复制文件
echo "📦 复制系统文件..."
cp -r ./* "$WORKSPACE/4ai-system/"

# 设置权限
chmod +x "$WORKSPACE/4ai-system/"*.js
chmod +x "$WORKSPACE/4ai-system/"*.sh
chmod +x "$WORKSPACE/4ai-system/"*.cjs

# 创建符号链接到工作空间根目录（可选）
cd "$WORKSPACE"
for file in 4ai-system/*.js 4ai-system/*.cjs; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        if [ ! -f "$filename" ]; then
            ln -s "$file" "$filename" 2>/dev/null || true
        fi
    fi
done

echo "✅ 安装完成！"
echo ""
echo "📋 下一步:"
echo "1. 配置API密钥: nano $WORKSPACE/unified-ai-config.json"
echo "2. 测试系统: node $WORKSPACE/4ai-system/parallel_ai_skill_optimized.js '测试'"
echo "3. 启动事件循环: node $WORKSPACE/4ai-system/AgentEventLoop.js start"
echo ""
echo "📚 详细文档请查看: $WORKSPACE/4ai-system/README.md"
EOF
        chmod +x "$TARGET_DIR/install.sh"
        log_success "install.sh 已创建"
    fi
    
    # 创建基本的心跳指南
    if [[ " ${missing_files[*]} " =~ " HEARTBEAT.md " ]]; then
        cat > "$TARGET_DIR/HEARTBEAT.md" << 'EOF'
# 心跳检查指南

## 什么是心跳检查？

心跳检查是4AI自主系统的健康监控机制，定期检查：
1. API密钥有效性
2. 模型可用性
3. 系统响应时间
4. 错误率统计

## 配置心跳

在 `scheduler-config.json` 中配置：

```json
{
  "heartbeat": {
    "enabled": true,
    "interval": 1800,
    "checks": [
      "api_connectivity",
      "model_availability",
      "response_time",
      "error_rate"
    ],
    "alert_threshold": 0.2
  }
}
```

## 手动触发心跳

```bash
# 使用AgentEventLoop
node AgentEventLoop.js heartbeat

# 使用CLI工具
node unified-ai-cli.js --heartbeat

# 详细模式
node AgentEventLoop.js heartbeat --verbose
```

## 心跳检查内容

### 1. API连接性检查
- 测试所有配置的API端点
- 验证API密钥有效性
- 检查响应时间

### 2. 模型可用性检查
- 检查配置的模型是否可用
- 测试模型响应
- 验证功能完整性

### 3. 性能指标检查
- 平均响应时间
- 成功率统计
- 错误类型分析

### 4. 系统健康检查
- 内存使用情况
- 磁盘空间
- 日志文件大小

## 告警机制

当以下情况发生时触发告警：
- 错误率超过20%
- 平均响应时间超过10秒
- API连接失败
- 磁盘空间不足10%

## 最佳实践

1. **设置合理间隔**: 建议30分钟到2小时
2. **启用详细日志**: 首次调试时使用`--verbose`模式
3. **定期查看报告**: 检查`logs/heartbeat_report.json`
4. **设置通知**: 集成到监控系统

## 故障排除

### 常见问题

1. **心跳检查失败**
   ```
   检查网络连接
   验证API密钥
   检查配置文件
   ```

2. **响应时间过长**
   ```
   检查模型负载
   优化请求频率
   考虑使用缓存
   ```

3. **API限制错误**
   ```
   降低请求频率
   使用多个API密钥
   实现退避重试
   ```

## 集成指南

### 与OpenClaw集成
```bash
# 在OpenClaw配置中添加心跳任务
openclaw cron add \
  --name "4AI_Heartbeat" \
  --schedule "every 30m" \
  --agent main \
  --isolated \
  --prompt "执行4AI心跳检查"
```

### 与监控系统集成
```json
{
  "integrations": {
    "prometheus": true,
    "grafana": true,
    "slack": true,
    "email": true
  }
}
```
EOF
        log_success "HEARTBEAT.md 已创建"
    fi
    
    return 0
}

# 部署到工作空间
deploy_to_workspace() {
    log_info "部署文件到工作空间..."
    
    # 复制文件到工作空间根目录
    for file in "$TARGET_DIR"/*; do
        if [ -f "$file" ]; then
            filename=$(basename "$file")
            cp "$file" "/root/.openclaw/workspace/"
            log_info "已部署: $filename"
        fi
    done
    
    # 设置执行权限
    chmod +x /root/.openclaw/workspace/*.js 2>/dev/null || true
    chmod +x /root/.openclaw/workspace/*.cjs 2>/dev/null || true
    chmod +x /root/.openclaw/workspace/*.sh 2>/dev/null || true
    
    log_success "部署完成"
}

# 验证安装
verify_installation() {
    log_info "验证安装..."
    
    local essential_files=(
        "unified-ai-config.json"
        "AutonomousPlanner.js"
        "parallel_ai_skill_optimized.js"
        "README.md"
    )
    
    local missing_essential=()
    
    for file in "${essential_files[@]}"; do
        if [ ! -f "/root/.openclaw/workspace/$file" ]; then
            missing_essential+=("$file")
        fi
    done
    
    if [ ${#missing_essential[@]} -gt 0 ]; then
        log_error "缺少核心文件: ${missing_essential[*]}"
        return 1
    fi
    
    log_success "安装验证通过"
    return 0
}

# 显示安装总结
show_summary() {
    echo ""
    echo "=========================================="
    echo "      4AI自主框架安装完成总结"
    echo "=========================================="
    echo ""
    echo "📁 安装目录: $TARGET_DIR"
    echo "📁 备份目录: $BACKUP_DIR"
    echo ""
    echo "📦 已安装的核心组件:"
    echo "  ✅ 4AI并行推演系统"
    echo "  ✅ 零错误自治系统"  
    echo "  ✅ 自主触发系统V2.0"
    echo "  ✅ 经验学习系统"
    echo "  ✅ 统一配置管理"
    echo ""
    echo "🚀 快速开始:"
    echo "  1. 配置API密钥:"
    echo "     nano /root/.openclaw/workspace/unified-ai-config.json"
    echo ""
    echo "  2. 测试系统:"
    echo "     node /root/.openclaw/workspace/parallel_ai_skill_optimized.js '测试'"
    echo ""
    echo "  3. 启动自主系统:"
    echo "     node /root/.openclaw/workspace/AutonomousPlanner.js '分析系统' --verbose"
    echo ""
    echo "  4. 查看文档:"
    echo "     cat /root/.openclaw/workspace/README.md"
    echo ""
    echo "🔧 系统架构:"
    echo "  ┌─ Cron定时器 → 自主规划 → 4AI并行推演"
    echo "  ├─ Heartbeat   → ReAct工具 → 零错误系统"
    echo "  ├─ 文件监控    → 经验学习 → 持续优化"
    echo "  └─ Webhook     → 反馈闭环 → 自我进化"
    echo ""
    echo "🛡️ 安全特性:"
    echo "  ✅ 配置文件使用占位符"
    echo "  ✅ 无密钥泄露风险"
    echo "  ✅ 完整的错误处理"
    echo "  ✅ 详细的日志记录"
    echo ""
    echo "📚 详细文档请查看: /root/.openclaw/workspace/README.md"
    echo "=========================================="
}

# 主函数
main() {
    echo "🚀 开始安装4AI自主框架V2.0"
    echo "=========================================="
    
    # 创建目录
    create_directories
    
    # 备份现有文件
    backup_existing_files
    
    # 下载文件
    if ! download_all_files; then
        log_warning "部分文件下载失败，将创建基本版本"
    fi
    
    # 创建配置和核心文件
    create_config_files
    create_core_files
    
    # 部署到工作空间
    deploy_to_workspace
    
    # 验证安装
    if verify_installation; then
        show_summary
    else
        log_error "安装验证失败，请检查日志"
        exit 1
    fi
}

# 运行主函数
main "$@"