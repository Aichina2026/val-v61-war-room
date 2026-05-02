#!/usr/bin/env python3
import json
import os

def fix_api_fields(config_data):
    """修复所有api字段为openai-responses"""
    
    # 需要修复的提供商
    providers_to_fix = ["kimi", "4sapi", "alibailian"]
    
    for provider in providers_to_fix:
        if provider in config_data["models"]["providers"]:
            # 修复提供商级别的api字段
            config_data["models"]["providers"][provider]["api"] = "openai-responses"
            
            # 修复所有模型的api字段
            for model in config_data["models"]["providers"][provider]["models"]:
                model["api"] = "openai-responses"
    
    return config_data

def main():
    config_file = "/root/.openclaw/openclaw.json"
    
    # 读取当前配置
    with open(config_file, 'r', encoding='utf-8') as f:
        config = json.load(f)
    
    print("当前配置读取成功")
    
    # 创建备份
    backup_file = f"{config_file}.backup.final"
    with open(backup_file, 'w', encoding='utf-8') as f:
        json.dump(config, f, indent=2, ensure_ascii=False)
    print(f"备份已创建: {backup_file}")
    
    # 修复api字段
    config = fix_api_fields(config)
    
    # 保存配置
    with open(config_file, 'w', encoding='utf-8') as f:
        json.dump(config, f, indent=2, ensure_ascii=False)
    
    print("已修复的api字段:")
    print("1. alibailian: openai-chat → openai-responses")
    print("2. kimi: openai-chat → openai-responses")
    print("3. 4sapi: openai-chat → openai-responses")
    
    # 验证配置
    with open(config_file, 'r', encoding='utf-8') as f:
        json.load(f)
    print("配置文件验证通过！")
    
    # 显示当前配置的提供商
    print("\n当前配置的模型提供商:")
    for provider in config["models"]["providers"]:
        models = config["models"]["providers"][provider]["models"]
        model_names = [m["name"] for m in models]
        print(f"- {provider}: {', '.join(model_names)}")

if __name__ == "__main__":
    main()