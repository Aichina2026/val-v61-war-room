# 心跳检查指南

## 什么是心跳检查？

心跳检查是4AI自主系统的健康监控机制，定期检查：
1. API密钥有效性
2. 模型可用性
3. 系统响应时间
4. 错误率统计

## 配置心跳

在 `scheduler-config.json` 中配置：

```json
{
  "heartbeat": {
    "enabled": true,
    "interval": 1800,
    "checks": [
      "api_connectivity",
      "model_availability",
      "response_time",
      "error_rate"
    ],
    "alert_threshold": 0.2
  }
}
```

## 手动触发心跳

```bash
# 使用AgentEventLoop
node AgentEventLoop.js heartbeat

# 使用CLI工具
node unified-ai-cli.js --heartbeat

# 详细模式
node AgentEventLoop.js heartbeat --verbose
```

## 心跳检查内容

### 1. API连接性检查
- 测试所有配置的API端点
- 验证API密钥有效性
- 检查响应时间

### 2. 模型可用性检查
- 检查配置的模型是否可用
- 测试模型响应
- 验证功能完整性

### 3. 性能指标检查
- 平均响应时间
- 成功率统计
- 错误类型分析

### 4. 系统健康检查
- 内存使用情况
- 磁盘空间
- 日志文件大小

## 告警机制

当以下情况发生时触发告警：
- 错误率超过20%
- 平均响应时间超过10秒
- API连接失败
- 磁盘空间不足10%

## 最佳实践

1. **设置合理间隔**: 建议30分钟到2小时
2. **启用详细日志**: 首次调试时使用`--verbose`模式
3. **定期查看报告**: 检查`logs/heartbeat_report.json`
4. **设置通知**: 集成到监控系统

## 故障排除

### 常见问题

1. **心跳检查失败**
   ```
   检查网络连接
   验证API密钥
   检查配置文件
   ```

2. **响应时间过长**
   ```
   检查模型负载
   优化请求频率
   考虑使用缓存
   ```

3. **API限制错误**
   ```
   降低请求频率
   使用多个API密钥
   实现退避重试
   ```

## 集成指南

### 与OpenClaw集成
```bash
# 在OpenClaw配置中添加心跳任务
openclaw cron add \
  --name "4AI_Heartbeat" \
  --schedule "every 30m" \
  --agent main \
  --isolated \
  --prompt "执行4AI心跳检查"
```

### 与监控系统集成
```json
{
  "integrations": {
    "prometheus": true,
    "grafana": true,
    "slack": true,
    "email": true
  }
}
```
