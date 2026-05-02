#!/bin/bash

# OpenClaw GLM5配置脚本
# 将主模型更换为阿里云GLM5

echo "🚀 OpenClaw GLM5配置脚本"
echo "=============================="

# 1. 检查当前配置
echo "🔍 检查当前配置..."
openclaw config get models.providers 2>/dev/null | head -20

# 2. 显示当前主模型
echo -e "\n🎯 当前主模型:"
openclaw config get agents.defaults.model.primary 2>/dev/null || echo "未设置"

# 3. 配置Qwen/GLM5提供商
echo -e "\n🔧 配置Qwen/GLM5提供商..."
echo "注意：需要阿里云DashScope API密钥"

# 检查是否已有Qwen配置
if openclaw config get models.providers.qwen 2>/dev/null | grep -q "baseUrl"; then
    echo "✅ Qwen提供商已配置"
else
    echo "⚠️  Qwen提供商未配置，需要设置API密钥"
    echo ""
    echo "请运行以下命令配置Qwen:"
    echo "  openclaw config set models.providers.qwen.baseUrl 'https://coding.dashscope.aliyuncs.com'"
    echo "  openclaw config set models.providers.qwen.apiKey '你的API密钥'"
    echo "  openclaw config set models.providers.qwen.api 'openai-chat'"
    echo ""
    echo "或者使用交互式向导:"
    echo "  openclaw wizard providers qwen"
fi

# 4. 添加GLM5模型配置
echo -e "\n➕ 添加GLM5模型配置..."

# 创建临时配置文件
TEMP_CONFIG=$(mktemp)
cat > "$TEMP_CONFIG" << 'EOF'
{
  "models": {
    "providers": {
      "qwen": {
        "baseUrl": "https://coding.dashscope.aliyuncs.com",
        "apiKey": "YOUR_API_KEY_HERE",
        "api": "openai-chat",
        "models": [
          {
            "id": "glm-5",
            "name": "GLM-5",
            "reasoning": true,
            "input": ["text", "image"],
            "contextWindow": 128000,
            "maxTokens": 8192
          },
          {
            "id": "glm-5-latest",
            "name": "GLM-5 Latest",
            "reasoning": true,
            "input": ["text", "image"],
            "contextWindow": 128000,
            "maxTokens": 8192
          }
        ]
      }
    }
  },
  "agents": {
    "defaults": {
      "model": {
        "primary": "qwen/glm-5-latest",
        "fallback": "ark/deepseek-v3.2"
      }
    }
  }
}
EOF

echo "📋 GLM5配置示例已保存到: $TEMP_CONFIG"
echo "请将 'YOUR_API_KEY_HERE' 替换为你的实际API密钥"

# 5. 显示配置步骤
echo -e "\n📝 手动配置步骤:"
echo "1. 获取阿里云DashScope API密钥:"
echo "   访问: https://help.aliyun.com/zh/dashscope/developer-reference/activate-dashscope-and-create-an-api-key"
echo ""
echo "2. 更新OpenClaw配置:"
echo "   编辑配置文件: nano /root/.openclaw/openclaw.json"
echo "   在 'models.providers' 部分添加 'qwen' 配置"
echo "   将 'agents.defaults.model.primary' 改为 'qwen/glm-5-latest'"
echo ""
echo "3. 重启服务:"
echo "   openclaw gateway restart"
echo ""
echo "4. 验证配置:"
echo "   openclaw models list"
echo "   openclaw chat --model qwen/glm-5-latest"

# 6. 使用环境变量（推荐）
echo -e "\n🌿 使用环境变量（推荐）:"
echo "export QWEN_API_KEY='你的API密钥'"
echo "export OPENCLAW_DEFAULT_MODEL='qwen/glm-5-latest'"
echo ""
echo "然后重启OpenClaw服务即可生效"

# 7. 检查模型是否可用
echo -e "\n🔍 检查可用模型:"
echo "运行: openclaw models list"
echo "应该能看到 'qwen/glm-5' 和 'qwen/glm-5-latest'"

# 清理
rm -f "$TEMP_CONFIG"

echo -e "\n✅ 配置指南完成"
echo "请按照上述步骤配置GLM5模型"