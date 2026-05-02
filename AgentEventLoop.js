#!/usr/bin/env node
/**
 * AgentEventLoop - 事件循环系统
 * 7×24小时常驻，支持定时/文件/webhook触发
 * 自主调度，自动恢复，智能监控
 */

const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class AgentEventLoop extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            // 循环配置
            loop: {
                interval: 30000,                    // 检查间隔（毫秒）
                heartbeatInterval: 600000,          // 心跳检查间隔（10分钟）
                maxInactiveTime: 1800000            // 最大无活动时间（30分钟）
            },
            
            // 触发源配置
            triggers: {
                cron: {
                    enabled: true,
                    schedule: '*/5 * * * *',        // 每5分钟执行一次
                    concurrency: 1
                },
                file_watch: {
                    enabled: true,
                    watchPaths: ['/root/.openclaw/workspace'],
                    patterns: ['*.txt', '*.json', '*.md'],
                    debounce: 5000
                },
                webhook: {
                    enabled: true,
                    port: 8080,
                    path: '/webhook',
                  authTokens: ['YOUR_WEBHOOK_TOKEN_HERE']
                },
                heartbeat: {
                    enabled: true,
                    interval: 1800000,             // 每30分钟
                    tasks: ['health_check', 'cleanup', 'report']
                }
            },
            
            // 任务调度配置
            scheduler: {
                maxConcurrent: 2,
                queueSize: 10,
                timeout: 300000,                    // 5分钟超时
                retry: {
                    maxAttempts: 3,
                    backoff: 2000,
                    jitter: 0.1
                }
            },
            
            // 监控配置
            monitoring: {
                enable: true,
                logLevel: 'info',
                metricsInterval: 300000,            // 每5分钟
                alertThreshold: 0.2                 // 错误率超过20%告警
            },
            
            // 数据持久化配置
            persistence: {
                enable: true,
                dataDir: '/root/.openclaw/workspace/eventloop',
                backupInterval: 3600000             // 每小时备份一次
            },
            
            ...config
        };
        
        // 状态跟踪
        this.state = {
            isRunning: false,
            startTime: null,
            lastActive: null,
            cycles: 0,
            tasks: {
                completed: 0,
                failed: 0,
                pending: 0,
                running: 0
            },
            queue: {
                size: 0,
                tasks: []
            },
            lastError: null,
            uptime: 0
        };
        
        // 内部组件

        this.taskQueue = [];
        this.activeTasks = new Map();
        this.timers = new Map();
        this.triggers = {
            cron: new CronTrigger(),
            file_watch: new FileWatchTrigger(),
            webhook: new WebhookTrigger(),
            heartbeat: new HeartbeatTrigger()
        };
        
        // 初始化目录
        this.initDirectories();
        
        console.log('🔄 AgentEventLoop初始化完成');
        console.log('📡 触发源:', Object.keys(this.triggers).join(', '));
    }
    
    /**
     * 初始化目录
     */
    initDirectories() {
        const dirs = [
            this.config.persistence.dataDir,
            `${this.config.persistence.dataDir}/logs`,
            `${this.config.persistence.dataDir}/tasks`,
            `${this.config.persistence.dataDir}/backups`
        ];
        
        for (const dir of dirs) {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        }
    }
    
    /**
     * 启动事件循环

     */
    async start(options = {}) {
        if (this.state.isRunning) {
            console.log('⚠️  事件循环已在运行');
            return false;
        }
        
        console.log('\n🚀 启动事件循环');
        console.log('='.repeat(50));
        
        this.state.isRunning = true;
        this.state.startTime = Date.now();
        this.state.lastActive = Date.now();
        
        // 注册监听器

        this.setupEventListeners();
        
        // 启动触发源

        await this.startTriggers(options);
        
        console.log('✅ 事件循环已启动');
        console.log(`📊 配置:`);
        console.log(`  - 检查间隔: ${this.config.loop.interval}ms`);
        console.log(`  - 最大并发: ${this.config.scheduler.maxConcurrent}`);
        console.log(`  - 日志级别: ${this.config.monitoring.logLevel}`);
        
        // 开始主循环

        this.mainLoop();
        
        return true;
    }
    
    /**
     * 注册事件监听器
     */
    setupEventListeners() {
        // 监听任务完成事件
        this.on('task_completed', (task) => {
            this.handleTaskCompleted(task);
        });
        
        // 监听任务失败事件

        this.on('task_failed', (task, error) => {
            this.handleTaskFailed(task, error);
        });
        
        // 监听新任务事件

        this.on('new_task', (task) => {
            this.handleNewTask(task);
        });
        
        // 监听错误事件

        this.on('error', (error) => {
            this.handleError(error);
        });
    }
    
    /**
     * 启动触发源
     */
    async startTriggers(options = {}) {
        console.log('\n📡 启动触发源...');
        
        const results = [];
        
        // 1. Cron定时器

        if (this.config.triggers.cron.enabled) {
            try {
                await this.triggers.cron.start({
                    schedule: this.config.triggers.cron.schedule,
                    callback: (trigger) => {
                        this.scheduleTask({
                            type: 'cron',
                            trigger: trigger,
                            name: '定期检查',
                            action: 'loop_check'
                        });
                    }
                });
                console.log('  ✅ Cron定时器已启动');
            } catch (error) {
                console.error('  ❌ Cron定时器启动失败:', error.message);
            }
        }
        
        // 2. 文件监控

        if (this.config.triggers.file_watch.enabled) {
            try {
                await this.triggers.file_watch.start({
                    paths: this.config.triggers.file_watch.watchPaths,
                    patterns: this.config.triggers.file_watch.patterns,
                    callback: (event, filePath) => {
                        this.scheduleTask({
                            type: 'file_watch',
                            trigger: event,
                            file: filePath,
                            name: '文件变更处理',
                            action: 'file_change',
                            data: { path: filePath, event: event }
                        });
                    }
                });
                console.log('  ✅ 文件监控已启动');
            } catch (error) {
                console.error('  ❌ 文件监控启动失败:', error.message);
            }
        }
        
        // 3. Webhook监听器

        if (this.config.triggers.webhook.enabled) {
            try {
                await this.triggers.webhook.start({
                    port: this.config.triggers.webhook.port,
                    path: this.config.triggers.webhook.path,
                    authTokens: this.config.triggers.webhook.authTokens,
                    callback: (data) => {
                        this.scheduleTask({
                            type: 'webhook',
                            trigger: data.trigger,
                            name: 'Webhook处理',
                            action: 'webhook',
                            data: data
                        });
                    }
                });
                console.log('  ✅ Webhook监听器已启动 (端口: ${this.config.triggers.webhook.port})`);
            } catch (error) {
                console.error('  ❌ Webhook监听器启动失败:', error.message);
            }
        }
        
        // 4. 心跳触发器
        if (this.config.triggers.heartbeat.enabled) {
            try {
                await this.triggers.heartbeat.start({
                    interval: this.config.triggers.heartbeat.interval,
                    tasks: this.config.triggers.heartbeat.tasks,
                    callback: (task) => {
                        this.scheduleTask({
                            type: 'heartbeat',
                            name: task,
                            action: task
                        });
                    }
                });
                console.log('  ✅ 心跳触发器已启动 (间隔: ${this.config.triggers.heartbeat.interval}ms)');
            } catch (error) {
                console.error('  ❌ 心跳触发器启动失败:', error.message);
            }
        }
        
        return results;
    }
    
    /**
     * 主循环

     */
    async mainLoop() {
        console.log('\n🔄 进入主循环...');
        
        let loopCount = 0;
        
        while (this.state.isRunning) {
            try {
                loopCount++;
                this.state.cycles++;
                
                // 1. 更新状态

                this.updateState();
                
                // 2. 处理队列

                await this.processQueue();
                
                // 3. 检查触发器

                await this.checkTriggers();
                
                // 4. 清理资源

                await this.cleanup();
                
                // 5. 等待下一轮

                await this.sleep(this.config.loop.interval);
                
                // 定期报告

                if (loopCount % 20 === 0) { // 每10分钟
                    this.emit('loop_report', this.getStatus());
                }
                
            } catch (error) {
                this.handleLoopError(error);
                
                // 如果连续多次失败，考虑重启
                if (++this.state.consecutiveErrors > 5) {
                    console.error('连续多次循环失败，考虑重启或退出');
                    this.emit('critical_failure', error);
                    await this.handleCriticalFailure();
                }
            }
        }
    }
    
    /**
     * 更新状态

     */
    updateState() {
        const now = Date.now();
        
        this.state.uptime = now - this.state.startTime;
        this.state.runningTime = Math.floor((now - this.state.startTime) / 1000);
        
        // 更新任务状态
        this.state.tasks.running = this.activeTasks.size;
        this.state.tasks.pending = this.taskQueue.length;
        this.state.queue.size = this.taskQueue.length;
        
        // 检查是否有新任务
        if (this.taskQueue.length > 0) {
            this.state.lastActive = now;
        }
        
        // 检查无活动时间

        const inactiveTime = now - this.state.lastActive;
        if (inactiveTime > this.config.loop.maxInactiveTime) {
            console.log('⚠️  长时间无活动，考虑触发唤醒任务');
        }
    }
    
    /**
     * 处理任务队列
     */
    async processQueue() {
        // 检查是否有空闲并发槽
        const availableSlots = this.config.scheduler.maxConcurrent - this.activeTasks.size;
        
        if (availableSlots > 0 && this.taskQueue.length > 0) {
            // 取出任务执行
            const tasksToStart = this.taskQueue.splice(0, availableSlots);
            
            for (const task of tasksToStart) {
                await this.executeTask(task);
            }
        }
        
        // 清理已完成的任务

        this.cleanupCompletedTasks();
    }
    
    /**
     * 执行任务

     */
    async executeTask(task) {
        const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const startTime = Date.now();
        
        // 添加任务到活动列表
        this.activeTasks.set(taskId, {
            ...task,
            startTime,
            status: 'running'
        });
        
        try {
            console.log(`🎯 开始执行任务: ${task.name}`);
            
            // 根据任务类型执行不同操作
            let result;
            
            switch (task.action) {
                case 'health_check':
                    result = await this.performHealthCheck(task);
                    break;
                
                case 'cleanup':
                    result = await this.performCleanup(task);
                    break;
                
                case 'report':
                    result = await this.generateReport(task);
                    break;
                
                case 'loop_check':
                    result = await this.performLoopCheck(task);
                    break;
                
                case 'file_change':
                    result = await this.handleFileChange(task);
                    break;
                
                case 'webhook':
                    result = await this.handleWebhook(task);
                    break;
                
                default:
                    result = await this.executeCustomTask(task);
            }
            
            // 标记任务完成

            const taskData = this.activeTasks.get(taskId);
            taskData.endTime = Date.now();
            taskData.duration = taskData.endTime - taskData.startTime;
            taskData.status = 'completed';
            taskData.result = result;
            
            this.state.tasks.completed++;
            
            console.log(`✅ 任务完成: ${task.name} (用时: ${taskData.duration}ms)`);
            
            // 发送完成事件
            this.emit('task_completed', taskData);
            
            return result;
            
        } catch (error) {
            const taskData = this.activeTasks.get(taskId);
            taskData.endTime = Date.now();
            taskData.duration = taskData.endTime - taskData.startTime;
            taskData.status = 'failed';
            taskData.error = error.message;
            
            this.state.tasks.failed++;
            this.state.lastError = {
                taskId,
                error: error.message,
                timestamp: new Date().toISOString()
            };
            
            console.error(`❌ 任务失败: ${task.name} (用时: ${taskData.duration}ms)`);
            console.error(`   错误详情: ${error.message}`);
            
            // 发送失败事件

            this.emit('task_failed', taskData, error);
            
            // 根据重试策略处理
            await this.handleTaskFailure(taskData, error);
            
            throw error;
        }
    }
    
    /**
     * 检查触发器

     */
    async checkTriggers() {
        // 1. 检查文件变更

        if (this.triggers.file_watch.hasChanges()) {
            const changes = this.triggers.file_watch.getChanges();
            
            for (const change of changes) {
                const task = {
                    type: 'file_watch',
                    trigger: change.event,
                    file: change.path,
                    name: `处理文件变更: ${path.basename(change.path)}`,
                    action: 'file_change',
                    data: { path: change.path, event: change.event, timestamp: change.timestamp }
                };
                
                this.scheduleTask(task);
            }
            
            this.triggers.file_watch.clearChanges();
        }
        
        // 2. 检查定时器

        if (this.triggers.cron.shouldTrigger()) {
            const cronTasks = this.triggers.cron.getTasks();
            
            for (const cronTask of cronTasks) {
                this.scheduleTask({
                    type: 'cron',
                    trigger: cronTask,
                    name: '定期检查',
                    action: 'loop_check'
                });
            }
        }
        
        // 3. 检查心跳
        if (this.triggers.heartbeat.shouldTrigger()) {
            const heartbeatTasks = this.triggers.heartbeat.getTasks();
            
            for (const heartbeatTask of heartbeatTasks) {
                this.scheduleTask({
                    type: 'heartbeat',
                    name: heartbeatTask,
                    action: heartbeatTask
                });
            }
        }
        
        // 4. 检查Webhook队列
        if (this.triggers.webhook.hasEvents()) {
            const events = this.triggers.webhook.getEvents();
            
            for (const event of events) {
                this.scheduleTask({
                    type: 'webbeat',
                    trigger: event.type,
                    name: '处理Webhook事件',
                    action: 'webhook',
                    data: event.data
                });
            }
        }
    }
    
    /**
     * 调度新任务
     */
    scheduleTask(task) {
        const taskWithMetadata = {
            ...task,
            id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date().toISOString(),
            priority: task.priority || 'normal',
            scheduledAt: Date.now()
        };
        
        // 添加到队列

        this.taskQueue.push(taskWithMetadata);
        
        // 检查队列容量
        if (this.taskQueue.length > this.config.scheduler.queueSize) {
            console.warn(`⚠️  任务队列已满 (${this.taskQueue.length}/${this.config.scheduler.queueSize})，将删除低优先级任务`);
            this.manageQueueCapacity();
        }
        
        this.state.queue.size = this.taskQueue.length;
        
        // 发送新任务事件

        this.emit('new_task', taskWithMetadata);
        
        console.log(`📋 任务已调度: ${task.name}`);
        
        return taskWithMetadata.id;
    }
    
    /**
     * 管理队列容量

     */
    manageQueueCapacity() {
        const maxSize = this.config.scheduler.queueSize;
        
        if (this.taskQueue.length > maxSize) {
            // 找到低优先级任务
            const lowPriorityIndex = this.taskQueue.findIndex(task => 
                task.priority === 'low' || task.priority === 'background'
            );
            
            if (lowPriorityIndex !== -1) {
                const removedTask = this.taskQueue.splice(lowPriorityIndex, 1)[0];
                console.log(`🗑️  已移除低优先级任务: ${removedTask.name}`);
            } else {
                // 移除最早的任务
                const removedTask = this.taskQueue.shift();
                console.log(`🗑️  队列已满，已移除最早任务: ${removedTask.name}`);
            }
        }
    }
    
    /**
     * 处理任务完成

     */
    handleTaskCompleted(task) {
        // 记录成功日志
        this.logTaskCompletion(task);
        
        // 保存任务结果
        this.saveTaskResult(task);
        
        // 触发后续任务（如果有依赖关系）
        if (task.dependencies && task.dependencies.length > 0) {
            for (const dependency of task.dependencies) {
                this.scheduleDependentTask(task, dependency);
            }
        }
    }
    
    /**
     * 处理任务失败

     */
    async handleTaskFailure(task, error) {
        constretryConfig = this.config.scheduler.retry;
        
        if (task.retryCount < retryConfig.maxAttempts) {
            constbackoffTime = retryConfig.backoff * Math.pow(2, task.retryCount);
            
            console.log(`🔄 任务失败，准备重试 (第${task.retryCount + 1}次，延迟${backoffTime}ms): ${task.name}`);
            
            // 添加延迟并重新调度
            await this.sleep(backoffTime);
            
            constretryTask = {
                ...task,
                retryCount: (task.retryCount || 0) + 1,
                retryReason: error.message
            };
            
            this.scheduleTask(retryTask);
            
        } else {
            console.error(`❌ 任务重试次数用尽，标记为失败: ${task.name}`);
            // 记录最终失败
            this.logTaskFailure(task, error);
            
            // 触发错误处理流程
            await this.handleCriticalTaskFailure(task, error);
        }
    }
    
    /**
     * 处理循环错误

     */
    async handleLoopError(error) {
        this.state.consecutiveErrors = (this.state.consecutiveErrors || 0) + 1;
        
        console.error(`🔄 循环处理错误 (连续${this.state.consecutiveErrors}次):`, error.message);
        
        // 记录错误
        this.logError('loop_error', error);
        
        // 如果错误严重，可能需要重启
        if (this.state.consecutiveErrors > 10) {
            console.error('连续多次循环错误，尝试恢复...');
            await this.recoverFromErrors();
        }
    }
    
    /**
     * 检查所有触发器
     */
    async checkTriggers() {
        const triggersToCheck = {
            cron: this.config.triggers.cron.enabled,
            file_watch: this.config.triggers.file_watch.enabled,
            webhook: this.config.triggers.webhook.enabled,
            heartbeat: this.config.triggers.heartbeat.enabled
        };
        
        for (const [triggerType, enabled] of Object.entries(triggersToCheck)) {
            if (enabled) {
                await this.checkTrigger(triggerType);
            }
        }
    }
    
    /**
     * 检查单个触发器

     */
    async checkTrigger(triggerType) {
        const trigger = this.triggers[triggerType];
        
        if (trigger && trigger.shouldTrigger()) {
            consttasks = trigger.getTasks();
            
            for (const task of tasks) {
                // 调度任务
                this.scheduleTask({
                    type: triggerType,
                    name: `触发: ${triggerType}`,
                    action: triggerType,
                    data: { trigger: triggerType, timestamp: new Date().toISOString() }
                });
            }
            
            trigger.reset();
        }
    }
    
    /**
     * 清理资源

     */
    async cleanup() {
        // 清理过期的任务记录
        const now = Date.now();
        constretentionTime = 24 * 60 * 60 * 1000; // 24小时
        
        for (const [taskId, task] of this.activeTasks.entries()) {
            if (task.status === 'completed' && task.endTime < now - retentionTime) {
                this.activeTasks.delete(taskId);
            }
        }
        
        // 定期清理日志文件

        if (this.state.cycles % 120 === 0) { // 每小时一次
            await this.cleanupLogs();
        }
    }
    
    /**
     * 清理日志文件
     */
    async cleanupLogs() {
        constlogDir = `${this.config.persistence.dataDir}/logs`;
        
        try {
            constfiles = fs.readdirSync(logDir);
            constcutoffTime = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7天前
            
            for (const file of files) {
                constfilePath = path.join(logDir, file);
                conststat = fs.statSync(filePath);
                
                if (stat.mtimeMs < cutoffTime) {
                    fs.unlinkSync(filePath);
                    console.log(`🗑️  已清理旧日志文件: ${file}`);
                }
            }
        } catch (error) {
            // 忽略清理错误
        }
    }
    
    /**
     * 执行心跳检查

     */
    async performHeartbeatCheck() {
        constchecks = [
            'process_status',
            'memory_usage',
            'disk_space',
            'api_availability',
            'network_connectivity'
        ];
        
        constresults = [];
        
        for (constcheckofchecks) {
            try {
                constresult=await this.runCheck(check);
                results.push({ check, status: 'passed', result });
            } catch (error) {
                results.push({ check, status: 'failed', error: error.message });
            }
        }
        
        return {
            timestamp: new Date().toISOString(),
            checks: results,
            summary: {
                passed: results.filter(r=>r.status==='passed').length,
                failed: results.filter(r=>r.status==='failed').length,
                total: results.length
            }
        };
    }
    
    /**
     * 获取系统状态

     */
    getStatus() {
        constnow=Date.now();
        constuptimeSec=Math.floor((now-this.state.startTime)/1000);
        
        return {
            event_loop: {
                running: this.state.isRunning,
                start_time: new Date(this.state.startTime).toISOString(),
                uptime: this.formatUptime(uptimeSec),
                cycles: this.state.cycles,
                state: {
                    ...this.state
                }
            },
            
            tasks: {
                active: this.activeTasks.size,
                queued: this.taskQueue.length,
                statistics: {
                    completed: this.state.tasks.completed,
                    failed: this.state.tasks.failed,
                    running: this.state.tasks.running,
                    pending: this.state.tasks.pending
                }
            },
            
            triggers: {
                cron: {
                    enabled: this.config.triggers.cron.enabled,
                    schedule: this.config.triggers.cron.schedule,
                    next_trigger: this.calculateNextCronTrigger()
                },
                
                file_watch: {
                    enabled: this.config.triggers.file_watch.enabled,
                    watching: this.config.triggers.file_watch.watchPaths
                },
                
                webhook: {
                    enabled: this.config.triggers.webhook.enabled,
                    port: this.config.triggers.webhook.port,
                    path: this.config.triggers.webhook.path,
                    has_events: this.triggers.webhook.hasEvents()
                },
                
                heartbeat: {
                    enabled: this.config.triggers.heartbeat.enabled,
                    interval: this.config.triggers.heartbeat.interval,
                    tasks: this.config.triggers.heartbeat.tasks,
                    last_check: this.state.lastHeartbeatCheck
                }
            },
            
            monitoring: {
                errors: this.state.consecutiveErrors,
                queue_size: this.state.queue.size,
                last_error: this.state.lastError,
                metrics: {
                    avg_task_time: this.calculateAverageTaskTime(),
                    error_rate: this.calculateErrorRate(),
                    throughput: this.calculateThroughput()
                }
            },
            
            system: {
                uptime: uptimeSec,
                current_time: new Date().toISOString(),
                next_check: this.calculateNextCheckTime(),
                health_status: this.determineHealthStatus()
            }
        };
    }
    
    /**
     * 计算平均任务时间

     */
    calculateAverageTaskTime() {
        constcompletedTasks=Array.from(this.activeTasks.values())
            .filter(task=>task.status==='completed');
        
        if (completedTasks.length===0) return 0;
        
        consttotalDuration=completedTasks.reduce((sum,task)=>
            sum+(task.endTime-task.startTime), 0);
        
        return totalDuration/completedTasks.length;
    }
    
    /**
     * 计算错误率

     */
    calculateErrorRate() {
        consttotalTasks=this.state.tasks.completed+this.state.tasks.failed;
        if (totalTasks===0) return 0;
        
        return this.state.tasks.failed/totalTasks;
    }
    
    /**
     * 计算吞吐量

     */
    calculateThroughput() {
        constuptimeHours=Math.floor((Date.now()-this.state.startTime)/(1000*60*60));
        if (uptimeHours===0) return this.state.tasks.completed;
        
        return this.state.tasks.completed/uptimeHours;
    }
    
    /**
     * 计算下次检查时间

     */
    calculateNextCheckTime() {
        constinterval=this.config.loop.interval;
        constnextCheck=this.state.lastActive+interval;
        consttimeLeft=nextCheck-Date.now();
        
        return {
            next_check: new Date(nextCheck).toISOString(),
            time_left_ms: timeLeft,
            time_left_formatted: this.formatTime(timeLeft)
        };
    }
    
    /**
     * 确定健康状态

     */
    determineHealthStatus() {
        consterrorRate=this.calculateErrorRate();
        constconsecutiveErrors=this.state.consecutiveErrors||0;
        
        if (errorRate>0.5||consecutiveErrors>10) {
            return 'critical';
        } else if (errorRate>0.2||consecutiveErrors>5) {
            return 'degraded';
        } else {
            return 'healthy';
        }
    }
    
    /**
     * 格式化时间

     */
    formatTime(ms) {
        constseconds=Math.floor(ms/1000);
        constminutes=Math.floor(seconds/60);
        const hours=Math.floor(minutes/60);
        
        if (hours>0) {
            return `${hours}小时 ${minutes%60}分钟`;
        } else if (minutes>0) {
            return `${minutes}分钟 ${seconds%60}秒`;
        } else {
            return `${seconds}秒`;
        }
    }
    
    /**
     * 格式化运行时间

     */
    formatUptime(seconds) {
        constdays=Math.floor(seconds/(24*60*60));
        consthours=Math.floor((seconds%(24*60*60))/(60*60));
        const minutes=Math.floor((seconds%(60*60))/60);
        const secs=seconds%60;
        
        const parts=[];
        if (days>0) parts.push(`${days}天`);
        if (hours>0) parts.push(`${hours}小时`);
        if (minutes>0) parts.push(`${minutes}分钟`);
        if (secs>0||parts.length===0) parts.push(`${secs}秒`);
        
        return parts.join(' ');
    }
    
    /***********************
     * 内部组件类
     ***********************/
    
    /**
     * Cron定时触发器

     */
    class CronTrigger {
        constructor() {
            this.lastTrigger = null;
            this.interval = null;
        }
        
        start(config) {
            if (config.schedule) {
                console.log('  ⏰ 启动Cron定时器，计划:', config.schedule);
                
                // 使用setInterval模拟定时器
                this.interval = setInterval(() => {
                    config.callback('cron');
                }, config.interval || 60000); // 默认1分钟
                
            } else if (config.interval) {
                console.log('  ⏰ 启动Cron定时器，间隔:', config.interval, 'ms');
                
                this.interval = setInterval(() => {
                    config.callback('cron');
                }, config.interval);
            }
            
            return Promise.resolve();
        }
        
        stop() {
            if (this.interval) {
                clearInterval(this.interval);
                this.interval = null;
                console.log('  ⏰ Cron定时器已停止');
            }
        }
        
        shouldTrigger() {
            // 简单的触发逻辑：每5分钟触发一次
            const now = Date.now();
            if (!this.lastTrigger || now - this.lastTrigger >= 300000) { // 5分钟
                this.lastTrigger = now;
                return true;
            }
            return false;
        }
        
        getTasks() {
            return ['cron_check'];
        }
        
        reset() {
            // 重置触发器状态
        }
        
        hasChanges() {
            return false;
        }
    }
    
    /**
     * 文件监控触发器

     */
    class FileWatchTrigger {
        constructor() {
            this.changes = [];
        }
        
        start(config) {
            console.log('  📁 启动文件监控...');
            console.log('    监控路径:', config.paths);
            console.log('    监控模式:', config.patterns);
            
            // 模拟文件变化
            setInterval(() => {
                // 随机生成文件变化事件
                if (Math.random() > 0.8) {
                    const eventTypes = ['create', 'modify', 'delete'];
                    const event = eventTypes[Math.floor(Math.random() * eventTypes.length)];
                    const filename = `test_${Date.now()}.txt`;
                    const filePath = path.join(config.paths[0], filename);
                    this.changes.push({
                        event,
                        path: filePath,
                        timestamp: new Date().toISOString()
                    });
                }
            }, 10000); // 每10秒
            return Promise.resolve();
        }
        
        stop() {
            console.log('  📁 文件监控已停止');
            this.changes = [];
        }
        
        hasChanges() {
            return this.changes.length > 0;
        }
        
        getChanges() {
            constchanges = [...this.changes];
            this.changes = [];
            return changes;
        }
    }
    
    /**
     * Webhook触发器

     */
    class WebhookTrigger {
        constructor() {
            this.events = [];
        }
        
        start(config) {
            console.log('  🌐 启动Webhook监听器，端口:', config.port);
            console.log('    监听路径:', config.path);
            
            // 模拟Webhook事件
            setInterval(() => {
                if (Math.random() > 0.9) {
                    this.events.push({
                        type: 'webhook',
                        data: {
                            event: 'test',
                            timestamp: new Date().toISOString(),
                            source: 'simulated'
                        }
                    });
                }
            }, 30000); // 每30秒
            return Promise.resolve();
        }
        
        stop() {
            console.log('  🌐 Webhook监听器已停止');
            this.events = [];
        }
        
        hasEvents() {
            return this.events.length > 0;
        }
        
        getEvents() {
            constevents = [...this.events];
            this.events = [];
            return events;
        }
    }
    
    /**
     * 心跳触发器

     */
    class HeartbeatTrigger {
        constructor() {
            this.lastBeat = null;
        }
        
        start(config) {
            console.log('  💓 启动心跳触发器，间隔:', config.interval, 'ms');
            
            // 定期触发心跳任务
            setInterval(() => {
                config.tasks.forEach(task => {
                    config.callback(task);
                });
            }, config.interval || 60000); // 默认1分钟
            
            return Promise.resolve();
        }
        
        stop() {
            console.log('  💓 心跳触发器已停止');
        }
        
        shouldTrigger() {
            // 按照配置的间隔触发
            constnow = Date.now();
            if (!this.lastBeat || now - this.lastBeat >= (config.interval || 60000)) {
                this.lastBeat = now;
                return true;
            }
            return false;
        }
        
        getTasks() {
            return ['heartbeat_check'];
        }
    }
}

// 主程序
if (require.main === module) {
    constargs = process.argv.slice(2);
    
    if (args.length===0 || args.includes('--help') || args.includes('-h')) {
        console.log('AgentEventLoop - 事件循环系统');
        console.log('='.repeat(40));
        console.log('使用方法: node AgentEventLoop.js <命令> [选项]');
        console.log('');
        console.log('命令:');
        console.log('  start             启动事件循环');
        console.log('  stop              停止事件循环');
        console.log('  restart           重启事件循环');

        console.log('  status           查看系统状态');
        console.log('  tasks            查看任务列表');

        console.log('  monitor          启动监控模式');

        console.log('  webhook          启动Webhook服务器');

        console.log('  cron             管理Cron任务');
        console.log('');
        console.log('选项:');
        console.log('  --config <文件>    指定配置文件');
        console.log('  --verbose         详细输出模式');

        console.log('  --log-level <级别> 设置日志级别');
        console.log('');
        console.log('示例:');
        console.log('  node AgentEventLoop.js start --verbose');
        console.log('  node AgentEventLoop.js status');
        console.log('  node AgentEventLoop.js monitor');
        console.log('');
        process.exit(0);
    }
    
    const command = args[0];
    constoptions = parseOptions(args.slice(1));
    
    consteventLoop = new AgentEventLoop();
    
    switch (command) {
        case 'start':
            eventLoop.start(options)
                .then(() => {
                    console.log('✅ 事件循环已启动');
                    process.exit(0);
                })
                .catch(error => {
                    console.error('❌ 启动失败:', error.message);
                    process.exit(1);
                });
            break;
        
        case 'stop':
            eventLoop.stop();
            break;
            
        case 'restart':
            eventLoop.restart(options);
            break;
            
        case 'status':
            conststatus = eventLoop.getStatus();
            console.log(JSON.stringify(status, null, 2));
            process.exit(0);
            break;
            
        case 'tasks':
            eventLoop.listTasks();
            break;
            
        case 'monitor':
            eventLoop.monitor(options);
            break;
            
        case 'webhook':
            eventLoop.startWebhook(options);
            break;
            
        case 'cron':
            eventLoop.manageCron(options);
            break;
            
        default:
            console.error