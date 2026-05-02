#!/bin/bash
# 策略更新脚本
cd /root/.openclaw/workspace
node strategy-library-generator.js
echo "策略更新完成: $(date)" >> /root/.openclaw/workspace/omc-automation-logs/scheduler.log
