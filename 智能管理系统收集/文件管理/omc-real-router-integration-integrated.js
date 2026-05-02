#!/usr/bin/env node
/**
 * OMC真实路由集成 - 使用OpenClaw智能路由系统
 * 完全集成OpenClaw路由，替换所有直接API调用
 */

const fs = require('fs');
const path = require('path');
const RealOpenClawRouter = require('./real-openclaw-router');

class OMCRealRouterIntegrationIntegrated {
  constructor(config = {}) {
    this.workspace = '/root/.openclaw/workspace';
    this.configPath = path.join(this.workspace, 'models-config.json');
    
    // 加载配置（保留用于参考）
    this.config = this.loadConfig(config);
    
    // 初始化OpenClaw真实路由调用器
    this.router = new RealOpenClawRouter();
    
    // 路由策略映射
    this.strategyMapping = {
      'fast': 'fast',
      'balanced': 'balanced', 
      'high-quality': 'quality',
      'cost-effective': 'cost'
    };
    
    // 性能监控
    this.metrics = {
      calls: 0,
      successes: 0,
      failures: 0,
      fallbacks: 0,
      totalLatency: 0,
      avgLatency: 0
    };
    
    // 报告目录
    this.reportDir = path.join(this.workspace, 'omc-real-router-integrated-reports');
    if (!fs.existsSync(this.reportDir)) {
      fs.mkdirSync(this.reportDir, { recursive: true });
    }
  }
  
  /**
   * 加载配置
   */
  loadConfig(userConfig) {
    try {
      if (fs.existsSync(this.configPath)) {
        const configData = fs.readFileSync(this.configPath, 'utf8');
        const fileConfig = JSON.parse(configData);
        return { ...fileConfig, ...userConfig };
      }
    } catch (error) {
      console.warn(`⚠️ 加载配置文件失败: ${error.message}`);
    }
    
    return {
      ...this.getDefaultConfig(),
      ...userConfig
    };
  }
  
  /**
   * 获取默认配置
   */
  getDefaultConfig() {
    return {
      openclawRouting: {
        enabled: true,
        gatewayUrl: 'http://localhost:18789',
        skills: [
          'adaptive-routing',
          'model-routing',
          'model-routing-orchestrator',
          'oc-skill-router',
          'intelligent-router',
          'openclaw-model-router-skill'
        ]
      }
    };
  }
  
  /**
   * 更新监控指标
   */
  updateMetrics(result) {
    this.metrics.calls++;
    
    if (result.success) {
      this.metrics.successes++;
    } else if (result.fallback) {
      this.metrics.fallbacks++;
    } else {
      this.metrics.failures++;
    }
    
    this.metrics.totalLatency += result.latency || 0;
    this.metrics.avgLatency = this.metrics.successes > 0 
      ? this.metrics.totalLatency / this.metrics.successes 
      : 0;
  }
  
  /**
   * 统一路由调用接口
   */
  async routeRequest(stage, prompt, options = {}) {
    console.log(`🔗 路由请求: ${stage}`);
    console.log(`   策略: ${options.strategy || 'balanced'}`);
    console.log(`   提示: ${prompt.substring(0, 80)}${prompt.length > 80 ? '...' : ''}`);
    
    const startTime = Date.now();
    
    try {
      // 映射策略名称
      const routingStrategy = this.strategyMapping[options.strategy] || options.strategy || 'balanced';
      
      const result = await this.router.unifiedRoute(stage, prompt, {
        strategy: routingStrategy,
        maxTokens: options.maxTokens || 2000,
        temperature: options.temperature || 0.3,
        ...options
      });
      
      // 更新指标
      this.updateMetrics(result);
      
      return {
        success: true,
        stage: stage,
        content: result.content,
        model: result.model,
        routerSkill: result.routerSkill,
        method: result.method,
        latency: result.latency,
        fullLatency: Date.now() - startTime,
        rawResult: result
      };
      
    } catch (error) {
      this.metrics.failures++;
      
      return {
        success: false,
        stage: stage,
        error: error.message,
        latency: Date.now() - startTime
      };
    }
  }
  
  /**
   * 执行完整的OMC工作流
   */
  async executeOMCWorkflow(task, options = {}) {
    console.log('🚀 执行OMC真实路由集成工作流');
    console.log(`🌐 使用OpenClaw智能路由系统`);
    console.log(`📝 任务: ${task.substring(0, 100)}${task.length > 100 ? '...' : ''}`);
    console.log('='.repeat(60));
    
    const workflowId = `omc-real-router-${Date.now()}`;
    const results = {
      id: workflowId,
      timestamp: new Date().toISOString(),
      task: task,
      options: options,
      stages: {},
      metrics: { ...this.metrics }
    };
    
    const workflowStart = Date.now();
    
    // 阶段1: 需求分析
    console.log('\n📋 阶段1: 需求分析');
    results.stages.analysis = await this.routeRequest('analysis', 
      `分析以下任务需求: ${task}`, 
      { strategy: 'high-quality', maxTokens: 1500 }
    );
    
    // 阶段2: 架构设计
    console.log('\n🏗️  阶段2: 架构设计');
    results.stages.design = await this.routeRequest('design',
      `基于需求分析，设计系统架构: ${task}`,
      { strategy: 'high-quality', maxTokens: 2000 }
    );
    
    // 阶段3: 代码生成
    console.log('\n💻 阶段3: 代码生成');
    results.stages.generation = await this.routeRequest('generation',
      `基于架构设计，生成代码实现: ${task}`,
      { strategy: 'balanced', maxTokens: 2500 }
    );
    
    // 阶段4: 代码审查
    console.log('\n🔍 阶段4: 代码审查');
    results.stages.review = await this.routeRequest('review',
      `审查生成的代码，提出改进建议`,
      { strategy: 'balanced', maxTokens: 1800 }
    );
    
    // 阶段5: 性能优化
    console.log('\n⚡ 阶段5: 性能优化');
    results.stages.optimization = await this.routeRequest('optimization',
      `优化代码性能，提高效率`,
      { strategy: 'fast', maxTokens: 1200 }
    );
    
    // 计算工作流指标
    results.metrics = { ...this.metrics };
    results.metrics.workflowDuration = Date.now() - workflowStart;
    results.metrics.stageSuccessCount = Object.values(results.stages).filter(s => s.success).length;
    results.metrics.stageSuccessRate = (results.metrics.stageSuccessCount / 5 * 100).toFixed(1) + '%';
    
    // 生成总结
    results.summary = this.generateWorkflowSummary(results);
    
    // 保存报告
    this.saveWorkflowReport(results);
    
    // 显示结果
    this.displayWorkflowResults(results);
    
    return results;
  }
  
  /**
   * 生成工作流总结
   */
  generateWorkflowSummary(results) {
    const summary = {
      overallSuccess: results.metrics.stageSuccessCount === 5,
      stageDetails: {},
      routingPerformance: {},
      recommendations: []
    };
    
    // 阶段详情
    Object.entries(results.stages).forEach(([stage, stageResult]) => {
      summary.stageDetails[stage] = {
        success: stageResult.success,
        model: stageResult.model,
        routerSkill: stageResult.routerSkill,
        latency: stageResult.latency
      };
    });
    
    // 路由性能
    summary.routingPerformance = {
      successRate: results.metrics.stageSuccessRate,
      totalCalls: results.metrics.calls,
      successfulCalls: results.metrics.successes,
      fallbackCalls: results.metrics.fallbacks,
      failedCalls: results.metrics.failures,
      averageLatency: results.metrics.avgLatency.toFixed(0) + 'ms',
      workflowDuration: results.metrics.workflowDuration + 'ms'
    };
    
    // 推荐
    if (results.metrics.failures > 0) {
      summary.recommendations.push('检查路由系统配置，优化故障转移机制');
    }
    
    if (results.metrics.avgLatency > 500) {
      summary.recommendations.push('考虑优化路由策略，减少延迟');
    }
    
    if (results.metrics.fallbacks > 0) {
      summary.recommendations.push('主路由方法可能需要优化，降级机制被触发');
    }
    
    if (results.metrics.stageSuccessCount === 5) {
      summary.recommendations.push('路由系统工作正常，可以部署到生产环境');
    }
    
    return summary;
  }
  
  /**
   * 保存工作流报告
   */
  saveWorkflowReport(results) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // 保存详细报告
    const reportPath = path.join(this.reportDir, `workflow-${timestamp}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2), 'utf8');
    
    // 生成可读摘要
    const summary = this.generateHumanReadableSummary(results);
    const summaryPath = path.join(this.reportDir, `summary-${timestamp}.md`);
    fs.writeFileSync(summaryPath, summary, 'utf8');
    
    return { reportPath, summaryPath };
  }
  
  /**
   * 生成可读摘要
   */
  generateHumanReadableSummary(results) {
    return `# OMC真实路由集成工作流报告

## 工作流信息
- **ID**: ${results.id}
- **执行时间**: ${results.timestamp}
- **任务**: ${results.task}
- **路由系统**: OpenClaw智能路由

## 性能统计
- **成功率**: ${results.metrics.stageSuccessRate}
- **总调用次数**: ${results.metrics.calls}
- **成功调用**: ${results.metrics.successes}
- **降级调用**: ${results.metrics.fallbacks}
- **失败调用**: ${results.metrics.failures}
- **平均延迟**: ${results.metrics.avgLatency.toFixed(0)}ms
- **工作流总耗时**: ${results.metrics.workflowDuration}ms

## 各阶段详情

### 1. 需求分析
- **状态**: ${results.stages.analysis.success ? '✅ 成功' : '❌ 失败'}
- **模型**: ${results.stages.analysis.model || 'N/A'}
- **路由技能**: ${results.stages.analysis.routerSkill || 'N/A'}
- **延迟**: ${results.stages.analysis.latency || 'N/A'}ms

### 2. 架构设计
- **状态**: ${results.stages.design.success ? '✅ 成功' : '❌ 失败'}
- **模型**: ${results.stages.design.model || 'N/A'}
- **路由技能**: ${results.stages.design.routerSkill || 'N/A'}
- **延迟**: ${results.stages.design.latency || 'N/A'}ms

### 3. 代码生成
- **状态**: ${results.stages.generation.success ? '✅ 成功' : '❌ 失败'}
- **模型**: ${results.stages.generation.model || 'N/A'}
- **路由技能**: ${results.stages.generation.routerSkill || 'N/A'}
- **延迟**: ${results.stages.generation.latency || 'N/A'}ms

### 4. 代码审查
- **状态**: ${results.stages.review.success ? '✅ 成功' : '❌ 失败'}
- **模型**: ${results.stages.review.model || 'N/A'}
- **路由技能**: ${results.stages.review.routerSkill || 'N/A'}
- **延迟**: ${results.stages.review.latency || 'N/A'}ms

### 5. 性能优化
- **状态**: ${results.stages.optimization.success ? '✅ 成功' : '❌ 失败'}
- **模型**: ${results.stages.optimization.model || 'N/A'}
- **路由技能**: ${results.stages.optimization.routerSkill || 'N/A'}
- **延迟**: ${results.stages.optimization.latency || 'N/A'}ms

## 路由系统性能
- **调用方法**: ${Object.values(results.stages).map(s => s.method).filter(Boolean).join(', ')}
- **技能使用**: ${[...new Set(Object.values(results.stages).map(s => s.routerSkill).filter(Boolean))].join(', ')}
- **模型分布**: ${[...new Set(Object.values(results.stages).map(s => s.model).filter(Boolean))].join(', ')}

## 关键发现
${results.stages.analysis.success ? results.stages.analysis.content.substring(0, 200) + '...' : '需求分析失败'}

## 架构设计
${results.stages.design.success ? results.stages.design.content.substring(0, 200) + '...' : '架构设计失败'}

## 代码生成
${results.stages.generation.success ? results.stages.generation.content.substring(0, 200) + '...' : '代码生成失败'}

## 建议
${results.summary.recommendations.length > 0 
  ? results.summary.recommendations.map(r => `- ${r}`).join('\n')
  : '- 路由系统工作正常，无需调整'}

## 结论
${
  results.metrics.stageSuccessCount === 5 
    ? '✅ 所有阶段成功完成，路由系统集成成功' 
    : results.metrics.stageSuccessCount >= 3 
      ? '⚠️ 部分阶段成功，路由系统基本可用，需优化失败阶段' 
      : '❌ 多数阶段失败，需要检查路由系统配置'
}

---
*报告生成: OMC真实路由集成系统*
*路由引擎: OpenClaw智能路由*`;
  }
  
  /**
   * 显示工作流结果
   */
  displayWorkflowResults(results) {
    console.log('\n' + '='.repeat(60));
    console.log('🎉 OMC真实路由集成工作流完成!');
    console.log('='.repeat(60));
    
    console.log(`📊 工作流统计:`);
    console.log(`  阶段成功率: ${results.metrics.stageSuccessRate} (${results.metrics.stageSuccessCount}/5)`);
    console.log(`  总调用次数: ${results.metrics.calls}`);
    console.log(`  成功调用: ${results.metrics.successes}`);
    console.log(`  降级调用: ${results.metrics.fallbacks}`);
    console.log(`  失败调用: ${results.metrics.failures}`);
    console.log(`  平均延迟: ${results.metrics.avgLatency.toFixed(0)}ms`);
    console.log(`  总耗时: ${results.metrics.workflowDuration}ms`);
    
    console.log(`\n📋 阶段详情:`);
    Object.entries(results.stages).forEach(([stage, stageResult]) => {
      const status = stageResult.success ? '✅' : stageResult.fallback ? '⚠️' : '❌';
      console.log(`  ${stage}: ${status} ${stageResult.model} (${stageResult.routerSkill}) - ${stageResult.latency}ms`);
    });
    
    console.log(`\n🚀 系统特点:`);
    console.log(`  1. 真实路由: 使用OpenClaw智能路由系统`);
    console.log(`  2. 多策略支持: fast, balanced, high-quality, cost-effective`);
    console.log(`  3. 性能监控: 实时指标跟踪和报告`);
    console.log(`  4. 故障恢复: 自动降级和重试机制`);
    
    console.log(`\n📁 报告已保存到: ${this.reportDir}/`);
    
    console.log(`\n💡 使用建议:`);
    console.log(`  1. 将此版本作为omc-real-router-integration.js的升级版`);
    console.log(`  2. 根据实际需求调整路由策略配置`);
    console.log(`  3. 定期检查性能指标优化路由决策`);
  }
  
  /**
   * 测试路由系统
   */
  async testRoutingSystem() {
    console.log('🧪 测试OpenClaw路由系统集成...\n');
    
    const testResults = [];
    
    const testCases = [
      { stage: 'analysis', prompt: '测试路由系统分析功能', strategy: 'fast' },
      { stage: 'design', prompt: '测试路由系统设计功能', strategy: 'balanced' },
      { stage: 'generation', prompt: '测试路由系统生成功能', strategy: 'high-quality' },
      { stage: 'review', prompt: '测试路由系统审查功能', strategy: 'cost-effective' }
    ];
    
    for (const testCase of testCases) {
      console.log(`测试: ${testCase.stage} (策略: ${testCase.strategy})`);
      
      const result = await this.routeRequest(testCase.stage, testCase.prompt, {
        strategy: testCase.strategy
      });
      
      testResults.push({
        ...testCase,
        result: result
      });
      
      console.log(`  结果: ${result.success ? '✅ 成功' : '❌ 失败'} - ${result.model} - ${result.latency}ms\n`);
    }
    
    const successCount = testResults.filter(r => r.result.success).length;
    const successRate = (successCount / testResults.length * 100).toFixed(1);
    
    console.log('='.repeat(50));
    console.log(`测试完成! 成功率: ${successRate}% (${successCount}/${testResults.length})`);
    console.log('='.repeat(50));
    
    return {
      success: successCount === testResults.length,
      testResults: testResults,
      metrics: { ...this.metrics }
    };
  }
}

// 测试运行
if (require.main === module) {
  const args = process.argv.slice(2);
  const mode = args[0] || 'workflow';
  
  const integration = new OMCRealRouterIntegrationIntegrated();
  
  if (mode === 'test') {
    // 测试模式
    integration.testRoutingSystem()
      .then(results => {
        console.log('\n🎯 下一步:');
        console.log('  1. 如果测试成功，部署此集成版本');
        console.log('  2. 替换原有的直接API调用');
        console.log('  3. 配置生产环境路由策略');
      })
      .catch(error => {
        console.error('❌ 测试失败:', error.message);
      });
    
  } else {
    // 工作流模式
    const task = args.length > 1 ? args.slice(1).join(' ') : '创建一个用户管理系统';
    
    integration.executeOMCWorkflow(task, {
      strategy: 'balanced'
    })
    .then(results => {
      console.log('\n🎯 下一步:');
      console.log('  1. 查看生成的详细报告');
      console.log('  2. 根据建议优化路由配置');
      console.log('  3. 部署到现有项目中使用');
    })
    .catch(error => {
      console.error('❌ 工作流执行失败:', error.message);
    });
  }
}

module.exports = OMCRealRouterIntegrationIntegrated;