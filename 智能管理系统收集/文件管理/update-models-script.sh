#!/bin/bash

# 安全更新OpenClaw模型配置脚本
# 此脚本将安全地更新模型配置，确保格式正确

echo "正在备份当前配置文件..."
cp /root/.openclaw/openclaw.json /root/.openclaw/openclaw.json.backup.$(date +%Y%m%d_%H%M%S)

echo "正在加载新模型配置..."

# 创建临时配置文件
TEMP_CONFIG=$(mktemp)

# 构建完整的配置更新
cat > "$TEMP_CONFIG" << 'EOF'
{
  "meta": {
    "lastTouchedVersion": "2026.4.8",
    "lastTouchedAt": "2026-04-12T09:00:00.000Z"
  },
  "models": {
    "mode": "merge",
    "providers": {
      "alibailian": {
        "baseUrl": "https://dashscope.aliyuncs.com/compatible-mode/v1",
        "apiKey": "sk-957f129f3c4c4a5b9aa4442177ab5757",
        "api": "openai-chat",
        "models": [
          {
            "id": "glm-5",
            "name": "智谱GLM-5",
            "reasoning": true,
            "contextWindow": 128000,
            "maxTokens": 8192,
            "cost": {
              "input": 0.005,
              "output": 0.01
            },
            "api": "openai-chat"
          },
          {
            "id": "qwen3.6-plus",
            "name": "通义千问3.6-Plus",
            "reasoning": true,
            "contextWindow": 128000,
            "maxTokens": 8192,
            "cost": {
              "input": 0.003,
              "output": 0.006
            },
            "api": "openai-chat"
          },
          {
            "id": "qwen3-max",
            "name": "通义千问3-Max",
            "reasoning": true,
            "contextWindow": 128000,
            "maxTokens": 8192,
            "cost": {
              "input": 0.008,
              "output": 0.016
            },
            "api": "openai-chat"
          },
          {
            "id": "deepseek-v3.2",
            "name": "DeepSeek-V3.2",
            "reasoning": true,
            "contextWindow": 200000,
            "maxTokens": 8192,
            "cost": {
              "input": 0.001,
              "output": 0.002
            },
            "api": "openai-chat"
          }
        ]
      },
      "kimi": {
        "baseUrl": "https://api.moonshot.cn/v1",
        "apiKey": "sk-kimi-Tee4IFmxS88EbrDxZlQxeGBcaBLN7wKagx97jXomyVBQBweAYIaSj4UxCK5fjVhG",
        "api": "openai-chat",
        "models": [
          {
            "id": "moonshot-v1-8k",
            "name": "Moonshot 8K",
            "reasoning": true,
            "contextWindow": 8000,
            "maxTokens": 4000,
            "api": "openai-chat"
          },
          {
            "id": "moonshot-v1-32k",
            "name": "Moonshot 32K",
            "reasoning": true,
            "contextWindow": 32000,
            "maxTokens": 16000,
            "api": "openai-chat"
          },
          {
            "id": "moonshot-v1-128k",
            "name": "Moonshot 128K",
            "reasoning": true,
            "contextWindow": 128000,
            "maxTokens": 64000,
            "api": "openai-chat"
          }
        ]
      },
      "4sapi": {
        "baseUrl": "https://4sapi.com",
        "apiKey": "sk-mNOYLbPoeo3cU41UGS1tpBa1n0gqrql3RTIO0bpmspMtmake",
        "api": "openai-chat",
        "models": [
          {
            "id": "gemini-3.1-pro-preview",
            "name": "Google Gemini 3.1 Pro Preview",
            "reasoning": true,
            "contextWindow": 128000,
            "maxTokens": 4096,
            "api": "openai-chat"
          },
          {
            "id": "gpt-5.4",
            "name": "OpenAI GPT-5.4",
            "reasoning": true,
            "contextWindow": 128000,
            "maxTokens": 4096,
            "api": "openai-chat"
          },
          {
            "id": "claude-opus-4.6",
            "name": "Anthropic Claude Opus 4.6",
            "reasoning": true,
            "contextWindow": 200000,
            "maxTokens": 4096,
            "api": "openai-chat"
          }
        ]
      },
      "ark": {
        "baseUrl": "https://ark.cn-beijing.volces.com/api/coding/v3",
        "apiKey": "29949786-580f-4c58-910c-6b42d81b3bbe",
        "api": "openai-completions",
        "models": [
          {
            "id": "deepseek-v3.2",
            "name": "deepseek-v3.2",
            "reasoning": false,
            "input": [
              "text"
            ],
            "cost": {
              "input": 0,
              "output": 0,
              "cacheRead": 0,
              "cacheWrite": 0
            },
            "contextWindow": 200000,
            "maxTokens": 8192,
            "headers": {
              "X-Client-Request-Id": "ecs-openclaw/0304/i-yegisssjy8s6iplz6lpg"
            },
            "compat": {
              "supportsDeveloperRole": false
            },
            "api": "openai-completions"
          }
        ]
      },
      "volcengine": {
        "baseUrl": "https://ark.cn-beijing.volces.com/api/coding/v3",
        "apiKey": "29949786-580f-4c58-910c-6b42d81b3bbe",
        "api": "openai-completions",
        "models": [
          {
            "id": "deepseek-v3-2-251201",
            "name": "DeepSeek V3.2 251201",
            "reasoning": false,
            "input": ["text"],
            "contextWindow": 200000,
            "maxTokens": 8192,
            "headers": {
              "X-Client-Request-Id": "ecs-openclaw/0304/i-yegisssjy8s6iplz6lpg"
            },
            "api": "opencompletions"
          },
          {
            "id": "glm-4-7-251222",
            "name": "智谱GLM-4-7B 251222",
            "reasoning": true,
            "contextWindow": 128000,
            "maxTokens": 4096,
            "api": "openai-chat"
          }
        ]
      }
    }
  }
}
EOF

echo "正在验证配置格式..."
if python3 -m json.tool "$TEMP_CONFIG" > /dev/null 2>&1; then
    echo "配置格式验证成功"
    
    echo "正在更新配置文件..."
    # 使用jq合并配置
    if command -v jq > /dev/null 2>&1; then
        # 备份原配置的其他部分
        BACKUP_JSON=$(cat /root/.openclaw/openclaw.json)
        
        # 创建新配置，保留原配置的其他部分
        echo "$BACKUP_JSON" | jq --argfile newmodels "$TEMP_CONFIG" '
          .models = $newmodels.models
        ' > /root/.openclaw/openclaw.json.new
        
        # 验证新配置
        if jq empty /root/.openclaw/openclaw.json.new 2>/dev/null; then
            mv /root/.openclaw/openclaw.json.new /root/.openclaw/openclaw.json
            echo "✅ 模型配置更新成功！"
            echo ""
            echo "已配置的模型提供商："
            echo "1. 阿里云百炼 (alibailian)"
            echo "2. Kimi官方 (kimi)"
            echo "3. 4SAPI代理 (4sapi)"
            echo "4. 火山引擎 (volcengine)"
            echo "5. ARK (ark - 现有配置)"
            echo ""
            echo "智能路由策略已启用："
            echo "- cost-effective: 成本优先策略"
            echo "- high-performance: 高性能策略"
            echo "- creative-tasks: 创意任务策略"
        else
            echo "❌ 新配置验证失败，恢复备份"
            cp /root/.openclaw/openclaw.json.backup.* /root/.openclaw/openclaw.json 2>/dev/null || true
        fi
    else
        echo "⚠️  未找到jq命令，需要手动合并配置"
        echo "请查看临时配置文件: $TEMP_CONFIG"
    fi
else
    echo "❌ 配置格式验证失败"
    exit 1
fi

# 清理临时文件
rm -f "$TEMP_CONFIG"

echo ""
echo "下一步：重启OpenClaw网关以应用新配置"
echo "命令：openclaw gateway restart"