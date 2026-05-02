#!/usr/bin/env node
/**
 * OMC路由适配器集成版 - 使用真实OpenClaw路由系统
 * 完全替换模拟路由为真实路由调用
 */

const fs = require('fs');
const path = require('path');
const RealOpenClawRouter = require('./real-openclaw-router');

class OMCRouterAdapterIntegrated {
  constructor(config = {}) {
    this.workspace = '/root/.openclaw/workspace';
    this.configPath = path.join(this.workspace, 'models-config.json');
    
    // 加载配置（兼容性保留）
    this.config = this.loadConfig(config);
    
    // 初始化真实OpenClaw路由调用器
    this.router = new RealOpenClawRouter();
    
    // 路由策略配置 - 保留原有策略名称映射
    this.strategyConfig = {
      'fast': {
        routingStrategy: 'fast',
        priorityModels: ['deepseek-v3.2', 'gpt-5.4'],
        timeout: 5000,
        description: '快速响应，适合简单任务'
      },
      'balanced': {
        routingStrategy: 'balanced',
        priorityModels: ['claude-opus-4.6', 'gemini-3.1-pro-preview'],
        timeout: 10000,
        description: '平衡性能和质量，适合一般任务'
      },
      'high-quality': {
        routingStrategy: 'quality',
        priorityModels: ['claude-opus-4.6', 'gpt-5.4'],
        timeout: 15000,
        description: '高质量输出，适合复杂任务'
      },
      'cost-effective': {
        routingStrategy: 'cost',
        priorityModels: ['deepseek-v3.2', 'gemini-3.1-pro-preview'],
        timeout: 8000,
        description: '成本优先，适合批量任务'
      }
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
    this.reportDir = path.join(this.workspace, 'omc-adapter-integrated-reports');
    if (!fs.existsSync(this.reportDir)) {
      fs.mkdirSync(this.reportDir, { recursive: true });
    }
    
    console.log('🚀 OMC路由适配器集成版已初始化');
    console.log(`🌐 使用OpenClaw智能路由系统`);
  }
  
  /**
   * 加载配置
   */
  loadConfig(userConfig) {
    const defaultConfig = {
      routing: {
        enabled: true,
        system: 'openclaw',
        gateway: {
          url: 'http://localhost:18789',
          timeout: 30000
        }
      }
    };
    
    try {
      if (fs.existsSync(this.configPath)) {
        const configData = fs.readFileSync(this.configPath, 'utf8');
        const fileConfig = JSON.parse(configData);
        return { ...defaultConfig, ...fileConfig, ...userConfig };
      }
    } catch (error) {
      console.warn(`⚠️ 加载配置文件失败: ${error.message}`);
    }
    
    return { ...defaultConfig, ...userConfig };
  }
  
  /**
   * 获取路由策略
   */
  getRoutingStrategy(strategyName = 'balanced') {
    return this.strategyConfig[strategyName] || this.strategyConfig.balanced;
  }
  
  /**
   * 路由适配调用 - 核心方法
   */
  async route(stage, prompt, options = {}) {
    console.log(`🔗 路由适配调用: ${stage}`);
    console.log(`   策略: ${options.strategy || 'balanced'}`);
    console.log(`   输入: ${prompt.substring(0, 80)}${prompt.length > 80 ? '...' : ''}`);
    
    const startTime = Date.now();
    
    // 获取路由策略
    const strategy = this.getRoutingStrategy(options.strategy);
    
    try {
      // 使用真实OpenClaw路由调用
      const result = await this.router.unifiedRoute(stage, prompt, {
        strategy: strategy.routingStrategy,
        maxTokens: options.maxTokens || 2000,
        temperature: options.temperature || 0.3,
        ...options
      });
      
      // 更新性能指标
      this.updateMetrics(result, Date.now() - startTime);
      
      // 构建标准化响应
      return this.buildStandardResponse(result, {
        stage,
        strategy: strategy.routingStrategy,
        fullLatency: Date.now() - startTime
      });
      
    } catch (error) {
      this.metrics.failures++;
      
      // 降级处理
      return {
        success: false,
        stage: stage,
        error: error.message,
        fallback: false,
        latency: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        recommendation: '检查路由系统连接或使用本地降级模式'
      };
    }
  }
  
  /**
   * 更新监控指标
   */
  updateMetrics(routeResult, fullLatency) {
    this.metrics.calls++;
    
    if (routeResult.success) {
      this.metrics.successes++;
    } else if (routeResult.fallback) {
      this.metrics.fallbacks++;
    } else {
      this.metrics.failures++;
    }
    
    this.metrics.totalLatency += fullLatency || routeResult.latency || 0;
    this.metrics.avgLatency = this.metrics.successes > 0 
      ? this.metrics.totalLatency / this.metrics.successes 
      : 0;
  }
  
  /**
   * 构建标准化响应
   */
  buildStandardResponse(routeResult, context) {
    return {
      success: routeResult.success,
      stage: context.stage,
      content: routeResult.content,
      model: routeResult.model,
      routerSkill: routeResult.routerSkill,
      routingStrategy: context.strategy,
      latency: routeResult.latency,
      fullLatency: context.fullLatency,
      method: routeResult.method,
      fallback: routeResult.fallback || false,
      timestamp: new Date().toISOString(),
      performance: this.calculatePerformanceGrade(routeResult.latency)
    };
  }
  
  /**
   * 计算性能等级
   */
  calculatePerformanceGrade(latency) {
    if (latency < 300) return 'A+ (极快)';
    if (latency < 500) return 'A (快速)';
    if (latency < 1000) return 'B (良好)';
    if (latency < 2000) return 'C (一般)';
    return 'D (较慢)';
  }
  
  /**
   * 执行完整工作流
   */
  async executeWorkflow(task, strategy = 'balanced') {
    console.log('\n🚀 执行OMC路由适配工作流');
    console.log(`📝 任务: ${task.substring(0, 100)}${task.length > 100 ? '...' : ''}`);
    console.log(`🎯 策略: ${strategy}`);
    console.log('='.repeat(60));
    
    const workflowId = `adapter-${Date.now()}`;
    const results = {
      id: workflowId,
      timestamp: new Date().toISOString(),
      task: task,
      strategy: strategy,
      stages: {},
      metrics: { ...this.metrics }
    };
    
    const workflowStart = Date.now();
    
    // OMC工作流的五个阶段
    const stages = [
      { name: 'analysis', description: '需求分析' },
      { name: 'design', description: '架构设计' },
      { name: 'generation', description: '代码生成' },
      { name: 'review', description: '代码审查' },
      { name: 'optimization', description: '性能优化' }
    ];
    
    for (const stage of stages) {
      console.log(`\n📋 ${stage.description}阶段`);
      
      const prompt = this.buildStagePrompt(stage.name, task);
      results.stages[stage.name] = await this.route(stage.name, prompt, {
        strategy: strategy,
        maxTokens: this.getStageMaxTokens(stage.name),
        temperature: this.getStageTemperature(stage.name)
      });
    }
    
    // 计算工作流统计
    results.metrics = { ...this.metrics };
    results.metrics.workflowDuration = Date.now() - workflowStart;
    results.metrics.stageSuccessCount = Object.values(results.stages).filter(s => s.success).length;
    results.metrics.stageSuccessRate = (results.metrics.stageSuccessCount / 5 * 100).toFixed(1) + '%';
    
    // 生成总结
    results.summary = this.generateWorkflowSummary(results);
    
    // 保存报告
    this.saveWorkflowReport(results);
    
    // 显示结果
    this.displayResults(results);
    
    return results;
  }
  
  /**
   * 构建阶段提示
   */
  buildStagePrompt(stage, task) {
    const prompts = {
      'analysis': `分析以下任务需求：${task}`,
      'design': `基于需求分析，设计系统架构：${task}`,
      'generation': `基于架构设计，生成代码实现：${task}`,
      'review': `审查代码质量，提出改进建议：${task}`,
      'optimization': `优化代码性能，提高效率：${task}`
    };
    
    return prompts[stage] || task;
  }
  
  /**
   * 获取阶段最大令牌数
   */
  getStageMaxTokens(stage) {
    const tokens = {
      'analysis': 1500,
      'design': 2000,
      'generation': 2500,
      'review': 1800,
      'optimization': 1200
    };
    
    return tokens[stage] || 1500;
  }
  
  /**
   * 获取阶段温度
   */
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
  
  /**
   * 生成工作流总结
   */
  generateWorkflowSummary(results) {
    const summary = {
      overallStatus: results.metrics.stageSuccessCount === 5 ? '完全成功' : '部分成功',
      stageDetails: {},
      performance: {},
      recommendations: []
    };
    
    // 阶段详情
    Object.entries(results.stages).forEach(([stage, stageResult]) => {
      summary.stageDetails[stage] = {
        success: stageResult.success,
        model: stageResult.model,
        routerSkill: stageResult.routerSkill,
        latency: stageResult.latency,
        performance: stageResult.performance
      };
    });
    
    // 性能统计
    summary.performance = {
      successRate: results.metrics.stageSuccessRate,
      averageLatency: results.metrics.avgLatency.toFixed(0) + 'ms',
      totalDuration: results.metrics.workDuration + 'ms'
    };
    
    // 推荐
    if (results.metrics.failures > 0) {
      summary.recommendations.push('优化路由系统连接配置');
    }
    
    if (results.metrics.fallbacks > 0) {
      summary.recommendations.push('检查主路由技能可用性');
    }
    
    if (results.metrics.avgLatency > 500) {
      summary.recommendations.push('考虑使用更快的路由策略');
    }
    
    if (results.metrics.stageSuccessCount === 5) {
      summary.recommendations.push('路由适配器工作正常，可以集成到项目中');
    }
    
    return summary;
  }
  
  /**
   * 保存工作流报告
   */
  saveWorkflowReport(results) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    const reportPath = path.join(this.reportDir, `workflow-${timestamp}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2), 'utf8');
    
    const summary = this.generateHumanReadableSummary(results);
    const summaryPath = path.join(this.reportDir, `summary-${timestamp}.md`);
    fs.writeFileSync(summaryPath, summary, 'utf8');
    
    return { reportPath, summaryPath };
  }
  
  /**
   * 生成可读摘要
   */
  generateHumanReadableSummary(results) {
    return `# OMC路由适配器集成版工作流报告

## 基本信息
- **工作流ID**: ${results.id}
- **执行时间**: ${results.timestamp}
- **任务**: ${results.task}
- **路由策略**: ${results.strategy}
- **路由系统**: OpenClaw智能路由

## 性能统计
- **成功率**: ${results.metrics.stageSuccessRate}
- **总调用次数**: ${results.metrics.calls}
- **成功调用**: ${results.metrics.successes}
- **降级调用**: ${results.metrics.fallbacks}
- **失败调用**: ${results.metrics.failures}
- **平均延迟**: ${results.metrics.avgLatency.toFixed(0)}ms
- **工作流总耗时**: ${results.metrics.workflowDuration}ms

## 各阶段结果

### 1. 需求分析
- **状态**: ${results.stages.analysis.success ? '✅ 成功' : '❌ 失败'}
- **模型**: ${results.stages.analysis.model || 'N/A'}
- **路由技能**: ${results.stages.analysis.routerSkill || 'N/A'}
- **延迟**: ${results.stages.analysis.latency || 'N/A'}ms
- **性能等级**: ${results.stages.analysis.performance || 'N/A'}

### 2. 架构设计
- **状态**: ${results.stages.design.success ? '✅ 成功' : '❌ 失败'}
- **模型**: ${results.stages.design.model || 'N/A'}
- **路由技能**: ${results.stages.design.routerSkill || 'N/A'}
- **延迟**: ${results.stages.design.latency || 'N/A'}ms
- **性能等级**: ${results.stages.design.performance || 'N/A'}

### 3. 代码生成
- **状态**: ${results.stages.generation.success ? '✅ 成功' : '❌ 失败'}
- **模型**: ${results.stages.generation.model || 'N/A'}
- **路由技能**: ${results.stages.generation.routerSkill || 'N/A'}
- **延迟**: ${results.stages.generation.latency || 'N/A'}ms
- **性能等级**: ${results.stages.generation.performance || 'N/A'}

### 4. 代码审查
- **状态**: ${results.stages.review.success ? '✅ 成功' : '❌ 失败'}
- **模型**: ${results.stages.review.model || 'N/A'}
- **路由技能**: ${results.stages.review.routerSkill || 'N/A'}
- **延迟**: ${results.stages.review.latency || 'N/A'}ms
- **性能等级**: ${results.stages.review.performance || 'N/A'}

### 5. 性能优化
- **状态**: ${results.stages.optimization.success ? '✅ 成功' : '❌ 失败'}
- **模型**: ${results.stages.optimization.model || 'N/A'}
- **路由技能**: ${results.stages.optimization.routerSkill || 'N/A'}
- **延迟**: ${results.stages.optimization.latency || 'N/A'}ms
- **性能等级**: ${results.stages.optimization.performance || 'N/A'}

## 路由系统详情
- **支持的技能**: ${Object.values(results.stages).map(s => s.routerSkill).filter((v, i, a) => a.indexOf(v) === i).join(', ')}
- **使用的模型**: ${Object.values(results.stages).map(s => s.model).filter((v, i, a) => a.indexOf(v) === i).join(', ')}
- **调用方法**: ${Object.values(results.stages).map(s => s.method).filter((v, i, a) => a.indexOf(v) === i).join(', ')}

## 综合评价
**${
  results.metrics.stageSuccessCount === 5 
    ? '✅ 优秀 - 路由适配器完全集成成功' 
    : results.metrics.stageSuccessCount >= 3 
      ? '⚠️ 良好 - 路由适配器基本可用，建议优化失败阶段' 
      : '❌ 待改进 - 路由适配器需要进一步调试'
}**

## 建议
${
  results.summary.recommendations.length > 0 
    ? results.summary.recommendations.map(r => `- ${r}`).join('\n')
    : '- 系统工作正常，无需调整'
}

## 下一步
1. **验证测试**: 确认路由适配器在真实环境中工作正常
2. **项目集成**: 将此版本集成到现有OMC项目中
3. **性能优化**: 根据实际使用情况调整路由策略

---
*报告生成: OMC路由适配器集成版*
*路由系统: OpenClaw智能路由*`;
  }
  
  /**
   * 显示结果
   */
  displayResults(results) {
    console.log('\n' + '='.repeat(60));
    console.log('🎉 OMC路由适配器工作流完成!');
    console.log('='.repeat(60));
    
    console.log(`📊 工作流统计:`);
    console.log(`  阶段成功率: ${results.metrics.stageSuccessRate}`);
    console.log(`  平均延迟: ${results.metrics.avgLatency.toFixed(0)}ms`);
    console.log(`  总耗时: ${results.metrics.workflowDuration}ms`);
    
    console.log(`\n📋 详细结果:`);
    Object.entries(results.stages).forEach(([stage, stageResult]) => {
      const status = stageResult.success ? '✅' : stageResult.fallback ? '⚠️' : '❌';
      const model = stageResult.model || 'N/A';
      const skill = stageResult.routerSkill || 'N/A';
      const latency = stageResult.latency || 'N/A';
      const perf = stageResult.performance || 'N/A';
      
      console.log(`  ${stage}: ${status} ${model} (${skill}) - ${latency}ms [${perf}]`);
    });
    
    console.log(`\n🚀 集成优势:`);
    console.log(`  1. 真实路由: 使用OpenClaw原生路由系统`);
    console.log(`  2. 策略灵活: 支持多种路由策略配置`);
    console.log(`  3. 性能监控: 完整的指标跟踪和报告`);
    console.log(`  4. 向后兼容: 保留原有接口和配置`);
    
    console.log(`\n📁 报告已保存: ${this.reportDir}/`);
    
    console.log(`\n💡 使用建议:`);
    console.log(`  1. 将此文件部署为omc-router-adapter.js的替代版本`);
    console.log(`  2. 根据项目需求调整路由策略`);
    console.log(`  3. 定期查看性能报告优化配置`);
  }
  
  /**
   * 测试适配器功能
   */
  async testAdapter() {
    console.log('🧪 测试路由适配器集成功能...\n');
    
    const testTask = '测试路由适配器集成功能';
    const results = await this.executeWorkflow(testTask, 'balanced');
    
    console.log('\n🎯 测试结果:');
    if (results.metrics.stageSuccessCount === 5) {
      console.log('✅ 适配器测试完全成功! 可以部署到生产环境。');
    } else {
      console.log(`⚠️ 适配器测试部分成功 (${results.metrics.stageSuccessCount}/5)。`);
      console.log('建议检查路由系统配置后再部署。');
    }
    
    return results;
  }
}

// 主程序
if (require.main === module) {
  const args = process.argv.slice(2);
  const mode = args[0] || 'workflow';
  
  const adapter = new OMCRouterAdapterIntegrated();
  
  if (mode === 'test') {
    adapter.testAdapter()
      .then(() => {
        console.log('\n🎯 下一步:');
        console.log('  1. 查看生成的测试报告');
        console.log('  2. 优化路由策略配置');
        console.log('  3. 集成到项目中使用');
      })
      .catch(error => {
        console.error('❌ 测试失败:', error.message);
      });
    
  } else if (mode === 'workflow') {
    const task = args.length > 1 ? args.slice(1).join(' ') : '创建一个测试项目';
    
    adapter.executeWorkflow(task, 'balanced')
      .then(() => {
        console.log('\n🎯 下一步:');
        console.log('  1. 分析报告中的建议');
        console.log('  2. 优化工作流配置');
        console.log('  3. 部署到实际项目');
      })
      .catch(error => {
        console.error('❌ 工作流执行失败:', error.message);
      });
    
  } else {
    console.log('使用方法:');
    console.log('  node omc-router-adapter-integrated.js test        # 测试模式');
    console.log('  node omc-router-adapter-integrated.js workflow   # 工作流模式（默认）');
    console.log('  node omc-router-adapter-integrated.js workflow "你的任务"   # 指定任务');
  }
}

module.exports = OMCRouterAdapterIntegrated;