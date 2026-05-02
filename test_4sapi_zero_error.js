#!/usr/bin/env node
/**
 * 测试使用零错误技能调用4SAPI节点
 * 测试4SAPI的可用性和响应质量
 */

const https = require('https');
const { URL } = require('url');

class FourSAPITester {
    constructor() {
        // 从OpenClaw配置中获取4SAPI配置
        this.config = {
            baseUrl: 'https://4sapi.com/v1',
            apiKey: 'sk-mNOYLbPoeo3cU41UGS1tpBa1n0gqrql3RTIO0bpmspMtmake',
            models: [
                'gemini-3.1-pro-preview',
                'gpt-5.4',
                'claude-opus-4.6'
            ]
        };
        
        console.log('🔧 4SAPI测试器初始化');
        console.log(`📡 端点: ${this.config.baseUrl}`);
        console.log(`🧠 可用模型: ${this.config.models.join(', ')}`);
    }
    
    /**
     * 零错误HTTP请求
     */
    makeRequest(options, data = null) {
        return new Promise((resolve, reject) => {
            const req = https.request(options, (res) => {
                let responseData = '';
                
                res.on('data', (chunk) => {
                    responseData += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const parsedData = JSON.parse(responseData);
                        resolve({
                            statusCode: res.statusCode,
                            headers: res.headers,
                            data: parsedData
                        });
                    } catch (error) {
                        resolve({
                            statusCode: res.statusCode,
                            headers: res.headers,
                            rawData: responseData,
                            parseError: error.message
                        });
                    }
                });
            });
            
            req.on('error', (error) => {
                reject({
                    type: 'request_error',
                    error: error.message
                });
            });
            
            req.setTimeout(30000, () => {
                req.destroy();
                reject({
                    type: 'timeout',
                    error: '请求超时 (30秒)'
                });
            });
            
            if (data) {
                req.write(JSON.stringify(data));
            }
            
            req.end();
        });
    }
    
    /**
     * 测试4SAPI连接性
     */
    async testConnectivity() {
        console.log('\n🔗 测试4SAPI连接性...');
        
        const options = {
            hostname: '4sapi.com',
            port: 443,
            path: '/v1/models',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${this.config.apiKey}`,
                'Content-Type': 'application/json',
                'User-Agent': 'OpenClaw-Tester/1.0'
            }
        };
        
        try {
            const result = await this.makeRequest(options);
            
            if (result.statusCode === 200) {
                console.log('✅ 连接测试成功');
                console.log(`📊 状态码: ${result.statusCode}`);
                
                if (result.data && result.data.data) {
                    const models = result.data.data.map(m => m.id);
                    console.log(`📦 可用模型: ${models.slice(0, 5).join(', ')}${models.length > 5 ? '...' : ''}`);
                    console.log(`🔢 模型总数: ${models.length}`);
                }
                
                return {
                    success: true,
                    statusCode: result.statusCode,
                    availableModels: result.data?.data || []
                };
            } else {
                console.log(`❌ 连接测试失败: HTTP ${result.statusCode}`);
                console.log(`📝 响应: ${JSON.stringify(result.data || result.rawData || '无数据', null, 2).slice(0, 200)}...`);
                
                return {
                    success: false,
                    statusCode: result.statusCode,
                    error: result.data || result.rawData
                };
            }
        } catch (error) {
            console.log(`❌ 连接测试异常: ${error.type || '未知错误'}`);
            console.log(`📝 错误详情: ${error.error || JSON.stringify(error)}`);
            
            return {
                success: false,
                error: error
            };
        }
    }
    
    /**
     * 测试特定模型
     */
    async testModel(modelName, testPrompt = '简单介绍一下你自己') {
        console.log(`\n🧪 测试模型: ${modelName}`);
        console.log(`💬 测试提示: "${testPrompt}"`);
        
        const requestData = {
            model: modelName,
            messages: [
                {
                    role: 'user',
                    content: testPrompt
                }
            ],
            max_tokens: 100,
            temperature: 0.7,
            stream: false
        };
        
        const options = {
            hostname: '4sapi.com',
            port: 443,
            path: '/v1/chat/completions',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.config.apiKey}`,
                'Content-Type': 'application/json',
                'User-Agent': 'OpenClaw-Tester/1.0'
            }
        };
        
        try {
            const startTime = Date.now();
            const result = await this.makeRequest(options, requestData);
            const responseTime = Date.now() - startTime;
            
            if (result.statusCode === 200) {
                console.log(`✅ 模型测试成功`);
                console.log(`⚡ 响应时间: ${responseTime}ms`);
                console.log(`📊 状态码: ${result.statusCode}`);
                
                if (result.data && result.data.choices && result.data.choices.length > 0) {
                    const response = result.data.choices[0].message.content;
                    console.log(`📝 响应内容: ${response.substring(0, 150)}${response.length > 150 ? '...' : ''}`);
                }
                
                if (result.data && result.data.usage) {
                    console.log(`🧮 Token使用: ${JSON.stringify(result.data.usage)}`);
                }
                
                return {
                    success: true,
                    model: modelName,
                    responseTime: responseTime,
                    statusCode: result.statusCode,
                    response: result.data?.choices?.[0]?.message?.content || '无响应内容',
                    usage: result.data?.usage || {},
                    fullResponse: result.data
                };
            } else {
                console.log(`❌ 模型测试失败: HTTP ${result.statusCode}`);
                console.log(`📝 错误响应: ${JSON.stringify(result.data || result.rawData || '无数据', null, 2).slice(0, 200)}...`);
                
                return {
                    success: false,
                    model: modelName,
                    statusCode: result.statusCode,
                    error: result.data || result.rawData
                };
            }
        } catch (error) {
            console.log(`❌ 模型测试异常: ${error.type || '未知错误'}`);
            console.log(`📝 错误详情: ${error.error || JSON.stringify(error)}`);
            
            return {
                success: false,
                model: modelName,
                error: error
            };
        }
    }
    
    /**
     * 零错误技能测试 - 测试系统的健壮性
     */
    async zeroErrorSkillTest() {
        console.log('\n🎯 执行零错误技能测试');
        console.log('='.repeat(60));
        
        const testCases = [
            {
                name: '空请求测试',
                data: {},
                expected: '应返回400错误或适当响应'
            },
            {
                name: '无效模型测试',
                data: {
                    model: 'invalid-model-12345',
                    messages: [{ role: 'user', content: 'test' }]
                },
                expected: '应返回400或404错误'
            },
            {
                name: '超长提示测试',
                data: {
                    model: 'gemini-3.1-pro-preview',
                    messages: [{ role: 'user', content: 'test'.repeat(1000) }],
                    max_tokens: 10
                },
                expected: '应正确处理或返回适当错误'
            },
            {
                name: '缺失必需字段测试',
                data: {
                    model: 'gemini-3.1-pro-preview'
                    // 故意缺少messages字段
                },
                expected: '应返回400错误'
            }
        ];
        
        const results = [];
        
        for (const testCase of testCases) {
            console.log(`\n📋 测试用例: ${testCase.name}`);
            console.log(`📝 预期: ${testCase.expected}`);
            
            const options = {
                hostname: '4sapi.com',
                port: 443,
                path: '/v1/chat/completions',
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`,
                    'Content-Type': 'application/json'
                }
            };
            
            try {
                const result = await this.makeRequest(options, testCase.data);
                
                const testResult = {
                    testName: testCase.name,
                    statusCode: result.statusCode,
                    success: result.statusCode >= 200 && result.statusCode < 500, // 接受4xx错误作为有效响应
                    errorType: result.statusCode >= 400 ? 'client_error' : 'server_error',
                    response: result.data || result.rawData
                };
                
                results.push(testResult);
                
                if (testResult.success) {
                    console.log(`✅ 测试通过: 返回状态码 ${testResult.statusCode}`);
                } else {
                    console.log(`⚠️  测试结果: 返回状态码 ${testResult.statusCode} (${testResult.errorType})`);
                }
                
            } catch (error) {
                const testResult = {
                    testName: testCase.name,
                    error: error,
                    success: false,
                    errorType: 'exception'
                };
                
                results.push(testResult);
                console.log(`❌ 测试异常: ${error.type || '未知错误'}`);
            }
        }
        
        return results;
    }
    
    /**
     * 性能基准测试
     */
    async performanceBenchmark() {
        console.log('\n📈 执行性能基准测试');
        console.log('='.repeat(60));
        
        const testPrompt = '请用一句话回答：人工智能是什么？';
        const iterations = 3;
        const models = ['gemini-3.1-pro-preview', 'gpt-5.4'];
        
        const results = [];
        
        for (const model of models) {
            console.log(`\n🧠 测试模型: ${model}`);
            
            const modelResults = [];
            
            for (let i = 0; i < iterations; i++) {
                console.log(`  第 ${i + 1}/${iterations} 次测试...`);
                
                try {
                    const startTime = Date.now();
                    const result = await this.testModel(model, testPrompt);
                    const responseTime = Date.now() - startTime;
                    
                    modelResults.push({
                        iteration: i + 1,
                        success: result.success,
                        responseTime: responseTime,
                        tokens: result.usage?.total_tokens || 0
                    });
                    
                    if (result.success) {
                        console.log(`    ✅ 成功 - ${responseTime}ms`);
                    } else {
                        console.log(`    ❌ 失败`);
                    }
                    
                    // 短暂延迟，避免速率限制
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                } catch (error) {
                    console.log(`    ❌ 异常: ${error.message}`);
                    modelResults.push({
                        iteration: i + 1,
                        success: false,
                        error: error.message
                    });
                }
            }
            
            const successfulTests = modelResults.filter(r => r.success);
            const avgResponseTime = successfulTests.length > 0 
                ? successfulTests.reduce((sum, r) => sum + r.responseTime, 0) / successfulTests.length
                : 0;
            
            const successRate = (successfulTests.length / iterations) * 100;
            
            results.push({
                model: model,
                iterations: iterations,
                successRate: successRate,
                avgResponseTime: avgResponseTime,
                details: modelResults
            });
            
            console.log(`  📊 统计: 成功率 ${successRate.toFixed(1)}%, 平均响应时间 ${avgResponseTime.toFixed(0)}ms`);
        }
        
        return results;
    }
    
    /**
     * 生成综合报告
     */
    generateReport(connectivityResult, modelTestResults, zeroErrorResults, performanceResults) {
        console.log('\n📊 4SAPI测试综合报告');
        console.log('='.repeat(60));
        
        const report = {
            timestamp: new Date().toISOString(),
            connectivity: connectivityResult,
            modelTests: modelTestResults,
            zeroErrorTests: zeroErrorResults,
            performance: performanceResults,
            summary: {
                overallStatus: connectivityResult.success ? '可用' : '不可用',
                testedModels: modelTestResults.map(r => r.model),
                totalTests: modelTestResults.length + (zeroErrorResults?.length || 0) + (performanceResults?.length || 0),
                successfulTests: modelTestResults.filter(r => r.success).length + 
                               (zeroErrorResults?.filter(r => r.success).length || 0)
            }
        };
        
        // 显示总结
        console.log(`📅 测试时间: ${report.timestamp}`);
        console.log(`🌐 连接状态: ${report.connectivity.success ? '✅ 可用' : '❌ 不可用'}`);
        
        if (report.connectivity.success) {
            console.log(`📦 可用模型数: ${report.connectivity.availableModels.length}`);
        }
        
        console.log(`🧪 测试模型: ${report.summary.testedModels.join(', ')}`);
        console.log(`📈 总测试数: ${report.summary.totalTests}`);
        console.log(`✅ 成功测试: ${report.summary.successfulTests}`);
        
        // 性能统计
        if (performanceResults && performanceResults.length > 0) {
            console.log('\n🚀 性能统计:');
            performanceResults.forEach(perf => {
                console.log(`  ${perf.model}: ${perf.successRate.toFixed(1)}% 成功率, ${perf.avgResponseTime.toFixed(0)}ms 平均响应`);
            });
        }
        
        // 建议
        console.log('\n💡 建议:');
        if (!report.connectivity.success) {
            console.log('  1. 检查4SAPI API密钥是否有效');
            console.log('  2. 检查网络连接是否正常');
            console.log('  3. 确认4SAPI服务状态');
        } else if (report.summary.successfulTests < report.summary.totalTests * 0.8) {
            console.log('  1. 部分测试失败，建议检查具体错误');
            console.log('  2. 考虑使用备用API端点');
            console.log('  3. 验证模型配置和权限');
        } else {
            console.log('  1. 4SAPI服务正常，可以集成使用');
            console.log('  2. 建议设置监控和告警');
            console.log('  3. 考虑性能优化策略');
        }
        
        return report;
    }
    
    /**
     * 运行完整测试套件
     */
    async runFullTestSuite() {
        console.log('🚀 开始4SAPI完整测试套件');
        console.log('='.repeat(60));
        
        try {
            // 1. 连接性测试
            const connectivityResult = await this.testConnectivity();
            
            if (!connectivityResult.success) {
                console.log('\n❌ 连接测试失败，中止后续测试');
                return this.generateReport(connectivityResult, [], [], []);
            }
            
            // 2. 模型测试
            const modelTestResults = [];
            for (const model of this.config.models.slice(0, 2)) { // 测试前两个模型
                const result = await this.testModel(model);
                modelTestResults.push(result);
                
                // 模型间延迟
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
            
            // 3. 零错误技能测试
            const zeroErrorResults = await this.zeroErrorSkillTest();
            
            // 4. 性能基准测试
            const performanceResults = await this.performanceBenchmark();
            
            // 5. 生成报告
            const report = this.generateReport(
                connectivityResult, 
                modelTestResults, 
                zeroErrorResults, 
                performanceResults
            );
            
            // 保存报告
            this.saveReport(report);
            
            return report;
            
        } catch (error) {
            console.error('❌ 测试套件执行失败:', error.message);
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
    
    saveReport(report) {
        const fs = require('fs');
        const path = require('path');
        
        const reportsDir = '/root/.openclaw/workspace/4sapi-test-reports';
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const reportFile = path.join(reportsDir, `4sapi_test_${timestamp}.json`);
        
        fs.writeFileSync(reportFile, JSON.stringify(report, null, 2), 'utf8');
        console.log(`\n📄 测试报告已保存: ${reportFile}`);
    }
}

// 主程序
async function main() {
    const tester = new FourSAPITester();
    
    const args = process.argv.slice(2);
    const testType = args[0] || 'full';
    
    try {
        switch (testType) {
            case 'connectivity':
                await tester.testConnectivity();
                break;
                
            case 'model':
                const model = args[1] || 'gemini-3.1-pro-preview';
                await tester.testModel(model, args[2] || '你好，请简单介绍一下你自己');
                break;
                
            case 'zero-error':
                await tester.zeroErrorSkillTest();
                break;
                
            case 'performance':
                await tester.performanceBenchmark();
                break;
                
            case 'full':
            default:
                await tester.runFullTestSuite();
                break;
        }
        
        console.log('\n🎉 测试完成！');
        
    } catch (error) {
        console.error('❌ 测试失败:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = FourSAPITester;