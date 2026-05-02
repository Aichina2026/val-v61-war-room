#!/bin/bash
# 数据分析脚本
cd /root/.openclaw/workspace
node omc-4ai-workflow-complete.js --mode=analyze
echo "数据分析完成: $(date)" >> /root/.openclaw/workspace/omc-automation-logs/scheduler.log
