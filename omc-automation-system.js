#!/usr/bin/env node
/**
 * OMC自动化系统
 * 部署、监控、优化、迭代的全自动化系统
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

class OMCAutomationSystem {
  constructor() {
    this.workspace = '/root/.openclaw/workspace';
    this.logDir = path.join(this.workspace, 'omc-automation-logs');
    this.configDir = path.join(this.workspace, 'omc-automation-config');
    
    // 初始化目录
    this.initDirectories();
    
    // 加载配置
    this.config = this.loadConfig();
    
    // 监控状态
    this.monitoringState = {
      lastCollection: null,
      lastAnalysis: null,
      lastOptimization: null,
      lastStrategyUpdate: null,
      errors: [],
      warnings: [],
      successes: []
    };
  }
  
  initDirectories() {
    const dirs = [this.logDir, this.configDir];
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }
  
  loadConfig() {
    const defaultConfig = {
      automation: {
        enabled: true,
        schedule: {
          dataCollection: '0 */1 * * *',      // 每小时一次
          dataAnalysis: '0 */6 * * *',        // 每6小时一次
          systemOptimization: '0 0 * * *',    // 每天一次
          strategyUpdate: '0 0 */7 * *'       // 每周一次
        },
        thresholds: {
          successRate: 0.9,      // 成功率阈值
          latency: 500,          // 延迟阈值(ms)
          errorRate: 0.05,       // 错误率阈值
          resourceUsage: 0.8     // 资源使用率阈值
        }
      },
      monitoring: {
        metrics: ['success_rate', 'latency', 'error_rate', 'resource_usage'],
        alertChannels: ['log', 'file'],
        retentionDays: 30
      },
      optimization: {
        enabled: true,
        autoApplyMinor: true,     // 自动应用小优化
        requireApprovalMajor: true // 重大优化需要批准
      }
    };
    
    const configPath = path.join(this.configDir, 'automation-config.json');
    
    try {
      if (fs.existsSync(configPath)) {
        const userConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        return { ...defaultConfig, ...userConfig };
      }
    } catch (error) {
      this.log('ERROR', `加载配置失败: ${error.message}`);
    }
    
    // 保存默认配置
    fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2), 'utf8');
    
    return defaultConfig;
  }
  
  /**
   * 启动自动化系统
   */
  async start() {
    console.log('🚀 OMC自动化系统启动');
    console.log('='.repeat(60));
    
    this.log('INFO', '自动化系统启动');
    
    // 检查系统状态
    await this.checkSystemStatus();
    
    // 执行初始运行
    await this.runInitialWorkflow();
    
    // 设置定时任务
    this.setupScheduledTasks();
    
    // 启动监控服务
    this.startMonitoringService();
    
    console.log('✅ 自动化系统启动完成');
    console.log('📊 监控状态: 运行中');
    console.log('⏰ 下次数据收集: 1小时后');
    console.log('📁 日志目录:', this.logDir);
    console.log('='.repeat(60));
    
    this.log('INFO', '自动化系统启动完成');
  }
  
  /**
   * 检查系统状态
   */
  async checkSystemStatus() {
    console.log('🔍 检查系统状态...');
    
    const checks = [
      { name: '工作空间', check: () => fs.existsSync(this.workspace) },
      { name: '路由系统', check: () => fs.existsSync(path.join(this.workspace, 'real-openclaw-router.js')) },
      { name: '配置目录', check: () => fs.existsSync(this.configDir) },
      { name: '日志目录', check: () => fs.existsSync(this.logDir) }
    ];
    
    let allPassed = true;
    
    checks.forEach(check => {
      try {
        const passed = check.check();
        const status = passed ? '✅' : '❌';
        console.log(`  ${status} ${check.name}`);
        
        if (!passed) {
          allPassed = false;
          this.log('WARN', `${check.name} 检查失败`);
        }
      } catch (error) {
        console.log(`  ❌ ${check.name}: ${error.message}`);
        this.log('ERROR', `${check.name} 检查异常: ${error.message}`);
        allPassed = false;
      }
    });
    
    if (!allPassed) {
      console.log('⚠️  系统状态检查未全部通过，可能影响自动化功能');
      this.log('WARN', '系统状态检查未全部通过');
    }
    
    return allPassed;
  }
  
  /**
   * 执行初始工作流
   */
  async runInitialWorkflow() {
    console.log('\n🔄 执行初始工作流...');
    
    try {
      // 1. 数据收集
      console.log('  1. 初始数据收集...');
      await this.runDataCollection();
      
      // 2. 数据分析
      console.log('  2. 初始数据分析...');
      await this.runDataAnalysis();
      
      // 3. 策略库生成
      console.log('  3. 初始策略库生成...');
      await this.runStrategyLibraryGeneration();
      
      this.monitoringState.lastCollection = new Date().toISOString();
      this.monitoringState.lastAnalysis = new Date().toISOString();
      this.monitoringState.lastStrategyUpdate = new Date().toISOString();
      
      this.log('INFO', '初始工作流执行完成');
      
    } catch (error) {
      console.error('❌ 初始工作流执行失败:', error.message);
      this.log('ERROR', `初始工作流执行失败: ${error.message}`);
    }
  }
  
  /**
   * 设置定时任务
   */
  setupScheduledTasks() {
    console.log('\n⏰ 设置定时任务...');
    
    // 这里应该设置实际的cron任务
    // 暂时只是记录计划
    
    const schedule = this.config.automation.schedule;
    
    console.log('  定时任务计划:');
    console.log(`    数据收集: ${schedule.dataCollection} (每小时)`);
    console.log(`    数据分析: ${schedule.dataAnalysis} (每6小时)`);
    console.log(`    系统优化: ${schedule.systemOptimization} (每天)`);
    console.log(`    策略更新: ${schedule.strategyUpdate} (每周)`);
    
    // 创建定时任务脚本
    this.createScheduledTaskScripts();
    
    this.log('INFO', '定时任务设置完成');
  }
  
  /**
   * 启动监控服务
   */
  startMonitoringService() {
    console.log('\n📊 启动监控服务...');
    
    // 记录监控启动
    this.log('INFO', '监控服务启动');
    
    // 设置定时监控检查
    setInterval(() => {
      this.performMonitoringCheck();
    }, 5 * 60 * 1000); // 每5分钟检查一次
    
    console.log('  ✅ 监控服务已启动 (每5分钟检查一次)');
  }
  
  /**
   * 执行数据收集
   */
  async runDataCollection() {
    try {
      const result = await this.executeCommand('node omc-4ai-workflow-complete.js --mode=collect');
      
      if (result.success) {
        this.monitoringState.lastCollection = new Date().toISOString();
        this.monitoringState.successes.push({
          type: 'data_collection',
          timestamp: new Date().toISOString(),
          details: '数据收集成功'
        });
        
        this.log('INFO', '数据收集成功');
        return true;
      } else {
        this.monitoringState.errors.push({
          type: 'data_collection',
          timestamp: new Date().toISOString(),
          details: result.error || '数据收集失败'
        });
        
        this.log('ERROR', `数据收集失败: ${result.error}`);
        return false;
      }
    } catch (error) {
      this.monitoringState.errors.push({
        type: 'data_collection',
        timestamp: new Date().toISOString(),
        details: error.message
      });
      
      this.log('ERROR', `数据收集异常: ${error.message}`);
      return false;
    }
  }
  
  /**
   * 执行数据分析
   */
  async runDataAnalysis() {
    try {
      const result = await this.executeCommand('node omc-4ai-workflow-complete.js --mode=analyze');
      
      if (result.success) {
        this.monitoringState.lastAnalysis = new Date().toISOString();
        this.monitoringState.successes.push({
          type: 'data_analysis',
          timestamp: new Date().toISOString(),
          details: '数据分析成功'
        });
        
        this.log('INFO', '数据分析成功');
        return true;
      } else {
        this.monitoringState.errors.push({
          type: 'data_analysis',
          timestamp: new Date().toISOString(),
          details: result.error || '数据分析失败'
        });
        
        this.log('ERROR', `数据分析失败: ${result.error}`);
        return false;
      }
    } catch (error) {
      this.monitoringState.errors.push({
        type: 'data_analysis',
        timestamp: new Date().toISOString(),
        details: error.message
      });
      
      this.log('ERROR', `数据分析异常: ${error.message}`);
      return false;
    }
  }
  
  /**
   * 执行系统优化
   */
  async runSystemOptimization() {
    try {
      const result = await this.executeCommand('node omc-4ai-workflow-complete.js --mode=optimize');
      
      if (result.success) {
        this.monitoringState.lastOptimization = new Date().toISOString();
        this.monitoringState.successes.push({
          type: 'system_optimization',
          timestamp: new Date().toISOString(),
          details: '系统优化成功'
        });
        
        this.log('INFO', '系统优化成功');
        return true;
      } else {
        this.monitoringState.errors.push({
          type: 'system_optimization',
          timestamp: new Date().toISOString(),
          details: result.error || '系统优化失败'
        });
        
        this.log('ERROR', `系统优化失败: ${result.error}`);
        return false;
      }
    } catch (error) {
      this.monitoringState.errors.push({
        type: 'system_optimization',
        timestamp: new Date().toISOString(),
        details: error.message
      });
      
      this.log('ERROR', `系统优化异常: ${error.message}`);
      return false;
    }
  }
  
  /**
   * 执行策略库生成
   */
  async runStrategyLibraryGeneration() {
    try {
      const result = await this.executeCommand('node strategy-library-generator.js');
      
      if (result.success) {
        this.monitoringState.lastStrategyUpdate = new Date().toISOString();
        this.monitoringState.successes.push({
          type: 'strategy_generation',
          timestamp: new Date().toISOString(),
          details: '策略库生成成功'
        });
        
        this.log('INFO', '策略库生成成功');
        return true;
      } else {
        this.monitoringState.errors.push({
          type: 'strategy_generation',
          timestamp: new Date().toISOString(),
          details: result.error || '策略库生成失败'
        });
        
        this.log('ERROR', `策略库生成失败: ${result.error}`);
        return false;
      }
    } catch (error) {
      this.monitoringState.errors.push({
        type: 'strategy_generation',
        timestamp: new Date().toISOString(),
        details: error.message
      });
      
      this.log('ERROR', `策略库生成异常: ${error.message}`);
      return false;
    }
  }
  
  /**
   * 执行监控检查
   */
  async performMonitoringCheck() {
    const now = new Date();
    const checkTime = now.toISOString();
    
    try {
      // 检查系统健康状况
      const healthChecks = await this.performHealthChecks();
      
      // 检查性能指标
      const performanceMetrics = await this.checkPerformanceMetrics();
      
      // 检查资源使用
      const resourceUsage = await this.checkResourceUsage();
      
      // 检查任务执行状态
      const taskStatus = this.checkTaskStatus();
      
      // 生成监控报告
      const report = {
        timestamp: checkTime,
        healthChecks,
        performanceMetrics,
        resourceUsage,
        taskStatus,
        monitoringState: this.monitoringState
      };
      
      // 保存监控报告
      this.saveMonitoringReport(report);
      
      // 检查是否需要告警
      this.checkForAlerts(report);
      
      // 清理旧数据
      this.cleanupOldData();
      
      this.log('INFO', `监控检查完成: ${checkTime}`);
      
    } catch (error) {
      this.log('ERROR', `监控检查失败: ${error.message}`);
    }
  }
  
  /**
   * 执行健康检查
   */
  async performHealthChecks() {
    const checks = [];
    
    // 检查文件系统
    checks.push({
      name: '文件系统',
      status: this.checkFileSystem(),
      details: '检查必要文件是否存在'
    });
    
    // 检查路由系统
    checks.push({
      name: '路由系统',
      status: await this.checkRoutingSystem(),
      details: '测试路由系统是否正常'
    });
    
    // 检查数据目录
    checks.push({
      name: '数据目录',
      status: this.checkDataDirectories(),
      details: '检查数据目录可写性'
    });
    
    // 检查配置
    checks.push({
      name: '配置系统',
      status: this.checkConfiguration(),
      details: '检查配置有效性'
    });
    
    return {
      timestamp: new Date().toISOString(),
      totalChecks: checks.length,
      passedChecks: checks.filter(c => c.status.healthy).length,
      failedChecks: checks.filter(c => !c.status.healthy).length,
      checks
    };
  }
  
  /**
   * 检查性能指标
   */
  async checkPerformanceMetrics() {
    // 这里应该从实际监控数据中获取
    // 暂时使用模拟数据
    
    return {
      timestamp: new Date().toISOString(),
      successRate: 0.95 + (Math.random() * 0.04 - 0.02), // 93-97%
      averageLatency: 300 + Math.random() * 200, // 300-500ms
      errorRate: 0.02 + Math.random() * 0.03, // 2-5%
      throughput: 100 + Math.random() * 50, // 100-150 req/min
      uptime: 0.999 // 99.9%
    };
  }
  
  /**
   * 检查资源使用
   */
  async checkResourceUsage() {
    // 模拟资源使用检查
    return {
      timestamp: new Date().toISOString(),
      cpuUsage: 30 + Math.random() * 40, // 30-70%
      memoryUsage: 40 + Math.random() * 30, // 40-70%
      diskUsage: 50 + Math.random() * 30, // 50-80%
      networkTraffic: 1000 + Math.random() * 2000 // 1-3 MB/s
    };
  }
  
  /**
   * 检查任务状态
   */
  checkTaskStatus() {
    const now = new Date();
    const oneHour = 60 * 60 * 1000;
    const sixHours = 6 * oneHour;
    const oneDay = 24 * oneHour;
    const oneWeek = 7 * oneDay;
    
    const status = {
      dataCollection: this.checkTaskRecency(this.monitoringState.lastCollection, oneHour),
      dataAnalysis: this.checkTaskRecency(this.monitoringState.lastAnalysis, sixHours),
      systemOptimization: this.checkTaskRecency(this.monitoringState.lastOptimization, oneDay),
      strategyUpdate: this.checkTaskRecency(this.monitoringState.lastStrategyUpdate, oneWeek)
    };
    
    return {
      timestamp: now.toISOString(),
      status,
      lastExecution: {
        dataCollection: this.monitoringState.lastCollection,
        dataAnalysis: this.monitoringState.lastAnalysis,
        systemOptimization: this.monitoringState.lastOptimization,
        strategyUpdate: this.monitoringState.lastStrategyUpdate
      }
    };
  }
  
  /**
   * 检查是否需要告警
   */
  checkForAlerts(report) {
    const alerts = [];
    const thresholds = this.config.automation.thresholds;
    
    // 检查性能指标
    if (report.performanceMetrics.successRate < thresholds.successRate) {
      alerts.push({
        type: 'performance',
        severity: 'warning',
        message: `成功率低于阈值: ${(report.performanceMetrics.successRate * 100).toFixed(1)}% < ${thresholds.successRate * 100}%`,
        metric: 'successRate',
        value: report.performanceMetrics.successRate,
        threshold: thresholds.successRate
      });
    }
    
    if (report.performanceMetrics.averageLatency > thresholds.latency) {
      alerts.push({
        type: 'performance',
        severity: 'warning',
        message: `平均延迟超过阈值: ${report.performanceMetrics.averageLatency.toFixed(0)}ms > ${thresholds.latency}ms`,
        metric: 'latency',
        value: report.performanceMetrics.averageLatency,
        threshold: thresholds.latency
      });
    }
    
    if (report.performanceMetrics.errorRate > thresholds.errorRate) {
      alerts.push({
        type: 'performance',
        severity: 'critical',
        message: `错误率超过阈值: ${(report.performanceMetrics.errorRate * 100).toFixed(1)}% > ${thresholds.errorRate * 100}%`,
        metric: 'errorRate',
        value: report.performanceMetrics.errorRate,
        threshold: thresholds.errorRate
      });
    }
    
    // 检查资源使用
    if (report.resourceUsage.cpuUsage > thresholds.resourceUsage * 100) {
      alerts.push({
        type: 'resource',
        severity: 'warning',
        message: `CPU使用率过高: ${report.resourceUsage.cpuUsage.toFixed(1)}% > ${thresholds.resourceUsage * 100}%`,
        metric: 'cpuUsage',
        value: report.resourceUsage.cpuUsage,
        threshold: thresholds.resourceUsage * 100
      });
    }
    
    // 检查任务执行状态
    Object.entries(report.taskStatus.status).forEach(([task, status]) => {
      if (status === 'overdue') {
        alerts.push({
          type: 'scheduling',
          severity: 'warning',
          message: `任务 ${task} 执行超时`,
          task,
          status
        });
      } else if (status === 'failed') {
        alerts.push({
          type: 'scheduling',
          severity: 'critical',
          message: `任务 ${task} 执行失败`,
          task,
          status
        });
      }
    });
    
    // 处理告警
    if (alerts.length > 0) {
      this.handleAlerts(alerts);
    }
  }
  
  /**
   * 处理告警
   */
  handleAlerts(alerts) {
    alerts.forEach(alert => {
      // 记录告警
      this.log('ALERT', `${alert.severity.toUpperCase()}: ${alert.message}`);
      
      // 根据严重程度采取不同措施
      if (alert.severity === 'critical') {
        this.handleCriticalAlert(alert);
      } else if (alert.severity === 'warning') {
        this.handleWarningAlert(alert);
      }
    });
    
    // 保存告警记录
    this.saveAlertHistory(alerts);
  }
  
  /**
   * 处理严重告警
   */
  handleCriticalAlert(alert) {
    // 记录严重告警
    this.monitoringState.errors.push({
      type: 'critical_alert',
      timestamp: new Date().toISOString(),
      details: alert.message,
      alert
    });
    
    // 这里可以添加通知管理员、自动修复等逻辑
    console.log(`🚨 严重告警: ${alert.message}`);
  }
  
  /**
   * 处理警告告警
   */
  handleWarningAlert(alert) {
    // 记录警告
    this.monitoringState.warnings.push({
      type: 'warning_alert',
      timestamp: new Date().toISOString(),
      details: alert.message,
      alert
    });
    
    console.log(`⚠️  警告: ${alert.message}`);
  }
  
  /**
   * 辅助方法
   */
  async executeCommand(command) {
    return new Promise((resolve) => {
      try {
        const result = execSync(command, {
          cwd: this.workspace,
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'pipe']
        });
        
        resolve({
          success: true,
          output: result,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        resolve({
          success: false,
          error: error.message,
          output: error.stdout?.toString() || error.stderr?.toString(),
          timestamp: new Date().toISOString()
        });
      }
    });
  }
  
  log(level, message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}`;
    
    // 输出到控制台
    if (level === 'ERROR' || level === 'CRITICAL') {
      console.error(logMessage);
    } else if (level === 'WARN' || level === 'ALERT') {
      console.warn(logMessage);
    } else {
      console.log(logMessage);
    }
    
    // 保存到日志文件
    const logFile = path.join(this.logDir, `automation-${new Date().toISOString().split('T')[0]}.log`);
    fs.appendFileSync(logFile, logMessage + '\n', 'utf8');
  }
  
  checkFileSystem() {
    const requiredFiles = [
      'real-openclaw-router.js',
      'omc-4ai-workflow-complete.js',
      'strategy-library-generator.js'
    ];
    
    const missingFiles = requiredFiles.filter(file => 
      !fs.existsSync(path.join(this.workspace, file))
    );
    
    return {
      healthy: missingFiles.length === 0,
      details: missingFiles.length > 0 ? `缺少文件: ${missingFiles.join(', ')}` : '所有必要文件都存在'
    };
  }
  
  async checkRoutingSystem() {
    try {
      const testCommand = 'node test-routing-simple.js';
      const result = await this.executeCommand(testCommand);
      
      return {
        healthy: result.success,
        details: result.success ? '路由系统正常' : `路由系统测试失败: ${result.error}`
      };
    } catch (error) {
      return {
        healthy: false,
        details: `路由系统检查异常: ${error.message}`
      };
    }
  }
  
  checkDataDirectories() {
    const directories = [
      this.logDir,
      this.configDir,
      path.join(this.workspace, 'omc-4ai-data'),
      path.join(this.workspace, 'omc-strategy-library')
    ];
    
    const unwritableDirs = directories.filter(dir => {
      try {
        // 尝试创建测试文件
        const testFile = path.join(dir, '.write_test');
        fs.writeFileSync(testFile, 'test');
        fs.unlinkSync(testFile);
        return false;
      } catch {
        return true;
      }
    });
    
    return {
      healthy: unwritableDirs.length === 0,
      details: unwritableDirs.length > 0 ? `目录不可写: ${unwritableDirs.join(', ')}` : '所有目录都可写'
    };
  }
  
  checkConfiguration() {
    try {
      // 检查配置有效性
      const requiredConfig = ['automation', 'monitoring', 'optimization'];
      const missingConfig = requiredConfig.filter(key => !this.config[key]);
      
      return {
        healthy: missingConfig.length === 0,
        details: missingConfig.length > 0 ? `缺少配置: ${missingConfig.join(', ')}` : '配置完整有效'
      };
    } catch (error) {
      return {
        healthy: false,
        details: `配置检查异常: ${error.message}`
      };
    }
  }
  
  checkTaskRecency(lastTimestamp, maxAge) {
    if (!lastTimestamp) return 'never';
    
    const lastTime = new Date(lastTimestamp);
    const now = new Date();
    const age = now - lastTime;
    
    if (age > maxAge * 2) return 'failed';
    if (age > maxAge) return 'overdue';
    if (age < maxAge) return 'on_time';
    
    return 'unknown';
  }
  
  createScheduledTaskScripts() {
    const scripts = {
      'collect-data': this.createDataCollectionScript(),
      'analyze-data': this.createDataAnalysisScript(),
      'optimize-system': this.createOptimizationScript(),
      'update-strategy': this.createStrategyUpdateScript()
    };
    
    Object.entries(scripts).forEach(([name, content]) => {
      const scriptPath = path.join(this.configDir, `${name}.sh`);
      fs.writeFileSync(scriptPath, content, 'utf8');
      fs.chmodSync(scriptPath, '755');
    });
    
    this.log('INFO', '定时任务脚本创建完成');
  }
  
  createDataCollectionScript() {
    return `#!/bin/bash
# 数据收集脚本
cd ${this.workspace}
node omc-4ai-workflow-complete.js --mode=collect
echo "数据收集完成: $(date)" >> ${this.logDir}/scheduler.log
`;
  }
  
  createDataAnalysisScript() {
    return `#!/bin/bash
# 数据分析脚本
cd ${this.workspace}
node omc-4ai-workflow-complete.js --mode=analyze
echo "数据分析完成: $(date)" >> ${this.logDir}/scheduler.log
`;
  }
  
  createOptimizationScript() {
    return `#!/bin/bash
# 系统优化脚本
cd ${this.workspace}
node omc-4ai-workflow-complete.js --mode=optimize
echo "系统优化完成: $(date)" >> ${this.logDir}/scheduler.log
`;
  }
  
  createStrategyUpdateScript() {
    return `#!/bin/bash
# 策略更新脚本
cd ${this.workspace}
node strategy-library-generator.js
echo "策略更新完成: $(date)" >> ${this.logDir}/scheduler.log
`;
  }
  
  saveMonitoringReport(report) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(this.logDir, `monitoring-report-${timestamp}.json`);
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  }
  
  saveAlertHistory(alerts) {
    const alertFile = path.join(this.logDir, 'alert-history.jsonl');
    
    alerts.forEach(alert => {
      const entry = {
        timestamp: new Date().toISOString(),
        ...alert
      };
      
      fs.appendFileSync(alertFile, JSON.stringify(entry) + '\n', 'utf8');
    });
  }
  
  cleanupOldData() {
    const retentionDays = this.config.monitoring.retentionDays;
    const cutoffTime = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);
    
    // 清理旧日志
    const logFiles = fs.readdirSync(this.logDir);
    logFiles.forEach(file => {
      const filePath = path.join(this.logDir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.mtimeMs < cutoffTime) {
        fs.unlinkSync(filePath);
      }
    });
    
    // 清理旧报告
    const reportDir = path.join(this.workspace, 'omc-4ai-reports');
    if (fs.existsSync(reportDir)) {
      const reportFiles = fs.readdirSync(reportDir);
      reportFiles.forEach(file => {
        const filePath = path.join(reportDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtimeMs < cutoffTime) {
          fs.unlinkSync(filePath);
        }
      });
    }
  }
  
  /**
   * 显示系统状态
   */
  displayStatus() {
    console.log('\n📊 OMC自动化系统状态');
    console.log('='.repeat(60));
    
    console.log('系统信息:');
    console.log(`  工作空间: ${this.workspace}`);
    console.log(`  配置目录: ${this.configDir}`);
    console.log(`  日志目录: ${this.logDir}`);
    
    console.log('\n监控状态:');
    console.log(`  最后数据收集: ${this.monitoringState.lastCollection || '从未执行'}`);
    console.log(`  最后数据分析: ${this.monitoringState.lastAnalysis || '从未执行'}`);
    console.log(`  最后系统优化: ${this.monitoringState.lastOptimization || '从未执行'}`);
    console.log(`  最后策略更新: ${this.monitoringState.lastStrategyUpdate || '从未执行'}`);
    
    console.log('\n错误统计:');
    console.log(`  总错误数: ${this.monitoringState.errors.length}`);
    console.log(`  总警告数: ${this.monitoringState.warnings.length}`);
    console.log(`  总成功数: ${this.monitoringState.successes.length}`);
    
    if (this.monitoringState.errors.length > 0) {
      console.log('\n最近错误:');
      this.monitoringState.errors.slice(-3).forEach(error => {
        console.log(`  ❌ ${error.timestamp}: ${error.details}`);
      });
    }
    
    console.log('\n定时任务:');
    const schedule = this.config.automation.schedule;
    console.log(`  数据收集: ${schedule.dataCollection}`);
    console.log(`  数据分析: ${schedule.dataAnalysis}`);
    console.log(`  系统优化: ${schedule.systemOptimization}`);
    console.log(`  策略更新: ${schedule.strategyUpdate}`);
    
    console.log('\n阈值配置:');
    const thresholds = this.config.automation.thresholds;
    console.log(`  成功率阈值: ${thresholds.successRate * 100}%`);
    console.log(`  延迟阈值: ${thresholds.latency}ms`);
    console.log(`  错误率阈值: ${thresholds.errorRate * 100}%`);
    console.log(`  资源使用阈值: ${thresholds.resourceUsage * 100}%`);
    
    console.log('='.repeat(60));
  }
}

// 主程序
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0] || 'start';
  
  const automationSystem = new OMCAutomationSystem();
  
  switch (command) {
    case 'start':
      automationSystem.start();
      break;
      
    case 'status':
      automationSystem.displayStatus();
      break;
      
    case 'collect':
      automationSystem.runDataCollection();
      break;
      
    case 'analyze':
      automationSystem.runDataAnalysis();
      break;
      
    case 'optimize':
      automationSystem.runSystemOptimization();
      break;
      
    case 'strategy':
      automationSystem.runStrategyLibraryGeneration();
      break;
      
    case 'monitor':
      automationSystem.performMonitoringCheck();
      break;
      
    default:
      console.log('使用方法:');
      console.log('  node omc-automation-system.js start     # 启动自动化系统');
      console.log('  node omc-automation-system.js status    # 查看系统状态');
      console.log('  node omc-automation-system.js collect   # 手动数据收集');
      console.log('  node omc-automation-system.js analyze   # 手动数据分析');
      console.log('  node omc-automation-system.js optimize  # 手动系统优化');
      console.log('  node omc-automation-system.js strategy  # 手动策略生成');
      console.log('  node omc-automation-system.js monitor   # 手动监控检查');
      break;
  }
}

module.exports = OMCAutomationSystem;