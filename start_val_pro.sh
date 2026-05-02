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
