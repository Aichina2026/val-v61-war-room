/**
 * OMC工作流 - 真实路由集成版
 * 使用OpenClaw智能路由系统调用原生API大模型
 */

const RealOpenClawRouter = require('./real-openclaw-router');

class OMCWorkflowRoutingIntegrated {
  constructor() {
    this.router = new RealOpenClawRouter();
    this.stages = ['analysis', 'design', 'generation', 'review', 'optimization'];
  }
  
  async execute(input, options = {}) {
    console.log('🚀 OMC工作流 - 真实路由集成版');
    console.log('='.repeat(50));
    console.log('输入:', input.substring(0, 80) + (input.length > 80 ? '...' : ''));
    console.log('使用路由系统: OpenClaw智能路由');
    console.log('='.repeat(50));
    
    const results = {
      input: input,
      stages: {},
      summary: {
        startTime: Date.now(),
        successCount: 0,
        totalLatency: 0
      }
    };
    
    for (const stage of this.stages) {
      console.log(`\n📋 ${stage}阶段: 调用OpenClaw路由...`);
      
      const stageStart = Date.now();
      
      try {
        const prompt = this.buildStagePrompt(stage, input, results);
        const routeResult = await this.router.unifiedRoute(stage, prompt, {
          maxTokens: this.getStageMaxTokens(stage),
          temperature: this.getStageTemperature(stage),
          strategy: options.strategy || 'balanced'
        });
        
        results.stages[stage] = {
          success: routeResult.success,
          content: routeResult.content,
          model: routeResult.model,
          routerSkill: routeResult.routerSkill,
          latency: routeResult.latency,
          method: routeResult.method
        };
        
        if (routeResult.success) {
          results.summary.successCount++;
          results.summary.totalLatency += routeResult.latency;
          console.log(`  ✅ 成功: ${routeResult.model} (${routeResult.routerSkill}) - ${routeResult.latency}ms`);
        } else {
          console.log(`  ⚠️ 降级: ${routeResult.model} - ${routeResult.latency}ms`);
        }
        
      } catch (error) {
        results.stages[stage] = {
          success: false,
          error: error.message,
          latency: Date.now() - stageStart
        };
        console.log(`  ❌ 失败: ${error.message}`);
      }
    }
    
    // 计算总结
    results.summary.totalTime = Date.now() - results.summary.startTime;
    results.summary.successRate = (results.summary.successCount / this.stages.length * 100).toFixed(1) + '%';
    results.summary.avgLatency = results.summary.successCount > 0 
      ? (results.summary.totalLatency / results.summary.successCount).toFixed(0) + 'ms'
      : 'N/A';
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 工作流完成!');
    console.log('='.repeat(50));
    console.log(`总耗时: ${results.summary.totalTime}ms`);
    console.log(`成功率: ${results.summary.successRate}`);
    console.log(`平均延迟: ${results.summary.avgLatency}`);
    console.log(`完成阶段: ${results.summary.successCount}/${this.stages.length}`);
    
    return results;
  }
  
  buildStagePrompt(stage, input, context) {
    const prompts = {
      'analysis': `分析代码需求: ${input}`,
      'design': `设计系统架构: ${input}`,
      'generation': `生成代码实现: ${input}`,
      'review': `审查代码质量`,
      'optimization': `优化代码性能`
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
}

// 测试运行
if (require.main === module) {
  const args = process.argv.slice(2);
  const input = args.join(' ') || '创建一个用户登录系统';
  
  console.log('🧪 测试真实路由集成工作流...\n');
  
  const workflow = new OMCWorkflowRoutingIntegrated();
  
  workflow.execute(input, {
    strategy: 'balanced'
  })
  .then(results => {
    console.log('\n📋 详细结果:');
    Object.entries(results.stages).forEach(([stage, stageResult]) => {
      const status = stageResult.success ? '✅' : stageResult.fallback ? '⚠️' : '❌';
      console.log(`  ${stage}: ${status} ${stageResult.model} (${stageResult.routerSkill}) - ${stageResult.latency}ms`);
    });
    
    console.log('\n🎯 下一步:');
    console.log('  1. 集成到现有OMC工作流项目');
    console.log('  2. 配置路由策略优化');
    console.log('  3. 部署监控和告警');
  })
  .catch(error => {
    console.error('❌ 工作流执行失败:', error.message);
  });
}

module.exports = OMCWorkflowRoutingIntegrated;