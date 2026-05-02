#!/bin/bash

# VAL Pro 修复测试脚本
echo "测试 VAL Pro 网站修复..."

SERVER="118.196.114.22"
PORT="3210"

echo "1. 测试端口 $PORT 连接..."
if timeout 3 nc -z $SERVER $PORT 2>/dev/null; then
    echo "   ✓ 端口 $PORT 已开放"
    
    echo "2. 测试 pro_index.html..."
    if timeout 5 curl -s -f "http://$SERVER:$PORT/pro_index.html" > /dev/null; then
        echo "   ✓ pro_index.html 可访问"
        
        echo "3. 获取页面标题..."
        TITLE=$(timeout 5 curl -s "http://$SERVER:$PORT/pro_index.html" | grep -o '<title>[^<]*</title>' | sed 's/<title>\(.*\)<\/title>/\1/')
        echo "   标题: $TITLE"
        
        echo "4. 测试健康检查..."
        if timeout 5 curl -s "http://$SERVER:$PORT/health" > /dev/null; then
            echo "   ✓ 健康检查端点正常"
        else
            echo "   ⚠ 健康检查端点不可用"
        fi
        
        echo "5. 测试环境变量端点..."
        if timeout 5 curl -s "http://$SERVER:$PORT/env" > /dev/null; then
            echo "   ✓ 环境变量端点正常"
        else
            echo "   ⚠ 环境变量端点不可用"
        fi
        
    else
        echo "   ✗ pro_index.html 不可访问"
    fi
else
    echo "   ✗ 端口 $PORT 未开放 - 服务未运行"
    
    echo "2. 检查相关服务状态..."
    for port in 80 3000 8000; do
        if timeout 2 nc -z $SERVER $port 2>/dev/null; then
            echo "   端口 $port: ✓ 运行中"
        else
            echo "   端口 $port: ✗ 未运行"
        fi
    done
fi

echo ""
echo "总结："
echo "要修复 http://$SERVER:$PORT/pro_index.html，需要："
echo "1. 将生成的部署文件上传到服务器"
echo "2. 按照 DEPLOYMENT_GUIDE.md 中的指南操作"
echo "3. 启动服务在端口 $PORT"
echo "4. 配置环境变量（已包含在 val_pro_env.sh 中）"