#!/usr/bin/env python3
import json
import sys
import os

def update_models_config():
    config_file = "/root/.openclaw/openclaw.json"
    
    # 读取当前配置
    with open(config_file, 'r', encoding='utf-8') as f:
        config = json.load(f)
    
    # 确保models部分存在
    if "models" not in config:
        config["models"] = {"mode": "merge", "providers": {}}
    
    # 配置阿里云百炼模型
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
            },
            {
                "id": "qwen3.6-plus",
                "name": "通义千问3.6-Plus",
                "reasoning": True,
                "contextWindow": 128000,
                "maxTokens": 8192,
                "cost": {"input": 0.003, "output": 0.006},
                "api": "openai-responses"
            },
            {
                "id": "qwen3-max",
                "name": "通义千问3-Max",
                "reasoning": True,
                "contextWindow": 128000,
                "maxTokens": 8192,
                "cost": {"input": 0.008, "output": 0.016},
                "api": "openai-responses"
            },
            {
                "id": "deepseek-v3.2",
                "name": "DeepSeek-V3.2",
                "reasoning": True,
                "contextWindow": 200000,
                "maxTokens": 8192,
                "cost": {"input": 0.001, "output": 0.002},
                "api": "openai-responses"
            }
        ]
    }
    
    # 配置Kimi模型
    kimi_config = {
        "baseUrl": "https://api.moonshot.cn/v1",
        "apiKey": "sk-kimi-Tee4IFmxS88EbrDxZlQxeGBcaBLN7wKagx97jXomyVBQBweAYIaSj4UxCK5fjVhG",
        "api": "openai-responses",
        "models": [
            {
                "id": "moonshot-v1-8k",
                "name": "Moonshot 8K",
                "reasoning": True,
                "contextWindow": 8000,
                "maxTokens": 4000,
                "api": "openai-responses"
            },
            {
                "id": "moenshot-v1-32k",
                "name": "Moonshot 32K",
                "reasoning": True,
                "contextWindow": 32000,
                "maxTokens": 16000,
                "api": "openai-responses"
            },
            {
                "id": "moonshot-v1-128k",
                "name": "Moonshot 128K",
                "reasoning": True,
                "contextWindow": 128000,
                "maxTokens": 64000,
                "api": "openai-responses"
            }
        ]
    }
    
    # 配置4SAPI模型
    4sapi_config = {
        "baseUrl": "https://4sapi.com/v1",
        "apiKey": "sk-mNOYLbPoeo3cU41UGS1tpBa1n0gqrql3RTIO0bpmspMtmake",
        "api": "openai-responses",
        "models": [
            {
                "id": "gemini-3.1-pro-preview",
                "name": "Google Gemini 3.1 Pro Preview",
                "reasoning": True,
                "contextWindow": 128000,
                "maxTokens": 4096,
                "api": "openai-responses"
            },
            {
                "id": "gpt-5.4",
                "name": "OpenAI GPT-5.4",
                "reasoning": True,
                "contextWindow": 128000,
                "maxTokens": 4096,
                "api": "openai-responses"
            },
            {
                "id": "claude-opus-4.6",
                "name": "Anthropic Claude Opus 4.6",
                "reasoning": True,
                "contextWindow": 200000,
                "maxTokens": 4096,
                "api": "openai-responses"
            }
        ]
    }
    
    # 更新配置
    config["models"]["providers"]["alibailian"] = alibailian_config
        # 保留现有的ark配置
    if "ark" not in config["models"]["providers"]:
        config["models"]["providers"]["ark"] = {
            "baseUrl": "https://ark.cn-beijing.volces.com/api/coding/v3",
            "apiKey": "29949786-580f-4c58-910c-6b42d81b3bbe",
            "api": "openai-completions",
            "models": [
                {
                    "id": "deepseek-v3.2",
                    "name": "deepseek-v3.2",
                    "reasoning": False,
                    "input": ["text"],
                    "cost": {"input": 0, "output": 0, "cacheRead": 0, "cacheWrite": 0},
                    "contextWindow": 200000,
                    "maxTokens": 8192,
                    "headers": {"X-Client-Request-Id": "ecs-openclaw/0304/i-yegisssjy8s6iplz6lpg"},
                    "compat": {"supportsDeveloperRole": False}
                }
            ]
        }
    
    # 创建备份
    backup_file = f"{config_file}.backup.{os.path.basename(__file__)}"
    with open(backup_file, 'w', encoding='utf-8') as f:
        json.dump(config, f, indent=2, ensure_ascii=False)
    print(f"备份已创建: {backup_file}")
    
    # 写入新配置
    with open(config_file, 'w', encoding='utf-8') as f:
        json.dump(config, f, indent=2, ensure_ascii=False)
    
    print("模型配置已更新！")
    print("已添加的模型提供商:")
    print("1. alibailian (阿里云百炼)")
    print("   - glm-5")
    print("   - qwen3.6-plus")
    print("   - qwen3-max")
    print("   - deepseek-v3.2")
    print("2. ark (火山引擎) - 已存在")
    
    # 验证JSON格式
    with open(config_file, 'r', encoding='utf-8') as f:
        json.load(f)  # 验证JSON格式
    print("配置文件验证通过！")

if __name__ == "__main__":
    update_models_config()