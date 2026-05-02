#!/bin/bash
# GitHub令牌设置脚本

set -e

echo "🔧 GitHub访问令牌设置工具"
echo "=".repeat(50)

# 检查是否已有令牌
if [ -n "${GITHUB_TOKEN}" ]; then
    echo "✅ 已检测到GITHUB_TOKEN环境变量"
    echo "   令牌前几位: ${GITHUB_TOKEN:0:8}***"
    exit 0
fi

echo "📝 请提供你的GitHub Personal Access Token (PAT)"
echo "   你可以从 https://github.com/settings/tokens 生成"
echo "   所需权限: repo, workflow, read:packages"
echo ""

# 询问用户输入令牌
read -sp "请输入GitHub令牌: " github_token
echo ""

if [ -z "${github_token}" ]; then
    echo "❌ 令牌不能为空"
    exit 1
fi

# 验证令牌格式
if [[ ! "${github_token}" =~ ^(ghp_|gho_|ghu_|ghs_|github_pat_).+ ]]; then
    echo "⚠️  令牌格式可能不正确，但将继续设置"
fi

# 设置环境变量
echo "📋 设置环境变量..."

# 1. 添加到当前会话
export GITHUB_TOKEN="${github_token}"

# 2. 添加到bashrc（如果存在）
if [ -f ~/.bashrc ]; then
    # 先删除已有的GITHUB_TOKEN设置
    sed -i '/export GITHUB_TOKEN=/d' ~/.bashrc
    
    # 添加新的设置
    echo "" >> ~/.bashrc
    echo "# GitHub Personal Access Token" >> ~/.bashrc
    echo "# Generated: $(date)" >> ~/.bashrc
    echo "export GITHUB_TOKEN=\"${github_token}\"" >> ~/.bashrc
    
    echo "✅ 已添加到 ~/.bashrc"
fi

# 3. 添加到OpenClaw配置
if [ -f /root/.openclaw/.env ]; then
    # 更新.env文件
    if grep -q "^GITHUB_TOKEN=" /root/.openclaw/.env; then
        sed -i "s|^GITHUB_TOKEN=.*|GITHUB_TOKEN=${github_token}|" /root/.openclaw/.env
    else
        echo "" >> /root/.openclaw/.env
        echo "# GitHub Personal Access Token" >> /root/.openclaw/.env
        echo "GITHUB_TOKEN=${github_token}" >> /root/.openclaw/.env
    fi
    
    echo "✅ 已更新 /root/.openclaw/.env"
fi

# 4. 创建.env文件
cat > /root/.openclaw/workspace/github.env << EOF
# GitHub配置
GITHUB_TOKEN=${github_token}
GITHUB_API_URL=https://api.github.com
GITHUB_GRAPHQL_URL=https://api.github.com/graphql
EOF

echo "✅ 已创建 /root/.openclaw/workspace/github.env"

# 5. 创建OpenClaw配置文件
cat > /root/.openclaw/workspace/github-config.json << EOF
{
  "github": {
    "enabled": true,
    "apiToken": "${github_token}",
    "baseUrl": "https://api.github.com",
    "graphqlUrl": "https://api.github.com/graphql",
    "rateLimit": {
      "remaining": 5000,
      "reset": null
    },
    "user": {
      "name": "OpenClaw AI",
      "email": "ai@openclaw.ai"
    },
    "permissions": [
      "repo",
      "workflow",
      "read:packages"
    ],
    "security": {
      "encrypted": false,
      "maskInLogs": true,
      "rotationSchedule": "monthly"
    }
  }
}
EOF

echo "✅ 已创建 /root/.openclaw/workspace/github-config.json"

# 验证令牌
echo ""
echo "🔍 验证GitHub令牌..."

# 尝试调用GitHub API
response=$(curl -s -H "Authorization: token ${github_token}" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/user 2>/dev/null || true)

if echo "${response}" | grep -q '"login"'; then
    username=$(echo "${response}" | grep '"login"' | sed 's/.*"login": "\([^"]*\)".*/\1/')
    echo "✅ 令牌验证成功！"
    echo "   用户名: ${username}"
    
    # 获取令牌权限
    headers=$(curl -s -I -H "Authorization: token ${github_token}" \
      -H "Accept: application/vnd.github.v3+json" \
      https://api.github.com/user 2>/dev/null || true)
    
    echo "   令牌类型: GitHub Personal Access Token"
    
else
    echo "⚠️  令牌验证失败，但已设置完成"
    echo "   请确保令牌有效且具有所需权限"
fi

# 生成使用说明
echo ""
echo "📚 使用说明:"
echo "=".repeat(50)
echo "1. 测试令牌:"
echo "   curl -H 'Authorization: token \$GITHUB_TOKEN' https://api.github.com/user"
echo ""
echo "2. 克隆私有仓库:"
echo "   git clone https://oauth2:\$GITHUB_TOKEN@github.com/用户名/仓库名.git"
echo ""
echo "3. 使用GitHub API:"
echo "   node -e \"require('axios').get('https://api.github.com/user', {"
echo "     headers: { 'Authorization': 'token ' + process.env.GITHUB_TOKEN }"
echo "   }).then(res => console.log(res.data))\""  
echo ""
echo "4. 在脚本中使用:"
echo "   export GITHUB_TOKEN='你的令牌'"
echo "   # 或 source ~/.bashrc"
echo ""
echo "✅ 设置完成！当前会话已启用GITHUB_TOKEN环境变量"

# 显示安全提示
echo ""
echo "🔒 安全提示:"
echo "=".repeat(50)
echo "1. 不要在代码中硬编码令牌"
echo "2. 不要将令牌提交到版本控制系统"
echo "3. 定期轮换令牌（建议每月）"
echo "4. 仅在需要时授予最小权限"
echo "5. 定期审查令牌使用情况"
echo ""
echo "🔗 管理令牌: https://github.com/settings/tokens"
echo "📊 令牌使用统计: https://github.com/settings/tokens/logs"