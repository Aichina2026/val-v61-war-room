#!/bin/bash
# 系统优化脚本
cd /root/.openclaw/workspace
node omc-4ai-workflow-complete.js --mode=optimize
echo "系统优化完成: $(date)" >> /root/.openclaw/workspace/omc-automation-logs/scheduler.log
