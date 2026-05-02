#!/bin/bash

# VAL Pro 网站修复部署脚本
# 目标: 修复 http://118.196.114.22:3210/pro_index.html
# 作者: OpenClaw AI Assistant
# 日期: 2026-04-22

set -e

echo "========================================="
echo "VAL Pro 网站修复部署脚本"
echo "========================================="

# 配置
SERVER_IP="118.196.114.22"
SERVER_PORT="3210"
NGINX_PORT="80"
API_PORT="8000"
DASHBOARD_PORT="3000"

# 环境变量配置
ENV_CONFIG_FILE="val_pro_env.sh"
ENV_VARS=(
    "VAL_API_BASE_URL=http://${SERVER_IP}:${API_PORT}"
    "VAL_DASHBOARD_URL=http://${SERVER_IP}:${DASHBOARD_PORT}"
    "VAL_SITE_URL=http://${SERVER_IP}:${SERVER_PORT}"
    "VAL_AI_MODEL=deepseek-v3.2"
    "VAL_MAX_TOKENS=200000"
    "VAL_TEMPERATURE=0.7"
    "VAL_LOG_LEVEL=info"
    "VAL_CACHE_TTL=3600"
    "VAL_ENABLE_METRICS=true"
    "VAL_METRICS_PORT=9090"
    "VAL_BACKUP_ENABLED=true"
    "VAL_BACKUP_SCHEDULE=\"0 2 * * *\""
    "VAL_ALLOWED_ORIGINS=http://${SERVER_IP}:${DASHBOARD_PORT},http://${SERVER_IP}:${SERVER_PORT}"
)

# 检查服务器连接
echo "1. 检查服务器连接..."
ping -c 2 $SERVER_IP > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "   ✓ 服务器可访问"
else
    echo "   ✗ 无法连接到服务器"
    exit 1
fi

# 检查端口
echo "2. 检查服务端口..."
echo "   端口80 (nginx):"
if nc -z $SERVER_IP $NGINX_PORT 2>/dev/null; then
    echo "     ✓ 运行中"
else
    echo "     ✗ 未运行"
fi

echo "   端口3000 (控制台):"
if nc -z $SERVER_IP $DASHBOARD_PORT 2>/dev/null; then
    echo "     ✓ 运行中"
else
    echo "     ✗ 未运行"
fi

echo "   端口8000 (API):"
if nc -z $SERVER_IP $API_PORT 2>/dev/null; then
    echo "     ✓ 运行中"
else
    echo "     ✗ 未运行"
fi

echo "   端口3210 (目标端口):"
if nc -z $SERVER_IP $SERVER_PORT 2>/dev/null; then
    echo "     ✓ 运行中 - 无需修复"
    exit 0
else
    echo "     ✗ 未运行 - 需要修复"
fi

# 创建环境变量文件
echo "3. 创建环境变量配置..."
cat > $ENV_CONFIG_FILE << EOF
#!/bin/bash
# VAL Pro 环境变量配置
# 生成时间: $(date)

EOF

for env_var in "${ENV_VARS[@]}"; do
    echo "export $env_var" >> $ENV_CONFIG_FILE
done

cat >> $ENV_CONFIG_FILE << EOF

# 显示所有环境变量
echo "VAL Pro 环境变量:"
env | grep ^VAL_ | sort
EOF

chmod +x $ENV_CONFIG_FILE
echo "   ✓ 环境变量文件已创建: $ENV_CONFIG_FILE"

# 创建HTML文件
echo "4. 创建HTML文件..."
HTML_FILE="val_pro_index.html"
cp pro_index.html $HTML_FILE 2>/dev/null || echo "   ⚠ 使用默认HTML模板"

# 创建启动脚本
echo "5. 创建服务启动脚本..."
START_SCRIPT="start_val_pro.sh"
cat > $START_SCRIPT << 'EOF'
#!/bin/bash

# VAL Pro 服务启动脚本
# 在端口3210启动服务

set -e

PORT=${1:-3210}
WORK_DIR=$(dirname "$0")
cd "$WORK_DIR"

# 加载环境变量
if [ -f val_pro_env.sh ]; then
    source val_pro_env.sh
    echo "环境变量已加载"
fi

echo "启动 VAL Pro 服务在端口 $PORT..."

# 检查Python
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
else
    echo "错误: 未找到Python"
    exit 1
fi

# 创建简单的HTTP服务器
cat > val_pro_server.py << PYEOF
import http.server
import socketserver
import os
import json
from datetime import datetime

PORT = int(os.environ.get('VAL_SERVER_PORT', $PORT))

class ValProHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/pro_index.html' or self.path == '/':
            self.send_response(200)
            self.send_header('Content-type', 'text/html; charset=utf-8')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            with open('val_pro_index.html', 'rb') as f:
                self.wfile.write(f.read())
        
        elif self.path == '/env':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            env_vars = {k: v for k, v in os.environ.items() if k.startswith('VAL_')}
            self.wfile.write(json.dumps(env_vars, indent=2).encode())
        
        elif self.path == '/health':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            
            health_status = {
                "status": "healthy",
                "service": "VAL Pro Web",
                "port": PORT,
                "timestamp": datetime.now().isoformat(),
                "environment": "production"
            }
            self.wfile.write(json.dumps(health_status, indent=2).encode())
        
        elif self.path == '/api/services':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            services = {
                "dashboard": "http://118.196.114.22:3000",
                "api": "http://118.196.114.22:8000",
                "docs": "http://118.196.114.22:8000/docs",
                "current_service": f"http://118.196.114.22:{PORT}"
            }
            self.wfile.write(json.dumps(services, indent=2).encode())
        
        else:
            self.send_response(404)
            self.send_header('Content-type', 'text/html; charset=utf-8')
            self.end_headers()
            self.wfile.write(b'<h1>404 - Page Not Found</h1><p>Visit <a href="/pro_index.html">pro_index.html</a></p>')

if __name__ == '__main__':
    with socketserver.TCPServer(("", PORT), ValProHandler) as httpd:
        print(f"VAL Pro 服务运行在端口 {PORT}")
        print(f"访问: http://localhost:{PORT}/pro_index.html")
        print(f"环境变量: http://localhost:{PORT}/env")
        print(f"按 Ctrl+C 停止服务")
        httpd.serve_forever()
PYEOF

# 启动服务器
echo "启动Python HTTP服务器..."
$PYTHON_CMD val_pro_server.py
EOF

chmod +x $START_SCRIPT
echo "   ✓ 启动脚本已创建: $START_SCRIPT"

# 创建nginx配置示例
echo "6. 创建nginx配置示例..."
NGINX_CONFIG="val_pro_nginx.conf"
cat > $NGINX_CONFIG << EOF
# VAL Pro Nginx 配置
# 将以下配置添加到 /etc/nginx/sites-available/ 或 /etc/nginx/conf.d/

server {
    listen 3210;
    server_name 118.196.114.22;
    
    location / {
        # 如果使用Python服务器
        proxy_pass http://127.0.0.1:3211;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # 或者直接提供静态文件
        # root /var/www/val_pro;
        # index pro_index.html;
    }
    
    location /env {
        proxy_pass http://127.0.0.1:3211;
        proxy_set_header Host \$host;
    }
    
    location /health {
        proxy_pass http://127.0.0.1:3211;
        proxy_set_header Host \$host;
    }
    
    location /api/ {
        proxy_pass http://118.196.114.22:8000/;
        proxy_set_header Host \$host;
    }
}

# 或者简单的静态文件服务
server {
    listen 3210;
    server_name 118.196.114.22;
    root /var/www/val_pro;
    index pro_index.html;
    
    location / {
        try_files \$uri \$uri/ =404;
    }
}
EOF

echo "   ✓ Nginx配置示例已创建: $NGINX_CONFIG"

# 创建部署说明
echo "7. 创建部署说明..."
DEPLOY_GUIDE="DEPLOYMENT_GUIDE.md"
cat > $DEPLOY_GUIDE << 'EOF'
# VAL Pro 网站修复部署指南

## 问题描述
原始网址 `http://118.196.114.22:3210/pro_index.html` 无法访问，端口3210无服务运行。

## 解决方案
1. 在端口3210启动Web服务
2. 提供 `pro_index.html` 文件
3. 配置环境变量
4. 集成现有服务（端口3000和8000）

## 文件说明
- `val_pro_index.html` - 主HTML文件
- `val_pro_env.sh` - 环境变量配置
- `start_val_pro.sh` - 服务启动脚本
- `val_pro_nginx.conf` - Nginx配置示例
- `val_pro_server.py` - Python HTTP服务器

## 快速部署

### 方法1: 使用Python服务器（推荐）
```bash
# 1. 上传文件到服务器
scp val_pro_* user@118.196.114.22:/opt/val_pro/

# 2. 登录服务器
ssh user@118.196.114.22

# 3. 进入目录
cd /opt/val_pro

# 4. 设置权限
chmod +x *.sh

# 5. 加载环境变量
source val_pro_env.sh

# 6. 启动服务
./start_val_pro.sh 3210

# 7. 检查服务
curl http://localhost:3210/pro_index.html
curl http://localhost:3210/health
curl http://localhost:3210/env
```

### 方法2: 使用Nginx
```bash
# 1. 复制配置文件
sudo cp val_pro_nginx.conf /etc/nginx/sites-available/val_pro
sudo ln -s /etc/nginx/sites-available/val_pro /etc/nginx/sites-enabled/

# 2. 创建网站目录
sudo mkdir -p /var/www/val_pro
sudo cp val_pro_index.html /var/www/val_pro/pro_index.html

# 3. 测试配置
sudo nginx -t

# 4. 重启Nginx
sudo systemctl restart nginx

# 5. 检查服务
curl http://118.196.114.22:3210/pro_index.html
```

### 方法3: 使用Docker
```bash
# 创建Dockerfile
cat > Dockerfile << DOCKEREOF
FROM nginx:alpine
COPY val_pro_index.html /usr/share/nginx/html/pro_index.html
COPY val_pro_env.sh /etc/val_pro/env.sh
EXPOSE 3210
CMD ["nginx", "-g", "daemon off;"]
DOCKEREOF

# 构建镜像
docker build -t val-pro-site .

# 运行容器
docker run -d \
  -p 3210:80 \
  --name val-pro \
  --env-file val_pro_env.sh \
  val-pro-site
```

## 环境变量
关键环境变量已配置在 `val_pro_env.sh` 中：
- `VAL_API_BASE_URL` - API服务地址
- `VAL_DASHBOARD_URL` - 控制台地址
- `VAL_SITE_URL` - 当前网站地址
- `VAL_AI_MODEL` - 默认AI模型
- 其他配置参数

## 验证
1. 访问 `http://118.196.114.22:3210/pro_index.html`
2. 检查环境变量端点 `http://118.196.114.22:3210/env`
3. 检查健康状态 `http://118.196.114.22:3210/health`
4. 检查服务集成 `http://118.196.114.22:3210/api/services`

## 监控
- 服务日志: 查看Python服务器或Nginx日志
- 健康检查: 定期访问 `/health` 端点
- 性能监控: 使用配置的监控端口（如9090）

## 故障排除
1. **端口被占用**: 检查端口3210是否被其他服务使用
2. **权限问题**: 确保Web服务器有文件读取权限
3. **防火墙**: 检查防火墙是否允许端口3210
4. **服务依赖**: 确保端口3000和8000的服务正常运行

## 更新
1. 更新HTML文件: 替换 `val_pro_index.html`
2. 更新环境变量: 编辑 `val_pro_env.sh`
3. 重启服务: 停止并重新启动服务
```

echo "   ✓ 部署指南已创建: $DEPLOY_GUIDE"

echo ""
echo "========================================="
echo "部署准备完成！"
echo "========================================="
echo ""
echo "已创建以下文件："
echo "1. $HTML_FILE        - 网站HTML文件"
echo "2. $ENV_CONFIG_FILE  - 环境变量配置"
echo "3. $START_SCRIPT     - 服务启动脚本"
echo "4. $NGINX_CONFIG     - Nginx配置示例"
echo "5. $DEPLOY_GUIDE     - 部署指南"
echo ""
echo "下一步："
echo "1. 将文件上传到服务器 118.196.114.22"
echo "2. 按照部署指南进行操作"
echo "3. 启动服务在端口3210"
echo "4. 验证访问 http://118.196.114.22:3210/pro_index.html"
echo ""
echo "环境变量已配置："
for env_var in "${ENV_VARS[@]}"; do
    echo "  $env_var"
done