#!/usr/bin/env node
/**
 * 4SAPI零错误技能工作流配置
 * 特性：延迟等待、自动重试、错误恢复、连续调用不中断
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

class FourSAPIWorkflow {
    constructor(config = {}) {
        // 默认配置
        this.config = {
            baseUrl: 'https://4sapi.com/v1',
            apiKey: 'sk-mNOYLbPoeo3cU41UGS1tpBa1n0gqrql3RTIO0bpmspMtmake',
            
            // 工作流配置
            defaultModel: 'gpt-5.4',
            fallbackModels: ['gemini-3.1-pro-preview', 'claude-opus-4.6'],
            
            // 延迟等待配置（毫秒）
            delays: {
                betweenRequests: 2000,       // 请求间延迟
                betweenRetries: 3000,        // 重试间延迟
                afterError: 5000,            // 错误后延迟
                rateLimitWait: 10000,        // 速率限制等待
                initialWait: 1000            // 初始等待
            },
            
            // 重试配置
            retry: {
                maxAttempts: 3,
                backoffFactor: 2,
                timeout: 30000
            },
            
            // 零错误技能配置
            zeroError: {
                enableValidation: true,
                enableSanitization: true,
                enableLogging: true,
                enableMetrics: true,
                enableCircuitBreaker: true
            },
            
            // 监控配置
            monitoring: {
                enable: true,
                logDir: '/root/.openclaw/workspace/4sapi-workflow-logs',
                metricsFile: 'workflow_metrics.json',
                errorFile: 'workflow_errors.json'
            },
            
            ...config
        };
        
        // 初始化状态
        this.state = {
            isRunning: false,
            currentTask: null,
            requestCount: 0,
            successCount: 0,
            errorCount: 0,
            lastRequestTime: null,
            circuitBreaker: {
                isOpen: false,
                failureCount: 0,
                lastFailureTime: null,
                resetAfterMs: 60000
            }
        };
        
        // 初始化监控目录
        this.initMonitoring();
        
        console.log('🚀 4SAPI零错误工作流初始化完成');
        console.log(`⚙️  配置: ${JSON.stringify({
            delays: this.config.delays,
            retryMax: this.config.retry.maxAttempts,
            zeroError: Object.keys(this.config.zeroError).filter(k => this.config.zeroError[k])
        }, null, 2)}`);
    }
    
    initMonitoring() {
        const { logDir } = this.config.monitoring;
        
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
        
        // 初始化日志文件
        const logFiles = ['workflow.log', 'errors.log', 'metrics.log'];
        logFiles.forEach(file => {
            const filePath = path.join(logDir, file);
            if (!fs.existsSync(filePath)) {
                fs.writeFileSync(filePath, `# 4SAPI工作流日志 - 开始时间: ${new Date().toISOString()}\n\n`);
            }
        });
    }
    
    /**
     * 延迟等待函数
     */
    async delay(ms, reason = '') {
        if (reason) {
            console.log(`⏳ 延迟等待 ${ms}ms: ${reason}`);
        }
        
        return new Promise(resolve => {
            setTimeout(() => {
                resolve();
            }, ms);
        });
    }
    
    /**
     * 检查熔断器状态
     */
    checkCircuitBreaker() {
        const { circuitBreaker } = this.state;
        
        if (circuitBreaker.isOpen) {
            const timeSinceFailure = Date.now() - circuitBreaker.lastFailureTime;
            
            if (timeSinceFailure > circuitBreaker.resetAfterMs) {
                // 重置熔断器
                circuitBreaker.isOpen = false;
                circuitBreaker.failureCount = 0;
                console.log('🔓 熔断器已重置');
                return true;
            }
            
            console.log(`⛔ 熔断器已打开，请等待 ${Math.ceil((circuitBreaker.resetAfterMs - timeSinceFailure) / 1000)}秒`);
            return false;
        }
        
        return true;
    }
    
    /**
     * 更新熔断器状态
     */
    updateCircuitBreaker(success) {
        const { circuitBreaker } = this.state;
        
        if (success) {
            // 成功请求，减少失败计数
            circuitBreaker.failureCount = Math.max(0, circuitBreaker.failureCount - 1);
        } else {
            // 失败请求，增加失败计数
            circuitBreaker.failureCount++;
            circuitBreaker.lastFailureTime = Date.now();
            
            // 如果连续失败超过阈值，打开熔断器
            if (circuitBreaker.failureCount >= 5) {
                circuitBreaker.isOpen = true;
                console.log('🔒 熔断器已打开（连续5次失败）');
            }
        }
    }
    
    /**
     * 零错误输入验证
     */
    validateInput(input) {
        const errors = [];
        
        // 检查输入类型
        if (typeof input !== 'string') {
            errors.push(`输入类型错误: ${typeof input}，应为字符串`);
        }
        
        // 检查输入长度
        if (!input || input.trim().length === 0) {
            errors.push('输入不能为空');
        }
        
        if (input.length > 10000) {
            errors.push(`输入过长: ${input.length} 字符，最大10000`);
        }
        
        // 检查危险字符（可选）
        const dangerousPatterns = [
            /<script>/i,
            /javascript:/i,
            /onload=/i,
            /onerror=/i
        ];
        
        dangerousPatterns.forEach(pattern => {
            if (pattern.test(input)) {
                errors.push(`检测到潜在危险字符: ${pattern}`);
            }
        });
        
        return {
            isValid: errors.length === 0,
            errors: errors,
            sanitized: input.trim().substring(0, 10000)
        };
    }
    
    /**
     * 零错误HTTP请求
     */
    async makeRequest(options, data = null, attempt = 1) {
        const { maxAttempts, backoffFactor, timeout } = this.config.retry;
        
        // 检查熔断器
        if (!this.checkCircuitBreaker()) {
            throw new Error('熔断器已打开，请求被阻止');
        }
        
        // 请求间延迟
        if (this.state.lastRequestTime) {
            const timeSinceLast = Date.now() - this.state.lastRequestTime;
            const minDelay = this.config.delays.betweenRequests;
            
            if (timeSinceLast < minDelay) {
                await this.delay(minDelay - timeSinceLast, '请求间隔延迟');
            }
        }
        
        this.state.lastRequestTime = Date.now();
        
        try {
            const result = await Promise.race([
                this._makeHttpRequest(options, data),
                new Promise((_, reject) => {
                    setTimeout(() => reject({
                        type: 'timeout',
                        error: `请求超时 (${timeout}ms)`
                    }), timeout);
                })
            ]);
            
            // 请求成功，更新状态
            this.state.requestCount++;
            this.state.successCount++;
            this.updateCircuitBreaker(true);
            
            return result;
            
        } catch (error) {
            // 请求失败
            this.state.errorCount++;
            this.updateCircuitBreaker(false);
            
            // 记录错误
            this.logError('request_failed', {
                attempt,
                error: error.type || 'unknown',
                message: error.error || error.message,
                options: { method: options.method, path: options.path }
            });
            
            // 检查是否需要重试
            const shouldRetry = (
                attempt < maxAttempts &&
                error.type !== 'validation_error' &&
                error.type !== 'circuit_breaker'
            );
            
            if (shouldRetry) {
                // 计算退避延迟
                const backoffDelay = this.config.delays.betweenRetries * Math.pow(backoffFactor, attempt - 1);
                
                console.log(`🔄 重试 ${attempt}/${maxAttempts}，等待 ${backoffDelay}ms`);
                await this.delay(backoffDelay, `重试延迟 (第${attempt}次)`);
                
                // 递归重试
                return this.makeRequest(options, data, attempt + 1);
            }
            
            // 重试次数用尽或不可重试的错误
            throw error;
        }
    }
    
    /**
     * 底层HTTP请求
     */
    _makeHttpRequest(options, data) {
        return new Promise((resolve, reject) => {
            const reqOptions = {
                hostname: '4sapi.com',
                port: 443,
                path: options.path,
                method: options.method,
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`,
                    'Content-Type': 'application/json',
                    'User-Agent': '4SAPI-Workflow/1.0',
                    ...options.headers
                },
                timeout: this.config.retry.timeout
            };
            
            const req = https.request(reqOptions, (res) => {
                let responseData = '';
                
                res.on('data', (chunk) => {
                    responseData += chunk;
                });
                
                res.on('end', () => {
                    const result = {
                        statusCode: res.statusCode,
                        headers: res.headers,
                        rawData: responseData
                    };
                    
                    // 处理不同的状态码
                    if (res.statusCode === 200) {
                        try {
                            result.data = JSON.parse(responseData);
                            resolve(result);
                        } catch (error) {
                            result.parseError = error.message;
                            resolve(result); // 解析失败但HTTP成功
                        }
                    } else if (res.statusCode === 429) {
                        // 速率限制
                        reject({
                            type: 'rate_limit',
                            error: '速率限制',
                            retryAfter: res.headers['retry-after'] || 60,
                            statusCode: res.statusCode
                        });
                    } else if (res.statusCode >= 400 && res.statusCode < 500) {
                        // 客户端错误
                        reject({
                            type: 'client_error',
                            error: `客户端错误: ${res.statusCode}`,
                            statusCode: res.statusCode,
                            data: responseData
                        });
                    } else if (res.statusCode >= 500) {
                        // 服务器错误
                        reject({
                            type: 'server_error',
                            error: `服务器错误: ${res.statusCode}`,
                            statusCode: res.statusCode,
                            data: responseData
                        });
                    } else {
                        // 其他状态码
                        resolve(result);
                    }
                });
            });
            
            req.on('error', (error) => {
                reject({
                    type: 'network_error',
                    error: error.message
                });
            });
            
            req.on('timeout', () => {
                req.destroy();
                reject({
                    type: 'timeout',
                    error: '连接超时'
                });
            });
            
            if (data) {
                req.write(JSON.stringify(data));
            }
            
            req.end();
        });
    }
    
    /**
     * 智能模型选择
     */
    async selectModel(preferredModel = null) {
        const model = preferredModel || this.config.defaultModel;
        
        // 检查模型可用性
        try {
            const options = {
                method: 'GET',
                path: '/v1/models'
            };
            
            const result = await this.makeRequest(options);
            
            if (result.statusCode === 200 && result.data && result.data.data) {
                const availableModels = result.data.data.map(m => m.id);
                
                if (availableModels.includes(model)) {
                    console.log(`🎯 选择模型: ${model} (可用)`);
                    return model;
                } else {
                    console.log(`⚠️  模型 ${model} 不可用，尝试备用模型`);
                    
                    // 尝试备用模型
                    for (const fallback of this.config.fallbackModels) {
                        if (availableModels.includes(fallback)) {
                            console.log(`🔄 切换到备用模型: ${fallback}`);
                            return fallback;
                        }
                    }
                    
                    // 所有模型都不可用，选择第一个可用模型
                    if (availableModels.length > 0) {
                        const firstAvailable = availableModels[0];
                        console.log(`🔄 使用可用模型: ${firstAvailable}`);
                        return firstAvailable;
                    }
                }
            }
        } catch (error) {
            console.log(`⚠️  模型检查失败: ${error.type || '未知错误'}`);
        }
        
        // 如果检查失败，使用默认模型
        console.log(`⚡ 使用默认模型: ${model}`);
        return model;
    }
    
    /**
     * 执行单个API调用
     */
    async executeCall(prompt, model = null, options = {}) {
        console.log(`\n📞 执行API调用`);
        console.log(`💬 提示: ${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}`);
        
        // 1. 输入验证
        const validation = this.validateInput(prompt);
        if (!validation.isValid) {
            console.log(`❌ 输入验证失败: ${validation.errors.join(', ')}`);
            throw {
                type: 'validation_error',
                error: '输入验证失败',
                details: validation.errors
            };
        }
        
        // 2. 模型选择
        const selectedModel = await this.selectModel(model);
        
        // 3. 构建请求数据
        const requestData = {
            model: selectedModel,
            messages: [
                {
                    role: 'user',
                    content: validation.sanitized
                }
            ],
            max_tokens: options.maxTokens || 500,
            temperature: options.temperature || 0.7,
            stream: false,
            ...options
        };
        
        // 4. 执行请求
        const startTime = Date.now();
        
        try {
            const result = await this.makeRequest({
                method: 'POST',
                path: '/v1/chat/completions',
                headers: options.headers || {}
            }, requestData);
            
            const responseTime = Date.now() - startTime;
            
            // 5. 处理响应
            let response = '';
            let usage = {};
            
            if (result.data && result.data.choices && result.data.choices.length > 0) {
                response = result.data.choices[0].message.content;
                usage = result.data.usage || {};
            }
            
            // 6. 记录成功
            this.logSuccess({
                model: selectedModel,
                promptLength: prompt.length,
                responseLength: response.length,
                responseTime: responseTime,
                statusCode: result.statusCode,
                usage: usage
            });
            
            console.log(`✅ 调用成功`);
            console.log(`⚡ 响应时间: ${responseTime}ms`);
            console.log(`📊 状态码: ${result.statusCode}`);
            console.log(`📝 响应: ${response.substring(0, 100)}${response.length > 100 ? '...' : ''}`);
            
            return {
                success: true,
                model: selectedModel,
                response: response,
                responseTime: responseTime,
                usage: usage,
                statusCode: result.statusCode,
                metadata: {
                    sanitizedInput: validation.sanitized,
                    attempt: 1
                }
            };
            
        } catch (error) {
            const responseTime = Date.now() - startTime;
            
            // 处理特定错误
            if (error.type === 'rate_limit') {
                const waitTime = parseInt(error.retryAfter) * 1000 || this.config.delays.rateLimitWait;
                console.log(`⏳ 速率限制，等待 ${waitTime}ms`);
                await this.delay(waitTime, '速率限制等待');
                
                // 自动重试
                return this.executeCall(prompt, model, options);
            }
            
            // 记录错误
            this.logError('api_call_failed', {
                model: selectedModel,
                errorType: error.type,
                errorMessage: error.error || error.message,
                responseTime: responseTime,
                promptLength: prompt.length
            });
            
            console.log(`❌ 调用失败: ${error.type || '未知错误'}`);
            console.log(`📝 错误详情: ${error.error || error.message}`);
            
            throw error;
        }
    }
    
    /**
     * 执行工作流（多个连续调用）
     */
    async executeWorkflow(tasks, options = {}) {
        console.log('\n🚀 开始执行4SAPI工作流');
        console.log('='.repeat(60));
        console.log(`📋 任务数量: ${tasks.length}`);
        
        this.state.isRunning = true;
        this.state.currentTask = 'workflow_execution';
        
        const results = [];
        const startTime = Date.now();
        
        try {
            // 初始延迟
            await this.delay(this.config.delays.initialWait, '工作流初始延迟');
            
            for (let i = 0; i < tasks.length; i++) {
                const task = tasks[i];
                console.log(`\n📝 任务 ${i + 1}/${tasks.length}: ${task.prompt.substring(0, 50)}${task.prompt.length > 50 ? '...' : ''}`);
                
                try {
                    const result = await this.executeCall(
                        task.prompt,
                        task.model,
                        task.options
                    );
                    
                    results.push({
                        taskIndex: i,
                        success: true,
                        result: result,
                        timestamp: new Date().toISOString()
                    });
                    
                    // 任务间延迟（最后一个任务后不需要延迟）
                    if (i < tasks.length - 1) {
                        await this.delay(this.config.delays.betweenRequests, '任务间延迟');
                    }
                    
                } catch (error) {
                    console.log(`⚠️  任务 ${i + 1} 失败: ${error.type || '未知错误'}`);
                    
                    results.push({
                        taskIndex: i,
                        success: false,
                        error: {
                            type: error.type,
                            message: error.error || error.message
                        },
                        timestamp: new Date().toISOString()
                    });
                    
                    // 错误后延迟
                    await this.delay(this.config.delays.afterError, '错误后延迟');
                    
                    // 如果配置了继续执行，则继续下一个任务
                    if (!options.continueOnError) {
                        console.log('⏹️  配置为错误时停止，终止工作流');
                        break;
                    }
                }
            }
            
            const totalTime = Date.now() - startTime;
            
            // 生成工作流报告
            const report = this.generateWorkflowReport(results, totalTime);
            
            console.log('\n🎉 工作流执行完成');
            console.log('='.repeat(60));
            console.log(`📊 总结:`);
            console.log(`   总任务: ${tasks.length}`);
            console.log(`   成功: ${report.summary.successfulTasks}`);
            console.log(`   失败: ${report.summary.failedTasks}`);
            console.log(`   总时间: ${totalTime}ms`);
            console.log(`   平均时间: ${Math.round(totalTime / tasks.length)}ms/任务`);
            
            // 保存报告
            this.saveWorkflowReport(report);
            
            return {
                success: true,
                results: results,
                report: report,
                metadata: {
                    totalTime: totalTime,
                    taskCount: tasks.length
                }
            };
            
        } catch (error) {
            console.error(`❌ 工作流执行失败: ${error.message}`);
            
            return {
                success: false,
                error: error.message,
                results: results,
                metadata: {
                    completedTasks: results.length
                }
            };
            
        } finally {
            this.state.isRunning = false;
            this.state.currentTask = null;
        }
    }
    
    /**
     * 生成工作流报告
     */
    generateWorkflowReport(results, totalTime) {
        const successfulTasks = results.filter(r => r.success);
        const failedTasks = results.filter(r => !r.success);
        
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalTasks: results.length,
                successfulTasks: successfulTasks.length,
                failedTasks: failedTasks.length,
                successRate: results.length > 0 ? (successfulTasks.length / results.length) * 100 : 0,
                totalTime: totalTime,
                avgTimePerTask: results.length > 0 ? totalTime / results.length : 0
            },
            details: {
                successful: successfulTasks.map(task => ({
                    taskIndex: task.taskIndex,
                    model: task.result?.model,
                    responseTime: task.result?.responseTime,
                    responseLength: task.result?.response?.length
                })),
                failed: failedTasks.map(task => ({
                    taskIndex: task.taskIndex,
                    errorType: task.error?.type,
                    errorMessage: task.error?.message
                }))
            },
            metrics: {
                requestCount: this.state.requestCount,
                successCount: this.state.successCount,
                errorCount: this.state.errorCount,
                successRate: this.state.requestCount > 0 ? (this.state.successCount / this.state.requestCount) * 100 : 0,
                circuitBreaker: { ...this.state.circuitBreaker }
            }
        };
        
        return report;
    }
    
    /**
     * 保存工作流报告
     */
    saveWorkflowReport(report) {
        const { logDir } = this.config.monitoring;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const reportFile = path.join(logDir, `workflow_report_${timestamp}.json`);
        
        fs.writeFileSync(reportFile, JSON.stringify(report, null, 2), 'utf8');
        console.log(`📄 工作流报告已保存: ${reportFile}`);
    }
    
    /**
     * 记录成功
     */
    logSuccess(data) {
        if (!this.config.zeroError.enableLogging) return;
        
        const { logDir } = this.config.monitoring;
        const logFile = path.join(logDir, 'workflow.log');
        
        const logEntry = {
            timestamp: new Date().toISOString(),
            type: 'success',
            data: data
        };
        
        fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n', 'utf8');
    }
    
    /**
     * 记录错误
     */
    logError(type, data) {
        if (!this.config.zeroError.enableLogging) return;
        
        const { logDir } = this.config.monitoring;
        const errorFile = path.join(logDir, 'errors.log');
        
        const logEntry = {
            timestamp: new Date().toISOString(),
            type: 'error',
            errorType: type,
            data: data
        };
        
        fs.appendFileSync(errorFile, JSON.stringify(logEntry) + '\n', 'utf8');
    }
    
    /**
     * 获取工作流状态
     */
    getStatus() {
        return {
            isRunning: this.state.isRunning,
            currentTask: this.state.currentTask,
            metrics: {
                requestCount: this.state.requestCount,
                successCount: this.state.successCount,
                errorCount: this.state.errorCount,
                successRate: this.state.requestCount > 0 ? 
                    Math.round((this.state.successCount / this.state.requestCount) * 100) : 0
            },
            circuitBreaker: this.state.circuitBreaker,
            config: {
                delays: this.config.delays,
                retry: this.config.retry
            }
        };
    }
    
    /**
     * 重置工作流状态
     */
    reset() {
        this.state = {
            isRunning: false,
            currentTask: null,
            requestCount: 0,
            successCount: 0,
            errorCount: 0,
            lastRequestTime: null,
            circuitBreaker: {
                isOpen: false,
                failureCount: 0,
                lastFailureTime: null,
                resetAfterMs: 60000
            }
        };
        
        console.log('🔄 工作流状态已重置');
    }
}

/**
 * 示例工作流任务
 */
function createExampleWorkflow() {
    return [
        {
            prompt: '请用一句话介绍人工智能',
            model: 'gpt-5.4',
            options: {
                max_tokens: 100,
                temperature: 0.7
            }
        },
        {
            prompt: '什么是机器学习？请简要说明',
            model: 'gemini-3.1-pro-preview',
            options: {
                max_tokens: 150,
                temperature: 0.5
            }
        },
        {
            prompt: '解释一下神经网络的基本原理',
            model: 'gpt-5.4',
            options: {
                max_tokens: 200,
                temperature: 0.3
            }
        },
        {
            prompt: '深度学习和传统机器学习有什么区别？',
            model: 'gemini-3.1-pro-preview',
            options: {
                max_tokens: 250,
                temperature: 0.6
            }
        },
        {
            prompt: '请总结AI在医疗领域的应用',
            model: 'gpt-5.4',
            options: {
                max_tokens: 300,
                temperature: 0.7
            }
        }
    ];
}

// 主程序
async function main() {
    const args = process.argv.slice(2);
    const command = args[0] || 'run-example';
    
    const workflow = new FourSAPIWorkflow();
    
    try {
        switch (command) {
            case 'status':
                const status = workflow.getStatus();
                console.log('📊 工作流状态:');
                console.log(JSON.stringify(status, null, 2));
                break;
                
            case 'single':
                const prompt = args[1] || '你好，请简单介绍一下你自己';
                const model = args[2] || null;
                
                console.log(`📞 执行单次调用`);
                console.log(`💬 提示: ${prompt}`);
                
                await workflow.executeCall(prompt, model);
                break;
                
            case 'custom':
                const customTasks = JSON.parse(args[1] || '[]');
                
                if (customTasks.length === 0) {
                    console.log('❌ 请提供任务列表');
                    process.exit(1);
                }
                
                await workflow.executeWorkflow(customTasks, {
                    continueOnError: true
                });
                break;
                
            case 'reset':
                workflow.reset();
                break;
                
            case 'run-example':
            default:
                const exampleTasks = createExampleWorkflow();
                await workflow.executeWorkflow(exampleTasks, {
                    continueOnError: true
                });
                break;
        }
        
    } catch (error) {
        console.error('❌ 执行失败:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = FourSAPIWorkflow;