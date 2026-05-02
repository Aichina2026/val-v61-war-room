#!/usr/bin/env python3
import json
import os

def main():
    config_file = "/root/.openclaw/openclaw.json"
    
    # 读取当前配置
    with open(config_file, 'r', encoding='utf-8') as f:
        config = json.load(f)
    
    print("当前配置读取成功")
    
    # 创建备份
    backup_file = f"{config_file}.backup.simple"
    with open(backup_file, 'w', encoding='utf-8') as f:
        json.dump(config, f, indent=2, ensure_ascii=False)
    print(f"备份已创建: {backup_file}")
    
    # 确保models部分存在
    if "models" not in config:
        config["models"] = {"mode": "merge", "providers": {}}
    
    # 只添加阿里云百炼模型（先测试一个）
    alibailian_config = {
        "baseUrl": "https://dashscope.aliyuncs.com/compatible-mode/v1",
        "apiKey": "sk-957f129f3c4c4a5b9aa4442177ab5757",
        "api": "openai-responses",
        "models": [
            {
                "id": "glm-5",
                "name": "智谱GLM-5",
                "reasoning": True,
                "contextWindow": 128000,
                "maxTokens": 8192,
                "cost": {"input": 0.005, "output": 0.01},
                "api": "openai-responses"
            }
        ]
    }
    
    # 添加到配置
    config["models"]["providers"]["alibailian"] = alibailian_config
    
    # 保存配置
    with open(config_file, 'w', encoding='utf-8') as f:
        json.dump(config, f, indent=2, ensure_ascii=False)
    
    print("配置已更新：添加了 alibailian (阿里云百炼) 提供商")
    print("模型: glm-5")
    
    # 验证
    with open(config_file, 'r', encoding='utf-8') as f:
        json.load(f)
    print("配置文件验证通过！")

if __name__ == "__main__":
    main()