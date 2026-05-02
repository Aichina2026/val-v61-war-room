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
