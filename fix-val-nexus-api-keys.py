#!/usr/bin/env python3
"""
修复VAL-Nexus V6.1.2WEB API密钥配置问题
将现有的API密钥映射到后端期望的环境变量名
"""

import os
import re
from pathlib import Path

def read_env_file(env_path):
    """读取.env文件内容"""
    env_vars = {}
    with open(env_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#'):
                # 处理带引号的值
                if '=' in line:
                    key, value = line.split('=', 1)
                    key = key.strip()
                    value = value.strip()
                    # 去除引号
                    if (value.startswith('"') and value.endswith('"')) or \
                       (value.startswith("'") and value.endswith("'")):
                        value = value[1:-1]
                    env_vars[key] = value
    return env_vars

def create_env_mapping(existing_vars):
    """创建环境变量映射"""
    mapping = {}
    
    # ALI映射
    ali_keys = [k for k in existing_vars.keys() if k.startswith('ALI_KEY_')]
    if ali_keys:
        # 使用第一个有效的ALI密钥
        for key in sorted(ali_keys):
            if existing_vars[key]:
                mapping['ALI_API_KEY'] = existing_vars[key]
                break
    
    # ARK映射
    ark_keys = [k for k in existing_vars.keys() if k.startswith('ARK_KEY_')]
    if ark_keys:
        for key in sorted(ark_keys):
            if existing_vars[key]:
                mapping['ARK_API_KEY'] = existing_vars[key]
                break
    
    # KIMI映射
    kimi_keys = [k for k in existing_vars.keys() if k.startswith('KIMI_KEY_')]
    if kimi_keys:
        for key in sorted(kimi_keys):
            if existing_vars[key]:
                mapping['KIMI_API_KEY'] = existing_vars[key]
                break
    
    # 检查是否已有ARK_API_KEY
    if 'ARK_API_KEY' in existing_vars and existing_vars['ARK_API_KEY']:
        mapping['ARK_API_KEY'] = existing_vars['ARK_API_KEY']
    
    # 添加其他需要的环境变量（设置为模拟值或空）
    required_vars = {
        'OPENAI_API_KEY': '',
        'ANTHROPIC_API_KEY': '',
        'BRAVE_API_KEY': '',
        '4SAPI_KEY': '',
        'VOLCANO_API_KEY': '',
    }
    
    # 更新映射
    for var in required_vars:
        if var not in mapping:
            mapping[var] = required_vars[var]
    
    return mapping

def write_env_update(mapping, output_path):
    """写入环境变量更新"""
    lines = []
    lines.append("# VAL-Nexus V6.1.2WEB API密钥配置")
    lines.append("# 自动生成的映射文件")
    lines.append("")
    
    for key, value in sorted(mapping.items()):
        if value:
            lines.append(f"{key}=\"{value}\"")
        else:
            lines.append(f"#{key}=")
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
    
    print(f"✅ 已生成环境变量映射文件: {output_path}")
    print(f"   包含 {len([v for v in mapping.values() if v])} 个有效API密钥")

def create_systemd_service_update():
    """创建systemd服务更新，设置环境变量"""
    service_content = """[Unit]
Description=VAL-Nexus V6.1.2WEB Backend
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/val-nexus/backend
EnvironmentFile=/root/.openclaw/val-nexus.env
ExecStart=/usr/bin/python main_complete.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
"""
    
    service_path = "/etc/systemd/system/val-nexus.service"
    
    # 创建环境变量文件
    env_file = "/root/.openclaw/val-nexus.env"
    
    return service_content, env_file, service_path

def main():
    print("🔧 开始修复VAL-Nexus V6.1.2WEB API密钥配置问题")
    print("=" * 60)
    
    # 1. 读取现有环境变量
    env_path = "/root/.openclaw/.env"
    if not os.path.exists(env_path):
        print(f"❌ 找不到环境变量文件: {env_path}")
        return
    
    print(f"📂 读取环境变量文件: {env_path}")
    existing_vars = read_env_file(env_path)
    print(f"   找到 {len(existing_vars)} 个环境变量")
    
    # 2. 创建映射
    print("\n🔄 创建API密钥映射...")
    mapping = create_env_mapping(existing_vars)
    
    print("   映射结果:")
    for key, value in sorted(mapping.items()):
        status = "✅ 有效" if value else "❌ 缺失"
        value_display = value[:20] + "..." if value and len(value) > 20 else value
        print(f"     {key}: {value_display} ({status})")
    
    # 3. 写入新的环境变量文件
    output_path = "/root/.openclaw/val-nexus.env"
    write_env_update(mapping, output_path)
    
    # 4. 创建systemd服务文件
    print("\n⚙️  创建systemd服务配置...")
    service_content, env_file, service_path = create_systemd_service_update()
    
    # 写入服务文件
    with open(service_path, 'w', encoding='utf-8') as f:
        f.write(service_content)
    print(f"✅ 已创建systemd服务文件: {service_path}")
    
    # 5. 重新加载systemd并重启服务
    print("\n🔄 重新加载systemd配置...")
    os.system("systemctl daemon-reload")
    
    print("🔄 重启VAL-Nexus服务...")
    os.system("systemctl restart val-nexus")
    
    # 6. 检查服务状态
    print("\n📊 检查服务状态...")
    os.system("systemctl status val-nexus --no-pager -l")
    
    print("\n" + "=" * 60)
    print("✅ 修复完成!")
    print("\n📋 下一步:")
    print("1. 等待30秒让服务完全启动")
    print("2. 访问 http://localhost:8000/health 检查API密钥状态")
    print("3. 如果仍有问题，请检查日志: journalctl -u val-nexus -f")
    print("4. 前端界面: http://localhost:3000")
    
    # 等待一下然后检查状态
    import time
    time.sleep(5)
    
    print("\n🔍 自动检查API密钥状态...")
    os.system("curl -s http://localhost:8000/health | python3 -c \""
              "import json,sys; d=json.load(sys.stdin); "
              "keys=d.get('api_keys',{}); "
              "print('总密钥数:', keys.get('total_keys',0)); "
              "print('可用密钥:', list(keys.get('available_keys',{}).keys()))"
              "\"")

if __name__ == "__main__":
    main()