#!/bin/bash

# OMC增强工作流生产启动脚本
# 启动方式: ./start-omc-workflow-enhanced.sh "需求描述"

if [ $# -eq 0 ]; then
    echo "使用方式: $0 \"需求描述\""
    echo "示例: $0 \"创建用户登录系统\""
    exit 1
fi

INPUT="$1"
echo "🚀 启动OMC增强工作流..."
echo "需求: $INPUT"

# 运行增强工作流
node modules/code-generation/skills/code-generation/omc-workflow-enhanced.js "$INPUT"
