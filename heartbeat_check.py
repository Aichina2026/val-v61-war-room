#!/usr/bin/env python3
"""
4AI心跳检查脚本
执行时间: 2026-04-18 22:13
"""

import os
import sys
import json
import time
import psutil
import subprocess
from datetime import datetime

def check_system_health():
    """系统健康检查"""
    print("1. 系统健康检查")
    
    # 内存使用
    memory = psutil.virtual_memory()
    print(f"  内存使用: {memory.percent:.1f}% ({memory.used/1024/1024/1024:.1f}GB/{memory.total/1024/1024/1024:.1f}GB)")
    
    # 磁盘空间
    disk = psutil.disk_usage('/')
    print(f"  磁盘使用: {disk.percent:.1f}% ({disk.used/1024/1024/1024:.1f}GB/{disk.total/1024/1024/1024:.1f}GB)")
    
    # CPU负载
    cpu_percent = psutil.cpu_percent(interval=1)
    print(f"  CPU负载: {cpu_percent:.1f}%")
    
    # 磁盘空间告警
    if disk.percent > 90:
        print(f"  ⚠️  磁盘空间不足: {disk.percent:.1f}%")
        return False
        
    return True

def check_api_connectivity():
    """API连接性检查"""
    print("\n2. API连接性检查")
    
    # 检查是否有API密钥配置
    api_keys = {
        "OPENAI_API_KEY": os.getenv("OPENAI_API_KEY"),
        "ANTHROPIC_API_KEY": os.getenv("ANTHROPIC_API_KEY"),
        "GEMINI_API_KEY": os.getenv("GEMINI_API_KEY")
    }
    
    configured = 0
    for key, value in api_keys.items():
        if value and len(value) > 10 and value != "placeholder":
            configured += 1
            print(f"  ✅ {key}: 已配置")
        else:
            print(f"  ⚠️  {key}: 未配置或无效")
    
    # 检查VAL系统连接性
    print("\n3. VAL系统连接性检查")
    
    # 检查原生工具
    tools_path = "/opt/arkclaw/tools"
    if os.path.exists(tools_path):
        tools = os.listdir(tools_path)
        print(f"  ✅ 原生工具目录存在: {len(tools)}个工具")
        for tool in tools:
            print(f"     - {tool}")
    else:
        print(f"  ❌ 原生工具目录不存在")
        
    # 检查VAL V6.1系统
    val_path = "/opt/val-nexus"
    if os.path.exists(val_path):
        print(f"  ✅ VAL V6.1系统已部署")
        
        # 检查核心文件
        files_to_check = [
            f"{val_path}/backend/core/swarm.py",
            f"{val_path}/backend/main.py",
            f"{val_path}/frontend/app/page.tsx",
            f"{val_path}/docker-compose.yml"
        ]
        
        for file in files_to_check:
            if os.path.exists(file):
                print(f"     ✅ {os.path.basename(file)}")
            else:
                print(f"     ❌ {os.path.basename(file)}")
    else:
        print(f"  ⚠️  VAL V6.1系统未部署")
    
    return configured > 0  # 至少有一个API密钥配置

def check_model_availability():
    """模型可用性检查"""
    print("\n4. 模型可用性检查")
    
    # 检查并行AI技能工具
    parallel_skill = "/opt/arkclaw/tools/parallel_ai_skill/main.py"
    if os.path.exists(parallel_skill):
        try:
            # 测试调用
            start_time = time.time()
            cmd = ["python", parallel_skill, "--models", "test-model", "--prompt", "test"]
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            response_time = (time.time() - start_time) * 1000  # 毫秒
            
            if result.returncode == 0:
                print(f"  ✅ 并行AI技能: 可用 (响应时间: {response_time:.0f}ms)")
                return True
            else:
                print(f"  ❌ 并行AI技能: 调用失败 - {result.stderr[:100]}")
                return False
                
        except Exception as e:
            print(f"  ❌ 并行AI技能: 异常 - {str(e)[:100]}")
            return False
    else:
        print(f"  ⚠️  并行AI技能工具不存在")
        return False

def check_performance_metrics():
    """性能指标检查"""
    print("\n5. 性能指标检查")
    
    # 检查日志文件大小
    log_dirs = [
        "/var/log",
        "/root/.openclaw/logs",
        "/root/.openclaw/workspace/logs"
    ]
    
    large_logs = []
    for log_dir in log_dirs:
        if os.path.exists(log_dir):
            try:
                # 检查大于100MB的日志文件
                result = subprocess.run(
                    ["find", log_dir, "-name", "*.log", "-o", "-name", "*.log.*", "-size", "+100M"],
                    capture_output=True,
                    text=True
                )
                
                if result.stdout.strip():
                    files = result.stdout.strip().split('\n')
                    large_logs.extend(files[:3])  # 只显示前3个
                    
            except Exception as e:
                pass
    
    if large_logs:
        print(f"  ⚠️  发现大日志文件:")
        for log in large_logs[:3]:
            size = os.path.getsize(log) / 1024 / 1024
            print(f"     - {os.path.basename(log)}: {size:.1f}MB")
    else:
        print(f"  ✅ 日志文件大小正常")
    
    return len(large_logs) == 0

def generate_report():
    """生成心跳检查报告"""
    print("\n" + "="*60)
    print("4AI心跳检查报告")
    print(f"检查时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*60)
    
    all_passed = True
    
    # 执行检查
    health_ok = check_system_health()
    api_ok = check_api_connectivity()
    model_ok = check_model_availability()
    perf_ok = check_performance_metrics()
    
    # 汇总结果
    print("\n" + "="*60)
    print("检查结果汇总:")
    print(f"  系统健康: {'✅ 通过' if health_ok else '❌ 失败'}")
    print(f"  API连接: {'✅ 通过' if api_ok else '⚠️  警告'}")
    print(f"  模型可用: {'✅ 通过' if model_ok else '❌ 失败'}")
    print(f"  性能指标: {'✅ 通过' if perf_ok else '⚠️  警告'}")
    
    all_passed = health_ok and model_ok
    
    print(f"\n总体状态: {'✅ 健康' if all_passed else '⚠️  需要关注'}")
    
    # 生成JSON报告
    report = {
        "timestamp": datetime.now().isoformat(),
        "checks": {
            "system_health": health_ok,
            "api_connectivity": api_ok,
            "model_availability": model_ok,
            "performance_metrics": perf_ok
        },
        "status": "healthy" if all_passed else "needs_attention",
        "message": "4AI系统心跳检查完成"
    }
    
    # 保存报告
    report_path = "/root/.openclaw/workspace/logs/heartbeat_report.json"
    os.makedirs(os.path.dirname(report_path), exist_ok=True)
    
    with open(report_path, 'w') as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    
    print(f"\n报告已保存: {report_path}")
    return all_passed

if __name__ == "__main__":
    # 安装必要依赖
    try:
        import psutil
    except ImportError:
        print("安装psutil依赖...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "psutil"])
        import psutil
    
    # 执行检查
    success = generate_report()
    
    # 根据结果退出
    sys.exit(0 if success else 1)