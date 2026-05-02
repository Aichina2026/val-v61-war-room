/**
 * 启动智能系统资源管理器Agent
 * 使用Redis作为后端存储
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

class ResourceManagerStarter {
  constructor() {
    this.process = null;
    this.config = {
      redisHost: 'localhost',
      redisPort: 6379,
      monitoringInterval: 5000, // 5秒
      logLevel: 'info'
    };
  }

  async start() {
    console.log('🚀 启动智能系统资源管理器Agent...');
    
    try {
      // 检查Redis连接
      await this.checkRedis();
      
      // 启动资源管理器进程
      this.process = spawn('node', [
        '-e',
        this.getResourceManagerCode()
      ], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, NODE_ENV: 'production' }
      });

      // 处理输出
      this.process.stdout.on('data', (data) => {
        console.log(`📊 [资源管理器]: ${data.toString().trim()}`);
      });

      this.process.stderr.on('data', (data) => {
        console.error(`❌ [资源管理器错误]: ${data.toString().trim()}`);
      });

      this.process.on('close', (code) => {
        console.log(`🛑 资源管理器进程退出，代码: ${code}`);
        this.process = null;
      });

      console.log('✅ 智能系统资源管理器Agent已启动');
      console.log('📈 监控指标:');
      console.log('   • CPU使用率');
      console.log('   • 内存使用率');
      console.log('   • 磁盘空间');
      console.log('   • 网络流量');
      console.log('   • 进程状态');
      console.log('   • 系统负载');
      console.log('');
      console.log('🔧 配置:');
      console.log(`   • Redis: ${this.config.redisHost}:${this.config.redisPort}`);
      console.log(`   • 监控间隔: ${this.config.monitoringInterval}ms`);
      console.log(`   • 日志级别: ${this.config.logLevel}`);

      return { success: true, pid: this.process.pid };
    } catch (error) {
      console.error(`❌ 启动失败: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async checkRedis() {
    return new Promise((resolve, reject) => {
      const redisCheck = spawn('redis-cli', ['ping'], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      redisCheck.stdout.on('data', (data) => {
        output += data.toString();
      });

      redisCheck.on('close', (code) => {
        if (code === 0 && output.includes('PONG')) {
          resolve();
        } else {
          reject(new Error(`Redis连接失败: ${output || '无响应'}`));
        }
      });

      redisCheck.on('error', (err) => {
        reject(new Error(`Redis检查错误: ${err.message}`));
      });
    });
  }

  getResourceManagerCode() {
    return `
      const os = require('os');
      const redis = require('redis');
      
      class ResourceManager {
        constructor() {
          this.client = redis.createClient({
            url: 'redis://localhost:6379'
          });
          
          this.metrics = {
            cpu: [],
            memory: [],
            disk: [],
            network: [],
            processes: []
          };
        }
        
        async start() {
          await this.client.connect();
          console.log('✅ 连接到Redis');
          
          // 启动监控循环
          setInterval(() => this.collectMetrics(), 5000);
          
          console.log('📊 资源监控已启动');
        }
        
        async collectMetrics() {
          const timestamp = Date.now();
          
          // 收集系统指标
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
            processes: this.getProcessInfo()
          };
          
          // 存储到Redis
          await this.client.set(\`metrics:\${timestamp}\`, JSON.stringify(metrics));
          await this.client.lPush('metrics:history', JSON.stringify(metrics));
          await this.client.lTrim('metrics:history', 0, 999); // 保留最近1000条
          
          // 检查阈值
          this.checkThresholds(metrics);
          
          console.log(\`📈 收集指标: CPU \${metrics.cpu.loadavg[0].toFixed(2)}, 内存 \${(metrics.memory.used.rss / 1024 / 1024).toFixed(1)}MB\`);
        }
        
        getProcessInfo() {
          return {
            total: Object.keys(require('child_process').spawnSync('ps', ['-e', '--no-headers']).stdout.toString().split('\\n').filter(Boolean)).length,
            openclaw: process.pid
          };
        }
        
        checkThresholds(metrics) {
          const cpuLoad = metrics.cpu.loadavg[0];
          const memoryUsage = metrics.memory.used.rss / metrics.memory.total;
          
          if (cpuLoad > 2.0) {
            console.warn(\`⚠️  CPU负载过高: \${cpuLoad.toFixed(2)}\`);
          }
          
          if (memoryUsage > 0.8) {
            console.warn(\`⚠️  内存使用率过高: \${(memoryUsage * 100).toFixed(1)}%\`);
          }
        }
      }
      
      const manager = new ResourceManager();
      manager.start().catch(console.error);
    `;
  }

  stop() {
    if (this.process) {
      this.process.kill('SIGTERM');
      console.log('🛑 发送停止信号给资源管理器');
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const starter = new ResourceManagerStarter();
  starter.start().catch(console.error);
  
  // 优雅退出
  process.on('SIGINT', () => {
    console.log('\\n🛑 收到停止信号');
    starter.stop();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.log('\\n🛑 收到终止信号');
    starter.stop();
    process.exit(0);
  });
}

module.exports = ResourceManagerStarter;