#!/bin/bash
# VAL Pro 环境变量配置
# 生成时间: Wed Apr 22 07:47:46 AM CST 2026

export VAL_API_BASE_URL=http://118.196.114.22:8000
export VAL_DASHBOARD_URL=http://118.196.114.22:3000
export VAL_SITE_URL=http://118.196.114.22:3210
export VAL_AI_MODEL=deepseek-v3.2
export VAL_MAX_TOKENS=200000
export VAL_TEMPERATURE=0.7
export VAL_LOG_LEVEL=info
export VAL_CACHE_TTL=3600
export VAL_ENABLE_METRICS=true
export VAL_METRICS_PORT=9090
export VAL_BACKUP_ENABLED=true
export VAL_BACKUP_SCHEDULE="0 2 * * *"
export VAL_ALLOWED_ORIGINS=http://118.196.114.22:3000,http://118.196.114.22:3210

# 显示所有环境变量
echo "VAL Pro 环境变量:"
env | grep ^VAL_ | sort
