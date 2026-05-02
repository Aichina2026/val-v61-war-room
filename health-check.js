#!/usr/bin/env node
/**
 * 4AI系统健康检查脚本
 * 用于定时维护任务中的系统健康监控
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class SystemHealthCheck {
  constructor() {
    this.timestamp = new Date().toISOString();
    this.workspace = '/root/.openclaw/workspace';
    this.reportPath = path.join(this.workspace, 'health-reports', `health-report-${new Date().toISOString().split('T')[0]}.json`);
    
    // 确保报告目录存在
    const reportDir = path.dirname(this.reportPath);
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    this.report = {
      timestamp: this.timestamp,
      system: {},
      services: {},
      resources: {},
      connectivity: {},
      issues: [],
      recommendations: [],
      summary: 'healthy'
    };
  }

  async runFullCheck() {
    console.log('🔍 开始4AI系统健康检查');
    console.log('='.repeat(60));
    
    try {
      // 1. 系统基本信息
      await this.checkSystemInfo();
      
      // 2. 服务状态检查
      await this.checkServices();
      
      // 3. 资源使用检查
      await this.checkResources();
      
      // 4. 网络连通性检查
      await this.checkConnectivity();
      
      // 5. 关键文件检查
      await this.checkCriticalFiles();
      
      // 6. 生成报告
      await this.generateReport();
      
      console.log('✅ 健康检查完成');
      console.log(`📄 报告已保存至: ${this.reportPath}`);
      
    } catch (error) {
      console.error('❌ 健康检查失败:', error.message);
      this.report.summary = 'failed';
      this.report.error = error.message;
      await this.saveReport();
    }
  }

  async checkSystemInfo() {
    console.log('📊 检查系统信息...');
    
    try {
      // 操作系统信息
      const osInfo = execSync('uname -a').toString().trim();
      this.report.system.os = osInfo;
      
      // Node.js版本
      const nodeVersion = execSync('node --version').toString().trim();
      this.report.system.node = nodeVersion;
      
      // npm版本
      const npmVersion = execSync('npm --version').toString().trim();
      this.report.system.npm = npmVersion;
      
      // Git版本
      const gitVersion = execSync('git --version').toString().trim();
      this.report.system.git = gitVersion;
      
      console.log(`   ✅ 系统信息正常`);
      console.log(`      OS: ${osInfo.split(' ')[0]}`);
      console.log(`      Node: ${nodeVersion}`);
      console.log(`      Git: ${gitVersion}`);
      
    } catch (error) {
      this.report.issues.push(`系统信息检查失败: ${error.message}`);
      console.log(`   ⚠️  系统信息检查异常: ${error.message}`);
    }
  }

  async checkServices() {
    console.log('⚙️  检查服务状态...');
    
    const services = [
      { name: 'openclaw-gateway', command: 'pgrep -f "openclaw-gateway"' },
      { name: '4ai-workflow', command: 'pgrep -f "AgentEventLoop.js"' },
      { name: 'cron-jobs', command: 'crontab -l | wc -l' }
    ];
    
    for (const service of services) {
      try {
        const result = execSync(service.command).toString().trim();
        const isRunning = service.name === 'cron-jobs' ? parseInt(result) > 0 : result.length > 0;
        
        this.report.services[service.name] = {
          running: isRunning,
          pid: isRunning && service.name !== 'cron-jobs' ? result : null
        };
        
        console.log(`   ${isRunning ? '✅' : '❌'} ${service.name}: ${isRunning ? '运行中' : '未运行'}`);
        
        if (!isRunning && service.name !== 'cron-jobs') {
          this.report.issues.push(`服务 ${service.name} 未运行`);
          this.report.recommendations.push(`启动服务: ${service.name}`);
        }
        
      } catch (error) {
        this.report.services[service.name] = { running: false, error: error.message };
        console.log(`   ❌ ${service.name}: 检查失败`);
      }
    }
  }

  async checkResources() {
    console.log('💾 检查资源使用...');
    
    try {
      // CPU使用率
      const cpuUsage = execSync("top -bn1 | grep 'Cpu(s)' | awk '{print $2}'").toString().trim();
      this.report.resources.cpu = parseFloat(cpuUsage);
      
      // 内存使用
      const memInfo = execSync("free -m | grep Mem:").toString().trim().split(/\s+/);
      const totalMem = parseInt(memInfo[1]);
      const usedMem = parseInt(memInfo[2]);
      const memUsage = (usedMem / totalMem * 100).toFixed(1);
      this.report.resources.memory = {
        total: totalMem,
        used: usedMem,
        usage: parseFloat(memUsage)
      };
      
      // 磁盘使用
      const diskInfo = execSync("df -h / | tail -1").toString().trim().split(/\s+/);
      this.report.resources.disk = {
        total: diskInfo[1],
        used: diskInfo[2],
        available: diskInfo[3],
        usage: diskInfo[4]
      };
      
      console.log(`   ✅ 资源使用正常`);
      console.log(`      CPU: ${cpuUsage}%`);
      console.log(`      内存: ${memUsage}% (${usedMem}MB/${totalMem}MB)`);
      console.log(`      磁盘: ${diskInfo[4]} 已用`);
      
      // 检查阈值
      if (parseFloat(cpuUsage) > 80) {
        this.report.issues.push(`CPU使用率过高: ${cpuUsage}%`);
      }
      if (parseFloat(memUsage) > 85) {
        this.report.issues.push(`内存使用率过高: ${memUsage}%`);
      }
      if (parseInt(diskInfo[4]) > 90) {
        this.report.issues.push(`磁盘使用率过高: ${diskInfo[4]}`);
      }
      
    } catch (error) {
      this.report.issues.push(`资源检查失败: ${error.message}`);
      console.log(`   ⚠️  资源检查异常: ${error.message}`);
    }
  }

  async checkConnectivity() {
    console.log('🌐 检查网络连通性...');
    
    const endpoints = [
      { name: 'github-api', url: 'https://api.github.com' },
      { name: 'github-main', url: 'https://github.com' },
      { name: 'openclaw-docs', url: 'https://docs.openclaw.ai' }
    ];
    
    for (const endpoint of endpoints) {
      try {
        execSync(`curl -s -I --connect-timeout 10 ${endpoint.url} | head -1`, { stdio: 'pipe' });
        this.report.connectivity[endpoint.name] = 'reachable';
        console.log(`   ✅ ${endpoint.name}: 可访问`);
      } catch (error) {
        this.report.connectivity[endpoint.name] = 'unreachable';
        this.report.issues.push(`网络端点 ${endpoint.name} 不可访问`);
        console.log(`   ❌ ${endpoint.name}: 不可访问`);
      }
    }
  }

  async checkCriticalFiles() {
    console.log('📁 检查关键文件...');
    
    const criticalFiles = [
      { path: '/root/.openclaw/openclaw.json', description: 'OpenClaw主配置' },
      { path: '/root/.openclaw/.env', description: '环境变量配置' },
      { path: '/root/.openclaw/workspace/AGENTS.md', description: '代理配置' },
      { path: '/root/.openclaw/workspace/SYSTEM_ARCHITECTURE_COMPLETE.md', description: '系统架构文档' },
      { path: '/root/.openclaw/workspace/MAINTENANCE_SCHEDULE.json', description: '维护计划' }
    ];
    
    for (const file of criticalFiles) {
      const exists = fs.existsSync(file.path);
      this.report[`file_${file.path.replace(/\W/g, '_')}`] = exists;
      
      if (exists) {
        console.log(`   ✅ ${file.description}: 存在`);
      } else {
        console.log(`   ❌ ${file.description}: 缺失`);
        this.report.issues.push(`关键文件缺失: ${file.description}`);
        this.report.recommendations.push(`创建文件: ${file.path}`);
      }
    }
  }

  async generateReport() {
    // 计算总体状态
    const issueCount = this.report.issues.length;
    if (issueCount === 0) {
      this.report.summary = 'healthy';
      this.report.status = '✅ 系统健康';
    } else if (issueCount <= 3) {
      this.report.summary = 'warning';
      this.report.status = '⚠️  系统有警告';
    } else {
      this.report.summary = 'critical';
      this.report.status = '❌ 系统有严重问题';
    }
    
    // 添加统计信息
    this.report.stats = {
      total_checks: 5,
      issues_found: issueCount,
      recommendations: this.report.recommendations.length,
      check_duration: new Date() - new Date(this.timestamp)
    };
    
    await this.saveReport();
  }

  async saveReport() {
    try {
      fs.writeFileSync(this.reportPath, JSON.stringify(this.report, null, 2));
      // 保留最近7天的报告
      this.cleanupOldReports();
    } catch (error) {
      console.error('保存报告失败:', error.message);
    }
  }

  cleanupOldReports() {
    const reportDir = path.dirname(this.reportPath);
    try {
      const files = fs.readdirSync(reportDir);
      const now = new Date();
      
      files.forEach(file => {
        if (file.startsWith('health-report-') && file.endsWith('.json')) {
          const fileDate = file.match(/health-report-(\d{4}-\d{2}-\d{2})/);
          if (fileDate) {
            const reportDate = new Date(fileDate[1]);
            const daysDiff = (now - reportDate) / (1000 * 60 * 60 * 24);
            if (daysDiff > 7) {
              fs.unlinkSync(path.join(reportDir, file));
            }
          }
        }
      });
    } catch (error) {
      // 忽略清理错误
    }
  }
}

// 命令行接口
if (require.main === module) {
  const args = process.argv.slice(2);
  const healthCheck = new SystemHealthCheck();
  
  if (args.includes('--full') || args.length === 0) {
    healthCheck.runFullCheck();
  } else if (args.includes('--quick')) {
    // 快速检查模式
    healthCheck.runFullCheck();
  } else if (args.includes('--help')) {
    console.log(`
4AI系统健康检查工具

用法:
  node health-check.js [选项]

选项:
  --full     完整健康检查（默认）
  --quick    快速检查
  --help     显示帮助信息

示例:
  node health-check.js --full
  node health-check.js --quick
    `);
  }
}

module.exports = SystemHealthCheck;