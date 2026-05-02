#!/usr/bin/env node
/**
 * OMC工作流修正版 - 集成OpenClaw智能路由系统
 * 使用OpenClaw路由调用原生API大模型
 */

const fs = require('fs');
const path = require('path');
const RealOpenClawRouter = require('./real-openclaw-router');

class OMCWorkflowFixedIntegrated {
  constructor() {
    this.workspace = '/root/.openclaw/workspace';
    this.configPath = path.join(this.workspace, 'models-config.json');
    this.apiConfig = this.loadApiConfig();
    
    // 初始化OpenClaw智能路由器
    this.router = new RealOpenClawRouter();
    
    // 路由策略配置 - 保留原有的多阶段路由逻辑
    this.stageMapping = {
      'discovery': 'analysis',       // 系统文件发现 -> analysis阶段
      'redundancy': 'design',        // 冗余分析 -> design阶段
      'selection': 'review',         // 最佳版本选择 -> review阶段
      'combination': 'generation',   // 最佳组合论证 -> generation阶段
      'fusion': 'optimization'       // 融合技能设计 -> optimization阶段
    };
    
    this.reportDir = path.join(this.workspace, 'omc-fixed-integrated-reports');
    if (!fs.existsSync(this.reportDir)) {
      fs.mkdirSync(this.reportDir, { recursive: true });
    }
  }

  /**
   * 加载API配置（保留用于参考）
   */
  loadApiConfig() {
    try {
      const configData = fs.readFileSync(this.configPath, 'utf8');
      const config = JSON.parse(configData);
      return config;
    } catch (error) {
      console.error('❌ 加载配置失败:', error.message);
      return this.getDefaultConfig();
    }
  }

  /**
   * 获取默认配置
   */
  getDefaultConfig() {
    return {
      modelConfig: {
        providers: {
          '4sapi': {
            baseUrl: 'https://4sapi.com',
            apiKey: 'sk-mNOYLbPoeo3cU41UGS1tpBa1n0gqrql3RTIO0bpmspMtmake'
          },
          'alibailian': {
            baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
            apiKey: 'sk-d22b28b2a05445f69ad2ad3732172b70'
          },
          'kimi': {
            baseUrl: 'https://api.moonshot.cn/v1',
            apiKey: 'sk-kimi-Tee4IFmxS88EbrDxZlQxeGBcaBLN7wKagx97jXomyVBQBweAYIaSj4UxCK5fjVhG'
          },
          'volcengine': {
            baseUrl: 'https://ark.cn-beijing.volces.com/api/coding/v3',
            apiKey: '29949786-580f-4c58-910c-6b42d81b3bbe'
          }
        }
      }
    };
  }

  /**
   * 获取API密钥（用于日志记录）
   */
  getApiKey(provider) {
    const config = this.apiConfig?.modelConfig?.providers?.[provider];
    return config?.apiKey || null;
  }

  /**
   * 通过OpenClaw路由系统调用AI
   */
  async callViaOpenClawRouter(stageName, prompt, options = {}) {
    console.log(`  🔗 路由调用: ${stageName} - ${prompt.substring(0, 60)}...`);
    
    // 映射到路由阶段
    const routeStage = this.stageMapping[stageName] || 'analysis';
    
    const routeOptions = {
      maxTokens: options.maxTokens || 2000,
      temperature: options.temperature || 0.3,
      strategy: options.strategy || 'balanced'
    };
    
    return await this.router.unifiedRoute(routeStage, prompt, routeOptions);
  }

  /**
   * 发现系统文件
   */
  async discoverSystemFiles() {
    const prompt = `分析工作空间中的OMC相关文件，识别所有与Oh-my-Codex、FREECODE、CLAWCODE、Claude code相关的工具、技能、系统、工作流、文件。`;
    
    const result = await this.callViaOpenClawRouter('discovery', prompt, {
      maxTokens: 1500
    });
    
    return {
      analysis: result.success ? result.content : '路由调用失败',
      model: result.model,
      routerSkill: result.routerSkill,
      latency: result.latency,
      success: result.success,
      fallback: result.fallback
    };
  }

  /**
   * 分析冗余
   */
  async analyzeRedundancy(discoveryResults) {
    const prompt = `基于系统发现结果，分析工具和工作流的冗余情况，识别重复功能，提出去重建议。`;
    
    const result = await this.callViaOpenClawRouter('redundancy', prompt, {
      maxTokens: 1800
    });
    
    return {
      analysis: result.success ? result.content : '路由调用失败',
      model: result.model,
      routerSkill: result.routerSkill,
      latency: result.latency,
      success: result.success,
      fallback: result.fallback
    };
  }

  /**
   * 选择最佳版本
   */
  async selectBestVersions(discoveryResults, redundancyResults) {
    const prompt = `基于系统发现和冗余分析结果，选择每个工具的最佳版本，制定版本管理策略。`;
    
    const result = await this.callViaOpenClawRouter('selection', prompt, {
      maxTokens: 2000
    });
    
    return {
      selection: result.success ? result.content : '路由调用失败',
      model: result.model,
      routerSkill: result.routerSkill,
      latency: result.latency,
      success: result.success,
      fallback: result.fallback
    };
  }

  /**
   * 设计最佳组合
   */
  async designBestCombination(previousResults) {
    const prompt = `基于之前的分析结果，设计Oh-my-Codex与free-code的最佳组合策略，提出融合技能方案。`;
    
    const result = await this.callViaOpenClawRouter('combination', prompt, {
      maxTokens: 2200
    });
    
    return {
      strategy: result.success ? result.content : '路由调用失败',
      model: result.model,
      routerSkill: result.routerSkill,
      latency: result.latency,
      success: result.success,
      fallback: result.fallback
    };
  }

  /**
   * 设计融合技能
   */
  async designFusionSkills(allResults) {
    const prompt = `设计创新的融合技能，将多个工具的优势结合，提出进化路径和实现方案。`;
    
    const result = await this.callViaOpenClawRouter('fusion', prompt, {
      maxTokens: 2500
    });
    
    return {
      design: result.success ? result.content : '路由调用失败',
      model: result.model,
      routerSkill: result.routerSkill,
      latency: result.latency,
      success: result.success,
      fallback: result.fallback
    };
  }

  /**
   * 执行系统分析（主工作流）
   */
  async executeSystemAnalysis(task) {
    console.log('🚀 启动OMC工作流系统分析（集成路由版）...');
    console.log('🌐 使用OpenClaw智能路由系统');
    console.log('='.repeat(60));
    
    const report = {
      timestamp: new Date().toISOString(),
      task: task,
      routingSystem: 'OpenClaw智能路由',
      stages: {},
      summary: {
        startTime: Date.now(),
        successCount: 0,
        totalLatency: 0
      }
    };
    
    // 阶段1: 系统文件发现
    console.log('\n🔍 阶段1: 系统文件发现');
    report.stages.discovery = await this.discoverSystemFiles();
    this.updateSummary(report, report.stages.discovery);
    
    // 阶段2: 冗余分析
    console.log('\n⚖️  阶段2: 冗余分析');
    report.stages.redundancy = await this.analyzeRedundancy(report.stages.discovery);
    this.updateSummary(report, report.stages.redundancy);
    
    // 阶段3: 最佳版本选择
    console.log('\n🏆 阶段3: 最佳版本选择');
    report.stages.selection = await this.selectBestVersions(report.stages.discovery, report.stages.redundancy);
    this.updateSummary(report, report.stages.selection);
    
    // 阶段4: 最佳组合论证
    console.log('\n💡 阶段4: 最佳组合论证');
    report.stages.combination = await this.designBestCombination(report);
    this.updateSummary(report, report.stages.combination);
    
    // 阶段5: 融合技能设计
    console.log('\n🧬 阶段5: 融合技能设计');
    report.stages.fusion = await this.designFusionSkills(report);
    this.updateSummary(report, report.stages.fusion);
    
    // 计算总结统计
    this.calculateFinalSummary(report);
    
    // 保存报告
    this.saveReports(report);
    
    // 显示结果
    this.displayResults(report);
    
    return report;
  }
  
  updateSummary(report, stageResult) {
    if (stageResult.success) {
      report.summary.successCount++;
      report.summary.totalLatency += stageResult.latency;
    }
  }
  
  calculateFinalSummary(report) {
    report.summary.totalTime = Date.now() - report.summary.startTime;
    report.summary.successRate = (report.summary.successCount / 5 * 100).toFixed(1) + '%';
    report.summary.avgLatency = report.summary.successCount > 0 
      ? (report.summary.totalLatency / report.summary.successCount).toFixed(0) + 'ms'
      : 'N/A';
  }

  /**
   * 保存报告
   */
  saveReports(report) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // 保存详细报告
    const reportPath = path.join(this.reportDir, `omc-analysis-${timestamp}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
    
    // 生成执行摘要
    const summary = this.generateExecutiveSummary(report);
    const summaryPath = path.join(this.reportDir, `omc-summary-${timestamp}.md`);
    fs.writeFileSync(summaryPath, summary, 'utf8');
    
    return { reportPath, summaryPath };
  }

  /**
   * 生成执行摘要
   */
  generateExecutiveSummary(report) {
    return `# OMC工作流系统分析报告（集成路由版）

## 分析概览
- **任务**: ${report.task}
- **执行时间**: ${report.timestamp}
- **路由系统**: ${report.routingSystem}
- **成功率**: ${report.summary.successRate}
- **总耗时**: ${report.summary.totalTime}ms
- **平均延迟**: ${report.summary.avgLatency}

## 各阶段结果

### 1. 系统文件发现
- **模型**: ${report.stages.discovery.model}
- **路由技能**: ${report.stages.discovery.routerSkill}
- **延迟**: ${report.stages.discovery.latency}ms
- **状态**: ${report.stages.discovery.success ? '✅ 成功' : (report.stages.discovery.fallback ? '⚠️ 降级' : '❌ 失败')}

### 2. 冗余分析
- **模型**: ${report.stages.redundancy.model}
- **路由技能**: ${report.stages.redundancy.routerSkill}
- **延迟**: ${report.stages.redundancy.latency}ms
- **状态**: ${report.stages.redundancy.success ? '✅ 成功' : (report.stages.redundancy.fallback ? '⚠️ 降级' : '❌ 失败')}

### 3. 最佳版本选择
- **模型**: ${report.stages.selection.model}
- **路由技能**: ${report.stages.selection.routerSkill}
- **延迟**: ${report.stages.selection.latency}ms
- **状态**: ${report.stages.selection.success ? '✅ 成功' : (report.stages.selection.fallback ? '⚠️ 降级' : '❌ 失败')}

### 4. 最佳组合论证
- **模型**: ${report.stages.combination.model}
- **路由技能**: ${report.stages.combination.routerSkill}
- **延迟**: ${report.stages.combination.latency}ms
- **状态**: ${report.stages.combination.success ? '✅ 成功' : (report.stages.combination.fallback ? '⚠️ 降级' : '❌ 失败')}

### 5. 融合技能设计
- **模型**: ${report.stages.fusion.model}
- **路由技能**: ${report.stages.fusion.routerSkill}
- **延迟**: ${report.stages.fusion.latency}ms
- **状态**: ${report.stages.fusion.success ? '✅ 成功' : (report.stages.fusion.fallback ? '⚠️ 降级' : '❌ 失败')}

## 关键发现
${report.stages.discovery.success ? report.stages.discovery.analysis.substring(0, 300) + '...' : '发现阶段失败'}

## 冗余建议
${report.stages.redundancy.success ? report.stages.redundancy.analysis.substring(0, 300) + '...' : '冗余分析失败'}

## 最佳组合
${report.stages.combination.success ? report.stages.combination.strategy.substring(0, 300) + '...' : '组合论证失败'}

## 融合技能
${report.stages.fusion.success ? report.stages.fusion.design.substring(0, 300) + '...' : '融合设计失败'}

## 技术指标
- **路由系统**: OpenClaw智能路由
- **支持的技能**: adaptive-routing, model-routing, model-routing-orchestrator, oc-skill-router, intelligent-router, openclaw-model-router-skill
- **调用方法**: 智能路由决策 + 故障转移

## 后续步骤
1. **实施优化建议** - 按照分析结果清理冗余文件
2. **版本标准化** - 采用选定的最佳版本
3. **融合技能开发** - 实现设计的融合技能
4. **性能监控** - 建立路由系统性能指标

---
*报告生成: OMC工作流集成路由版*
*路由系统: OpenClaw智能路由*`;
  }

  /**
   * 显示结果
   */
  displayResults(report) {
    console.log('\n' + '='.repeat(60));
    console.log('🎉 分析完成!');
    console.log('='.repeat(60));
    
    console.log(`📊 性能统计:`);
    console.log(`  成功率: ${report.summary.successRate}`);
    console.log(`  总耗时: ${report.summary.totalTime}ms`);
    console.log(`  平均延迟: ${report.summary.avgLatency}`);
    
    console.log(`\n📋 阶段详情:`);
    Object.entries(report.stages).forEach(([stage, result]) => {
      const status = result.success ? '✅' : result.fallback ? '⚠️' : '❌';
      console.log(`  ${stage}: ${status} ${result.model} (${result.routerSkill}) - ${result.latency}ms`);
    });
    
    console.log(`\n🚀 系统优势:`);
    console.log(`  1. 智能路由: 自动选择最佳模型和技能`);
    console.log(`  2. 故障转移: 降级机制保障服务连续性`);
    console.log(`  3. 统一接口: 简化API调用复杂度`);
    console.log(`  4. 性能监控: 实时延迟和成功率跟踪`);
    
    console.log(`\n📁 报告保存位置:`);
    console.log(`  JSON详细报告: ${this.reportDir}/`);
    console.log(`  Markdown摘要: ${this.reportDir}/`);
    
    console.log(`\n💡 建议:`);
    console.log(`  1. 使用此版本替换原有的API直接调用`);
    console.log(`  2. 根据需要调整路由策略配置文件`);
    console.log(`  3. 部署到生产环境前进行完整测试`);
  }
}

// 测试运行
if (require.main === module) {
  const args = process.argv.slice(2);
  const task = args.join(' ') || '分析系统中的OMC相关文件，识别工具冗余，提出最佳组合方案';
  
  console.log('🧪 测试OMC工作流集成路由版...\n');
  
  const workflow = new OMCWorkflowFixedIntegrated();
  
  workflow.executeSystemAnalysis(task)
    .then(report => {
      console.log('\n🎯 下一步:');
      console.log('  1. 将此文件部署为 omc-workflow-api-fixed.js 的升级版');
      console.log('  2. 在现有项目中替换原有的API调用');
      console.log('  3. 配置路由策略优化性能');
    })
    .catch(error => {
      console.error('❌ 分析失败:', error.message);
    });
}

module.exports = OMCWorkflowFixedIntegrated;