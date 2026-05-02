#!/usr/bin/env node
/**
 * OMC工作流增强版 - 集成智能路由系统
 * 生产环境部署版本
 */

const { OMCRouterAdapter } = require('./omc-router-adapter');
const fs = require('fs');
const path = require('path');

class OMCWorkflowEnhanced {
  constructor(configPath = 'omc-production-config.json') {
    this.workspace = '/root/.openclaw/workspace';
    
    // 加载生产配置
    this.config = this.loadProductionConfig(configPath);
    
    // 初始化路由适配器
    this.router = new OMCRouterAdapter(this.config);
    
    // 工作流阶段
    this.stages = ['analysis', 'design', 'generation', 'review', 'optimization'];
    
    // 日志目录
    this.logDir = path.join(this.workspace, 'logs', 'production');
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
    
    console.log('🚀 OMC增强工作流启动 (生产环境)');
    console.log('配置加载:', this.config.environment || 'production');
  }
  
  loadProductionConfig(configPath) {
    const defaultConfig = {
      logLevel: 'info',
      enableMetrics: true,
      enableFallback: true,
      maxRetries: 3,
      environment: 'production',
      deploymentTime: new Date().toISOString()
    };
    
    try {
      if (fs.existsSync(configPath)) {
        const fileConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        return { ...defaultConfig, ...fileConfig };
      }
    } catch (error) {
      console.warn('⚠️ 配置文件加载失败，使用默认配置:', error.message);
    }
    
    return defaultConfig;
  }
  
  async executeWorkflow(input, options = {}) {
    console.log('\n📋 OMC增强工作流执行开始');
    console.log('输入:', input.substring(0, 100) + (input.length > 100 ? '...' : ''));
    
    const results = {
      workflowId: `wf_${Date.now()}`,
      input: input,
      stages: {},
      startTime: new Date().toISOString()
    };
    
    const startTime = Date.now();
    
    // 按阶段执行
    for (const stage of this.stages) {
      const stageStartTime = Date.now();
      console.log(`\n🔍 ${stage}阶段...`);
      
      try {
        // 构建阶段提示词
        const prompt = this.buildStagePrompt(stage, input, results);
        
        // 调用统一路由接口
        const stageResult = await this.router.unifiedCall(stage, prompt, {
          strategy: options.strategy || this.config.stageStrategies?.[stage]?.strategy || 'balanced',
          maxTokens: this.getStageMaxTokens(stage),
          temperature: this.getStageTemperature(stage)
        });
        
        results.stages[stage] = {
          success: true,
          content: stageResult.content,
          model: stageResult.model,
          router: stageResult.router,
          strategy: stageResult.strategy,
          latency: stageResult.latency,
          stageDuration: Date.now() - stageStartTime
        };
        
        console.log(`  ✅ ${stage}完成 - 模型: ${stageResult.model}, 路由器: ${stageResult.router}`);
        
      } catch (error) {
        results.stages[stage] = {
          success: false,
          error: error.message,
          stageDuration: Date.now() - stageStartTime
        };
        
        console.log(`  ❌ ${stage}失败: ${error.message}`);
        
        // 记录错误日志
        this.logError(stage, error, input);
        
        if (options.failFast) {
          throw error;
        }
      }
    }
    
    // 计算指标
    results.metrics = this.calculateMetrics(results, startTime);
    results.endTime = new Date().toISOString();
    
    // 保存结果
    this.saveResults(results);
    
    // 输出摘要
    this.printSummary(results);
    
    return results;
  }
  
  buildStagePrompt(stage, input, context) {
    const prompts = {
      'analysis': `分析以下代码需求:
需求: ${input}

请识别技术栈、复杂度、关键组件。`,
      
      'design': `设计系统架构:
需求: ${input}
分析: ${context.stages.analysis?.content?.substring(0, 300) || '无'}

考虑可扩展性、安全性、性能。`,
      
      'generation': `生成代码实现:
需求: ${input}
设计: ${context.stages.design?.content?.substring(0, 300) || '无'}

要求代码规范和最佳实践。`,
      
      'review': `代码审查:
代码: ${context.stages.generation?.content?.substring(0, 500) || '无'}

审查代码质量和潜在问题。`,
      
      'optimization': `性能优化:
代码: ${context.stages.generation?.content?.substring(0, 500) || '无'}

优化性能、可读性、维护性。`
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
  
  logError(stage, error, input) {
    const errorLog = {
      timestamp: new Date().toISOString(),
      stage: stage,
      error: error.message,
      input: input.substring(0, 200)
    };
    
    const errorFile = path.join(this.logDir, `errors-${new Date().toISOString().substr(0, 10)}.log`);
    fs.appendFileSync(errorFile, JSON.stringify(errorLog) + '\n', 'utf8');
  }
  
  calculateMetrics(results, startTime) {
    const successfulStages = Object.values(results.stages).filter(s => s.success).length;
    const totalStages = Object.keys(results.stages).length;
    const successRate = (successfulStages / totalStages) * 100;
    
    const totalDuration = Date.now() - startTime;
    
    return {
      successRate: `${successRate.toFixed(1)}%`,
      totalDuration: `${totalDuration}ms`,
      successfulStages,
      totalStages
    };
  }
  
  saveResults(results) {
    const resultsFile = path.join(this.logDir, `results-${results.workflowId}.json`);
    fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2), 'utf8');
    console.log(`💾 结果已保存: ${resultsFile}`);
  }
  
  printSummary(results) {
    console.log('\n' + '='.repeat(60));
    console.log('🎉 OMC增强工作流执行完成!');
    console.log('='.repeat(60));
    
    console.log(`📊 执行结果:`);
    console.log(`  工作流ID: ${results.workflowId}`);
    console.log(`  总耗时: ${results.metrics.totalDuration}`);
    console.log(`  成功率: ${results.metrics.successRate}`);
    console.log(`  成功阶段: ${results.metrics.successfulStages}/${results.metrics.totalStages}`);
    
    console.log('\n🔍 阶段详情:');
    Object.entries(results.stages).forEach(([stage, data]) => {
      if (data.success) {
        console.log(`  ${stage}: ✅ ${data.model} (${data.router}) - ${data.stageDuration}ms`);
      } else {
        console.log(`  ${stage}: ❌ ${data.error}`);
      }
    });
    
    // 路由性能指标
    const routerMetrics = this.router.getMetrics();
    console.log('\n📈 路由性能指标:');
    console.log(`  总调用: ${routerMetrics.calls}次`);
    console.log(`  成功率: ${routerMetrics.successRate}`);
    console.log(`  平均延迟: ${routerMetrics.avgLatency}`);
  }
}

// CLI支持
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('使用方式: node omc-workflow-enhanced.js "需求描述"');
    console.log('示例: node omc-workflow-enhanced.js "创建用户登录系统"');
    console.log('选项: --strategy=balanced|fast|high-quality|cost-effective');
    process.exit(0);
  }
  
  const workflow = new OMCWorkflowEnhanced();
  
  // 解析选项
  const options = {};
  const inputArgs = [];
  
  args.forEach(arg => {
    if (arg.startsWith('--strategy=')) {
      options.strategy = arg.split('=')[1];
    } else {
      inputArgs.push(arg);
    }
  });
  
  const input = inputArgs.join(' ');
  
  workflow.executeWorkflow(input, options)
    .then(() => {
      console.log('\n🚀 生产部署验证完成!');
      console.log('   系统已就绪，可以使用增强工作流。');
    })
    .catch(error => {
      console.error('❌ 工作流执行失败:', error.message);
      process.exit(1);
    });
}

module.exports = OMCWorkflowEnhanced;