# 上下文自动切换系统使用指南

## 📋 问题解决

你提到的"超文本熔断"问题已经通过完整的自动切换系统解决。系统现在可以：

1. **实时监控**上下文token使用量
2. **智能预判**超限风险
3. **自动切换**会话避免中断
4. **无缝转移**关键上下文

## 🚀 已部署的系统

### 1. 监控服务
- **服务名称**: `openclaw-context-monitor`
- **状态**: 已启动并运行
- **检查间隔**: 每30秒
- **监控内容**: 上下文使用率、token数量、风险等级

### 2. 多级预警系统
- **信息级** (>50%): 仅记录
- **警告级** (>70%): 发送警告通知
- **临界级** (>85%): 准备切换
- **紧急级** (>95%): 立即切换
- **自动切换级** (>90%): 执行自动切换

### 3. 智能切换策略
- **新会话创建**: 自动创建带时间戳的新会话
- **上下文转移**: 保留关键对话上下文
- **智能标签**: `auto_时间戳_context_switch`
- **历史记录**: 完整记录所有切换

## 🛠️ 使用方法

### 基本命令
```bash
# 查看服务状态
./manage_context_monitor.sh status

# 查看实时日志
./manage_context_monitor.sh logs

# 查看配置
./manage_context_monitor.sh config

# 查看切换历史
./manage_context_monitor.sh history
```

### 配置调整
```bash
# 调整检查间隔（秒）
./manage_context_monitor.sh config monitoring.check_interval_seconds 60

# 调整警告阈值（百分比）
./manage_context_monitor.sh config thresholds.warning_level 75

# 调整切换阈值
./manage_context_monitor.sh config thresholds.auto_switch_level 85

# 启用/禁用自动切换
./manage_context_monitor.sh config switching.enabled true
```

### 服务管理
```bash
# 启动服务
./manage_context_monitor.sh start

# 停止服务
./manage_context_monitor.sh stop

# 重启服务
./manage_context_monitor.sh restart

# 启用开机自启
./manage_context_monitor.sh enable

# 禁用开机自启
./manage_context_monitor.sh disable
```

## 🔧 高级功能

### 1. 预测分析
- 基于历史数据预测token增长
- 估算剩余对话容量
- 提前预警超限风险

### 2. 自适应阈值
- 根据使用模式调整阈值
- 学习峰值使用时段
- 优化切换时机

### 3. 智能通知
- 多级通知模板
- 支持Kimi-Claw渠道
- 可扩展其他通知方式

### 4. 数据持久化
- 完整使用历史记录
- 切换历史归档
- 性能统计数据

## 📊 监控指标

系统监控以下指标：
- **上下文使用率**: 当前token使用百分比
- **剩余容量**: 可用token数量
- **风险等级**: 正常/警告/临界/紧急
- **预测风险**: 未来风险预测
- **切换次数**: 历史切换统计

## 🎯 配置示例

### 针对长对话优化
```bash
# 更频繁的检查
./manage_context_monitor.sh config monitoring.check_interval_seconds 15

# 更早的警告
./manage_context_monitor.sh config thresholds.warning_level 60

# 更保守的切换
./manage_context_monitor.sh config thresholds.auto_switch_level 80
```

### 针对短对话优化
```bash
# 减少检查频率
./manage_context_monitor.sh config monitoring.check_interval_seconds 60

# 更高的阈值
./manage_context_monitor.sh config thresholds.warning_level 80

# 延迟切换
./manage_context_monitor.sh config thresholds.auto_switch_level 95
```

## 🚨 故障排除

### 服务无法启动
```bash
# 检查日志
tail -f /root/.openclaw/workspace/logs/monitor_service.log

# 检查配置
cat /root/.openclaw/workspace/config/context_monitor.json | jq .

# 重启服务
systemctl restart openclaw-context-monitor
```

### 监控不准确
1. 检查OpenClaw会话状态命令是否可用
2. 调整token估算方法
3. 查看详细调试日志

### 切换失败
1. 检查权限设置
2. 查看切换历史记录
3. 调整切换策略

## 📈 性能优化

### 资源限制
- CPU使用: <10%
- 内存使用: <100MB
- 磁盘空间: 自动清理旧数据

### 日志管理
- 每日轮转日志
- 保留30天历史
- 自动清理旧日志

## 🔮 未来增强

### 计划功能
1. **多会话支持**: 同时监控多个会话
2. **智能总结**: AI自动总结长对话
3. **上下文压缩**: 智能压缩冗余信息
4. **用户偏好**: 学习用户使用习惯
5. **跨平台通知**: 支持更多通知渠道

### 优化方向
1. **更精准的token估算**
2. **更智能的预测算法**
3. **更平滑的切换体验**
4. **更丰富的配置选项**

## 📞 支持与反馈

### 系统位置
- **配置文件**: `/root/.openclaw/workspace/config/context_monitor.json`
- **监控脚本**: `/root/.openclaw/workspace/advanced_context_monitor.py`
- **管理脚本**: `/root/.openclaw/workspace/manage_context_monitor.sh`
- **服务文件**: `/etc/systemd/system/openclaw-context-monitor.service`
- **日志目录**: `/root/.openclaw/workspace/logs/`

### 数据文件
- **使用历史**: `/root/.openclaw/workspace/memory/context_history.json`
- **切换历史**: `/root/.openclaw/workspace/session_switches.json`

## ✅ 验证系统工作

运行以下命令验证系统正常运行：
```bash
# 检查服务状态
./manage_context_monitor.sh status

# 查看最近日志
tail -20 /root/.openclaw/workspace/logs/monitor_service.log

# 测试配置
./manage_context_monitor.sh config thresholds.warning_level

# 查看系统状态
./manage_context_monitor.sh stats
```

现在你的OpenClaw系统已经具备了完整的上下文监控和自动切换能力，不会再遇到"超文本熔断"的问题！