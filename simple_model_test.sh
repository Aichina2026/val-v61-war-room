#!/bin/bash

echo "🚀 模型配置完整性测试"
echo "======================"

# 1. 检查配置文件
echo "1. 检查配置文件..."
if [ -f "/root/.openclaw/openclaw.json" ]; then
    echo "   ✅ 配置文件存在"
    
    # 检查模型配置
    MODEL_COUNT=$(jq '.models.providers | length' /root/.openclaw/openclaw.json 2>/dev/null)
    if [ "$MODEL_COUNT" -gt 0 ]; then
        echo "   ✅ 配置了 $MODEL_COUNT 个模型提供商"
    else
        echo "   ❌ 未配置任何模型提供商"
        exit 1
    fi
else
    echo "   ❌ 配置文件不存在"
    exit 1
fi

echo ""
echo "2. 检查各提供商配置..."

# 检查每个提供商的配置
jq -r '.models.providers | to_entries[] | "\(.key): \(.value.models | length) models"' /root/.openclaw/openclaw.json 2>/dev/null | while read line; do
    echo "   $line"
done

echo ""
echo "3. 建议的测试顺序:"
echo ""
echo "   第一步: 测试火山引擎模型 (最快响应)"
echo "   openclaw run --model ark/deepseek-v3.2 \"你好，测试DeepSeek V3.2模型\""
echo ""
echo "   第二步: 测试阿里云百炼模型"
echo "   openclaw run --model alibailian/glm-5 \"你好，测试GLM-5模型\""
echo ""
echo "   第三步: 测试Kimi 2.5模型"
echo "   openclaw run --model kimi/kimi-k2.5 \"你好，测试Kimi 2.5模型\""
echo ""
echo "   第四步: 测试4SAPI模型"
echo "   openclaw run --model 4sapi/gemini-3.1-pro-preview \"Hello, test Gemini 3.1 Pro model\""
echo ""
echo "4. 测试命令说明:"
echo "   - 每个命令可能需要10-30秒完成"
echo "   - 如果超时，可以按 Ctrl+C 中断"
echo "   - 成功响应会显示模型的回答"
echo "   - 失败可能有多种原因："
echo "     * API密钥无效"
echo "     * 网络连接问题"
echo "     * 模型服务暂时不可用"
echo ""
echo "5. 快速测试单个模型:"
echo "   运行以下命令测试火山引擎的DeepSeek模型:"
echo "   timeout 15 openclaw run --model ark/deepseek-v3.2 \"测试\""

# 显示完整的模型列表
echo ""
echo "📋 完整的模型列表:"
echo ""
jq -r '.models.providers | to_entries[] | "\(.key):\n  \(.value.models[] | \"- \(.name) (ID: \(.id))\")"' /root/.openclaw/openclaw.json 2>/dev/null