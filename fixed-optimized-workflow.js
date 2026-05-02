#!/usr/bin/env node
/**
 * 修复版优化OMC 4AI工作流
 * 基于实际可用的4SAPI模型进行优化
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class FixedOptimizedWorkflow {
  constructor() {
    this.workspace = '/root/.openclaw/workspace';
    
    // 加载环境变量
    this.loadEnvVars();
    
    // 基于测试结果的可用模型
    this.availableModels = {
      '4sapi': ['gpt-5.4', 'gemini-3.1-pro-preview'],
      'fallback': ['deepseek-v3.2', 'glm-5', 'qwen3.6-plus']
    };
    
    // 4AI角色配置（基于可用模型优化）
    this.aiRoles = {
      'analysis': {
        name: '分析专家',
        description: '负责数据分析和问题诊断',
        primaryModel: 'gemini-3.1-pro-preview',  // 分析能力强
        fallbackModel: 'deepseek-v3.2',
        strategy: 'balanced'
      },
      'design': {
        name: '架构设计师',
        description: '负责系统架构和技术方案设计',
        primaryModel: 'gpt-5.4',  // 设计能力强
        fallbackModel: 'glm-5',
        strategy: 'high-quality'
      },
      'implementation': {
        name: '实施工程师',
        description: '负责具体实现和代码生成',
        primaryModel: 'gpt-5.4',  // 代码生成能力强
        fallbackModel: 'deepseek-v3.2',
        strategy: 'cost-effective'
      },
      'optimization': {
        name: '优化专家',
        description: '负责性能优化和质量保证',
        primaryModel: 'gemini-3.1-pro-preview',  // 优化建议能力强
        fallbackModel: 'deepseek-v3.2',
        strategy: 'fast'
      }
    };
    
    // 路由系统
    this.routingSystems = [
      {
        name: '4sapi-direct',
        priority: 1,
        testModel: 'gpt-5.4',
        enabled: true
      },
      {
        name: 'openclaw-router',
        priority: 2,
        testModel: 'deepseek-v3.2',
        enabled: true
      },
      {
        name: 'local-fallback',
        priority: 3,
        testModel: 'local',
        enabled: true
      }
    ];
    
    // 性能监控
    this.metrics = {
      calls: { total: 0, success: 0, fail: 0 },
      latency: [],
      modelUsage: {}
    };
  }
  
  loadEnvVars() {
    // 加载4SAPI密钥
    this.foursapiKeys = [];
    for (let i = 1; i <= 5; i++) {
      const key = process.env[`FOURSAPI_KEY_${i}`];
      if (key && key.trim()) {
        this.foursapiKeys.push(key.trim());
      }
    }
    
    this.foursapiBaseUrl = process.env.FOURSAPI_BASE_URL || 'https://4sapi.com/v1';
    
    console.log('🔑 环境变量配置:');
    console.log(`   4SAPI密钥: ${this.foursapiKeys.length} 个`);
    console.log(`   基础URL: ${this.foursapiBaseUrl}`);
  }
  
  /**
   * 智能模型选择器
   */
  selectModelForRole(role, useFallback = false) {
    const roleConfig = this.aiRoles[role];
    
    if (useFallback || !this.foursapiKeys.length) {
      return {
        provider: 'fallback',
        model: roleConfig.fallbackModel,
        system: 'openclaw-router'
      };
    }
    
    // 检查模型是否在可用列表中
    if (this.availableModels['4sapi'].includes(roleConfig.primaryModel)) {
      return {
        provider: '4sapi',
        model: roleConfig.primaryModel,
        system: '4sapi-direct'
      };
    }
    
    // 如果首选模型不可用，选择其他可用模型
    const availableModel = this.availableModels['4sapi'][0];
    return {
      provider: '4sapi',
      model: availableModel,
      system: '4sapi-direct'
    };
  }
  
  /**
   * 获取轮询的API密钥
   */
  getNextApiKey() {
    if (this.foursapiKeys.length === 0) return null;
    const index = this.metrics.calls.total % this.foursapiKeys.length;
    return this.foursapiKeys[index];
  }
  
  /**
   * 调用4SAPI API
   */
  async call4SAPI(model, prompt, options = {}) {
    const apiKey = options.apiKey || this.getNextApiKey();
    if (!apiKey) {
      throw new Error('没有可用的4SAPI密钥');
    }
    
    return new Promise((resolve, reject) => {
      const requestData = {
        model: model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: options.maxTokens || 1000,
        temperature: options.temperature || 0.7,
        ...options.extraParams
      };
      
      const postData = JSON.stringify(requestData);
      const url = new URL(this.foursapiBaseUrl + '/chat/completions');
      
      const startTime = Date.now();
      const req = https.request({
        hostname: url.hostname,
        port: 443,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'Content-Length': Buffer.byteLength(postData)
        }
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          const latency = Date.now() - startTime;
          
          try {
            const parsed = JSON.parse(data);
            
            // 更新指标
            this.updateMetrics({
              provider: '4sapi',
              model: model,
              success: res.statusCode === 200,
              latency: latency
            });
            
            if (res.statusCode === 200) {
              resolve({
                success: true,
                content: parsed.choices?.[0]?.message?.content || '',
                model: parsed.model,
                usage: parsed.usage,
                latency: latency
              });
            } else {
              reject(new Error(`API错误 ${res.statusCode}: ${data.substring(0, 200)}`));
            }
          } catch (error) {
            reject(new Error(`响应解析失败: ${error.message}`));
          }
        });
      });
      
      req.on('error', reject);
      req.setTimeout(options.timeout || 10000, () => {
        req.destroy();
        reject(new Error('请求超时'));
      });
      
      req.write(postData);
      req.end();
    });
  }
  
  /**
   * 调用OpenClaw路由
   */
  async callOpenClaw(model, prompt, options = {}) {
    try {
      const command = `openclaw chat --model ${model} "${prompt.substring(0, 500)}"`;
      const startTime = Date.now();
      
      const { stdout } = await execAsync(command, {
        timeout: options.timeout || 15000
      });
      
      const latency = Date.now() - startTime;
      
      this.updateMetrics({
        provider: 'openclaw',
        model: model,
        success: true,
        latency: latency
      });
      
      return {
        success: true,
        content: stdout,
        model: model,
        latency: latency
      };
      
    } catch (error) {
      this.updateMetrics({
        provider: 'openclaw',
        model: model,
        success: false,
        latency: 0
      });
      
      throw error;
    }
  }
  
  /**
   * 统一AI调用接口
   */
  async callAI(role, prompt, options = {}) {
    const roleConfig = this.aiRoles[role];
    console.log(`\n🤖 ${roleConfig.name} 开始工作...`);
    
    // 选择模型
    const modelSelection = this.selectModelForRole(role, options.forceFallback);
    console.log(`   模型: ${modelSelection.model} (${modelSelection.provider})`);
    
    try {
      let result;
      
      switch (modelSelection.system) {
        case '4sapi-direct':
          result = await this.call4SAPI(modelSelection.model, prompt, options);
          break;
          
        case 'openclaw-router':
          result = await this.callOpenClaw(modelSelection.model, prompt, options);
          break;
          
        default:
          // 本地回退
          result = {
            success: true,
            content: `[本地回退] ${prompt.substring(0, 200)}...`,
            model: modelSelection.model,
            latency: 100,
            fallback: true
          };
      }
      
      console.log(`   ✅ 完成 (${result.latency}ms)`);
      return {
        role: role,
        roleName: roleConfig.name,
        ...result,
        modelSelection: modelSelection
      };
      
    } catch (error) {
      console.log(`   ❌ 失败: ${error.message}`);
      
      // 如果4SAPI失败，尝试回退
      if (modelSelection.system === '4sapi-direct') {
        console.log('   尝试回退到OpenClaw路由...');
        return this.callAI(role, prompt, { ...options, forceFallback: true });
      }
      
      throw error;
    }
  }
  
  /**
   * 4AI协同工作流
   */
  async execute4AIWorkflow(task, context = {}) {
    console.log('\n🚀 启动4AI协同工作流');
    console.log(`任务: ${task}`);
    console.log('='.repeat(60));
    
    const results = {
      task: task,
      startTime: new Date().toISOString(),
      stages: {}
    };
    
    // 阶段1: 分析
    try {
      const analysisPrompt = `请分析任务: "${task}"
      
      分析要点:
      1. 需求理解
      2. 技术难点
      3. 可行性评估
      4. 初步建议
      
      上下文: ${JSON.stringify(context)}`;
      
      results.stages.analysis = await this.callAI('analysis', analysisPrompt, {
        maxTokens: 800
      });
      console.log('📊 分析完成');
    } catch (error) {
      console.log('❌ 分析失败:', error.message);
      results.stages.analysis = { error: error.message };
    }
    
    // 阶段2: 设计
    try {
      const analysisResult = results.stages.analysis?.content || '';
      const designPrompt = `基于分析进行设计:
      
      任务: ${task}
      分析: ${analysisResult}
      
      设计要点:
      1. 系统架构
      2. 技术选型
      3. 模块划分
      4. 接口设计`;
      
      results.stages.design = await this.callAI('design', designPrompt, {
        maxTokens: 1000
      });
      console.log('🏗️  设计完成');
    } catch (error) {
      console.log('❌ 设计失败:', error.message);
      results.stages.design = { error: error.message };
    }
    
    // 阶段3: 实施
    try {
      const designResult = results.stages.design?.content || '';
      const implementationPrompt = `基于设计进行实施:
      
      任务: ${task}
      设计: ${designResult}
      
      实施要点:
      1. 代码框架
      2. 核心实现
      3. 配置说明
      4. 测试方案`;
      
      results.stages.implementation = await this.callAI('implementation', implementationPrompt, {
        maxTokens: 1200
      });
      console.log('💻 实施完成');
    } catch (error) {
      console.log('❌ 实施失败:', error.message);
      results.stages.implementation = { error: error.message };
    }
    
    // 阶段4: 优化
    try {
      const implementationResult = results.stages.implementation?.content || '';
      const optimizationPrompt = `进行优化:
      
      任务: ${task}
      实现: ${implementationResult}
      
      优化要点:
      1. 性能优化
      2. 安全加固
      3. 可维护性
      4. 成本控制`;
      
      results.stages.optimization = await this.callAI('optimization', optimizationPrompt, {
        maxTokens: 800
      });
      console.log('⚡ 优化完成');
    } catch (error) {
      console.log('❌ 优化失败:', error.message);
      results.stages.optimization = { error: error.message };
    }
    
    // 汇总结果
    results.endTime = new Date().toISOString();
    results.metrics = this.getMetrics();
    results.summary = this.generateSummary(results.stages);
    
    // 保存结果
    this.saveResults(results);
    
    console.log('\n🎯 工作流完成');
    console.log('='.repeat(60));
    console.log('性能指标:');
    console.log(`   总调用: ${this.metrics.calls.total}`);
    console.log(`   成功率: ${this.metrics.calls.success}/${this.metrics.calls.total}`);
    console.log(`   平均延迟: ${this.getAverageLatency()}ms`);
    
    return results;
  }
  
  updateMetrics(metric) {
    this.metrics.calls.total++;
    
    if (metric.success) {
      this.metrics.calls.success++;
      this.metrics.latency.push(metric.latency);
    } else {
      this.metrics.calls.fail++;
    }
    
    const key = `${metric.provider}/${metric.model}`;
    this.metrics.modelUsage[key] = (this.metrics.modelUsage[key] || 0) + 1;
  }
  
  getAverageLatency() {
    if (this.metrics.latency.length === 0) return 0;
    const sum = this.metrics.latency.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.metrics.latency.length);
  }
  
  getMetrics() {
    return {
      calls: { ...this.metrics.calls },
      averageLatency: this.getAverageLatency(),
      modelUsage: { ...this.metrics.modelUsage }
    };
  }
  
  generateSummary(stages) {
    const summary = [];
    
    for (const [stage, result] of Object.entries(stages)) {
      if (result && !result.error) {
        summary.push(`## ${stage.toUpperCase()}\n${result.content.substring(0, 500)}...`);
      }
    }
    
    return summary.join('\n\n');
  }
  
  saveResults(results) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `workflow-${timestamp}.json`;
    const filepath = path.join(this.workspace, 'omc-4ai-reports', filename);
    
    // 确保目录存在
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(filepath, JSON.stringify(results, null, 2));
    console.log(`📄 结果保存: ${filepath}`);
  }
  
  /**
   * 系统测试
   */
  async testSystem() {
    console.log('🧪 系统测试...');
    
    const tests = [
      {
        name: '4SAPI连接测试',
        role: 'analysis',
        prompt: '测试连接，回复"连接成功"',
        options: { maxTokens: 20, temperature: 0.1 }
      },
      {
        name: '模型切换测试',
        role: 'design',
        prompt: '简单设计测试，回复"设计测试成功"',
        options: { maxTokens: 30 }
      }
    ];
    
    const results = [];
    
    for (const test of tests) {
      console.log(`\n🔍 ${test.name}`);
      try {
        const result = await this.callAI(test.role, test.prompt, test.options);
        results.push({
          test: test.name,
          status: '✅ 成功',
          model: result.model,
          latency: result.latency + 'ms'
        });
      } catch (error) {
        results.push({
          test: test.name,
          status: '❌ 失败',
          error: error.message
        });
      }
    }
    
    console.log('\n📊 测试结果:');
    console.table(results);
    
    return results;
  }
}

// 主程序
async function main() {
  console.log('🚀 修复版优化OMC 4AI工作流');
  console.log('='.repeat(60));
  
  const workflow = new FixedOptimizedWorkflow();
  
  // 系统测试
  const testResults = await workflow.testSystem();
  const passedTests = testResults.filter(r => r.status === '✅ 成功').length;
  
  if (passedTests < testResults.length) {
    console.warn('\n⚠️ 部分测试失败，但仍可继续工作流');
  }
  
  // 执行示例工作流
  console.log('\n' + '='.repeat(60));
  console.log('开始示例工作流...');
  
  try {
    const exampleTask = '设计一个智能任务管理系统，支持多用户协作和自动化工作流';
    
    const result = await workflow.execute4AIWorkflow(exampleTask, {
      priority: 'normal',
      deadline: '1周'
    });
    
    console.log('\n✅ 示例工作流完成');
    
    // 显示各阶段状态
    console.log('\n📋 各阶段状态:');
    for (const [stage, stageResult] of Object.entries(result.stages)) {
      const status = stageResult.error ? '❌' : '✅';
      console.log(`  ${stage}: ${status} ${stageResult.error || '完成'}`);
    }
    
  } catch (error) {
    console.error('\n❌ 工作流执行失败:', error.message);
  }
}

// 执行
if (require.main === module) {
  main().catch(console.error);
}

module.exports = FixedOptimizedWorkflow;