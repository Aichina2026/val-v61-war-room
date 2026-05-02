#!/usr/bin/env node
/**
 * 优化版OMC 4AI工作流 - 多路由多密钥智能调用系统
 * 集成环境变量中的4SAPI密钥和多种路由策略
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class OptimizedOMC4AIWorkflow {
  constructor() {
    this.workspace = '/root/.openclaw/workspace';
    this.dataDir = path.join(this.workspace, 'omc-4ai-data');
    this.reportsDir = path.join(this.workspace, 'omc-4ai-reports');
    this.strategyDir = path.join(this.workspace, 'omc-strategy-library');
    
    // 初始化目录
    this.initDirectories();
    
    // 加载环境变量中的4SAPI密钥
    this.load4SAPIKeysFromEnv();
    
    // 初始化路由系统
    this.initRoutingSystems();
    
    // 4AI角色定义
    this.aiRoles = {
      'analysis': {
        name: '分析专家',
        description: '负责数据分析和问题诊断',
        preferredModels: ['deepseek-v3.2', 'gemini-3.1-pro-preview'],
        routingStrategy: 'balanced'
      },
      'design': {
        name: '架构设计师',
        description: '负责系统架构和技术方案设计',
        preferredModels: ['claude-opus-4.6', 'gpt-5.4'],
        routingStrategy: 'high-quality'
      },
      'implementation': {
        name: '实施工程师',
        description: '负责具体实现和代码生成',
        preferredModels: ['gpt-5.4', 'glm-5'],
        routingStrategy: 'cost-effective'
      },
      'optimization': {
        name: '优化专家',
        description: '负责性能优化和质量保证',
        preferredModels: ['deepseek-v3.2', 'gemini-3.1-pro-preview'],
        routingStrategy: 'fast'
      }
    };
    
    // 性能监控
    this.metrics = {
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      latencyStats: [],
      modelUsage: {}
    };
  }
  
  initDirectories() {
    const dirs = [this.dataDir, this.reportsDir, this.strategyDir];
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }
  
  load4SAPIKeysFromEnv() {
    // 从环境变量加载4SAPI密钥
    this.foursapiKeys = [];
    
    for (let i = 1; i <= 5; i++) {
      const key = process.env[`FOURSAPI_KEY_${i}`];
      if (key && key.trim()) {
        this.foursapiKeys.push(key.trim());
      }
    }
    
    this.foursapiBaseUrl = process.env.FOURSAPI_BASE_URL || 'https://4sapi.com/v1';
    
    console.log('🔑 加载的4SAPI配置:');
    console.log(`   基础URL: ${this.foursapiBaseUrl}`);
    console.log(`   可用密钥: ${this.foursapiKeys.length} 个`);
    
    if (this.foursapiKeys.length === 0) {
      console.warn('⚠️ 未找到有效的4SAPI密钥，将使用备用方案');
    }
  }
  
  initRoutingSystems() {
    // 可用的路由系统
    this.routingSystems = {
      'direct-4sapi': {
        name: '直接4SAPI调用',
        description: '直接HTTP调用4SAPI API',
        priority: 1,
        enabled: true
      },
      'openclaw-router': {
        name: 'OpenClaw路由系统',
        description: '通过OpenClaw系统路由调用',
        priority: 2,
        enabled: true
      },
      'fallback-local': {
        name: '本地回退',
        description: '本地模型回退方案',
        priority: 3,
        enabled: true
      }
    };
    
    // 模型映射
    this.modelMapping = {
      'deepseek-v3.2': {
        provider: '4sapi',
        modelId: 'deepseek-v3.2',
        fallback: 'volcengine/deepseek-v3-2-251201'
      },
      'gemini-3.1-pro-preview': {
        provider: '4sapi',
        modelId: 'gemini-3.1-pro-preview',
        fallback: null
      },
      'claude-opus-4.6': {
        provider: '4sapi',
        modelId: 'claude-opus-4.6',
        fallback: null
      },
      'gpt-5.4': {
        provider: '4sapi',
        modelId: 'gpt-5.4',
        fallback: null
      },
      'glm-5': {
        provider: '4sapi',
        modelId: 'glm-5',
        fallback: 'alibailian/glm-5'
      }
    };
  }
  
  /**
   * 智能路由选择器
   */
  selectRoute(role, modelPreference) {
    const roleConfig = this.aiRoles[role];
    const preferredModel = modelPreference || roleConfig.preferredModels[0];
    const modelConfig = this.modelMapping[preferredModel];
    
    // 检查4SAPI密钥可用性
    const sapiAvailable = this.foursapiKeys.length > 0;
    
    // 路由决策逻辑
    if (sapiAvailable && modelConfig && modelConfig.provider === '4sapi') {
      return {
        system: 'direct-4sapi',
        model: modelConfig.modelId,
        provider: '4sapi',
        key: this.getNext4SAPIKey(),
        strategy: 'primary'
      };
    } else if (modelConfig && modelConfig.fallback) {
      return {
        system: 'openclaw-router',
        model: modelConfig.fallback,
        provider: 'fallback',
        strategy: 'secondary'
      };
    } else {
      return {
        system: 'fallback-local',
        model: 'deepseek-v3.2',
        provider: 'local',
        strategy: 'emergency'
      };
    }
  }
  
  getNext4SAPIKey() {
    // 简单的轮询负载均衡
    if (this.foursapiKeys.length === 0) return null;
    
    const index = this.metrics.totalCalls % this.foursapiKeys.length;
    return this.foursapiKeys[index];
  }
  
  /**
   * 直接4SAPI调用
   */
  async call4SAPIDirect(model, prompt, options = {}) {
    const apiKey = options.key || this.getNext4SAPIKey();
    if (!apiKey) {
      throw new Error('没有可用的4SAPI密钥');
    }
    
    const requestData = {
      model: model,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: options.maxTokens || 1000,
      temperature: options.temperature || 0.7,
      ...options.extraParams
    };
    
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify(requestData);
      
      const url = new URL(this.foursapiBaseUrl + '/chat/completions');
      
      const requestOptions = {
        hostname: url.hostname,
        port: 443,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'Content-Length': Buffer.byteLength(postData)
        }
      };
      
      const startTime = Date.now();
      const req = https.request(requestOptions, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          const latency = Date.now() - startTime;
          
          try {
            const parsed = JSON.parse(data);
            
            // 更新指标
            this.updateMetrics({
              model: model,
              provider: '4sapi',
              success: res.statusCode === 200,
              latency: latency,
              tokensUsed: parsed.usage?.total_tokens || 0
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
              reject(new Error(`API错误: ${res.statusCode} - ${data.substring(0, 200)}`));
            }
          } catch (error) {
            reject(new Error(`响应解析失败: ${error.message}`));
          }
        });
      });
      
      req.on('error', (error) => {
        reject(new Error(`请求失败: ${error.message}`));
      });
      
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('请求超时'));
      });
      
      req.setTimeout(options.timeout || 30000);
      req.write(postData);
      req.end();
    });
  }
  
  /**
   * OpenClaw路由调用
   */
  async callOpenClawRouter(model, prompt, options = {}) {
    try {
      // 尝试使用OpenClaw CLI调用
      const command = `openclaw chat --model ${model} "${prompt.substring(0, 500)}"`;
      
      const startTime = Date.now();
      const { stdout, stderr } = await execAsync(command, {
        timeout: options.timeout || 15000
      });
      
      const latency = Date.now() - startTime;
      
      this.updateMetrics({
        model: model,
        provider: 'openclaw',
        success: true,
        latency: latency
      });
      
      return {
        success: true,
        content: stdout,
        model: model,
        latency: latency,
        method: 'openclaw-cli'
      };
      
    } catch (error) {
      // 记录失败
      this.updateMetrics({
        model: model,
        provider: 'openclaw',
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
    console.log(`\n🤖 ${this.aiRoles[role].name} 开始工作...`);
    console.log(`   任务: ${prompt.substring(0, 100)}...`);
    
    const route = this.selectRoute(role, options.modelPreference);
    console.log(`   路由选择: ${route.system} -> ${route.model}`);
    
    try {
      let result;
      
      switch (route.system) {
        case 'direct-4sapi':
          result = await this.call4SAPIDirect(route.model, prompt, {
            key: route.key,
            ...options
          });
          break;
          
        case 'openclaw-router':
          result = await this.callOpenClawRouter(route.model, prompt, options);
          break;
          
        case 'fallback-local':
          // 本地回退逻辑
          result = {
            success: true,
            content: `[本地回退] ${prompt.substring(0, 200)}...`,
            model: route.model,
            latency: 0,
            fallback: true
          };
          break;
          
        default:
          throw new Error(`未知的路由系统: ${route.system}`);
      }
      
      console.log(`   ✅ 完成 (${result.latency}ms)`);
      return {
        role: role,
        roleName: this.aiRoles[role].name,
        ...result,
        route: route
      };
      
    } catch (error) {
      console.log(`   ❌ 失败: ${error.message}`);
      
      // 尝试回退方案
      if (route.strategy === 'primary') {
        console.log('   尝试回退方案...');
        return await this.callAI(role, prompt, {
          ...options,
          forceFallback: true
        });
      }
      
      throw error;
    }
  }
  
  /**
   * 4AI协同工作流
   */
  async execute4AIWorkflow(taskDescription, context = {}) {
    console.log('\n🚀 启动4AI协同工作流');
    console.log('='.repeat(60));
    console.log(`任务: ${taskDescription}`);
    console.log('='.repeat(60));
    
    const workflowResults = {
      task: taskDescription,
      startTime: new Date().toISOString(),
      stages: {},
      finalResult: null
    };
    
    // 阶段1: 分析
    try {
      const analysisPrompt = `请分析以下任务: "${taskDescription}"
      
      分析要求:
      1. 理解任务的核心需求
      2. 识别关键技术难点
      3. 评估可行性
      4. 提出初步建议
      
      上下文信息: ${JSON.stringify(context, null, 2)}`;
      
      workflowResults.stages.analysis = await this.callAI('analysis', analysisPrompt);
      console.log('\n📊 分析完成');
    } catch (error) {
      console.error('分析阶段失败:', error.message);
      workflowResults.stages.analysis = { error: error.message };
    }
    
    // 阶段2: 设计
    try {
      const analysisResult = workflowResults.stages.analysis?.content || '';
      const designPrompt = `基于以下分析结果，设计解决方案:
      
      任务: ${taskDescription}
      分析结果: ${analysisResult}
      
      设计要求:
      1. 系统架构设计
      2. 技术栈选择
      3. 模块划分
      4. 接口定义`;
      
      workflowResults.stages.design = await this.callAI('design', designPrompt);
      console.log('🏗️  设计完成');
    } catch (error) {
      console.error('设计阶段失败:', error.message);
      workflowResults.stages.design = { error: error.message };
    }
    
    // 阶段3: 实施
    try {
      const designResult = workflowResults.stages.design?.content || '';
      const implementationPrompt = `基于以下设计，生成具体实现:
      
      任务: ${taskDescription}
      设计方案: ${designResult}
      
      实施要求:
      1. 代码框架
      2. 核心算法
      3. 配置说明
      4. 测试方案`;
      
      workflowResults.stages.implementation = await this.callAI('implementation', implementationPrompt);
      console.log('💻 实施完成');
    } catch (error) {
      console.error('实施阶段失败:', error.message);
      workflowResults.stages.implementation = { error: error.message };
    }
    
    // 阶段4: 优化
    try {
      const implementationResult = workflowResults.stages.implementation?.content || '';
      const optimizationPrompt = `优化以下实现方案:
      
      任务: ${taskDescription}
      实现方案: ${implementationResult}
      
      优化要求:
      1. 性能优化建议
      2. 安全性改进
      3. 可维护性提升
      4. 成本效益分析`;
      
      workflowResults.stages.optimization = await this.callAI('optimization', optimizationPrompt);
      console.log('⚡ 优化完成');
    } catch (error) {
      console.error('优化阶段失败:', error.message);
      workflowResults.stages.optimization = { error: error.message };
    }
    
    // 生成最终结果
    workflowResults.finalResult = this.synthesizeResults(workflowResults.stages);
    workflowResults.endTime = new Date().toISOString();
    workflowResults.metrics = this.getMetricsSummary();
    
    // 保存结果
    this.saveWorkflowResult(workflowResults);
    
    console.log('\n🎯 4AI工作流完成');
    console.log('='.repeat(60));
    console.log('性能指标:');
    console.log(`   总调用: ${this.metrics.totalCalls}`);
    console.log(`   成功: ${this.metrics.successfulCalls}`);
    console.log(`   失败: ${this.metrics.failedCalls}`);
    console.log(`   平均延迟: ${this.getAverageLatency()}ms`);
    
    return workflowResults;
  }
  
  synthesizeResults(stages) {
    const synthesis = Object.entries(stages)
      .filter(([_, result]) => result && !result.error)
      .map(([stage, result]) => `## ${stage.toUpperCase()}\n${result.content}`)
      .join('\n\n');
    
    return `# 4AI协同工作流结果汇总\n\n${synthesis}`;
  }
  
  updateMetrics(metric) {
    this.metrics.totalCalls++;
    
    if (metric.success) {
      this.metrics.successfulCalls++;
      this.metrics.latencyStats.push(metric.latency);
    } else {
      this.metrics.failedCalls++;
    }
    
    // 记录模型使用情况
    const modelKey = `${metric.provider}/${metric.model}`;
    if (!this.metrics.modelUsage[modelKey]) {
      this.metrics.modelUsage[modelKey] = 0;
    }
    this.metrics.modelUsage[modelKey]++;
  }
  
  getAverageLatency() {
    if (this.metrics.latencyStats.length === 0) return 0;
    const sum = this.metrics.latencyStats.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.metrics.latencyStats.length);
  }
  
  getMetricsSummary() {
    return {
      totalCalls: this.metrics.totalCalls,
      successRate: this.metrics.totalCalls > 0 
        ? (this.metrics.successfulCalls / this.metrics.totalCalls * 100).toFixed(2) + '%'
        : '0%',
      averageLatency: this.getAverageLatency() + 'ms',
      modelUsage: this.metrics.modelUsage
    };
  }
  
  saveWorkflowResult(result) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `workflow-result-${timestamp}.json`;
    const filepath = path.join(this.reportsDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(result, null, 2));
    console.log(`📄 结果已保存: ${filepath}`);
  }
  
  /**
   * 测试所有路由系统
   */
  async testAllRoutes() {
    console.log('\n🧪 测试所有路由系统...');
    
    const testPrompt = '这是一个路由系统测试，请回复"路由测试成功"';
    const testResults = [];
    
    // 测试4SAPI直接调用
    if (this.foursapiKeys.length > 0) {
      try {
        const result = await this.call4SAPIDirect('gpt-5.4', testPrompt, {
          maxTokens: 20,
          temperature: 0.1
        });
        testResults.push({
          system: 'direct-4sapi',
          status: '✅ 成功',
          latency: result.latency + 'ms',
          model: result.model
        });
      } catch (error) {
        testResults.push({
          system: 'direct-4sapi',
          status: '❌ 失败',
          error: error.message
        });
      }
    }
    
    // 测试OpenClaw路由
    try {
      const result = await this.callOpenClawRouter('deepseek-v3.2', testPrompt);
      testResults.push({
        system: 'openclaw-router',
        status: '✅ 成功',
        latency: result.latency + 'ms',
        model: result.model
      });
    } catch (error) {
      testResults.push({
        system: 'openclaw-router',
        status: '❌ 失败',
        error: error.message
      });
    }
    
    console.log('\n📊 路由测试结果:');
    console.table(testResults);
    
    return testResults;
  }
}

// 主程序
async function main() {
  const workflow = new OptimizedOMC4AIWorkflow();
  
  console.log('🚀 优化版OMC 4AI工作流系统');
  console.log('='.repeat(60));
  
  // 测试路由系统
  await workflow.testAllRoutes();
  
  // 示例工作流执行
  const exampleTask = '设计一个智能文件管理系统，支持多模态文件处理、自动化分类和智能搜索';
  
  console.log('\n' + '='.repeat(60));
  console.log('开始示例工作流执行...');
  
  try {
    const result = await workflow.execute4AIWorkflow(exampleTask, {
      priority: 'high',
      budget: 'standard',
      timeline: '2周'
    });
    
    console.log('\n✅ 工作流执行完成');
    console.log('最终结果已保存到报告目录');
    
    // 显示摘要
    console.log('\n📋 工作流摘要:');
    Object.keys(result.stages).forEach(stage => {
      const stageResult = result.stages[stage];
      console.log(`  ${stage}: ${stageResult.error ? '❌' : '✅'} ${stageResult.error || '完成'}`);
    });
    
  } catch (error) {
    console.error('工作流执行失败:', error);
  }
}

// 执行主程序
if (require.main === module) {
  main().catch(console.error);
}

module.exports = OptimizedOMC4AIWorkflow;