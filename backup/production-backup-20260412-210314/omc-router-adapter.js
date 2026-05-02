#!/usr/bin/env node
/**
 * OMC路由适配器 - 连接OMC工作流与OpenClaw路由系统
 * 第一阶段：基础路由适配层实现
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

class OMCRouterAdapter {
  constructor(config = {}) {
    this.workspace = '/root/.openclaw/workspace';
    this.configPath = path.join(this.workspace, 'models-config.json');
    this.routerConfigPath = path.join(this.workspace, 'omc-router-config.json');
    
    // 加载配置
    this.config = this.loadConfig(config);
    
    // 路由系统模拟（实际应调用真实的路由技能）
    this.routingSystems = this.initRoutingSystems();
    
    // 路由策略配置
    this.strategyConfig = {
      'fast': {
        priority: ['evolink', 'model'],
        timeout: 5000,
        description: '快速响应，适合简单任务'
      },
      'balanced': {
        priority: ['orchestrator', 'intelligent'],
        timeout: 10000,
        description: '平衡性能和质量，适合一般任务'
      },
      'high-quality': {
        priority: ['intelligent', 'orchestrator'],
        timeout: 15000,
        description: '高质量输出，适合复杂任务'
      },
      'cost-effective': {
        priority: ['adaptive', 'deterministic'],
        timeout: 8000,
        description: '成本优先，适合批量任务'
      }
    };
    
    // 性能监控
    this.metrics = {
      calls: 0,
      successes: 0,
      failures: 0,
      totalLatency: 0,
      byRouter: {},
      byStage: {}
    };
    
    // 日志
    this.logDir = path.join(this.workspace, 'logs', 'router');
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * 加载配置
   */
  loadConfig(userConfig) {
    const defaultConfig = {
      logLevel: 'info',
      enableMetrics: true,
      enableFallback: true,
      maxRetries: 3,
      defaultStrategy: 'balanced',
      stageStrategies: {
        'analysis': 'balanced',
        'design': 'high-quality',
        'generation': 'cost-effective',
        'review': 'balanced',
        'optimization': 'fast'
      }
    };
    
    // 从文件加载配置
    let fileConfig = {};
    if (fs.existsSync(this.routerConfigPath)) {
      try {
        fileConfig = JSON.parse(fs.readFileSync(this.routerConfigPath, 'utf8'));
      } catch (error) {
        console.warn('⚠️ 路由配置加载失败，使用默认配置:', error.message);
      }
    }
    
    // 加载模型配置
    let modelConfig = {};
    if (fs.existsSync(this.configPath)) {
      try {
        modelConfig = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
      } catch (error) {
        console.warn('⚠️ 模型配置加载失败:', error.message);
      }
    }
    
    return {
      ...defaultConfig,
      ...fileConfig,
      ...userConfig,
      modelConfig
    };
  }

  /**
   * 初始化路由系统（模拟实现）
   */
  initRoutingSystems() {
    // 这里模拟现有的6个路由技能
    return {
      // 1. adaptive-routing - 自适应路由
      adaptive: {
        name: 'adaptive-routing',
        description: '本地优先，云端备援',
        call: async (params) => await this.simulateAdaptiveRouting(params),
        priority: 1
      },
      
      // 2. model-routing - 模型路由
      model: {
        name: 'model-routing',
        description: '基于任务类型优化',
        call: async (params) => await this.simulateModelRouting(params),
        priority: 2
      },
      
      // 3. model-routing-orchestrator - 模型路由编排器
      orchestrator: {
        name: 'model-routing-orchestrator',
        description: '多维度优化',
        call: async (params) => await this.simulateOrchestratorRouting(params),
        priority: 3
      },
      
      // 4. oc-skill-router - Evolink智能路由
      evolink: {
        name: 'oc-skill-router',
        description: '支持Claude/GPT/Gemini/DeepSeek/Kimi',
        call: async (params) => await this.simulateEvolinkRouting(params),
        priority: 4
      },
      
      // 5. intelligent-router - 智能模型路由
      intelligent: {
        name: 'intelligent-router',
        description: '子代理任务委派',
        call: async (params) => await this.simulateIntelligentRouting(params),
        priority: 5
      },
      
      // 6. openclaw-model-router-skill - OpenClaw模型路由技能
      deterministic: {
        name: 'openclaw-model-router-skill',
        description: '确定性路由',
        call: async (params) => await this.simulateDeterministicRouting(params),
        priority: 6
      }
    };
  }

  /**
   * 统一模型调用接口
   */
  async unifiedCall(stage, prompt, options = {}) {
    const callId = this.generateCallId();
    const startTime = Date.now();
    
    this.log('info', `路由调用开始`, { callId, stage, promptLength: prompt.length });
    
    // 更新指标
    this.metrics.calls++;
    if (!this.metrics.byStage[stage]) {
      this.metrics.byStage[stage] = { calls: 0, successes: 0, totalLatency: 0 };
    }
    this.metrics.byStage[stage].calls++;
    
    try {
      // 1. 选择路由策略
      const strategy = this.selectStrategy(stage, options);
      
      // 2. 执行路由调用
      const result = await this.executeWithStrategy(strategy, {
        stage,
        prompt,
        callId,
        options
      });
      
      // 3. 计算延迟
      const latency = Date.now() - startTime;
      
      // 4. 记录成功
      this.recordSuccess(callId, stage, strategy.name, latency, result.model);
      
      this.log('info', `路由调用成功`, {
        callId,
        stage,
        strategy: strategy.name,
        latency,
        model: result.model
      });
      
      return {
        success: true,
        content: result.content,
        model: result.model,
        router: result.router,
        strategy: strategy.name,
        latency,
        callId
      };
      
    } catch (error) {
      // 5. 记录失败
      const latency = Date.now() - startTime;
      this.recordFailure(callId, stage, latency, error.message);
      
      this.log('error', `路由调用失败`, {
        callId,
        stage,
        latency,
        error: error.message
      });
      
      // 6. 降级调用（如果启用）
      if (this.config.enableFallback && options.retryOnFailure !== false) {
        try {
          return await this.fallbackCall(stage, prompt, options, callId);
        } catch (fallbackError) {
          this.log('error', `降级调用失败`, {
            callId,
            stage,
            error: fallbackError.message
          });
        }
      }
      
      throw error;
    }
  }

  /**
   * 选择路由策略
   */
  selectStrategy(stage, options) {
    // 如果指定了策略，使用指定策略
    if (options.strategy && this.strategyConfig[options.strategy]) {
      return {
        name: options.strategy,
        ...this.strategyConfig[options.strategy]
      };
    }
    
    // 根据阶段选择默认策略
    const strategyName = this.config.stageStrategies[stage] || this.config.defaultStrategy;
    
    return {
      name: strategyName,
      ...this.strategyConfig[strategyName]
    };
  }

  /**
   * 执行路由策略
   */
  async executeWithStrategy(strategy, context) {
    const { stage, prompt, callId, options } = context;
    const timeout = strategy.timeout || 10000;
    
    // 按优先级顺序尝试路由系统
    for (const routerName of strategy.priority) {
      const router = this.routingSystems[routerName];
      if (!router) {
        this.log('warn', `路由系统不存在`, { routerName });
        continue;
      }
      
      try {
        const result = await this.callWithTimeout(
          router.call.bind(router),
          {
            stage,
            prompt,
            options,
            callId,
            routerName: router.name
          },
          timeout
        );
        
        return {
          ...result,
          router: router.name
        };
        
      } catch (error) {
        this.log('warn', `路由调用失败`, {
          router: router.name,
          stage,
          error: error.message
        });
        continue;
      }
    }
    
    throw new Error(`所有路由策略都失败: ${strategy.priority.join(', ')}`);
  }

  /**
   * 带超时的调用
   */
  callWithTimeout(fn, params, timeout) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`调用超时 (${timeout}ms)`));
      }, timeout);
      
      fn(params)
        .then(result => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  /**
   * 降级调用
   */
  async fallbackCall(stage, prompt, options, callId) {
    this.log('info', `开始降级调用`, { callId, stage });
    
    // 降级策略：使用更简单但更可靠的路由
    const fallbackStrategy = {
      name: 'fallback',
      priority: ['deterministic', 'adaptive'],
      timeout: 15000
    };
    
    try {
      const result = await this.executeWithStrategy(fallbackStrategy, {
        stage,
        prompt,
        callId,
        options: { ...options, simpleMode: true }
      });
      
      this.log('info', `降级调用成功`, { callId, stage, router: result.router });
      
      return {
        ...result,
        fallback: true,
        strategy: 'fallback'
      };
      
    } catch (error) {
      throw new Error(`降级调用失败: ${error.message}`);
    }
  }

  /**
   * 模拟路由系统实现
   */
  
  // 模拟 adaptive-routing
  async simulateAdaptiveRouting(params) {
    await this.simulateDelay(100, 500);
    
    // 基于配置选择模型
    const models = this.getAvailableModels();
    const model = this.selectModelByPriority(models, ['deepseek-v3.2', 'qwen3.6-plus', 'glm-5']);
    
    return {
      content: `[adaptive-routing] ${params.prompt.substring(0, 100)}...`,
      model: model,
      latency: Math.floor(Math.random() * 300) + 100
    };
  }

  // 模拟 model-routing
  async simulateModelRouting(params) {
    await this.simulateDelay(200, 800);
    
    const stage = params.stage;
    const modelMap = {
      'analysis': ['gemini-3.1-pro-preview', 'deepseek-v3.2'],
      'design': ['claude-opus-4.6', 'gpt-5.4'],
      'generation': ['gpt-5.4', 'gemini-3.1-pro-preview'],
      'review': ['deepseek-v3.2', 'claude-opus-4.6'],
      'optimization': ['deepseek-v3.2', 'claude-opus-4.6']
    };
    
    const models = modelMap[stage] || ['deepseek-v3.2'];
    const model = models[0];
    
    return {
      content: `[model-routing:${stage}] ${params.prompt.substring(0, 100)}...`,
      model: model,
      latency: Math.floor(Math.random() * 500) + 200
    };
  }

  // 模拟 model-routing-orchestrator
  async simulateOrchestratorRouting(params) {
    await this.simulateDelay(300, 1200);
    
    // 多维度决策模拟
    const decision = this.makeOrchestratorDecision(params);
    
    return {
      content: `[orchestrator] 多维度优化决策: ${decision.model}\n${params.prompt.substring(0, 80)}...`,
      model: decision.model,
      factors: decision.factors,
      latency: Math.floor(Math.random() * 800) + 300
    };
  }

  // 模拟 oc-skill-router (Evolink)
  async simulateEvolinkRouting(params) {
    await this.simulateDelay(150, 600);
    
    const model = this.selectModelByPriority(
      this.getAvailableModels(),
      ['claude-opus-4.6', 'gpt-5.4', 'gemini-3.1-pro-preview', 'deepseek-v3.2', 'moonshot-v1-128k']
    );
    
    return {
      content: `[evolink] 多模型平台支持: ${model}\n${params.prompt.substring(0, 90)}...`,
      model: model,
      latency: Math.floor(Math.random() * 400) + 150
    };
  }

  // 模拟 intelligent-router
  async simulateIntelligentRouting(params) {
    await this.simulateDelay(400, 1500);
    
    // 模拟任务分解和委派
    const subTasks = this.decomposeTask(params.prompt);
    
    return {
      content: `[intelligent-router] 任务分解为 ${subTasks.length} 个子任务\n${params.prompt.substring(0, 70)}...`,
      model: 'multi-agent-system',
      subTasks: subTasks,
      latency: Math.floor(Math.random() * 1000) + 400
    };
  }

  // 模拟 openclaw-model-router-skill
  async simulateDeterministicRouting(params) {
    await this.simulateDelay(50, 300);
    
    // 确定性路由：总是选择相同的模型
    const model = 'deepseek-v3.2'; // 默认确定性选择
    
    return {
      content: `[deterministic] 确定性路由选择: ${model}\n${params.prompt.substring(0, 120)}...`,
      model: model,
      latency: Math.floor(Math.random() * 200) + 50
    };
  }

  /**
   * 辅助方法
   */
  
  simulateDelay(min, max) {
    const delay = Math.floor(Math.random() * (max - min)) + min;
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  getAvailableModels() {
    const config = this.config.modelConfig;
    if (!config || !config.modelConfig || !config.modelConfig.providers) {
      return ['deepseek-v3.2', 'gemini-3.1-pro-preview', 'claude-opus-4.6', 'gpt-5.4'];
    }
    
    const models = [];
    Object.values(config.modelConfig.providers).forEach(provider => {
      if (provider.models) {
        provider.models.forEach(model => {
          models.push(model.id);
        });
      }
    });
    
    return [...new Set(models)];
  }

  selectModelByPriority(models, priorityList) {
    for (const preferredModel of priorityList) {
      if (models.includes(preferredModel)) {
        return preferredModel;
      }
    }
    return models[0] || 'deepseek-v3.2';
  }

  makeOrchestratorDecision(params) {
    // 模拟多维度决策
    const factors = {
      cost: Math.random() * 0.1,
      latency: Math.random() * 1000,
      quality: 0.7 + Math.random() * 0.3,
      availability: 0.8 + Math.random() * 0.2
    };
    
    // 根据因子选择模型
    const models = this.getAvailableModels();
    let selectedModel = models[0];
    
    if (factors.cost < 0.05) {
      selectedModel = this.selectModelByPriority(models, ['deepseek-v3.2', 'qwen3.6-plus']);
    } else if (factors.quality > 0.9) {
      selectedModel = this.selectModelByPriority(models, ['claude-opus-4.6', 'gpt-5.4']);
    } else if (factors.latency < 300) {
      selectedModel = this.selectModelByPriority(models, ['gemini-3.1-pro-preview', 'gpt-5.4']);
    }
    
    return {
      model: selectedModel,
      factors: factors
    };
  }

  decomposeTask(prompt) {
    const words = prompt.split(/\s+/);
    const chunkSize = Math.ceil(words.length / 3);
    const subTasks = [];
    
    for (let i = 0; i < words.length; i += chunkSize) {
      subTasks.push(words.slice(i, i + chunkSize).join(' '));
    }
    
    return subTasks.slice(0, 3); // 最多3个子任务
  }

  generateCallId() {
    return `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  recordSuccess(callId, stage, strategy, latency, model) {
    this.metrics.successes++;
    this.metrics.totalLatency += latency;
    
    if (!this.metrics.byStage[stage]) {
      this.metrics.byStage[stage] = { calls: 0, successes: 0, totalLatency: 0 };
    }
    this.metrics.byStage[stage].successes++;
    this.metrics.byStage[stage].totalLatency += latency;
    
    // 按路由器记录
    if (!this.metrics.byRouter[strategy]) {
      this.metrics.byRouter[strategy] = { calls: 0, successes: 0, totalLatency: 0 };
    }
    this.metrics.byRouter[strategy].calls++;
    this.metrics.byRouter[strategy].successes++;
    this.metrics.byRouter[strategy].totalLatency += latency;
  }

  recordFailure(callId, stage, latency, error) {
    this.metrics.failures++;
    this.metrics.totalLatency += latency;
    
    if (!this.metrics.byStage[stage]) {
      this.metrics.byStage[stage] = { calls: 0, successes: 0, totalLatency: 0 };
    }
    this.metrics.byStage[stage].totalLatency += latency;
  }

  log(level, message, data = {}) {
    if (!this.config.logLevel) return;
    
    const logLevels = { 'error': 0, 'warn': 1, 'info': 2, 'debug': 3 };
    const currentLevel = logLevels[this.config.logLevel] || 2;
    const messageLevel = logLevels[level] || 2;
    
    if (messageLevel <= currentLevel) {
      const timestamp = new Date().toISOString();
      const logEntry = {
        timestamp,
        level,
        message,
        ...data
      };
      
      // 控制台输出
      const color = {
        'error': '\x1b[31m', // 红色
        'warn': '\x1b[33m',  // 黄色
        'info': '\x1b[36m',  // 青色
        'debug': '\x1b[90m'  // 灰色
      }[level] || '\x1b[0m';
      
      console.log(`${color}[${timestamp}] ${level.toUpperCase()}: ${message}\x1b[0m`);
      
      // 文件日志
      if (this.config.enableFileLogging !== false) {
        try {
          const logFile = path.join(this.logDir, `${timestamp.substr(0, 10)}.log`);
          fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n', 'utf8');
        } catch (error) {
          // 文件日志失败时不中断
        }
      }
    }
  }

  /**
   * 获取性能指标
   */
  getMetrics() {
    const successRate = this.metrics.calls > 0 
      ? (this.metrics.successes / this.metrics.calls) * 100 
      : 0;
    
    const avgLatency = this.metrics.successes > 0
      ? this.metrics.totalLatency / this.metrics.successes
      : 0;
    
    return {
      calls: this.metrics.calls,
      successes: this.metrics.successes,
      failures: this.metrics.failures,
      successRate: `${successRate.toFixed(2)}%`,
      avgLatency: `${avgLatency.toFixed(0)}ms`,
      byStage: this.metrics.byStage,
      byRouter: this.metrics.byRouter
    };
  }

  /**
   * 生成配置模板
   */
  generateConfigTemplate() {
    const template = {
      logLevel: 'info',
      enableMetrics: true,
      enableFallback: true,
      maxRetries: 3,
      defaultStrategy: 'balanced',
      stageStrategies: {
        'analysis': 'balanced',
        'design': 'high-quality',
        'generation': 'cost-effective',
        'review': 'balanced',
        'optimization': 'fast'
      },
      strategyConfig: this.strategyConfig,
      routingSystems: Object.keys(this.routingSystems)
    };
    
    return template;
  }
}

/**
 * 集成OMC工作流的示例
 */
class OMCEnhancedWithRouter {
  constructor() {
    this.router = new OMCRouterAdapter();
    this.stages = ['analysis', 'design', 'generation', 'review', 'optimization'];
  }
  
  async executeWorkflow(input, options = {}) {
    console.log('🚀 启动OMC路由集成工作流...');
    
    const results = {
      input: input.substring(0, 100) + (input.length > 100 ? '...' : ''),
      stages: {},
      routingMetrics: null,
      timestamp: new Date().toISOString()
    };
    
    const startTime = Date.now();
    
    // 按阶段执行，每个阶段使用路由系统
    for (const stage of this.stages) {
      console.log(`\n📋 ${stage}阶段 (使用智能路由)...`);
      
      try {
        const stageStartTime = Date.now();
        
        // 构建阶段特定的提示词
        const prompt = this.buildStagePrompt(stage, input, results);
        
        // 通过路由系统调用
        const stageResult = await this.router.unifiedCall(stage, prompt, {
          strategy: options[`${stage}Strategy`],
          maxTokens: this.getStageMaxTokens(stage),
          temperature: this.getStageTemperature(stage)
        });
        
        results.stages[stage] = {
          success: true,
          content: stageResult.content,
          model: stageResult.model,
          router: stageResult.router,
          strategy: stageResult.strategy,
          stageLatency: stageResult.latency,
          totalLatency: Date.now() - stageStartTime
        };
        
        console.log(`  ✅ ${stage}完成 - 使用模型: ${stageResult.model}, 路由器: ${stageResult.router}`);
        
      } catch (error) {
        results.stages[stage] = {
          success: false,
          error: error.message,
          stageLatency: Date.now() - startTime
        };
        
        console.log(`  ❌ ${stage}失败: ${error.message}`);
        
        if (options.failFast) {
          throw error;
        }
      }
    }
    
    // 获取路由指标
    results.routingMetrics = this.router.getMetrics();
    results.totalLatency = Date.now() - startTime;
    results.successRate = this.calculateSuccessRate(results.stages);
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 OMC路由集成工作流完成!');
    console.log('='.repeat(60));
    console.log(`总耗时: ${results.totalLatency}ms`);
    console.log(`成功率: ${results.successRate}%`);
    console.log(`路由调用: ${results.routingMetrics.calls}次`);
    console.log(`平均延迟: ${results.routingMetrics.avgLatency}`);
    
    return results;
  }
  
  buildStagePrompt(stage, input, context) {
    const prompts = {
      'analysis': `请分析以下代码需求，识别技术栈、复杂度、关键组件：
需求: ${input}`,
      
      'design': `基于需求分析，设计系统架构。考虑可扩展性、性能、安全性：
需求: ${input}
分析: ${context.stages.analysis?.content || '无'}`,
      
      'generation': `根据架构设计，生成高质量的代码实现。注意代码规范和最佳实践：
需求: ${input}
设计: ${context.stages.design?.content || '无'}`,
      
      'review': `审查生成的代码，识别潜在问题，提供改进建议：
代码: ${context.stages.generation?.content?.substring(0, 500) || '无'}`,
      
      'optimization': `优化代码性能、可读性和可维护性：
代码: ${context.stages.generation?.content?.substring(0, 500) || '无'}`
    };
    
    return prompts[stage] || input;
  }
  
  getStageMaxTokens(stage) {
    const tokens = {
      'analysis': 1000,
      'design': 1500,
      'generation': 2000,
      'review': 1200,
      'optimization': 1000
    };
    return tokens[stage] || 1000;
  }
  
  getStageTemperature(stage) {
    const temps = {
      'analysis': 0.3,
      'design': 0.2,
      'generation': 0.1,
      'review': 0.4,
      'optimization': 0.3
    };
    return temps[stage] || 0.3;
  }
  
  calculateSuccessRate(stages) {
    const successfulStages = Object.values(stages).filter(s => s.success).length;
    return ((successfulStages / Object.keys(stages).length) * 100).toFixed(1);
  }
}

// CLI支持
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('使用方式:');
    console.log('  1. 测试路由适配器: node omc-router-adapter.js test');
    console.log('  2. 生成配置模板: node omc-router-adapter.js config');
    console.log('  3. 运行集成示例: node omc-router-adapter.js run "你的需求"');
    process.exit(0);
  }
  
  const command = args[0];
  
  if (command === 'test') {
    // 测试路由适配器
    const router = new OMCRouterAdapter();
    
    console.log('🧪 测试路由适配器...');
    console.log('可用的路由系统:');
    Object.values(router.routingSystems).forEach(sys => {
      console.log(`  ${sys.name}: ${sys.description}`);
    });
    
    console.log('\n路由策略配置:');
    Object.entries(router.strategyConfig).forEach(([name, config]) => {
      console.log(`  ${name}: ${config.description} (优先级: ${config.priority.join(' > ')})`);
    });
    
    // 测试调用
    console.log('\n🚀 测试路由调用...');
    router.unifiedCall('analysis', '测试路由调用功能', { strategy: 'fast' })
      .then(result => {
        console.log('✅ 测试成功:');
        console.log(`  模型: ${result.model}`);
        console.log(`  路由器: ${result.router}`);
        console.log(`  策略: ${result.strategy}`);
        console.log(`  延迟: ${result.latency}ms`);
        
        console.log('\n📊 性能指标:');
        const metrics = router.getMetrics();
        console.log(`  调用次数: ${metrics.calls}`);
        console.log(`  成功率: ${metrics.successRate}`);
        console.log(`  平均延迟: ${metrics.avgLatency}`);
      })
      .catch(error => {
        console.error('❌ 测试失败:', error.message);
      });
    
  } else if (command === 'config') {
    // 生成配置模板
    const router = new OMCRouterAdapter();
    const template = router.generateConfigTemplate();
    
    const configPath = path.join(process.cwd(), 'omc-router-config.json');
    fs.writeFileSync(configPath, JSON.stringify(template, null, 2), 'utf8');
    console.log(`✅ 配置模板已生成: ${configPath}`);
    
  } else if (command === 'run') {
    // 运行集成示例
    const input = args.slice(1).join(' ') || '创建一个用户登录组件，包含前端React组件和后端API';
    
    console.log(`🚀 运行OMC路由集成示例...`);
    console.log(`输入: ${input}`);
    
    const workflow = new OMCEnhancedWithRouter();
    
    workflow.executeWorkflow(input, {
      analysisStrategy: 'balanced',
      designStrategy: 'high-quality',
      generationStrategy: 'cost-effective',
      reviewStrategy: 'balanced',
      optimizationStrategy: 'fast'
    })
    .then(results => {
      console.log('\n📋 阶段结果摘要:');
      Object.entries(results.stages).forEach(([stage, stageResult]) => {
        if (stageResult.success) {
          console.log(`  ${stage}: ✅ ${stageResult.model} (${stageResult.router})`);
        } else {
          console.log(`  ${stage}: ❌ ${stageResult.error}`);
        }
      });
      
      console.log('\n🎯 建议下一步:');
      console.log('  1. 查看详细日志: logs/router/ 目录');
      console.log('  2. 调整路由策略配置');
      console.log('  3. 集成到实际的OMC工作流');
    })
    .catch(error => {
      console.error('❌ 工作流执行失败:', error.message);
    });
    
  } else {
    console.log('❌ 未知命令，请使用: test, config, 或 run');
    process.exit(1);
  }
}

module.exports = {
  OMCRouterAdapter,
  OMCEnhancedWithRouter
};