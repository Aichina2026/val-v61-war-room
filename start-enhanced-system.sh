#!/bin/bash
# 增强系统启动脚本

set -e

WORKSPACE="/root/.openclaw/workspace"
LOG_DIR="$WORKSPACE/omc-automation-logs"
REPORT_DIR="$WORKSPACE/omc-4ai-reports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$LOG_DIR/enhanced_system_${TIMESTAMP}.log"

# 创建必要的目录
mkdir -p "$LOG_DIR"
mkdir -p "$REPORT_DIR"

echo "🚀 启动增强系统部署..."
echo "日志文件: $LOG_FILE"
echo "报告目录: $REPORT_DIR"
echo ""

# 检查Node.js是否可用
if ! command -v node &> /dev/null; then
    echo "❌ Node.js未安装，请先安装Node.js"
    exit 1
fi

echo "📋 系统检查..."
echo "Node.js版本: $(node --version)"
echo "工作空间: $WORKSPACE"
echo ""

# 检查必要的文件
REQUIRED_FILES=(
    "deploy-enhanced-system.js"
    "4ai-role-system.json"
    "omc-enhanced-workflow-v2.js"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$WORKSPACE/$file" ]; then
        echo "✅ $file 存在"
    else
        echo "❌ $file 不存在"
        exit 1
    fi
done

echo ""
echo "🔧 启动部署..."

# 运行部署脚本，同时输出到控制台和日志文件
{
    echo "================================"
    echo "增强系统部署开始 - $TIMESTAMP"
    echo "================================"
    echo ""
    
    cd "$WORKSPACE"
    node deploy-enhanced-system.js --deploy
    
    echo ""
    echo "================================"
    echo "增强系统部署完成 - $(date +%Y%m%d_%H%M%S)"
    echo "================================"
} 2>&1 | tee "$LOG_FILE"

echo ""
echo "📊 部署摘要:"
echo "   日志文件: $LOG_FILE"
echo "   报告目录: $REPORT_DIR"
echo ""

# 检查是否有错误
if grep -q "❌" "$LOG_FILE"; then
    echo "⚠️  部署过程中检测到错误，请检查日志文件"
    echo "错误摘要:"
    grep "❌" "$LOG_FILE" | head -5
fi

if grep -q "✅" "$LOG_FILE"; then
    echo "✅ 部署完成，系统正在运行"
    echo "按Ctrl+C停止系统"
fi

echo ""
echo "🔍 查看实时日志: tail -f $LOG_FILE"
echo "📁 查看生成报告: ls -la $REPORT_DIR/"