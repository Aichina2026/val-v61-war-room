#!/bin/bash
# 数据收集脚本
cd /root/.openclaw/workspace
node omc-4ai-workflow-complete.js --mode=collect
echo "数据收集完成: $(date)" >> /root/.openclaw/workspace/omc-automation-logs/scheduler.log
