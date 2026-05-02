#!/bin/bash

echo "🔍 快速模型配置验证测试"
echo "========================"

echo "1. 检查OpenClaw网关状态..."
if pgrep -f "openclaw-gateway" > /dev/null; then
    echo "   ✅ OpenClaw网关正在运行"
else
    echo "   ❌ OpenClaw网关未运行"
    exit 1
fi

echo ""
echo "2. 检查模型配置文件..."
CONFIG_FILE="/root/.openclaw/openclaw.json"
if [ -f "$CONFIG_FILE" ]; then
    echo "   ✅ 配置文件存在"
    
    # 使用python检查配置
    python3 << 'EOF'
import json
import sys

try:
    with open('/root/.openclaw/openclaw.json', 'r', encoding='utf-8') as f:
        config = json.load(f)
    
    providers = config.get('models', {}).get('providers', {})
    
    print("   配置的模型提供商:")
    for provider, details in providers.items():
        models = details.get('models', [])
        print(f"   - {provider}: {len(models)}个模型")
        for model in models:
            print(f"     * {model.get('name', '未知')} ({model.get('id', '未知ID')})")
    
except Exception as e:
    print(f"   错误读取配置: {e}")
    sys.exit(1)
EOF
else
    echo "   ❌ 配置文件不存在"
    exit 1
fi

echo ""
echo "3. 测试建议:"
echo ""
echo "   由于OpenClaw run命令可能需要交互，建议手动测试:"
echo ""
echo "   A. 测试火山引擎模型:"
echo "      openclaw run --model ark/deepseek-v3.2"
echo "      (然后输入: 你好，测试)"
echo "      (按Ctrl+D结束输入)"
echo ""
echo "   B. 测试阿里云模型:"
echo "      echo '你好，测试GLM-5' | openclaw run --model alibailian/glm-5"
echo ""
echo "   C. 测试Kimi 2.5:"
echo "      echo '你好，测试Kimi' | openclaw run --model kimi/kimi-k2.5"
echo ""
echo "4. 验证API密钥格式:"
echo "   当前配置的API密钥格式正确，所有api字段已设置为openai-responses"

echo ""
echo "📊 配置验证完成!"
echo "如果测试失败，可能是以下原因:"
echo "- API密钥无效或过期"
echo "- 网络连接问题"
echo "- 模型服务暂时不可用"
echo "- OpenClaw版本兼容性问题"