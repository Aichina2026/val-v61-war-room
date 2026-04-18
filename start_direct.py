#!/usr/bin/env python3
"""
VAL V6.1 OS - Direct Startup (No Docker Mode)
当Docker镜像拉取失败时的备用启动方案
"""

import subprocess
import sys
import os

# Add backend to path
sys.path.insert(0, '/opt/val-nexus/backend')

def check_dependencies():
    """检查并安装依赖"""
    deps = ["fastapi", "uvicorn", "pydantic"]
    for dep in deps:
        try:
            __import__(dep)
        except ImportError:
            print(f"Installing {dep}...")
            subprocess.run([sys.executable, "-m", "pip", "install", dep, "-q"], check=False)

def start_backend():
    """启动后端服务"""
    os.chdir('/opt/val-nexus/backend')
    
    # 设置环境变量
    os.environ['PYTHONPATH'] = '/opt/val-nexus/backend'
    
    print("[VAL V6.1] 正在启动后端服务...")
    print("[VAL V6.1] 原生工具路径: /opt/arkclaw/tools")
    
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)

if __name__ == "__main__":
    check_dependencies()
    start_backend()
