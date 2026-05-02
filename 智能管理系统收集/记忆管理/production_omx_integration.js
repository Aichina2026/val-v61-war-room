
/**
 * 生产级OmX集成系统
 * 高性能计算引擎 + 分布式任务调度
 */

const cluster = require('cluster');
const os = require('os');

class ProductionOmXIntegration {
  constructor() {
    this.workers = new Map();
    this.tasks = new Map();
    this.performance = new PerformanceMonitor();
    this.faultTolerance = new FaultTolerance();
  }

  async start() {
    console.log('🚀 生产级OmX集成启动...');
    
    if (cluster.isMaster) {
      await this.startMaster();
    } else {
      await this.startWorker();
    }
    
    return { success: true, role: cluster.isMaster ? 'master' : 'worker' };
  }

  async startMaster() {
    console.log(`主进程启动，CPU核心数: ${os.cpus().length}`);
    
    // 创建Worker进程
    const cpuCount = os.cpus().length;
    for (let i = 0; i < cpuCount; i++) {
      const worker = cluster.fork();
      this.workers.set(worker.id, {
        id: worker.id,
        process: worker,
        status: 'starting',
        tasks: 0,
        lastHeartbeat: Date.now()
      });
      
      this.setupWorkerHandlers(worker);
    }
    
    // 启动任务调度器
    this.startTaskScheduler();
    
    // 启动心跳检测
    this.startHeartbeat();
    
    console.log(`✅ 主进程就绪，管理 ${this.workers.size} 个Worker`);
  }

  async startWorker() {
    console.log(`Worker ${process.pid} 启动`);
    
    // 注册Worker能力
    process.send({
      type: 'register',
      pid: process.pid,
      capabilities: ['compute', 'io', 'network']
    });
    
    // 监听任务
    process.on('message', async (message) => {
      if (message.type === 'task') {
        await this.processTask(message.task);
      }
    });
    
    // 定期发送心跳
    setInterval(() => {
      process.send({
        type: 'heartbeat',
        pid: process.pid,
        load: process.memoryUsage().heapUsed
      });
    }, 5000);
  }

  setupWorkerHandlers(worker) {
    worker.on('message', (message) => {
      this.handleWorkerMessage(worker, message);
    });
    
    worker.on('exit', (code, signal) => {
      console.log(`Worker ${worker.id} 退出，代码: ${code}, 信号: ${signal}`);
      this.workers.delete(worker.id);
      
      // 自动重启
      setTimeout(() => {
        const newWorker = cluster.fork();
        this.workers.set(newWorker.id, {
          id: newWorker.id,
          process: newWorker,
          status: 'restarted',
          tasks: 0
        });
        this.setupWorkerHandlers(newWorker);
      }, 1000);
    });
  }

  handleWorkerMessage(worker, message) {
    const workerInfo = this.workers.get(worker.id);
    
    switch (message.type) {
      case 'register':
        workerInfo.status = 'active';
        workerInfo.capabilities = message.capabilities;
        break;
        
      case 'heartbeat':
        workerInfo.lastHeartbeat = Date.now();
        workerInfo.load = message.load;
        break;
        
      case 'task_complete':
        this.handleTaskCompletion(message.taskId, message.result);
        break;
        
      case 'task_error':
        this.handleTaskError(message.taskId, message.error);
        break;
    }
  }

  startTaskScheduler() {
    this.schedulerInterval = setInterval(() => {
      this.distributeTasks();
    }, 100);
  }

  distributeTasks() {
    // 智能任务分配算法
    const availableWorkers = Array.from(this.workers.values())
      .filter(w => w.status === 'active' && w.tasks < 10);
    
    if (availableWorkers.length === 0) return;
    
    // 获取待处理任务
    const pendingTasks = Array.from(this.tasks.values())
      .filter(t => t.status === 'pending')
      .slice(0, availableWorkers.length);
    
    pendingTasks.forEach((task, index) => {
      const worker = availableWorkers[index % availableWorkers.length];
      
      this.assignTaskToWorker(task, worker);
    });
  }

  assignTaskToWorker(task, worker) {
    task.status = 'assigned';
    task.workerId = worker.id;
    task.assignedAt = Date.now();
    
    worker.tasks++;
    
    worker.process.send({
      type: 'task',
      task: {
        id: task.id,
        type: task.type,
        data: task.data
      }
    });
    
    console.log(`分配任务 ${task.id} 到 Worker ${worker.id}`);
  }

  handleTaskCompletion(taskId, result) {
    const task = this.tasks.get(taskId);
    if (!task) return;
    
    task.status = 'completed';
    task.result = result;
    task.completedAt = Date.now();
    
    const worker = this.workers.get(task.workerId);
    if (worker) worker.tasks--;
    
    console.log(`任务 ${taskId} 完成，耗时: ${task.completedAt - task.assignedAt}ms`);
    
    // 触发完成事件
    this.emit('task_completed', { taskId, result });
  }

  handleTaskError(taskId, error) {
    const task = this.tasks.get(taskId);
    if (!task) return;
    
    task.status = 'failed';
    task.error = error;
    task.retryCount = (task.retryCount || 0) + 1;
    
    const worker = this.workers.get(task.workerId);
    if (worker) worker.tasks--;
    
    console.log(`任务 ${taskId} 失败: ${error}`);
    
    // 重试逻辑
    if (task.retryCount < 3) {
      setTimeout(() => {
        task.status = 'pending';
        this.tasks.set(taskId, task);
      }, 1000 * task.retryCount);
    }
  }

  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.checkWorkerHealth();
    }, 10000);
  }

  checkWorkerHealth() {
    const now = Date.now();
    
    for (const [id, worker] of this.workers.entries()) {
      if (now - worker.lastHeartbeat > 30000) { // 30秒无心跳
        console.log(`Worker ${id} 心跳超时，标记为不健康`);
        worker.status = 'unhealthy';
        
        // 转移任务
        this.redistributeWorkerTasks(id);
      }
    }
  }

  redistributeWorkerTasks(workerId) {
    const tasksToRedistribute = Array.from(this.tasks.values())
      .filter(t => t.workerId === workerId && t.status === 'assigned');
    
    tasksToRedistribute.forEach(task => {
      task.status = 'pending';
      task.workerId = null;
    });
    
    console.log(`重新分配 Worker ${workerId} 的 ${tasksToRedistribute.length} 个任务`);
  }

  submitTask(taskData) {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const task = {
      id: taskId,
      type: taskData.type || 'compute',
      data: taskData,
      status: 'pending',
      createdAt: Date.now()
    };
    
    this.tasks.set(taskId, task);
    
    console.log(`提交新任务: ${taskId} (${task.type})`);
    
    return taskId;
  }

  getTaskStatus(taskId) {
    const task = this.tasks.get(taskId);
    return task ? {
      id: task.id,
      status: task.status,
      createdAt: task.createdAt,
      assignedAt: task.assignedAt,
      completedAt: task.completedAt,
      retryCount: task.retryCount
    } : null;
  }

  getSystemStatus() {
    const workers = Array.from(this.workers.values());
    
    return {
      workers: {
        total: workers.length,
        active: workers.filter(w => w.status === 'active').length,
        unhealthy: workers.filter(w => w.status === 'unhealthy').length
      },
      tasks: {
        total: this.tasks.size,
        pending: Array.from(this.tasks.values()).filter(t => t.status === 'pending').length,
        assigned: Array.from(this.tasks.values()).filter(t => t.status === 'assigned').length,
        completed: Array.from(this.tasks.values()).filter(t => t.status === 'completed').length
      },
      performance: this.performance.getMetrics()
    };
  }

  stop() {
    if (this.schedulerInterval) clearInterval(this.schedulerInterval);
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    
    console.log('OmX集成系统停止');
  }
}

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
  }

  record(operation, duration, success = true) {
    const key = `${operation}_${success ? 'success' : 'failure'}`;
    
    if (!this.metrics.has(key)) {
      this.metrics.set(key, {
        count: 0,
        totalDuration: 0,
        min: Infinity,
        max: 0
      });
    }
    
    const metric = this.metrics.get(key);
    metric.count++;
    metric.totalDuration += duration;
    metric.min = Math.min(metric.min, duration);
    metric.max = Math.max(metric.max, duration);
  }

  getMetrics() {
    const result = {};
    
    for (const [key, metric] of this.metrics.entries()) {
      result[key] = {
        count: metric.count,
        avgDuration: metric.count > 0 ? metric.totalDuration / metric.count : 0,
        min: metric.min === Infinity ? 0 : metric.min,
        max: metric.max
      };
    }
    
    return result;
  }
}

class FaultTolerance {
  constructor() {
    this.errors = new Map();
    this.recoveryStrategies = new Map();
  }

  recordError(context, error) {
    const key = `${context}_${error.code || 'unknown'}`;
    
    if (!this.errors.has(key)) {
      this.errors.set(key, {
        count: 0,
        firstOccurred: Date.now(),
        lastOccurred: Date.now(),
        errors: []
      });
    }
    
    const errorRecord = this.errors.get(key);
    errorRecord.count++;
    errorRecord.lastOccurred = Date.now();
    errorRecord.errors.push({
      message: error.message,
      timestamp: Date.now(),
      stack: error.stack
    });
    
    // 保留最近10个错误
    if (errorRecord.errors.length > 10) {
      errorRecord.errors = errorRecord.errors.slice(-10);
    }
    
    // 触发恢复策略
    this.triggerRecovery(context, error);
  }

  triggerRecovery(context, error) {
    const strategy = this.recoveryStrategies.get(context);
    
    if (strategy) {
      console.log(`触发恢复策略: ${context}`);
      
      try {
        strategy.recover(error);
      } catch (recoveryError) {
        console.error(`恢复策略执行失败: ${recoveryError.message}`);
      }
    }
  }

  addRecoveryStrategy(context, recoverFunction) {
    this.recoveryStrategies.set(context, {
      recover: recoverFunction,
      addedAt: Date.now()
    });
  }

  getErrorStats() {
    const stats = {};
    
    for (const [key, record] of this.errors.entries()) {
      stats[key] = {
        count: record.count,
        firstOccurred: new Date(record.firstOccurred).toISOString(),
        lastOccurred: new Date(record.lastOccurred).toISOString(),
        recentErrors: record.errors.length
      };
    }
    
    return stats;
  }
}

module.exports = ProductionOmXIntegration;
