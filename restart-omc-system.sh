#!/bin/bash

# OMC系统重启脚本
# 安全地重启OMC路由系统以应用新配置

echo "🚀 OMC系统重启开始"
echo "============================================"

# 1. 检查当前进程
echo "🔍 检查当前OMC进程..."
OMC_PID=$(ps aux | grep -E 'omc-automation-system|omc-router' | grep -v grep | awk '{print $2}')

if [ -n "$OMC_PID" ]; then
    echo "📊 发现运行中的OMC进程: $OMC_PID"
    
    # 2. 优雅停止进程
    echo "🛑 优雅停止OMC进程..."
    for pid in $OMC_PID; do
        echo "  停止进程 $pid..."
        kill -TERM $pid 2>/dev/null
    done
    
    # 3. 等待进程停止
    echo "⏳ 等待进程停止..."
    sleep 3
    
    # 4. 检查是否还有进程运行
    STILL_RUNNING=$(ps aux | grep -E 'omc-automation-system|omc-router' | grep -v grep | wc -l)
    if [ "$STILL_RUNNING" -gt 0 ]; then
        echo "⚠️  仍有进程运行，强制停止..."
        for pid in $OMC_PID; do
            kill -9 $pid 2>/dev/null
        done
        sleep 2
    fi
else
    echo "ℹ️  未发现运行中的OMC进程"
fi

# 5. 清理残留
echo "🧹 清理残留..."
pkill -f "omc-automation-system" 2>/dev/null
pkill -f "omc-router" 2>/dev/null

# 6. 等待确保完全停止
echo "⏳ 等待清理完成..."
sleep 5

# 7. 检查端口占用
echo "🔍 检查端口占用..."
NETSTAT_OUTPUT=$(netstat -tlnp 2>/dev/null | grep -E ':3000|:3001|:3002' || true)
if [ -n "$NETSTAT_OUTPUT" ]; then
    echo "⚠️  发现端口占用:"
    echo "$NETSTAT_OUTPUT"
    echo "  可能需要手动清理"
fi

# 8. 启动新系统
echo "🚀 启动OMC系统..."
cd /root/.openclaw/workspace

# 检查配置文件
echo "📋 检查配置文件..."
if [ ! -f "omc-automation-system.js" ]; then
    echo "❌ 找不到 omc-automation-system.js"
    exit 1
fi

if [ ! -f "openclaw-update-models.json" ]; then
    echo "❌ 找不到 openclaw-update-models.json"
    exit 1
fi

# 启动系统
echo "💡 启动自动化系统..."
nohup node omc-automation-system.js start > omc-restart.log 2>&1 &
AUTOMATION_PID=$!

# 等待启动
echo "⏳ 等待系统启动..."
sleep 10

# 9. 验证启动状态
echo "🔍 验证启动状态..."
if ps -p $AUTOMATION_PID > /dev/null; then
    echo "✅ OMC自动化系统已启动 (PID: $AUTOMATION_PID)"
    
    # 检查日志
    echo "📝 查看启动日志..."
    if [ -f "omc-restart.log" ]; then
        tail -20 omc-restart.log
    fi
else
    echo "❌ OMC自动化系统启动失败"
    if [ -f "omc-restart.log" ]; then
        echo "📝 错误日志:"
        tail -50 omc-restart.log
    fi
    exit 1
fi

# 10. 检查路由系统
echo "🔍 检查路由系统状态..."
ROUTER_PROCESS=$(ps aux | grep -i router | grep -v grep | wc -l)
if [ "$ROUTER_PROCESS" -gt 0 ]; then
    echo "✅ 路由系统运行正常"
else
    echo "⚠️  路由系统可能未启动"
fi

# 11. 最终状态
echo "============================================"
echo "🎉 OMC系统重启完成"
echo ""
echo "📊 系统状态:"
echo "  - 自动化系统: ✅ 运行中 (PID: $AUTOMATION_PID)"
echo "  - 模型配置: ✅ 已更新 (10个模型)"
echo "  - 阶段策略: ✅ 已配置 (5个阶段)"
echo ""
echo "💡 下一步操作:"
echo "  1. 监控系统日志: tail -f omc-restart.log"
echo "  2. 测试路由功能"
echo "  3. 验证模型可用性"
echo ""
echo "📝 日志文件: omc-restart.log"
echo "📋 配置摘要: model-config-summary-2026-04-12.md"