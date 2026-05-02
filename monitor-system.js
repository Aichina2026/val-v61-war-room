#!/usr/bin/env node
/**
 * 系统监控脚本
 * 监控增强系统的运行状态和性能指标
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class SystemMonitor {
  constructor() {
    this.workspace = '/root/.openclaw/workspace';
    this.dataDir = path.join(this.workspace, 'omc-4ai-data');
    this.logsDir = path.join(this.workspace, 'omc-automation-logs');
    this.reportsDir = path.join(this.workspace, 'omc-4ai-reports');
    
    this.monitoringInterval = 30000; // 30秒检查一次
    this.alertThresholds = {
      cpuUsage: 80, // CPU使用率超过80%告警
      memoryUsage: 85, // 内存使用率超过85%告警
      diskUsage: 90, // 磁盘使用率超过90%告警
      errorRate: 5, // 错误率超过5%告警
      responseTime: 5000 // 响应时间超过5秒告警
    };
    
    this.alerts = [];
    this.metricsHistory = [];
  }
  
  async startMonitoring() {
    console.log('📊 启动系统监控...');
    console.log(`监控间隔: ${this.monitoringInterval / 1000}秒`);
    console.log(`告警阈值: CPU>${this.alertThresholds.cpuUsage}%, MEM>${this.alertThresholds.memoryUsage}%`);
    console.log('');
    
    // 立即执行一次监控

    await this.collectAndAnalyze();
    
    // 设置定期监控

    setInterval(async () => {
      await this.collectAndAnalyze();
    }, this.monitoringInterval);
    
    // 保持进程运行

    return new Promise((resolve) => {
      process.on('SIGINT', () => {
        console.log('\n🛑 停止监控...');
        this.generateFinalReport();
        resolve();
      });
    });
  }
  
  async collectAndAnalyze() {
    const timestamp = new Date().toISOString();
    console.log(`\n⏰ ${timestamp}`);
    console.log('📈 收集系统指标...');
    
    try {
      // 收集系统指标

      const metrics = await this.collectSystemMetrics();
      
      // 检查告警

      const alerts = this.checkAlerts(metrics, timestamp);
      
      // 记录历史数据

      this.metricsHistory.push({
        timestamp,
        metrics,
        alerts
      });
      
      // 显示当前状态

      this.displayStatus(metrics, alerts);
      
      // 如果发现告警，发送通知

      if (alerts.length > 0) {
        await this.handleAlerts(alerts, metrics);
      }
      
      // 定期保存报告

      if (this.metricsHistory.length % 10 === 0) {
        this.saveMonitoringReport();
      }
      
    } catch (error) {
      console.error('❌ 监控收集失败:', error.message);
      this.alerts.push({
        timestamp: new Date().toISOString(),
        type: 'monitoring_error',
        severity: 'critical',
        message: `监控收集失败: ${error.message}`,
        details: error.stack
      });
    }
  }
  
  async collectSystemMetrics() {
    const metrics = {
      timestamp: Date.now(),
      system: {},
      performance: {},
      context: {},
      tasks: {}
    };
    
    try {
      // 收集系统资源使用情况

      const systemInfo = await this.collectSystemInfo();
      metrics.system = systemInfo;
      
      // 收集性能指标（从增强系统日志）

      const performanceMetrics = await this.collectPerformanceMetrics();
      metrics.performance = performanceMetrics;
      
      // 收集上下文信息

      const contextInfo = await this.collectContextInfo();
      metrics.context = contextInfo;
      
      // 收集任务执行情况

      const taskInfo = await this.collectTaskInfo();
      metrics.tasks = taskInfo;
      
      // 计算总体健康度

      metrics.healthScore = this.calculateHealthScore(metrics);
      
    } catch (error) {
      console.error('收集指标失败:', error.message);
    }
    
    return metrics;
  }
  
  async collectSystemInfo() {
    try {
      const [cpuResult, memResult, diskResult] = await Promise.all([
        this.getCPUUsage(),
        this.getMemoryUsage(),
        this.getDiskUsage()
      ]);
      
      return {
        cpuUsage: parseFloat(cpuResult) || 0,
        memoryUsage: parseFloat(memResult) || 0,
        diskUsage: parseFloat(diskResult) || 0,
        uptime: process.uptime(),
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        cpuUsage: 0,
        memoryUsage: 0,
        diskUsage: 0,
        uptime: process.uptime(),
        error: error.message,
        timestamp: Date.now()
      };
    }
  }
  
  async getCPUUsage() {
    try {
      // 使用top命令获取CPU使用率

      const { stdout } = await execAsync("top -bn1 | grep 'Cpu(s)' | awk '{print $2}' | cut -d'%' -f1");
      return stdout.trim();
    } catch {
      // 如果top不可用，使用/proc/stat
      try {
        const { stdout } = await execAsync("grep 'cpu ' /proc/stat | awk '{usage=($2+$4)*100/($2+$4+$5)} END {print usage}'");
        return stdout.trim();
      } catch {
        return '0';
      }
    }
  }
  
  async getMemoryUsage() {
    try {
      const { stdout } = await execAsync("free | grep Mem | awk '{print $3/$2 * 100.0}'");
      return stdout.trim();
    } catch {
      return '0';
    }
  }
  
  async getDiskUsage() {
    try {
      const { stdout } = await execAsync("df / | tail -1 | awk '{print $5}' | sed 's/%//'");
      return stdout.trim();
    } catch {
      return '0';
    }
  }
  
  async collectPerformanceMetrics() {
    // 从日志文件中收集性能指标

    const metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      contextRestarts: 0,
      autoTasksExecuted: 0,
      dataPointsCollected: 0
    };
    
    try {
      // 查找最新的日志文件

      const logFiles = fs.readdirSync(this.logsDir)
        .filter(file => file.endsWith('.log'))
        .sort()
        .reverse();
      
      if (logFiles.length > 0) {
        const latestLog = path.join(this.logsDir, logFiles[0]);
        const logContent = fs.readFileSync(latestLog, 'utf8');
        
        // 从日志中提取指标（简单正则匹配）

        const requestMatch = logContent.match(/总请求数: (\d+)/);
        if (requestMatch) metrics.totalRequests = parseInt(requestMatch[1]);
        
        const successMatch = logContent.match(/成功请求: (\d+)/);
        if (successMatch) metrics.successfulRequests = parseInt(successMatch[1]);
        
        const restartMatch = logContent.match(/上下文重启次数: (\d+)/);
        if (restartMatch) metrics.contextRestarts = parseInt(restartMatch[1]);
        
        const taskMatch = logContent.match(/自动任务执行: (\d+)/);
        if (taskMatch) metrics.autoTasksExecuted = parseInt(taskMatch[1]);
        
        // 计算成功率

        if (metrics.totalRequests > 0) {
          metrics.successRate = metrics.successfulRequests / metrics.totalRequests;
          metrics.errorRate = 1 - metrics.successRate;
        } else {
          metrics.successRate = 0;
          metrics.errorRate = 0;
        }
      }
      
    } catch (error) {
      console.error('读取性能指标失败:', error.message);
    }
    
    return metrics;
  }
  
  async collectContextInfo() {
    // 收集上下文相关信息

    const contextInfo = {
      currentTokens: 0,
      maxTokens: 8000,
      usageRatio: 0,
      threadCount: 0,
      lastRestart: 0,
      warningActive: false
    };
    
    try {
      // 检查上下文配置文件

      const configFile = path.join(this.workspace, '4ai-role-system.json');
      if (fs.existsSync(configFile)) {
        const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
        
        if (config.performanceTargets) {
          contextInfo.maxTokens = config.performanceTargets.maxContextTokens || 8000;
        }
      }
      
      // 从最近的日志中获取上下文使用情况

      const logFiles = fs.readdirSync(this.logsDir)
        .filter(file => file.endsWith('.log'))
        .sort()
        .reverse();
      
      if (logFiles.length > 0) {
        const latestLog = path.join(this.logsDir, logFiles[0]);
        const logContent = fs.readFileSync(latestLog, 'utf8');
        
        const tokenMatch = logContent.match(/当前上下文使用: (\d+)\/(\d+)/);
        if (tokenMatch) {
          contextInfo.currentTokens = parseInt(tokenMatch[1]);
          contextInfo.maxTokens = parseInt(tokenMatch[2]) || contextInfo.maxTokens;
          contextInfo.usageRatio = contextInfo.currentTokens / contextInfo.maxTokens;
        }
        
        const warningMatch = logContent.match(/预警状态: (已触发|未触发)/);
        if (warningMatch) {
          contextInfo.warningActive = warningMatch[1] === '已触发';
        }
      }
      
    } catch (error) {
      console.error('收集上下文信息失败:', error.message);
    }
    
    return contextInfo;
  }
  
  async collectTaskInfo() {
    // 收集任务执行信息

    const taskInfo = {
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      runningTasks: 0,
      scheduledTasks: 0
    };
    
    try {
      // 检查任务日志

      const reportDir = this.reportsDir;
      if (fs.existsSync(reportDir)) {
        const reportFiles = fs.readdirSync(reportDir)
          .filter(file => file.includes('iteration') && file.endsWith('.json'));
        
        taskInfo.scheduledTasks = reportFiles.length;
        
        // 读取最新的迭代报告

        if (reportFiles.length > 0) {
          const latestReport = path.join(reportDir, reportFiles[reportFiles.length - 1]);
          const reportData = JSON.parse(fs.readFileSync(latestReport, 'utf8'));
          
          if (reportData.results && reportData.results.totalExecuted) {
            taskInfo.completedTasks = reportData.results.totalExecuted;
            taskInfo.successfulTasks = reportData.results.successful || 0;
            taskInfo.failedTasks = reportData.results.failed || 0;
          }
        }
      }
      
    } catch (error) {
      console.error('收集任务信息失败:', error.message);
    }
    
    return taskInfo;
  }
  
  calculateHealthScore(metrics) {
    let score = 100;
    
    // 扣分规则

    if (metrics.system.cpuUsage > 70) {
      score -= 10;
    }
    if (metrics.system.cpuUsage > 85) {
      score -= 20;
    }
    
    if (metrics.system.memoryUsage > 75) {
      score -= 10;
    }
    if (metrics.system.memoryUsage > 90) {
      score -= 20;
    }
    
    if (metrics.performance.errorRate > 0.05) {
      score -= 15;
    }
    if (metrics.performance.errorRate > 0.1) {
      score -= 30;
    }
    
    if (metrics.context.usageRatio > 0.8) {
      score -= 10;
    }
    if (metrics.context.warningActive) {
      score -= 15;
    }
    
    // 确保分数在0-100之间

    return Math.max(0, Math.min(100, score));
  }
  
  checkAlerts(metrics, timestamp) {
    const alerts = [];
    
    // 检查CPU使用率

    if (metrics.system.cpuUsage > this.alertThresholds.cpuUsage) {
      alerts.push({
        timestamp,
        type: 'high_cpu_usage',
        severity: metrics.system.cpuUsage > 90 ? 'critical' : 'warning',
        message: `CPU使用率过高: ${metrics.system.cpuUsage.toFixed(2)}%`,
        details: {
          current: metrics.system.cpuUsage,
          threshold: this.alertThresholds.cpuUsage
        }
      });
    }
    
    // 检查内存使用率

    if (metrics.system.memoryUsage > this.alertThresholds.memoryUsage) {
      alerts.push({
        timestamp,
        type: 'high_memory_usage',
        severity: metrics.system.memoryUsage > 95 ? 'critical' : 'warning',
        message: `内存使用率过高: ${metrics.system.memoryUsage.toFixed(2)}%`,
        details: {
          current: metrics.system.memoryUsage,
          threshold: this.alertThresholds.memoryUsage
        }
      });
    }
    
    // 检查错误率

    if (metrics.performance.errorRate > this.alertThresholds.errorRate / 100) {
      alerts.push({
        timestamp,
        type: 'high_error_rate',
        severity: metrics.performance.errorRate > 0.1 ? 'critical' : 'warning',
        message: `错误率过高: ${(metrics.performance.errorRate * 100).toFixed(2)}%`,
        details: {
          current: metrics.performance.errorRate * 100,
          threshold: this.alertThresholds.errorRate
        }
      });
    }
    
    // 检查上下文使用

    if (metrics.context.usageRatio > 0.9) {
      alerts.push({
        timestamp,
        type: 'high_context_usage',
        severity: 'critical',
        message: `上下文使用率过高: ${(metrics.context.usageRatio * 100).toFixed(2)}%`,
        details: {
          currentTokens: metrics.context.currentTokens,
          maxTokens: metrics.context.maxTokens,
          usageRatio: metrics.context.usageRatio
        }
      });
    }
    
    // 添加到历史告警

    this.alerts.push(...alerts);
    
    return alerts;
  }
  
  displayStatus(metrics, alerts) {
    // 显示系统状态

    console.log('📊 系统状态:');
    console.log(`   健康度: ${this.getHealthEmoji(metrics.healthScore)} ${metrics.healthScore.toFixed(1)}/100`);
    
    console.log('🖥️  系统资源:');
    console.log(`   CPU使用: ${metrics.system.cpuUsage.toFixed(2)}%`);
    console.log(`   内存使用: ${metrics.system.memoryUsage.toFixed(2)}%`);
    console.log(`   磁盘使用: ${metrics.system.diskUsage.toFixed(2)}%`);
    console.log(`   运行时间: ${Math.floor(metrics.system.uptime / 3600)}小时`);
    
    console.log('⚡ 性能指标:');
    console.log(`   总请求数: ${metrics.performance.totalRequests}`);
    console.log(`   成功率: ${metrics.performance.successRate ? (metrics.performance.successRate * 100).toFixed(2) : 0}%`);
    console.log(`   上下文重启: ${metrics.performance.contextRestarts}`);
    console.log(`   自动任务: ${metrics.performance.autoTasksExecuted}`);
    
    console.log('🧠 上下文状态:');
    console.log(`   使用情况: ${metrics.context.currentTokens}/${metrics.context.maxTokens} tokens`);
    console.log(`   使用率: ${(metrics.context.usageRatio * 100).toFixed(2)}%`);
    console.log(`   预警状态: ${metrics.context.warningActive ? '⚠️  已触发' : '✅ 正常'}`);
    
    console.log('📋 任务状态:');
    console.log(`   已完成: ${metrics.tasks.completedTasks}`);
    console.log(`   成功: ${metrics.tasks.successfulTasks}`);
    console.log(`   失败: ${metrics.tasks.failedTasks}`);
    console.log(`   计划中: ${metrics.tasks.scheduledTasks}`);
    
    if (alerts.length > 0) {
      console.log('🚨 当前告警:');
      alerts.forEach(alert => {
        console.log(`   ${this.getAlertEmoji(alert.severity)} ${alert.message}`);
      });
    } else {
      console.log('✅ 无告警');
    }
  }
  
  getHealthEmoji(score) {
    if (score >= 90) return '🟢';
    if (score >= 70) return '🟡';
    if (score >= 50) return '🟠';
    return '🔴';
  }
  
  getAlertEmoji(severity) {
    switch (severity) {
      case 'critical': return '🔴';
      case 'warning': return '🟡';
      default: return '⚪';
    }
  }
  
  async handleAlerts(alerts, metrics) {
    console.log('🚨 处理告警...');
    
    for (const alert of alerts) {
      // 根据告警类型采取不同措施

      switch (alert.type) {
        case 'high_cpu_usage':
          await this.handleHighCPUAlert(alert, metrics);
          break;
        
        case 'high_memory_usage':
          await this.handleHighMemoryAlert(alert, metrics);
          break;
        
        case 'high_context_usage':
          await this.handleHighContextAlert(alert, metrics);
          break;
        
        default:
          console.log(`  处理告警: ${alert.message}`);
      }
    }
    
    // 保存告警记录

    this.saveAlertReport(alerts);
  }
  
  async handleHighCPUAlert(alert, metrics) {
    console.log('  处理高CPU告警...');
    
    // 建议措施

    const recommendations = [
      '检查是否有长时间运行的任务',
      '考虑优化算法复杂度',
      '增加监控频率',
      '可能需要扩容资源'
    ];
    
    console.log('  建议措施:');
    recommendations.forEach(rec => console.log(`    • ${rec}`));
  }
  
  async handleHighMemoryAlert(alert, metrics) {
    console.log('  处理高内存告警...');
    
    // 建议措施

    const recommendations = [
      '检查内存泄漏',
      '清理缓存数据',
      '优化数据结构',
      '考虑增加Swap空间'
    ];
    
    console.log('  建议措施:');
    recommendations.forEach(rec => console.log(`    • ${rec}`));
  }
  
  async handleHighContextAlert(alert, metrics) {
    console.log('  处理高上下文告警...');
    
    // 建议措施

    const recommendations = [
      '清理旧对话上下文',
      '优化上下文管理策略',
      '增加上下文限制阈值',
      '实施更频繁的上下文清理'
    ];
    
    console.log('  建议措施:');
    recommendations.forEach(rec => console.log(`    • ${rec}`));
    
    // 可以自动触发上下文清理

    if (alert.severity === 'critical') {
      console.log('  🚨 严重告警，建议立即清理上下文');
    }
  }
  
  saveAlertReport(alerts) {
    const alertFile = path.join(this.reportsDir, `alerts_${Date.now()}.json`);
    
    const report = {
      timestamp: Date.now(),
      totalAlerts: alerts.length,
      criticalAlerts: alerts.filter(a => a.severity === 'critical').length,
      warningAlerts: alerts.filter(a => a.severity === 'warning').length,
      alerts: alerts
    };
    
    fs.writeFileSync(alertFile, JSON.stringify(report, null, 2));
    console.log(`💾 告警报告已保存到: ${alertFile}`);
  }
  
  saveMonitoringReport() {
    const reportFile = path.join(this.reportsDir, `monitoring_report_${Date.now()}.json`);
    
    const report = {
      timestamp: Date.now(),
      totalMetrics: this.metricsHistory.length,
      totalAlerts: this.alerts.length,
      recentMetrics: this.metricsHistory.slice(-5),
      recentAlerts: this.alerts.slice(-10),
      summary: {
        avgHealthScore: this.calculateAverageHealthScore(),
        maxCPUUsage: this.findMaxMetric('system.cpuUsage'),
        maxMemoryUsage: this.findMaxMetric('system.memoryUsage'),
        totalRequests: this.sumMetrics('performance.totalRequests')
      }
    };
    
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    console.log(`💾 监控报告已保存到: ${reportFile}`);
  }
  
  calculateAverageHealthScore() {
    if (this.metricsHistory.length === 0) return 0;
    
    const totalScore = this.metricsHistory.reduce((sum, entry) => {
      return sum + (entry.metrics.healthScore || 0);
    }, 0);
    
    return totalScore / this.metricsHistory.length;
  }
  
  findMaxMetric(path) {
    if (this.metricsHistory.length === 0) return 0;
    
    let max = 0;
    for (const entry of this.metricsHistory) {
      const value = this.getNestedValue(entry.metrics, path);
      if (value > max) max = value;
    }
    
    return max;
  }
  
  sumMetrics(path) {
    return this.metricsHistory.reduce((sum, entry) => {
      return sum + (this.getNestedValue(entry.metrics, path) || 0);
    }, 0);
  }
  
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : 0;
    }, obj);
  }
  
  generateFinalReport() {
    console.log('\n📋 生成最终监控报告...');
    
    const finalReport = {
      monitoringStartTime: this.metricsHistory.length > 0 ? this.metricsHistory[0].timestamp : Date.now(),
      monitoringEndTime: Date.now(),
      totalMonitoringCycles: this.metricsHistory.length,
      totalAlerts: this.alerts.length,
      
      systemSummary: {
        avgHealthScore: this.calculateAverageHealthScore(),
        avgCPUUsage: this.calculateAverageMetric('system.cpuUsage'),
        avgMemoryUsage: this.calculateAverageMetric('system.memoryUsage'),
        maxCPUUsage: this.findMaxMetric('system.cpuUsage'),
        maxMemoryUsage: this.findMaxMetric('system.memoryUsage')
      },
      
      performanceSummary: {
        totalRequests: this.sumMetrics('performance.totalRequests'),
        avgSuccessRate: this.calculateAverageMetric('performance.successRate') * 100,
        totalContextRestarts: this.sumMetrics('performance.contextRestarts'),
        totalAutoTasks: this.sumMetrics('performance.autoTasksExecuted')
      },
      
      alertSummary: {
        byType: this.groupAlertsByType(),
        bySeverity: this.groupAlertsBySeverity(),
        mostCommonAlert: this.findMostCommonAlert()
      },
      
      recommendations: this.generateRecommendations()
    };
    
    const finalReportFile = path.join(this.reportsDir, 'final_monitoring_report.json');
    fs.writeFileSync(finalReportFile, JSON.stringify(finalReport, null, 2));
    
    console.log(`💾 最终报告已保存到: ${finalReportFile}`);
    
    // 显示摘要

    console.log('\n📊 监控摘要:');
    console.log(`   监控周期: ${finalReport.totalMonitoringCycles} 次`);
    console.log(`   平均健康度: ${finalReport.systemSummary.avgHealthScore.toFixed(1)}/100`);
    console.log(`   总告警数: ${finalReport.totalAlerts}`);
    console.log(`   总请求数: ${finalReport.performanceSummary.totalRequests}`);
    console.log(`   平均成功率: ${finalReport.performanceSummary.avgSuccessRate.toFixed(2)}%`);
  }
  
  calculateAverageMetric(path) {
    if (this.metricsHistory.length === 0) return 0;
    
    const total = this.metricsHistory.reduce((sum, entry) => {
      return sum + (this.getNestedValue(entry.metrics, path) || 0);
    }, 0);
    
    return total / this.metricsHistory.length;
  }
  
  groupAlertsByType() {
    const groups = {};
    
    for (const alert of this.alerts) {
      if (!groups[alert.type]) {
        groups[alert.type] = 0;
      }
      groups[alert.type]++;
    }
    
    return groups;
  }
  
  groupAlertsBySeverity() {
    const groups = {
      critical: 0,
      warning: 0,
      info: 0
    };
    
    for (const alert of this.alerts) {
      if (groups[alert.severity] !== undefined) {
        groups[alert.severity]++;
      } else {
        groups.info++;
      }
    }
    
    return groups;
  }
  
  findMostCommonAlert() {
    const byType = this.groupAlertsByType();
    
    let mostCommon = null;
    let maxCount = 0;
    
    for (const [type, count] of Object.entries(byType)) {
      if (count > maxCount) {
        mostCommon = type;
        maxCount = count;
      }
    }
    
    return mostCommon ? { type: mostCommon, count: maxCount } : null;
  }
  
  generateRecommendations() {
    const recommendations = [];
    
    // 基于告警分析生成建议

    const alertTypes = this.groupAlertsByType();
    
    if (alertTypes['high_cpu_usage'] > 0) {
      recommendations.push({
        type: 'cpu_optimization',
        priority: alertTypes['high_cpu_usage'] > 5 ? 'high' : 'medium',
        description: 'CPU使用率频繁过高',
        actions: [
          '优化算法复杂度',
          '增加缓存机制',
          '考虑水平扩展'
        ]
      });
    }
    
    if (alertTypes['high_memory_usage'] > 0) {
      recommendations.push({
        type: 'memory_optimization',
        priority: alertTypes['high_memory_usage'] > 3 ? 'high' : 'medium',
        description: '内存使用率过高',
        actions: [
          '检查内存泄漏',
          '优化数据结构',
          '增加内存监控'
        ]
      });
    }
    
    if (alertTypes['high_context_usage'] > 0) {
      recommendations.push({
        type: 'context_optimization',
        priority: 'high',
        description: '上下文使用率过高',
        actions: [
          '优化上下文管理策略',
          '增加上下文清理频率',
          '实施预测性上下文管理'
        ]
      });
    }
    
    // 基于性能指标生成建议

    const avgHealthScore = this.calculateAverageHealthScore();
    if (avgHealthScore < 70) {
      recommendations.push({
        type: 'system_optimization',
        priority: 'high',
        description: `系统整体健康度较低: ${avgHealthScore.toFixed(1)}/100`,
        actions: [
          '全面性能优化',
          '增加监控频率',
          '考虑系统重构'
        ]
      });
    }
    
    return recommendations;
  }
}

// 主执行函数
async function main() {
  try {
    const monitor = new SystemMonitor();
    await monitor.startMonitoring();
  } catch (error) {
    console.error('❌ 监控系统失败:', error);
    process.exit(1);
  }
}

// 命令行接口
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    console.log(`
用法: node monitor-system.js [选项]

选项:
  --start    启动系统监控
  --report   生成历史报告
  --help     显示帮助信息

示例:
  node monitor-system.js --start
  node monitor-system.js --report
    `);
  } else if (args.includes('--report')) {
    const monitor = new SystemMonitor();
    monitor.generateFinalReport();
  } else {
    // 默认启动监控
    main().catch(error => {
      console.error('❌ 执行失败:', error);
      process.exit(1);
    });
  }
}

module.exports = SystemMonitor;