#!/usr/bin/env python3
import json
import os

def update_kimi_to_k25(config):
    """更新Kimi配置为Kimi 2.5模型"""
    if "kimi" in config["models"]["providers"]:
        # 更新为Kimi 2.5模型
        config["models"]["providers"]["kimi"]["models"] = [
            {
                "id": "kimi-k2.5",
                "name": "Kimi Chat 2.5",
                "reasoning": True,
                "contextWindow": 128000,
                "maxTokens": 64000,
                "api": "openai-responses",
                "description": "深度求索Kimi Chat 2.5 - 最新版本"
            }
        ]
        print("✅ Kimi配置已更新为Kimi 2.5")
    return config

def add_volcengine_glm47(config):
    """为火山引擎添加glm-4-7-251222模型"""
    if "ark" in config["models"]["providers"]:
        # 检查是否已存在glm-4-7-251222
        current_models = config["models"]["providers"]["ark"]["models"]
        glm_exists = any(model["id"] == "glm-4-7-251222" for model in current_models)
        
        if not glm_exists:
            # 添加glm-4-7-251222模型
            glm47_model = {
                "id": "glm-4-7-251222",
                "name": "智谱GLM-4-7B 251222",
                "reasoning": True,
                "contextWindow": 128000,
                "maxTokens": 4096,
                "api": "openai-responses",
                "description": "智谱GLM-4-7B模型 (火山引擎版本)"
            }
            current_models.append(glm47_model)
            print("✅ 火山引擎已添加glm-4-7-251222模型")
        else:
            print("⚠️  火山引擎已存在glm-4-7-251222模型")
    return config

def add_more_alibaba_models(config):
    """添加更多阿里云模型"""
    if "alibailian" in config["models"]["providers"]:
        # 当前已有的模型ID
        current_models = config["models"]["providers"]["alibailian"]["models"]
        existing_ids = [model["id"] for model in current_models]
        
        # 需要添加的模型
        models_to_add = [
            {
                "id": "qwen3.6-plus",
                "name": "通义千问3.6-Plus",
                "reasoning": True,
                "contextWindow": 128000,
                "maxTokens": 8192,
                "cost": {"input": 0.003, "output": 0.006},
                "api": "openai-responses",
                "description": "通义千问3.6 Plus版本"
            },
            {
                "id": "qwen3-max",
                "name": "通义千问3-Max",
                "reasoning": True,
                "contextWindow": 128000,
                "maxTokens": 8192,
                "cost": {"input": 0.008, "output": 0.016},
                "api": "openai-responses",
                "description": "通义千问3 Max版本"
            },
            {
                "id": "deepseek-v3.2",
                "name": "DeepSeek-V3.2 (阿里云)",
                "reasoning": True,
                "contextWindow": 200000,
                "maxTokens": 8192,
                "cost": {"input": 0.001, "output": 0.002},
                "api": "openai-responses",
                "description": "DeepSeek V3.2 (阿里云百炼版本)"
            }
        ]
        
        # 只添加不存在的模型
        added_count = 0
        for model in models_to_add:
            if model["id"] not in existing_ids:
                current_models.append(model)
                existing_ids.append(model["id"])
                added_count += 1
                print(f"✅ 已添加阿里云模型: {model['name']}")
        
        if added_count > 0:
            print(f"✅ 共添加了 {added_count} 个阿里云模型")
        else:
            print("⚠️  所有阿里云模型已存在，无需添加")
    return config

def main():
    config_file = "/root/.openclaw/openclaw.json"
    
    # 读取当前配置
    with open(config_file, 'r', encoding='utf-8') as f:
        config = json.load(f)
    
    print("🔧 开始更新模型配置...")
    
    # 创建备份
    backup_file = f"{config_file}.backup.update"
    with open(backup_file, 'w', encoding='utf-8') as f:
        json.dump(config, f, indent=2, ensure_ascii=False)
    print(f"📁 备份已创建: {backup_file}")
    
    # 执行更新
    config = update_kimi_to_k25(config)
    config = add_volcengine_glm47(config)
    config = add_more_alibaba_models(config)
    
    # 保存配置
    with open(config_file, 'w', encoding='utf-8') as f:
        json.dump(config, f, indent=2, ensure_ascii=False)
    
    print("✅ 所有更新已完成！")
    
    # 验证配置
    with open(config_file, 'r', encoding='utf-8') as f:
        json.load(f)
    print("✅ 配置文件验证通过！")

if __name__ == "__main__":
    main()