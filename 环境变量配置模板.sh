#!/bin/bash
# OpenClaw 完整工作流环境变量配置模板
# 启用所有系统所需的环境变量

echo "🚀 OpenClaw 完整系统环境变量配置模板"
echo "📋 请将以下环境变量添加到您的系统配置中"
echo "=================================================="

cat << 'EOF'

# ==================================================
# OpenClaw 完整系统环境变量配置
# ==================================================

# 核心配置
export OPENCLAW_WORKSPACE="/root/.openclaw/workspace"
export OPENCLAW_VERSION="2026.4.12"

# ==================================================
# 4SAPI辩证多AI辩论系统配置
# ==================================================

# AI模型API密钥
# 国内模型
export DEEPSEEK_API_KEY="your_deepseek_api_key_here"
export GLM_API_KEY="your_glm_api_key_here"  
export KIMI_API_KEY="your_kimi_api_key_here"
export ALIYUN_API_KEY="your_aliyun_api_key_here"

# 国外顶级模型
export OPENAI_API_KEY="your_openai_api_key_here"
export ANTHROPIC_API_KEY="your_claude_api_key_here"
export GEMINI_API_KEY="your_gemini_api_key_here"

# 4SAPI辩证模式
export DIALECTIC_MODE="multi-debate"  # zero-error|multi-debate|consensus|evolution
export DEBATE_ROUNDS=3
export CONSENSUS_THRESHOLD=80

# ==================================================
# $team模式 - 4模型并行审查配置
# ==================================================

export TEAM_MODE_ENABLED="true"
export MAX_PARALLEL_MODELS=4
export REVIEW_TIMEOUT_MS=30000
export VALIDATION_LEVEL="production"

# 模型优先级配置
export ARCHITECT_MODEL_WEIGHT=1.2
export SECURITY_MODEL_WEIGHT=1.3
export PERFORMANCE_MODEL_WEIGHT=1.1
export QUALITY_MODEL_WEIGHT=1.0
export BUSINESS_MODEL_WEIGHT=1.1


# ==================================================
# $ri模式 - 持久执行循环优化配置
# ==================================================

export RI_MODE_ENABLED="true"
export MAX_ITERATIONS=20
export OPTIMIZATION_GOALS="performance,quality,security"
export VALIDATION_STRICTNESS="strict"  # lenient|normal|strict


# ==================================================
# 架构师验证 - 生产级架构验证配置
= ==================================================

export ARCHITECT_VALIDATION_ENABLED="true"
export VALIDATION_LEVEL="production"  # basic|standard|production
export STRICT_MODE="true"

# 验证参数
export MAX_CODE_COMPLEXITY=15
export MIN_CODE_COVERAGE=80
export MAX_FUNCTION_LENGTH=50


# ==================================================
# free-code集成 - Claude code纯洁版国内优化配置
# ==================================================

export FREECODE_ENABLED="true"
export CLAUDE_API_KEY="your_claude_api_key_here"
export CODE_GENERATION_QUALITY="production"  # draft|standard|production

# 国内优化配置
export USE_CHINESE_CODING_STANDARD="true"
export CHINESE_CODE_COMMENTS="true"
export LOCAL_FALLBACK_ENABLED="true"




# ==================================================
# Oh-my-Codex工作流 - 端到端编排系统配置
# ==================================================

export OMC_WORKFLOW_ENABLED="true"
export WORKFLOW_TYPE="full"  # full|analysis|design|implementation|review
export DETAILED_OUTPUT="true"

# 工作流阶段配置
export ANALYSIS_PHASE_TIMEOUT=60000
export DESIGN_PHASE_TIMEOUT=90000
export IMPLEMENTATION_PHASE_TIMEOUT=120000




# ==================================================
# 系统集成与监控配置
# ==================================================

# HTTP服务配置
export HTTP_PORT=3000
export HTTP_HOST="localhost"
export HEALTH_CHECK_ENABLED="true"
export METRICS_ENABLED="true"

# 性能监控
export MONITORING_ENABLED="true"
export LOG_LEVEL="info"  # debug|info|warn|error
export MAX_LOG_SIZE_MB=100
export LOG_RETENTION_DAYS=30




# ==================================================
# 成本控制配置
# ==================================================

# 模型使用策略
export PRIMARY_MODEL="ark/deepseek-v3.2"
export FALLBACK_MODEL="openai/gpt-4-turbo"
export BUDGET_LIMIT=1000  # 每月预算上限（元）

# 流量控制
export MAX_REQUESTS_PER_HOUR=1000
export MAX_TOKENS_PER_REQUEST=10000
export ENABLE_CACHING="true"

# 成本监控
export COST_MONITORING_ENABLED="true"
export COST_ALERT_THRESHOLD=500  # 成本预警阈值（元）




# ==================================================
# 多模型监管配置
# ==================================================

# 模型监管配置
export INTENT_VALIDATION_ENABLED="true"
export MULTI_MODEL_CONSENSUS_REQUIRED="true"
export MIN_CONSENSUS_SCORE=85

# 模型权重
export MODEL_1_WEIGHT=1.0  # 主模型
export MODEL_2_WEIGHT=0.8  # 辅助模型1
export MODEL_3_WEIGHT=0.7  # 辅助模型2
export MODEL_4_WEIGHT=0.6  # 辅助模型3




# ==================================================
# 安全配置
==================================================

# API密钥安全
export ENCRYPT_API_KEYS="true"
export ROTATE_API_KEYS="true"
export KEY_ROTATION_DAYS=30

# 访问控制
export ENABLE_API_AUTH="true"
export ALLOWED_IP_RANGES="127.0.0.1,10.0.0.0/8"






# ==================================================
# 使用说明
# ==================================================

# 1. 复制此模板到您的环境变量配置文件
# 2. 替换所有的 "your_xxx_api_key_here" 为实际的API密钥
# 3. 加载配置:
#    source 环境变量配置模板.sh
# 4. 启动系统:
#    node 中文系统启动器.js "项目主题" --模型数=5 --启动服务


EOF

echo "✅ 配置模板已生成"
echo "📁 总环境变量数量: 45 个"
echo "🔑 必需API密钥数量: 8 个 (DeepSeek, GLM, Kimi, Aliyun, OpenAI, Claude, Gemini, Security)"
echo "📊 系统总配置项: 60 个"