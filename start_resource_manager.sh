#!/bin/bash
# 智能系统资源管理器 Agent 启动脚本

set -e

echo "🚀 启动智能系统资源管理器 Agent..."

# 检查 Redis 是否运行
if ! systemctl is-active --quiet redis-server; then
    echo "🔧 启动 Redis 服务..."
    systemctl start redis-server
    sleep 2
fi

# 检查 Python 虚拟环境
if [ ! -d "/root/.openclaw/workspace/venv_resources" ]; then
    echo "🐍 创建 Python 虚拟环境..."
    cd /root/.openclaw/workspace
    python3 -m venv venv_resources
    source venv_resources/bin/activate
    pip install fastapi uvicorn psutil redis aiohttp pyyaml
fi

# 检查 Agent 是否已经在运行
if pgrep -f "python main.py" > /dev/null; then
    echo "⚠️  Agent 已经在运行"
    echo "    PID: $(pgrep -f "python main.py")"
    echo "    端点: http://localhost:8001"
    exit 0
fi

# 启动 Agent
cd /root/.openclaw/workspace/resource_manager_agent
nohup /root/.openclaw/workspace/venv_resources/bin/python main.py > /var/log/resource_manager_agent.log 2>&1 &

# 等待启动
echo "⏳ 等待 Agent 启动..."
sleep 5

# 检查是否启动成功
if curl -s http://localhost:8001/health > /dev/null; then
    echo "✅ 智能系统资源管理器 Agent 启动成功！"
    echo ""
    echo "📊 服务信息:"
    echo "  - 健康检查: http://localhost:8001/health"
    echo "  - 系统状态: http://localhost:8001/state"
    echo "  - 历史数据: http://localhost:8001/history"
    echo "  - 优化建议: http://localhost:8001/optimize"
    echo "  - 实时数据: ws://localhost:8001/ws"
    echo "  - 监控指标: http://localhost:8001/metrics"
    echo ""
    echo "🔧 管理命令:"
    echo "  - 查看日志: tail -f /var/log/resource_manager_agent.log"
    echo "  - 停止服务: pkill -f 'python main.py'"
    echo "  - 重启服务: $0 restart"
    echo ""
    echo "📈 当前状态:"
    curl -s http://localhost:8001/health | python3 -m json.tool
else
    echo "❌ Agent 启动失败，请检查日志"
    tail -20 /var/log/resource_manager_agent.log
    exit 1
fi

# 创建 systemd 服务（可选）
if [ "$1" = "--systemd" ]; then
    echo ""
    echo "🔧 创建 systemd 服务..."
    
    cat > /etc/systemd/system/resource-manager-agent.service << EOF
[Unit]
Description=智能系统资源管理器 Agent
After=network.target redis-server.service
Requires=redis-server.service

[Service]
Type=simple
User=root
WorkingDirectory=/root/.openclaw/workspace/resource_manager_agent
ExecStart=/root/.openclaw/workspace/venv_resources/bin/python main.py
Restart=always
RestartSec=10
StandardOutput=append:/var/log/resource_manager_agent.log
StandardError=append:/var/log/resource_manager_agent.log

[Install]
WantedBy=multi-user.target
EOF
    
    systemctl daemon-reload
    systemctl enable resource-manager-agent
    systemctl start resource-manager-agent
    
    echo "✅ systemd 服务创建完成"
    echo "  启动服务: systemctl start resource-manager-agent"
    echo "  服务状态: systemctl status resource-manager-agent"
fi