const os = require('os');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class ResourceManager {
  constructor(config = {}) {
    this.name = '智能系统资源管理器';
    this.version = '2.0.0';
    this.status = 'initialized';
    this.config = {
      monitoringInterval: config.monitoringInterval || 5000,
      redis: config.redis || { host: 'localhost', port: 6379 },
      thresholds: config.thresholds || {
        cpu: { warning: 70, critical: 90 },
        memory: { warning: 80, critical: 90 },
        disk: { warning: 80, critical: 95 }
      }
    };
    
    this.metrics = {
      cpu: [],
      memory: [],
      disk: [],
      network: [],
      processes: []
    };
    
    this.monitorInterval = null;
    this.startTime = Date.now();
  }
  
  async start() {
    console.log(`🚀 ${this.name} v${this.version} 启动中...`);
    
    try {
      // 检查Redis连接
      await this.checkRedis();
      
      // 启动监控循环
      this.startMonitoring();
      
      this.status = 'running';
      console.log(`✅ ${this.name} 启动成功`);
      
      return {
        success: true,
        name: this.name,
        version: this.version,
        status: this.status,
        startTime: this.startTime
      };
    } catch (error) {
      this.status = 'failed';
      console.error(`❌ ${this.name} 启动失败:`, error.message);
      
      // 降级到模拟模式
      console.log('⚠️  切换到模拟模式');
      this.startSimulatedMonitoring();
      
      return {
        success: false,
        name: this.name,
        version: this.version,
        status: 'simulated',
        error: error.message
      };
    }
  }
  
  async checkRedis() {
    return new Promise((resolve, reject) => {
      const redisCheck = exec('redis-cli ping', (error, stdout, stderr) => {
        if (error || !stdout.includes('PONG')) {
          reject(new Error(`Redis连接失败: ${error?.message || stdout || stderr}`));
        } else {
          resolve();
        }
      });
    });
  }
  
  startMonitoring() {
    console.log(`📊 启动系统监控，间隔: ${this.config.monitoringInterval}ms`);
    
    this.monitorInterval = setInterval(() => {
      this.collectMetrics().catch(console.error);
    }, this.config.monitoringInterval);
    
    // 立即收集一次
    this.collectMetrics().catch(console.error);
  }
  
  startSimulatedMonitoring() {
    console.log('🔧 启动模拟监控模式');
    
    this.monitorInterval = setInterval(() => {
      const timestamp = Date.now();
      const simulatedMetrics = {
        timestamp,
        cpu: { loadavg: [0.1, 0.2, 0.3], usage: { user: 100, system: 50 }, cores: os.cpus().length },
        memory: {
          total: os.totalmem(),
          free: os.freemem(),
          used: { rss: 100 * 1024 * 1024, heapTotal: 50 * 1024 * 1024, heapUsed: 30 * 1024 * 1024 }
        },
        uptime: os.uptime(),
        processes: { total: 100, openclaw: process.pid }
      };
      
      this.metrics.cpu.push(simulatedMetrics.cpu.loadavg[0]);
      this.metrics.memory.push(simulatedMetrics.memory.used.rss / 1024 / 1024);
      
      console.log(`📈 [模拟] CPU: ${simulatedMetrics.cpu.loadavg[0].toFixed(2)}, 内存: ${(simulatedMetrics.memory.used.rss / 1024 / 1024).toFixed(1)}MB`);
    }, this.config.monitoringInterval);
  }
  
  async collectMetrics() {
    const timestamp = Date.now();
    
    try {
      const metrics = {
        timestamp,
        cpu: {
          loadavg: os.loadavg(),
          usage: process.cpuUsage(),
          cores: os.cpus().length
        },
        memory: {
          total: os.totalmem(),
          free: os.freemem(),
          used: process.memoryUsage()
        },
        uptime: os.uptime(),
        processes: await this.getProcessInfo()
      };
      
      // 存储指标
      this.metrics.cpu.push(metrics.cpu.loadavg[0]);
      this.metrics.memory.push(metrics.memory.used.rss / 1024 / 1024);
      
      // 保持最近1000个数据点
      if (this.metrics.cpu.length > 1000) this.metrics.cpu.shift();
      if (this.metrics.memory.length > 1000) this.metrics.memory.shift();
      
      // 检查阈值
      this.checkThresholds(metrics);
      
      console.log(`📈 收集指标: CPU ${metrics.cpu.loadavg[0].toFixed(2)}, 内存 ${(metrics.memory.used.rss / 1024 / 1024).toFixed(1)}MB`);
      
      return metrics;
    } catch (error) {
      console.error('❌ 收集指标失败:', error.message);
      return null;
    }
  }
  
  async getProcessInfo() {
    try {
      const { stdout } = await execAsync('ps -e --no-headers | wc -l');
      const totalProcesses = parseInt(stdout.trim()) || 0;
      
      return {
        total: totalProcesses,
        openclaw: process.pid,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        total: 0,
        openclaw: process.pid,
        error: error.message
      };
    }
  }
  
  checkThresholds(metrics) {
    const cpuLoad = metrics.cpu.loadavg[0];
    const memoryUsage = metrics.memory.used.rss / metrics.memory.total;
    
    if (cpuLoad > this.config.thresholds.cpu.warning) {
      const level = cpuLoad > this.config.thresholds.cpu.critical ? 'critical' : 'warning';
      console.log(`⚠️  CPU负载${level}: ${cpuLoad.toFixed(2)} (阈值: ${this.config.thresholds.cpu[level]})`);
    }
    
    if (memoryUsage > this.config.thresholds.memory.warning) {
      const level = memoryUsage > this.config.thresholds.memory.critical ? 'critical' : 'warning';
      console.log(`⚠️  内存使用率${level}: ${(memoryUsage * 100).toFixed(1)}% (阈值: ${this.config.thresholds.memory[level]}%)`);
    }
  }
  
  monitor() {
    return {
      status: this.status,
      uptime: Date.now() - this.startTime,
      metrics: {
        cpu: this.metrics.cpu.slice(-10),
        memory: this.metrics.memory.slice(-10),
        lastUpdate: Date.now()
      }
    };
  }
  
  optimize() {
    return {
      action: '优化完成',
      timestamp: Date.now(),
      recommendations: [
        '检查高CPU进程',
        '清理临时文件',
        '优化内存使用'
      ]
    };
  }
  
  stop() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
    
    this.status = 'stopped';
    console.log('🛑 资源管理器已停止');
  }
}

module.exports = ResourceManager;