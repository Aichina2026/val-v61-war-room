#!/bin/bash
# OpenClaw LLM 路由系统部署脚本

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 开始部署 OpenClaw LLM 路由系统...${NC}"

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker 未安装${NC}"
    echo "请先安装 Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

# 检查 Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}⚠️  Docker Compose 未安装，将使用 Docker 命令${NC}"
    USE_COMPOSE=false
else
    USE_COMPOSE=true
fi

# 创建必要目录
echo "📁 创建目录..."
mkdir -p data/redis
mkdir -p logs
mkdir -p config

# 检查配置文件
if [[ ! -f "config/settings.yaml" ]]; then
    echo -e "${YELLOW}⚠️  配置文件不存在，创建默认配置${NC}"
    cp config/settings.yaml.example config/settings.yaml 2>/dev/null || \
    cat > config/settings.yaml << 'EOF'
# OpenClaw LLM 路由系统配置
# 请填入实际的 API Key

redis:
  host: "localhost"
  port: 6379
  password: null

cache:
  enabled: true
  ttl: 3600
  max_size: 10000

providers:
  foursapi:
    name: "4Sapi NewAPI"
    base_url: "https://4sapi.com/v1"
    api_keys:
      - "sk-4s-key1"  # ⚠️ 替换为实际 Key
    priority: 1
    timeout: 120
    max_retries: 3
    enabled: true

  openrouter:
    name: "OpenRouter"
    base_url: "https://openrouter.ai/api/v1"
    api_keys:
      - "sk-or-key1"  # ⚠️ 替换为实际 Key
    priority: 2
    timeout: 150
    max_retries: 3
    enabled: true
EOF
    echo -e "${YELLOW}⚠️  请编辑 config/settings.yaml 填入实际的 API Key${NC}"
fi

# 构建 Docker 镜像
echo "🐳 构建 Docker 镜像..."
docker build -t openclaw-llm-router:latest .

# 停止并移除旧容器
echo "🧹 清理旧容器..."
docker stop openclaw-llm-router 2>/dev/null || true
docker rm openclaw-llm-router 2>/dev/null || true

# 运行容器
echo "🚀 启动路由服务..."
docker run -d \
    --name openclaw-llm-router \
    --restart unless-stopped \
    -p 8000:8000 \
    -p 9091:9091 \
    -v $(pwd)/config:/app/config \
    -v $(pwd)/logs:/app/logs \
    -e "PYTHONPATH=/app" \
    openclaw-llm-router:latest

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 10

# 检查服务状态
if curl -s http://localhost:8000/health > /dev/null; then
    echo -e "${GREEN}✅ 路由服务启动成功！${NC}"
    echo ""
    echo "📊 服务信息:"
    echo "  - API 端点: http://localhost:8000/v1/chat/completions"
    echo "  - 健康检查: http://localhost:8000/health"
    echo "  - 监控指标: http://localhost:8000/stats"
    echo "  - 管理界面: http://localhost:8000/docs"
    echo ""
    echo "🔧 管理命令:"
    echo "  - 查看日志: docker logs openclaw-llm-router"
    echo "  - 重启服务: docker restart openclaw-llm-router"
    echo "  - 停止服务: docker stop openclaw-llm-router"
    echo "  - 删除服务: docker rm -f openclaw-llm-router"
    echo ""
    echo -e "${GREEN}🎉 部署完成！请确保已配置正确的 API Key${NC}"
    
else
    echo -e "${RED}❌ 服务启动失败，请检查日志${NC}"
    docker logs openclaw-llm-router --tail 20
    exit 1
fi


# 可选: 创建 systemd 服务（如果需要在系统启动时自动启动）
if [[ "$1" == "--systemd" ]]; then
    echo ""
    echo "🔧 创建 systemd 服务..."
    
    cat > /etc/systemd/system/openclaw-llm-router.service << EOF
[Unit]
Description=OpenClaw LLM Router Service
Requires=docker.service
After=docker.service network.target

[Service]
Type=simple
Restart=always
RestartSec=10
WorkingDirectory=$(pwd)
ExecStart=/usr/bin/docker start -a openclaw-llm-router
ExecStop=/usr/bin/docker stop openclaw-llm-router



[Install]
WantedBy=multi-user.target
EOF
    
    systemctl daemon-reload
    systemctl enable openclaw-llm-router
    
    echo -e "${GREEN}✅ systemd 服务创建完成${NC}"
    echo "  启动服务: systemctl start openclaw-llm-router"
    echo "  服务状态: systemctl status openclaw-llm-router"
fi


echo ""
echo "📋 下一步:"
echo "  1. 编辑 config/settings.yaml 填入实际的 API Key"
echo "  2. 访问 http://localhost:8000/docs 查看 API 文档"
echo "  3. 使用 curl 测试服务:"
echo "     curl -X POST http://localhost:8000/v1/chat/completions \\"
echo "       -H \"Content-Type: application/json\" \\"
echo "       -d '{\"model\":\"gpt-3.5-turbo\",\"messages\":[{\"role\":\"user\",\"content\":\"你好\"}]}'"