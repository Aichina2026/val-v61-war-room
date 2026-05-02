#!/bin/bash

# MAC工作流与OpenClaw路由系统集成部署脚本
# 一键完成所有集成文件的部署

set -e

echo "🚀 MAC工作流与OpenClaw路由系统集成部署脚本"
echo "============================================"
echo ""

# 检查当前目录
if [[ ! -d "/root/.openclaw/workspace" ]]; then
    echo "❌ 错误: 不在OpenClaw工作空间目录中"
    exit 1
fi

cd /root/.openclaw/workspace

echo "📋 检查集成文件状态..."
echo ""

# 1. 检查核心路由组件
echo "🔍 检查核心路由组件:"
if [[ -f "real-openclaw-router.js" ]]; then
    echo "  ✅ real-openclaw-router.js 存在"
else
    echo "  ❌ real-openclaw-router.js 不存在"
    exit 1
fi

if [[ -f "routing-integration-config.json" ]]; then
    echo "  ✅ routing-integration-config.json 存在"
else
    echo "  ❌ routing-integration-config.json 不存在"
    exit 1
fi

# 2. 检查集成版本文件
echo ""
echo "🔍 检查集成版本文件:"
INTEGRATED_FILES=(
    "omc-workflow-api-fixed-integrated.js"
    "omc-real-router-integration-integrated.js"
    "omc-router-adapter-integrated.js"
    "omc-workflow-routing-integrated.js"
)

for file in "${INTEGRATED_FILES[@]}"; do
    if [[ -f "$file" ]]; then
        echo "  ✅ $file 存在"
    else
        echo "  ❌ $file 不存在"
        exit 1
    fi
done

# 3. 检查原始文件
echo ""
echo "🔍 检查原始文件:"
ORIGINAL_FILES=(
    "omc-workflow-api-fixed.js"
    "omc-real-router-integration.js"
    "omc-router-adapter.js"
)

for file in "${ORIGINAL_FILES[@]}"; do
    if [[ -f "$file" ]]; then
        echo "  ✅ $file 存在 (将被备份)"
    else
        echo "  ⚠️  $file 不存在 (跳过备份)"
    fi
done

# 4. 询问用户确认
echo ""
read -p "📝 是否开始部署? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ 部署已取消"
    exit 0
fi

echo ""
echo "🔄 开始部署..."
echo ""

# 5. 创建备份目录
BACKUP_DIR="backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
echo "📁 创建备份目录: $BACKUP_DIR"

# 6. 备份原始文件
echo ""
echo "📦 备份原始文件..."
for file in "${ORIGINAL_FILES[@]}"; do
    if [[ -f "$file" ]]; then
        cp "$file" "$BACKUP_DIR/"
        echo "  ✅ $file 已备份到 $BACKUP_DIR/"
    fi
done

# 7. 部署集成版本
echo ""
echo "🚀 部署集成版本..."
DEPLOY_MAP=(
    "omc-workflow-api-fixed-integrated.js:omc-workflow-api-fixed.js"
    "omc-real-router-integration-integrated.js:omc-real-router-integration.js"
    "omc-router-adapter-integrated.js:omc-router-adapter.js"
)

for mapping in "${DEPLOY_MAP[@]}"; do
    IFS=':' read -r source target <<< "$mapping"
    if [[ -f "$source" ]]; then
        cp "$source" "$target"
        echo "  ✅ $source -> $target"
    fi
done

# 8. 测试路由系统
echo ""
echo "🧪 测试路由系统..."
if node test-routing-simple.js > /dev/null 2>&1; then
    echo "  ✅ 路由系统测试通过"
else
    echo "  ⚠️  路由系统测试失败，但部署继续"
fi

# 9. 验证部署
echo ""
echo "🔍 验证部署..."
VALIDATION_SUCCESS=true
for file in "${ORIGINAL_FILES[@]}"; do
    if [[ -f "$file" ]]; then
        # 检查文件是否包含OpenClaw路由
        if grep -q "RealOpenClawRouter\|OpenClaw路由" "$file"; then
            echo "  ✅ $file 已成功集成OpenClaw路由"
        else
            echo "  ❌ $file 可能未正确集成"
            VALIDATION_SUCCESS=false
        fi
    fi
done

# 10. 显示部署总结
echo ""
echo "============================================"
echo "🎉 部署完成!"
echo "============================================"
echo ""
echo "📊 部署总结:"
echo "  - 备份目录: $BACKUP_DIR"
echo "  - 集成文件: ${#INTEGRATED_FILES[@]} 个"
echo "  - 原始文件: ${#ORIGINAL_FILES[@]} 个"
echo "  - 验证状态: $([ "$VALIDATION_SUCCESS" = true ] && echo "✅ 成功" || echo "⚠️ 警告")"
echo ""
echo "🚀 下一步操作:"
echo ""
echo "1. 测试集成功能:"
echo "   node omc-workflow-routing-integrated.js \"测试任务\""
echo ""
echo "2. 查看路由配置:"
echo "   cat routing-integration-config.json"
echo ""
echo "3. 查看完成报告:"
echo "   cat MAC-OPENCLAW-ROUTING-INTEGRATION-COMPLETED.md"
echo ""
echo "4. 如果需要回滚:"
echo "   cp $BACKUP_DIR/* ./"
echo ""
echo "💡 使用建议:"
echo "  - 定期检查路由系统性能"
echo "  - 根据实际需求调整路由策略"
echo "  - 查看生成的性能报告优化配置"
echo ""
echo "📞 技术支持:"
echo "  - 文档: ROUTING-INTEGRATION-README.md"
echo "  - 报告: routing-integration-report.md"
echo "  - 问题: 通过OpenClaw问题跟踪系统"
echo ""
echo "============================================"
echo "部署时间: $(date)"
echo "工作空间: $(pwd)"
echo "============================================"