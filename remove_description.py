#!/usr/bin/env python3
import json
import os

def remove_description(config):
    """移除所有模型的description字段"""
    
    for provider_name, provider in config["models"]["providers"].items():
        if "models" in provider:
            for model in provider["models"]:
                if "description" in model:
                    del model["description"]
    
    return config

def main():
    config_file = "/root/.openclaw/openclaw.json"
    
    # 读取当前配置
    with open(config_file, 'r', encoding='utf-8') as f:
        config = json.load(f)
    
    print("🔧 开始移除description字段...")
    
    # 创建备份
    backup_file = f"{config_file}.backup.nodesc"
    with open(backup_file, 'w', encoding='utf-8') as f:
        json.dump(config, f, indent=2, ensure_ascii=False)
    print(f"📁 备份已创建: {backup_file}")
    
    # 移除description字段
    config = remove_description(config)
    
    # 保存配置
    with open(config_file, 'w', encoding='utf-8') as f:
        json.dump(config, f, indent=2, ensure_ascii=False)
    
    print("✅ 所有description字段已移除！")
    
    # 验证配置
    with open(config_file, 'r', encoding='utf-8') as f:
        json.load(f)
    print("✅ 配置文件验证通过！")

if __name__ == "__main__":
    main()