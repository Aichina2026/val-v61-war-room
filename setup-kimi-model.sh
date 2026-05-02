#!/bin/bash

# 安全地添加Kimi模型配置
echo "正在添加Kimi模型配置..."

# 创建Kimi模型配置JSON
cat > /tmp/kimi-model.json << 'EOF'
{
  "providers": {
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
    }
  }
}
EOF

# 使用openclaw配置命令添加
echo "使用openclaw配置命令..."
openclaw config patch -f /tmp/kimi-model.json

# 清理临时文件
rm -f /tmp/kimi-model.json

echo "Kimi模型配置已完成！"