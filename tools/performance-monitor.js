/**
 * 紧急重构版性能监控
 */

const os = require('os');

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      startup: [],
      memory: [],
      cpu: [],
      requests: []
    };
    
    this.startTime = Date.now();
    this.interval = null;
  }

  start(interval = 5000) {
    console.log('📊 启动性能监控...');
    
    this.interval = setInterval(() => {
      this.collectMetrics();
    }, interval);
    
    // 记录启动时间
    this.metrics.startup.push({
      time: Date.now(),
      duration: Date.now() - this.startTime
    });
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  collectMetrics() {
    const timestamp = Date.now();
    
    // 内存使用
    const memory = process.memoryUsage();
    this.metrics.memory.push({
      time: timestamp,
      heapUsed: memory.heapUsed,
      heapTotal: memory.heapTotal,
      rss: memory.rss
    });
    
    // CPU使用（简化）
    const cpuUsage = process.cpuUsage();
    this.metrics.cpu.push({
      time: timestamp,
      user: cpuUsage.user,
      system: cpuUsage.system
    });
    
    // 系统负载
    const load = os.loadavg();
    
    // 定期清理旧数据（保留最近1000条）
    ['memory', 'cpu', 'requests'].forEach(type => {
      if (this.metrics[type].length > 1000) {
        this.metrics[type] = this.metrics[type].slice(-1000);
      }
    });
  }

  recordRequest(method, path, duration, status) {
    this.metrics.requests.push({
      time: Date.now(),
      method,
      path,
      duration,
      status
    });
  }

  getReport() {
    const now = Date.now();
    const uptime = now - this.startTime;
    
    // 计算平均值
    const avgMemory = this.calculateAverage(this.metrics.memory, 'heapUsed');
    const avgCPU = this.calculateAverage(this.metrics.cpu, 'user');
    
    // 最近性能
    const recentMemory = this.metrics.memory.slice(-10);
    const recentCPU = this.metrics.cpu.slice(-10);
    
    return {
      uptime,
      memory: {
        current: process.memoryUsage().heapUsed,
        average: avgMemory,
        trend: this.calculateTrend(recentMemory, 'heapUsed')
      },
      cpu: {
        current: process.cpuUsage().user,
        average: avgCPU,
        trend: this.calculateTrend(recentCPU, 'user')
      },
      requests: {
        total: this.metrics.requests.length,
        recent: this.metrics.requests.slice(-20)
      },
      startup: this.metrics.startup[0] || null
    };
  }

  calculateAverage(data, field) {
    if (data.length === 0) return 0;
    
    const sum = data.reduce((acc, item) => acc + (item[field] || 0), 0);
    return sum / data.length;
  }

  calculateTrend(data, field) {
    if (data.length < 2) return 'stable';
    
    const first = data[0][field] || 0;
    const last = data[data.length - 1][field] || 0;
    
    if (last > first * 1.1) return 'increasing';
    if (last < first * 0.9) return 'decreasing';
    return 'stable';
  }

  alert(check) {
    const report = this.getReport();
    
    if (check(report)) {
      console.warn('⚠️  性能警报触发');
      console.log('当前状态:', report);
      return true;
    }
    
    return false;
  }
}

// 预设警报规则
const defaultAlerts = {
  memory: (report) => report.memory.current > 800 * 1024 * 1024, // 800MB
  cpu: (report) => report.cpu.current > 500000, // 高CPU使用
  startup: (report) => report.startup && report.startup.duration > 10000 // 10秒
};

module.exports = { PerformanceMonitor, defaultAlerts };
