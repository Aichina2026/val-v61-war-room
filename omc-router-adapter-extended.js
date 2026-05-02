#!/usr/bin/env node
/**
 * OMC路由适配器扩展版 - 添加密钥管理和K2.6测试
 * 扩展现有成熟路由系统，不重复造轮子
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// 加载现有路由适配器
try {
    var OMCRouterAdapterIntegrated = require('./omc-router-adapter');
} catch (error) {
    console.error('❌ 无法加载现有路由适配器:', error.message);
    process.exit(1);
}

class OMCRouterAdapterExtended extends OMCRouterAdapterIntegrated {
    constructor(config = {}) {
        super(config);
        
        // 密钥管理配置
        this.keyConfig = {
            enabled: true,
            autoCheck: true,
            checkInterval: 3600,
            testModels: true,
            notifyOnFailure: true,
            keyReportDir: path.join(this.workspace, 'key-management-reports')
        };
        
        // 创建密钥报告目录
        if (!fs.existsSync(this.keyConfig.keyReportDir)) {
            fs.mkdirSync(this.keyConfig.keyReportDir, { recursive: true });
        }
        
        // K2.6-code-preview配置
        this.kimiConfig = {
            targetModel: 'k2.6-code-preview',
            testUrl: 'https://api.moonshot.cn/v1/models',
            testEndpoint: 'https://api.moonshot.cn/v1/chat/completions'
        };
        
        console.log('🔑 OMC路由适配器扩展版已初始化');
        console.log('📦 新增功能: 密钥管理 + K2.6测试 + 增强监控');
    }
    
    /**
     * 密钥检测功能
     */
    async detectAPIKeys() {
        console.log('🔍 检测API密钥...');
        
        const keys = {};
        
        try {
            // 1. 从OpenClaw配置文件检测
            const openclawConfig = '/root/.openclaw/openclaw.json';
            if (fs.existsSync(openclawConfig)) {
                const config = JSON.parse(fs.readFileSync(openclawConfig, 'utf8'));
                
                if (config.models && config.models.providers) {
                    for (const [provider, providerConfig] of Object.entries(config.models.providers)) {
                        if (providerConfig.apiKey) {
                            const keyValue = providerConfig.apiKey;
                            keys[`${provider}_main`] = {
                                provider,
                                key: keyValue,
                                key_preview: keyValue.substring(0, 8) + '...' + keyValue.substring(keyValue.length - 4),
                                source: 'openclaw_config',
                                status: 'unknown'
                            };
                        }
                    }
                }
            }
            
            // 2. 检测环境变量
            const env = process.env;
            const envKeys = {};
            
            for (const [key, value] of Object.entries(env)) {
                if (value && /^(ARK_|KIMI_|ALI_|OPENAI_|ANTHROPIC_|GOOGLE_|DEEPSEEK_)/.test(key)) {
                    const provider = this.guessProvider(key);
                    envKeys[`env_${key}`] = {
                        provider,
                        key: value,
                        key_preview: value.substring(0, 8) + '...' + value.substring(value.length - 4),
                        source: 'environment',
                        status: 'unknown'
                    };
                }
            }
            
            // 合并结果
            Object.assign(keys, envKeys);
            
            console.log(`✅ 检测到 ${Object.keys(keys).length} 个API密钥`);
            return keys;
            
        } catch (error) {
            console.error(`❌ 密钥检测失败: ${error.message}`);
            return {};
        }
    }
    
    guessProvider(keyName) {
        const keyLower = keyName.toLowerCase();
        
        if (keyLower.includes('ark') || keyLower.includes('deepseek')) return 'ark';
        if (keyLower.includes('kimi') || keyLower.includes('moonshot')) return 'kimi';
        if (keyLower.includes('ali') || keyLower.includes('dashscope') || keyLower.includes('qwen')) return 'alibailian';
        if (keyLower.includes('openai') || keyLower.includes('gpt')) return 'openai';
        if (keyLower.includes('anthropic') || keyLower.includes('claude')) return 'anthropic';
        if (keyLower.includes('google') || keyLower.includes('gemini')) return 'google';
        if (keyLower.includes('4sapi')) return '4sapi';
        
        return 'unknown';
    }
    
    /**
     * 测试密钥有效性
     */
    async testKeyValidity(keyInfo) {
        if (!keyInfo.key || keyInfo.key.trim() === '') {
            return { valid: false, reason: 'empty_key' };
        }
        
        // 检查占位符
        const placeholderPatterns = [
            'sk-xxx', 'xxx', 'your_', 'example_', 'placeholder',
            'test_', 'demo_', 'sample_', 'e2b_sandbox_active_token_'
        ];
        
        const keyLower = keyInfo.key.toLowerCase();
        for (const pattern of placeholderPatterns) {
            if (keyLower.includes(pattern)) {
                return { valid: false, reason: `placeholder_${pattern}` };
            }
        }
        
        // 根据提供商测试
        try {
            const testUrl = this.getTestUrl(keyInfo.provider);
            if (!testUrl) {
                return { valid: true, reason: 'no_test_url_assumed_valid' };
            }
            
            const { stdout } = await execAsync(
                `curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer ${keyInfo.key}" "${testUrl}" --max-time 10`
            );
            
            const statusCode = stdout.trim();
            if (statusCode === '200') {
                return { valid: true, reason: 'api_success', status_code: statusCode };
            } else {
                return { valid: false, reason: `api_error_${statusCode}`, status_code: statusCode };
            }
            
        } catch (error) {
            return { valid: false, reason: `test_failed_${error.message}` };
        }
    }
    
    getTestUrl(provider) {
        const urls = {
            'kimi': 'https://api.moonshot.cn/v1/models',
            'ark': 'https://ark.cn-beijing.volces.com/api/coding/v3/models',
            'alibailian': 'https://dashscope.aliyuncs.com/compatible-mode/v1/models',
            '4sapi': 'https://4sapi.com/v1/models'
        };
        
        return urls[provider];
    }
    
    /**
     * 生成密钥报告
     */
    async generateKeyReport() {
        console.log('📊 生成密钥有效性报告...');
        
        const keys = await this.detectAPIKeys();
        const results = {};
        
        let validCount = 0;
        let invalidCount = 0;
        
        for (const [keyName, keyInfo] of Object.entries(keys)) {
            console.log(`  测试 ${keyName} (${keyInfo.key_preview})...`);
            const testResult = await this.testKeyValidity(keyInfo);
            
            results[keyName] = {
                ...keyInfo,
                status: testResult.valid ? 'valid' : 'invalid',
                test_result: testResult,
                last_tested: new Date().toISOString()
            };
            
            if (testResult.valid) {
                validCount++;
                console.log(`    ✅ 有效`);
            } else {
                invalidCount++;
                console.log(`    ❌ 无效 (${testResult.reason})`);
            }
        }
        
        // 保存报告
        const report = {
            timestamp: new Date().toISOString(),
            total_keys: Object.keys(keys).length,
            valid_keys: validCount,
            invalid_keys: invalidCount,
            efficiency_rate: Object.keys(keys).length > 0 ? 
                Math.round((validCount / Object.keys(keys).length) * 100) : 0,
            keys: results
        };
        
        const reportFile = path.join(
            this.keyConfig.keyReportDir, 
            `key_report_${Date.now()}.json`
        );
        
        fs.writeFileSync(reportFile, JSON.stringify(report, null, 2), 'utf8');
        
        console.log(`\n📈 密钥报告统计:`);
        console.log(`   总密钥: ${report.total_keys}`);
        console.log(`   有效密钥: ${report.valid_keys}`);
        console.log(`   无效密钥: ${report.invalid_keys}`);
        console.log(`   有效率: ${report.efficiency_rate}%`);
        console.log(`\n📄 报告已保存: ${reportFile}`);
        
        return report;
    }
    
    /**
     * 专门测试Kimi K2.6-code-preview
     */
    async testKimiK26() {
        console.log('🧪 测试Kimi K2.6-code-preview模型...');
        
        // 1. 检测Kimi密钥
        const keys = await this.detectAPIKeys();
        const kimiKeys = Object.entries(keys).filter(([_, info]) => info.provider === 'kimi');
        
        if (kimiKeys.length === 0) {
            console.log('❌ 未找到Kimi密钥');
            return {
                success: false,
                reason: 'no_kimi_keys_found',
                recommendation: '请添加有效的Kimi API密钥'
            };
        }
        
        const results = [];
        
        for (const [keyName, keyInfo] of kimiKeys) {
            console.log(`  测试密钥: ${keyName} (${keyInfo.key_preview})`);
            
            try {
                // 测试模型列表
                const { stdout } = await execAsync(
                    `curl -s -H "Authorization: Bearer ${keyInfo.key}" "${this.kimiConfig.testUrl}" --max-time 10`
                );
                
                let modelAvailable = false;
                let availableModels = [];
                
                try {
                    const data = JSON.parse(stdout);
                    if (data.data && Array.isArray(data.data)) {
                        availableModels = data.data.map(m => m.id);
                        modelAvailable = availableModels.includes(this.kimiConfig.targetModel);
                    }
                } catch (parseError) {
                    // 解析失败，检查是否包含目标模型字符串
                    modelAvailable = stdout.includes(`"${this.kimiConfig.targetModel}"`);
                }
                
                if (modelAvailable) {
                    console.log(`    ✅ 找到模型: ${this.kimiConfig.targetModel}`);
                    
                    // 测试模型调用
                    const testPayload = JSON.stringify({
                        model: this.kimiConfig.targetModel,
                        messages: [{ role: 'user', content: 'Say hello' }],
                        max_tokens: 10,
                        temperature: 0.7
                    });
                    
                    try {
                        const { stdout: testStdout } = await execAsync(
                            `curl -s -H "Authorization: Bearer ${keyInfo.key}" \
                             -H "Content-Type: application/json" \
                             -d '${testPayload}' \
                             "${this.kimiConfig.testEndpoint}" --max-time 15`
                        );
                        
                        const testData = JSON.parse(testStdout);
                        if (testData.choices && testData.choices.length > 0) {
                            results.push({
                                key_name: keyName,
                                key_preview: keyInfo.key_preview,
                                available: true,
                                can_call: true,
                                reason: 'model_available_and_working',
                                response_preview: testData.choices[0].message.content.substring(0, 50)
                            });
                            console.log(`    ✅ 模型可调用`);
                        } else {
                            results.push({
                                key_name: keyName,
                                key_preview: keyInfo.key_preview,
                                available: true,
                                can_call: false,
                                reason: 'model_available_but_call_failed'
                            });
                            console.log(`    ⚠️  模型可用但调用失败`);
                        }
                        
                    } catch (callError) {
                        results.push({
                            key_name: keyName,
                            key_preview: keyInfo.key_preview,
                            available: true,
                            can_call: false,
                            reason: `call_error_${callError.message}`
                        });
                        console.log(`    ⚠️  调用测试失败`);
                    }
                    
                } else {
                    results.push({
                        key_name: keyName,
                        key_preview: keyInfo.key_preview,
                        available: false,
                        can_call: false,
                        reason: 'model_not_available',
                        available_models: availableModels.slice(0, 5)
                    });
                    console.log(`    ❌ 模型不可用`);
                }
                
            } catch (error) {
                results.push({
                    key_name: keyName,
                    key_preview: keyInfo.key_preview,
                    available: false,
                    can_call: false,
                    reason: `test_error_${error.message}`
                });
                console.log(`    ❌ 测试失败: ${error.message}`);
            }
        }
        
        // 生成总结报告
        const summary = {
            timestamp: new Date().toISOString(),
            target_model: this.kimiConfig.targetModel,
            total_kimi_keys: kimiKeys.length,
            results: results,
            summary: {
                available_count: results.filter(r => r.available).length,
                callable_count: results.filter(r => r.can_call).length,
                success_rate: results.length > 0 ? 
                    Math.round((results.filter(r => r.available && r.can_call).length / results.length) * 100) : 0
            },
            recommendation: this.getK26Recommendation(results)
        };
        
        // 保存报告
        const reportFile = path.join(
            this.keyConfig.keyReportDir,
            `kimi_k26_test_${Date.now()}.json`
        );
        
        fs.writeFileSync(reportFile, JSON.stringify(summary, null, 2), 'utf8');
        
        console.log('\n📊 K2.6测试总结:');
        console.log(`   测试密钥数: ${summary.total_kimi_keys}`);
        console.log(`   模型可用: ${summary.summary.available_count}`);
        console.log(`   可调用: ${summary.summary.callable_count}`);
        console.log(`   成功率: ${summary.summary.success_rate}%`);
        console.log(`\n💡 建议: ${summary.recommendation.action}`);
        console.log(`📄 报告已保存: ${reportFile}`);
        
        return summary;
    }
    
    getK26Recommendation(results) {
        const availableResults = results.filter(r => r.available);
        const callableResults = availableResults.filter(r => r.can_call);
        
        if (availableResults.length === 0) {
            return {
                action: '获取有效Kimi密钥',
                priority: 'high',
                details: '需要有效的Kimi API密钥才能访问K2.6-code-preview'
            };
        }
        
        if (callableResults.length > 0) {
            return {
                action: '集成到路由系统',
                priority: 'medium',
                details: 'K2.6-code-preview可用且可调用，可以添加到路由策略中'
            };
        } else {
            return {
                action: '检查密钥权限',
                priority: 'medium',
                details: 'K2.6-code-preview在模型列表中，但当前密钥无法调用，需要检查套餐权限'
            };
        }
    }
    
    /**
     * 增强版路由调用
     */
    async enhancedRoute(stage, prompt, options = {}) {
        console.log(`🚀 增强路由调用: ${stage}`);
        
        // 1. 检查密钥状态（如果启用）
        if (this.keyConfig.enabled && this.keyConfig.autoCheck) {
            const keyStatus = await this.checkKeyHealth();
            if (!keyStatus.healthy) {
                console.warn(`⚠️ 密钥健康状态: ${keyStatus.message}`);
            }
        }
        
        // 2. 使用父类的路由功能
        const routeResult = await this.route(stage, prompt, options);
        
        // 3. 添加增强元数据
        const enhancedResult = {
            ...routeResult,
            enhanced_metadata: {
                key_check_enabled: this.keyConfig.enabled,
                routing_strategy: options.strategy || 'balanced',
                timestamp: new Date().toISOString()
            }
        };
        
        return enhancedResult;
    }
    
    async checkKeyHealth() {
        try {
            const report = await this.generateKeyReport();
            
            const total = report.total_keys;
            const valid = report.valid_keys;
            const ratio = total > 0 ? valid / total : 0;
            
            return {
                healthy: ratio >= 0.7,
                valid_ratio: ratio,
                valid_keys: valid,
                total_keys: total,
                message: `密钥有效性: ${valid}/${total} (${Math.round(ratio * 100)}%)`
            };
        } catch (error) {
            return {
                healthy: false,
                message: `密钥检查失败: ${error.message}`
            };
        }
    }
    
    /**
     * 执行增强工作流
     */
    async executeEnhancedWorkflow(task, strategy = 'balanced') {
        console.log('\n🚀 执行增强版路由工作流');
        console.log('='.repeat(60));
        
        // 1. 密钥健康检查
        console.log('🔑 执行密钥健康检查...');
        const keyStatus = await this.checkKeyHealth();
        console.log(`   状态: ${keyStatus.message}`);
        
        // 2. 执行标准工作流
        const workflowResult = await this.executeWorkflow(task, strategy);
        
        // 3. 添加增强分析
        const enhancedResult = {
            ...workflowResult,
            key_health: keyStatus,
            enhanced_analysis: {
                key_impact: keyStatus.healthy ? '正常' : '可能影响路由质量',
                recommendation: this.getWorkflowRecommendation(workflowResult, keyStatus)
            }
        };
        
        // 4. 保存增强报告
        this.saveEnhancedReport(enhancedResult);
        
        return enhancedResult;
    }
    
    getWorkflowRecommendation(workflowResult, keyStatus) {
        const recommendations = [];
        
        if (!keyStatus.healthy) {
            recommendations.push({
                priority: 'high',
                action: '修复密钥问题',
                details: `密钥有效性 ${Math.round(keyStatus.valid_ratio * 100)}%，低于70%阈值`
            });
        }
        
        if (workflowResult.metrics && workflowResult.metrics.stageSuccessCount < 5) {
            recommendations.push({
                priority: 'medium',
                action: '优化路由策略',
                details: `工作流成功率 ${workflowResult.metrics.stageSuccessRate}`
            });
        }
        
        if (recommendations.length === 0) {
            recommendations.push({
                priority: 'low',
                action: '保持当前配置',
                details: '系统运行良好'
            });
        }
        
        return recommendations;
    }
    
    saveEnhancedReport(result) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const reportFile = path.join(
            this.keyConfig.keyReportDir,
            `enhanced_workflow_${timestamp}.json`
        );
        
        fs.writeFileSync(reportFile, JSON.stringify(result, null, 2), 'utf8');
        
        console.log(`\n📊 增强报告已保存: ${reportFile}`);
    }
    
    /**
     * 启动监控服务
     */
    startMonitoring(intervalSeconds = 3600) {
        console.log(`📡 启动监控服务，间隔: ${intervalSeconds}秒`);
        
        const monitorInterval = setInterval(async () => {
            console.log(`\n⏰ ${new Date().toISOString()} - 执行定期检查`);
            
            try {
                // 1. 密钥检查
                const keyStatus = await this.checkKeyHealth();
                console.log(`🔑 密钥状态: ${keyStatus.message}`);
                
                // 2. 路由测试
                const testResult = await this.enhancedRoute(
                    'monitoring', 
                    '系统监控检查', 
                    { strategy: 'fast' }
                );
                
                // 3. 记录日志
                const logEntry = {
                    timestamp: new Date().toISOString(),
                    key_status: keyStatus,
                    route_test: testResult.success ? '通过' : '失败',
                    system_status: 'operational'
                };
                
                const logFile = path.join(
                    this.keyConfig.keyReportDir,
                    `monitor_log_${Date.now()}.json`
                );
                
                fs.writeFileSync(logFile, JSON.stringify(logEntry, null, 2), 'utf8');
                
                console.log('✅ 监控检查完成');
                
            } catch (error) {
                console.error(`❌ 监控检查失败: ${error.message}`);
            }
        }, intervalSeconds * 1000);
        
        // 处理退出
        process.on('SIGINT', () => {
            clearInterval(monitorInterval);
            console.log('\n👋 监控服务已停止');
            process.exit(0);
        });
        
        // 保持进程运行
        console.log('⏳ 监控服务运行中，按 Ctrl+C 停止...');
        process.stdin.resume();
    }
}

// 主程序
if (require.main === module) {
    const args = process.argv.slice(2);
    const mode = args[0] || 'workflow';
    
    const extendedRouter = new OMCRouterAdapterExtended();
    
    if (mode === 'test-keys') {
        console.log('🔑 测试密钥管理功能...');
        extendedRouter.generateKeyReport()
            .then(() => {
                console.log('\n✅ 密钥测试完成');
            })
            .catch(error => {
                console.error('❌ 密钥测试失败:', error.message);
            });
        
    } else if (mode === 'test-k26') {
        console.log('🧪 测试Kimi K2.6-code-preview...');
        extendedRouter.testKimiK26()
            .then(result => {
                console.log('\n🎯 K2.6测试完成');
            })
            .catch(error => {
                console.error('❌ K2.6测试失败:', error.message);
            });
        
    } else if (mode === 'workflow') {
        const task = args.length > 1 ? args.slice(1).join(' ') : '测试增强版路由系统';
        const strategy = args.includes('--strategy') ? args[args.indexOf('--strategy') + 1] : 'balanced';
        
        extendedRouter.executeEnhancedWorkflow(task, strategy)
            .then(result => {
                console.log('\n🎉 增强工作流执行完成!');
            })
            .catch(error => {
                console.error('❌ 工作流执行失败:', error.message);
            });
        
    } else if (mode === 'monitor') {
        const interval = args.length > 1 ? parseInt(args[1]) : 3600;
        extendedRouter.startMonitoring(interval);
        
    } else if (mode === 'cleanup') {
        console.log('🧹 清理冗余文件...');
        
        const filesToRemove = [
            'smart_router.py',
            'integrated_gateway.py',
            'simple_key_check.py',
            'auto_key_manager.sh',
            'INTEGRATED_SMART_ROUTING_SYSTEM.md',
            'omc-enhanced-key-integration.js'
        ];
        
        let removed = 0;
        filesToRemove.forEach(file => {
            const filePath = path.join('/root/.openclaw/workspace', file);
            if (fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath);
                    console.log(`  ✅ 删除: ${file}`);
                    removed++;
                } catch (error) {
                    console.log(`  ⚠️  无法删除 ${file}: ${error.message}`);
                }
            }
        });
        
        console.log(`\n📊 清理完成: 删除了 ${removed} 个文件`);
        console.log('💡 现在使用: node omc-router-adapter-extended.js [命令]');
        
    } else {
        console.log('OMC路由适配器扩展版 - 使用现有成熟系统，添加密钥管理功能');
        console.log('='.repeat(60));
        console.log('使用方法:');
        console.log('  node omc-router-adapter-extended.js test-keys        # 测试密钥管理');
        console.log('  node omc-router-adapter-extended.js test-k26         # 测试K2.6模型');
        console.log('  node omc-router-adapter-extended.js workflow [任务]  # 执行增强工作流');
        console.log('  node omc-router-adapter-extended.js monitor [间隔]   # 启动监控服务');
        console.log('  node omc-router-adapter-extended.js cleanup          # 清理冗余文件');
        console.log('');
        console.log('选项:');
        console.log('  --strategy <策略>    # 指定路由策略');
        console.log('');
        console.log('📋 现有路由系统已扩展以下功能:');
        console.log('  1. 🔑 密钥自动检测和验证');
        console.log('  2. 🧪 K2.6-code-preview专门测试');
        console.log('  3. 📊 增强监控和报告');
        console.log('  4. 🔄 向后兼容现有接口');
    }
}

module.exports = OMCRouterAdapterExtended;