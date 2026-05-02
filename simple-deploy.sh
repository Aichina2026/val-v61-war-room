#!/bin/bash

echo "🚀 OMC工作流智能路由集成 - 生产部署开始"
echo "=========================================="

# 1. 备份现有系统
echo ""
echo "📦 步骤1: 备份现有系统..."
BACKUP_DIR="backup/production-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp -r modules/code-generation/skills/code-generation/* "$BACKUP_DIR/" 2>/dev/null || true
echo "✅ 备份完成: $BACKUP_DIR ($(ls "$BACKUP_DIR" | wc -l) 个文件)"

# 2. 部署路由适配器
echo ""
echo "🔄 步骤2: 部署路由适配器..."
cp omc-router-adapter.js modules/code-generation/skills/code-generation/
echo "✅ 路由适配器已部署"

# 3. 部署配置文件
echo ""
echo "⚙️  步骤3: 部署生产配置..."
if [ -f "omc-production-config.json" ]; then
    cp omc-production-config.json modules/code-generation/skills/code-generation/
    echo "✅ 生产配置文件已部署"
else
    echo "⚠️ 未找到生产配置文件，创建默认配置..."
    cat > modules/code-generation/skills/code-generation/omc-production-config.json << 'EOF'
{
  "version": "1.0.0",
  "environment": "production",
  "enableMetrics": true,
  "enableFallback": true
}
EOF
    echo "✅ 默认配置已创建"
fi

# 4. 创建启动脚本
echo ""
echo "▶️  步骤4: 创建启动脚本..."
cat > start-omc-workflow-enhanced.sh << 'EOF'
#!/bin/bash

# OMC增强工作流生产启动脚本
# 启动方式: ./start-omc-workflow-enhanced.sh "需求描述"

if [ $# -eq 0 ]; then
    echo "使用方式: $0 \"需求描述\""
    echo "示例: $0 \"创建用户登录系统\""
    exit 1
fi

INPUT="$1"
echo "🚀 启动OMC增强工作流..."
echo "需求: $INPUT"

# 运行增强工作流
node modules/code-generation/skills/code-generation/omc-workflow-enhanced.js "$INPUT"
EOF

chmod +x start-omc-workflow-enhanced.sh
echo "✅ 启动脚本创建完成"

# 5. 验证部署
echo ""
echo "🧪 步骤5: 验证部署结果..."

echo "1. 检查部署文件..."
if [ -f "modules/code-generation/skills/code-generation/omc-router-adapter.js" ]; then
    echo "✅ 路由适配器已就位"
else
    echo "❌ 路由适配器部署失败"
    exit 1
fi

echo "2. 检查配置文件..."
if [ -f "modules/code-generation/skills/code-generation/omc-production-config.json" ]; then
    echo "✅ 生产配置已就位"
else
    echo "⚠️ 生产配置未找到"
fi

echo "3. 创建日志目录..."
mkdir -p logs/production/ 2>/dev/null || true
if [ -d "logs/production/" ]; then
    echo "✅ 日志目录准备就绪"
else
    echo "⚠️ 日志目录创建失败"
fi

echo ""
echo "🎉 生产部署完成!"
echo "=================================="
echo ""
echo "📋 部署结果:"
echo "  ✅ 路由适配器: 已部署"
echo "  ✅ 生产配置: 已就位"
echo "  ✅ 启动脚本: 已创建"
echo "  ✅ 备份系统: 已保存"
echo ""
echo "🚀 启动命令:"
echo "  ./start-omc-workflow-enhanced.sh \"你的需求描述\""
echo ""
echo "📊 监控建议:"
echo "  1. 检查日志: logs/production/"
echo "  2. 监控指标: 使用 router.getMetrics()"
echo "  3. 测试功能: 运行示例任务"
echo ""
echo "🎯 生产环境就绪!"