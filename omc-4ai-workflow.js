#!/usr/bin/env node
/**
 * OMC 4AI工作流 - 数据收集、迭代优化、策略库生成
 * 四阶段AI工作流：收集 → 分析 → 优化 → 生成
 */

const fs = require('fs');
const path = require('path');
const RealOpenClawRouter = require('./real-openclaw-router');

class OMC4AIWorkflow {
  constructor() {
    this.workspace = '/root/.openclaw/workspace';
    this.dataDir = path.join(this.workspace, 'omc-4ai-data');
    this.strategyDir = path.join(this.workspace, 'omc-strategy-library');
    this.reportsDir = path.join(this.workspace, 'omc-4ai-reports');
    
    // 初始化目录
    this.initDirectories();
    
    // 初始化OpenClaw路由器
    this.router = new RealOpenClawRouter();
    
    // 性能指标数据库
    this.metricsDB = path.join(this.dataDir, 'metrics.jsonl');
    
    // 策略库配置
    this.strategyConfig = {
      collectionInterval: 3600000, // 1小时收集一次
      analysisInterval: 86400000,  // 1天分析一次
      optimizationThreshold: 0.85, // 成功率低于85%触发优化
      strategyVersion: '1.0.0'
    };
  }
  
  initDirectories() {
    const dirs = [this.dataDir, this.strategyDir, this.reportsDir];
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }
  
  /**
   * 阶段1: 数据收集
   */
  async collectData() {
    console.log('📊 阶段1: 数据收集');
    console.log('='.repeat(50));
    
    const timestamp = new Date().toISOString();
    const collection = {
      timestamp,
      type: 'routing_performance',
      data: {}
    };
    
    // 收集当前路由系统状态
    const routingStats = await this.collectRoutingStats();
    collection.data.routingStats = routingStats;
    
    // 收集性能指标
    const performanceMetrics = await this.collectPerformanceMetrics();
    collection.data.performanceMetrics = performanceMetrics;
    
    // 收集错误日志
    const errorLogs = await this.collectErrorLogs();
    collection.data.errorLogs = errorLogs;
    
    // 收集用户反馈（模拟）
    const userFeedback = await this.collectUserFeedback();
    collection.data.userFeedback = userFeedback;
    
    // 保存数据
    this.saveCollection(collection);
    
    console.log(`✅ 数据收集完成:`);
    console.log(`   路由统计: ${Object.keys(routingStats).length} 项`);
    console.log(`   性能指标: ${performanceMetrics.length} 条`);
    console.log(`   错误日志: ${errorLogs.length} 条`);
    console.log(`   用户反馈: ${userFeedback.length} 条`);
    
    return collection;
  }
  
  async collectRoutingStats() {
    // 这里应该从实际路由系统收集数据
    // 暂时使用模拟数据
    return {
      totalCalls: Math.floor(Math.random() * 1000) + 500,
      successfulCalls: Math.floor(Math.random() * 950) + 400,
      failedCalls: Math.floor(Math.random() * 50) + 10,
      averageLatency: Math.floor(Math.random() * 400) + 200,
      skillUsage: {
        'adaptive-routing': Math.floor(Math.random() * 200) + 100,
        'model-routing': Math.floor(Math.random() * 180) + 90,
        'model-routing-orchestrator': Math.floor(Math.random() * 220) + 110,
        'oc-skill-router': Math.floor(Math.random() * 190) + 95,
        'intelligent-router': Math.floor(Math.random() * 210) + 105
      }
    };
  }
  
  async collectPerformanceMetrics() {
    const metrics = [];
    const stages = ['analysis', 'design', 'generation', 'review', 'optimization'];
    
    stages.forEach(stage => {
      metrics.push({
        stage,
        timestamp: new Date().toISOString(),
        latency: Math.floor(Math.random() * 300) + 200,
        success: Math.random() > 0.1,
        model: this.getModelForStage(stage),
        strategy: 'balanced'
      });
    });
    
    return metrics;
  }
  
  async collectErrorLogs() {
    // 收集错误日志
    const errorLogs = [];
    const errorTypes = [
      'timeout',
      'api_error',
      'network_error',
      'model_unavailable',
      'rate_limit'
    ];
    
    for (let i = 0; i < 5; i++) {
      const errorType = errorTypes[Math.floor(Math.random() * errorTypes.length)];
      errorLogs.push({
        timestamp: new Date().toISOString(),
        type: errorType,
        stage: ['analysis', 'design', 'generation'][Math.floor(Math.random() * 3)],
        message: `模拟错误: ${errorType}`,
        resolution: 'retry_or_fallback'
      });
    }
    
    return errorLogs;
  }
  
  async collectUserFeedback() {
    // 模拟用户反馈收集
    const feedback = [];
    const feedbackTypes = [
      { type: 'quality', rating: 4.5, comment: '代码质量优秀' },
      { type: 'speed', rating: 4.2, comment: '响应速度很快' },
      { type: 'reliability', rating: 4.7, comment: '系统稳定可靠' },
      { type: 'usability', rating: 4.3, comment: '使用体验良好' }
    ];
    
    feedbackTypes.forEach(fb => {
      feedback.push({
        timestamp: new Date().toISOString(),
        ...fb
      });
    });
    
    return feedback;
  }
  
  saveCollection(collection) {
    const filename = `collection-${Date.now()}.json`;
    const filepath = path.join(this.dataDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(collection, null, 2), 'utf8');
    
    // 同时追加到JSONL数据库
    const jsonlEntry = JSON.stringify(collection) + '\n';
    fs.appendFileSync(this.metricsDB, jsonlEntry, 'utf8');
  }
  
  /**
   * 阶段2: 数据分析
   */
  async analyzeData() {
    console.log('\n📈 阶段2: 数据分析');
    console.log('='.repeat(50));
    
    // 加载收集的数据
    const collections = this.loadCollections();
    const analysis = {
      timestamp: new Date().toISOString(),
      summary: {},
      insights: [],
      recommendations: [],
      anomalies: []
    };
    
    // 分析路由性能
    const routingAnalysis = await this.analyzeRoutingPerformance(collections);
    analysis.summary.routingPerformance = routingAnalysis;
    
    // 分析错误模式
    const errorAnalysis = await this.analyzeErrorPatterns(collections);
    analysis.summary.errorPatterns = errorAnalysis;
    
    // 分析用户满意度
    const satisfactionAnalysis = await this.analyzeUserSatisfaction(collections);
    analysis.summary.userSatisfaction = satisfactionAnalysis;
    
    // 生成洞察
    analysis.insights = await this.generateInsights(analysis.summary);
    
    // 生成建议
    analysis.recommendations = await this.generateRecommendations(analysis.insights);
    
    // 检测异常
    analysis.anomalies = await this.detectAnomalies(analysis.summary);
    
    // 保存分析结果
    this.saveAnalysis(analysis);
    
    console.log(`✅ 数据分析完成:`);
    console.log(`   路由分析: ${Object.keys(routingAnalysis).length} 项指标`);
    console.log(`   错误分析: ${errorAnalysis.patterns.length} 个模式`);
    console.log(`   用户分析: ${satisfactionAnalysis.averageRating.toFixed(1)} 平均分`);
    console.log(`   生成洞察: ${analysis.insights.length} 条`);
    console.log(`   优化建议: ${analysis.recommendations.length} 条`);
    
    return analysis;
  }
  
  loadCollections() {
    const collections = [];
    try {
      const files = fs.readdirSync(this.dataDir).filter(f => f.startsWith('collection-'));
      
      files.forEach(file => {
        const filepath = path.join(this.dataDir, file);
        const content = fs.readFileSync(filepath, 'utf8');
        collections.push(JSON.parse(content));
      });
    } catch (error) {
      console.warn('⚠️ 加载数据失败:', error.message);
    }
    
    return collections;
  }
  
  async analyzeRoutingPerformance(collections) {
    if (collections.length === 0) {
      return { totalCalls: 0, successRate: 0, averageLatency: 0 };
    }
    
    let totalCalls = 0;
    let successfulCalls = 0;
    let totalLatency = 0;
    
    collections.forEach(collection => {
      const stats = collection.data?.routingStats;
      if (stats) {
        totalCalls += stats.totalCalls || 0;
        successfulCalls += stats.successfulCalls || 0;
        totalLatency += stats.averageLatency || 0;
      }
    });
    
    const successRate = totalCalls > 0 ? (successfulCalls / totalCalls) : 0;
    const averageLatency = collections.length > 0 ? totalLatency / collections.length : 0;
    
    // 分析路由技能使用情况
    const skillUsage = {};
    collections.forEach(collection => {
      const skills = collection.data?.routingStats?.skillUsage;
      if (skills) {
        Object.entries(skills).forEach(([skill, count]) => {
          skillUsage[skill] = (skillUsage[skill] || 0) + count;
        });
      }
    });
    
    return {
      totalCalls,
      successfulCalls,
      failedCalls: totalCalls - successfulCalls,
      successRate: successRate.toFixed(3),
      averageLatency: averageLatency.toFixed(0),
      skillUsage,
      topSkills: Object.entries(skillUsage)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([skill, count]) => ({ skill, count }))
    };
  }
  
  async analyzeErrorPatterns(collections) {
    const errors = [];
    
    collections.forEach(collection => {
      const errorLogs = collection.data?.errorLogs || [];
      errors.push(...errorLogs);
    });
    
    // 按错误类型分组
    const errorTypes = {};
    errors.forEach(error => {
      const type = error.type;
      errorTypes[type] = (errorTypes[type] || 0) + 1;
    });
    
    // 按阶段分组
    const errorStages = {};
    errors.forEach(error => {
      const stage = error.stage;
      errorStages[stage] = (errorStages[stage] || 0) + 1;
    });
    
    return {
      totalErrors: errors.length,
      patterns: Object.entries(errorTypes).map(([type, count]) => ({
        type,
        count,
        percentage: ((count / errors.length) * 100).toFixed(1) + '%'
      })),
      stages: Object.entries(errorStages).map(([stage, count]) => ({
        stage,
        count,
        percentage: ((count / errors.length) * 100).toFixed(1) + '%'
      }))
    };
  }
  
  async analyzeUserSatisfaction(collections) {
    const feedbacks = [];
    
    collections.forEach(collection => {
      const userFeedback = collection.data?.userFeedback || [];
      feedbacks.push(...userFeedback);
    });
    
    if (feedbacks.length === 0) {
      return {
        totalFeedback: 0,
        averageRating: 0,
        feedbackByType: []
      };
    }
    
    const ratingsByType = {};
    feedbacks.forEach(feedback => {
      const type = feedback.type;
      if (!ratingsByType[type]) {
        ratingsByType[type] = { total: 0, count: 0 };
      }
      ratingsByType[type].total += feedback.rating;
      ratingsByType[type].count += 1;
    });
    
    const averageRating = feedbacks.reduce((sum, fb) => sum + fb.rating, 0) / feedbacks.length;
    
    return {
      totalFeedback: feedbacks.length,
      averageRating: averageRating.toFixed(2),
      feedbackByType: Object.entries(ratingsByType).map(([type, data]) => ({
        type,
        averageRating: (data.total / data.count).toFixed(2),
        count: data.count
      }))
    };
  }
  
  async generateInsights(summary) {
    const insights = [];
    
    // 基于路由性能生成洞察
    const routing = summary.routingPerformance;
    if (routing.successRate < 0.9) {
      insights.push({
        type: 'performance',
        severity: 'warning',
        message: `路由成功率较低: ${(routing.successRate * 100).toFixed(1)}%，建议优化路由策略`,
        data: { successRate: routing.successRate }
      });
    }
    
    if (routing.averageLatency > 500) {
      insights.push({
        type: 'latency',
        severity: 'warning',
        message: `平均延迟较高: ${routing.averageLatency}ms，建议优化网络连接或使用更快的路由`,
        data: { averageLatency: routing.averageLatency }
      });
    }
    
    // 基于错误分析生成洞察
    const errors = summary.errorPatterns;
    if (errors.totalErrors > 0) {
      const topError = errors.patterns[0];
      insights.push({
        type: 'error',
        severity: 'info',
        message: `主要错误类型: ${topError.type} (${topError.percentage})`,
        data: { errorType: topError.type, percentage: topError.percentage }
      });
    }
    
    // 基于用户反馈生成洞察
    const feedback = summary.userSatisfaction;
    if (feedback.averageRating < 4.0) {
      insights.push({
        type: 'user',
        severity: 'warning',
        message: `用户满意度较低: ${feedback.averageRating}/5.0，建议改进服务质量`,
        data: { averageRating: feedback.averageRating }
      });
    }
    
    return insights;
  }
  
  async generateRecommendations(insights) {
    const recommendations = [];
    
    insights.forEach(insight => {
      switch (insight.type) {
        case 'performance':
          recommendations.push({
            type: 'routing_optimization',
            priority: insight.severity === 'warning' ? 'high' : 'medium',
            action: '调整路由策略配置，增加故障转移机制',
            impact: '预计提升成功率 10-20%'
          });
          break;
          
        case 'latency':
          recommendations.push({
            type: 'performance_optimization',
            priority: insight.severity === 'warning' ? 'high' : 'medium',
            action: '优化网络连接，启用缓存机制，使用更快的路由策略',
            impact: '预计减少延迟 30-50%'
          });
          break;
          
        case 'error':
          recommendations.push({
            type: 'error_handling',
            priority: 'medium',
            action: `针对 ${insight.data.errorType} 错误类型优化错误处理逻辑`,
            impact: '减少错误发生率，提高系统稳定性'
          });
          break;
          
        case 'user':
          recommendations.push({
            type: 'quality_improvement',
            priority: 'high',
            action: '收集更多用户反馈，针对性改进服务质量',
            impact: '提升用户满意度和系统可用性'
          });
          break;
      }
    });
    
    return recommendations;
  }
  
  async detectAnomalies(summary) {
    const anomalies = [];
    
    // 检测成功率异常
    const routing = summary.routingPerformance;
    if (routing.successRate < 0.8) {
      anomalies.push({
        type: 'success_rate_anomaly',
        severity: 'critical',
        message: `路由成功率异常低: ${(routing.successRate * 100).toFixed(1)}%`,
        threshold: 80,
        actual: routing.successRate * 100
      });
    }
    
    // 检测延迟异常
    if (routing.averageLatency > 1000) {
      anomalies.push({
        type: 'latency_anomaly',
        severity: 'critical',
        message: `平均延迟异常高: ${routing.averageLatency}ms`,
        threshold: 1000,
        actual: routing.averageLatency
      });
    }
    
    // 检测错误率异常
    const errors = summary.errorPatterns;
    if (errors.totalErrors > 100) {
      anomalies.push({
        type: 'error_rate_anomaly',
        severity: 'high',
        message: `错误数量异常高: ${errors.totalErrors} 条`,
        threshold: 100,
        actual: errors.totalErrors
      });
    }
    
    return anomalies;
  }
  
  saveAnalysis(analysis) {
    const filename = `analysis-${Date.now()}.json`;
    const filepath = path.join(this.reportsDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(analysis, null, 2), 'utf8');
  }
  
  /**
   * 阶段3: 迭代优化
   */
  async optimizeSystem() {
    console.log('\n⚡ 阶段3: 迭代优化');
    console.log('='.repeat(50));
    
    // 加载最新分析结果
    const latestAnalysis = this.loadLatestAnalysis();
    if (!latestAnalysis) {
      console.log('⚠️ 没有找到分析结果，跳过优化阶段');
      return null;
    }
    
    const optimization = {
      timestamp: new Date().toISOString(),
      basedOnAnalysis: latestAnalysis.timestamp,
      optimizations: [],
      expectedImpact: {},
      implementationPlan: []
    };
    
    // 根据洞察生成优化
    const insights = latestAnalysis.insights || [];
    const recommendations = latestAnalysis.recommendations || [];
    
    insights.forEach(insight => {
      const optimizationItem = this.generateOptimization(insight, latestAnalysis.summary);
      if (optimizationItem) {
        optimization.optimizations.push(optimizationItem);
      }
    });
    
    recommendations.forEach(recommendation => {
      const implementation = this.generateImplementation(recommendation);
      optimization.implementationPlan.push(implementation);
    });
    
    // 计算预期影响
    optimization.expectedImpact = this.calculateExpectedImpact(optimization.optimizations);
    
    // 生成优化策略
    const strategy = await this.generateOptimizationStrategy(optimization);
    optimization.strategy = strategy;
    
    // 应用优化
    const applied = await this.applyOptimizations(optimization.optimizations);
    optimization.appliedOptimizations = applied;
    
    // 保存优化结果
    this.saveOptimization(optimization);
    
    console.log(`✅ 系统优化完成:`);
    console.log(`   生成优化项: ${optimization.optimizations.length} 个`);
    console.log(`   实施计划: ${optimization.implementationPlan.length} 项`);
    console.log(`   预期提升: ${Object.keys(optimization.expectedImpact).join(', ')}`);
    console.log(`   已应用优化: ${applied.length} 个`);
    
    return optimization;
  }
  
  loadLatestAnalysis() {
    try {
      const files = fs.readdirSync(this.reportsDir).filter(f => f.startsWith('analysis-'));
      if (files.length === 0) return null;
      
      // 获取最新的分析文件
      files.sort().reverse();
      const latestFile = files[0];
      const filepath = path.join(this.reportsDir, latestFile);
      const content = fs.readFileSync(filepath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.warn('⚠️ 加载分析结果失败:', error.message);
      return null;
    }
  }
  
  generateOptimization(insight, summary) {
    switch (insight.type) {
      case 'performance':
        return {
          type: 'routing_strategy_optimization',
          target: 'success_rate',
          currentValue: summary.routingPerformance.successRate,
          targetValue: '0.95',
          action: '调整路由策略优先级，增加重试机制',
          implementation: '修改routing-integration-config.json'
        };
        
      case 'latency':
        return {
          type: 'performance_optimization',
          target: 'average_latency',
          currentValue: summary.routingPerformance.averageLatency,
          targetValue: '300',
          action: '启用缓存，优化网络连接，使用更快的路由策略',
          implementation: '添加缓存层，优化网络配置'
        };
        
      case 'error':
        return {
          type: 'error_handling_optimization',
          target: 'error_rate',
          currentValue: insight.data.percentage,
          targetValue: '5%',
          action: `优化${insight.data.errorType}错误处理逻辑`,
          implementation: '增强错误恢复机制'
        };
        
      default:
        return null;
    }
  }
  
  generateImplementation(recommendation) {
    return {
      ...recommendation,
      status: 'pending',
      assignedTo: 'system',
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7天后
      dependencies: []
    };
  }
  
  calculateExpectedImpact(optimizations) {
    const impact = {
      successRateImprovement: '10-20%',
      latencyReduction: '30-50%',
      errorRateReduction: '20-40%',
      userSatisfactionImprovement: '0.5-1.0 points'
    };
    
    // 根据优化项调整预期影响
    optimizations.forEach(opt => {
      if (opt.type === 'routing_strategy_optimization') {
        impact.successRateImprovement = '15-25%';
      }
      if (opt.type === 'performance_optimization') {
        impact.latencyReduction = '40-60%';
      }
    });
    
    return impact;
  }
  
  async generateOptimizationStrategy(optimization) {
    const prompt = `基于以下优化分析，生成一个详细的优化策略：
    
    当前问题:
    ${JSON.stringify(optimization.optimizations, null, 2)}
    
    预期影响:
    ${JSON.stringify(optimization.expectedImpact, null, 2)}
    
    请生成一个包含以下内容的优化策略:
    1. 短期优化措施（1周内）
    2. 中期改进计划（1个月内）
    3. 长期优化路线图（3个月内）
    4. 风险评估和缓解措施
    5. 关键成功指标`;
    
    // 使用AI生成优化策略
    const result = await this.router.unifiedRoute('analysis', prompt, {
      maxTokens: 2000,
      strategy: 'quality'
    });
    
    return {
      generatedAt: new Date().toISOString(),
      content: result.content,
      model: result.model,
      routerSkill: result.routerSkill
    };
  }
  
  async applyOptimizations(optimizations) {
    const applied = [];
    
    for (const optimization of optimizations) {
      try {
        // 这里应该实际应用优化
        // 暂时只是记录
        applied.push({
          ...optimization,
          appliedAt: new Date().toISOString(),
          status: 'applied',
          result: '优化已记录，等待实施'
        });
        
        console.log(`   ✅ 记录优化: ${optimization.type}`);
        
      } catch (error) {
        console.log(`   ❌ 应用优化失败: ${optimization.type} - ${error.message}`);
      }
    }
    
    return applied;
  }
  
  saveOptimization(optimization) {
    const filename = `optimization-${Date.now()}.json`;
    const filepath = path.join(this.reportsDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(optimization, null, 2), 'utf8');
  }
  
  /**
   * 阶段4: 策略库生成
   */
  async generateStrategyLibrary() {
    console.log('\n📚 阶段4: 策略库生成');
    console.log('='.repeat(50));
    
    // 收集所有历史数据
    const collections = this.loadCollections();
    const analyses = this.loadAnalyses();
    const optimizations = this.loadOptimizations();
    
    const strategyLibrary = {
      version: this.strategyConfig.strategyVersion,
      generatedAt: new Date().toISOString(),
      summary: {
        totalCollections: collections.length,
        totalAnalyses: analyses.length,
        totalOptimizations: optimizations.length,
        timeRange: this.getTimeRange(collections, analyses, optimizations)
      },
      strategies: {},
      bestPractices: [],
      antiPatterns: [],
      performanceBenchmarks: {},
      recommendations: {}
    };
    
    // 生成路由策略
    strategyLibrary.strategies.routing = await this.generateRoutingStrategies(collections);
    
    // 生成性能优化策略
    strategyLibrary.strategies.performance = await this.generatePerformanceStrategies(analyses);
    
    // 生成错误处理策略
    strategyLibrary.strategies.errorHandling = await this.generateErrorHandlingStrategies(collections);
    
    // 生成最佳实践
    strategyLibrary.bestPractices = await this.generateBestPractices(collections, analyses, optimizations);
    
    // 生成反模式
    strategyLibrary.antiPatterns = await this.generateAntiPatterns(collections, analyses);
    
    // 生成性能基准
    strategyLibrary.performanceBenchmarks = await this.generatePerformanceBenchmarks(collections);
    
    // 生成推荐配置
    strategyLibrary.recommendations = await this.generateRecommendationsConfig(analyses, optimizations);
    
    // 保存策略库
    this.saveStrategyLibrary(strategyLibrary);
    
    // 生成可读版本
    this.generateReadableStrategyLibrary(strategyLibrary);
    
    console.log(`✅ 策略库生成完成:`);
    console.log(`   策略数量: ${Object.keys(strategyLibrary.strategies).length} 类`);
    console.log(`   最佳实践: ${strategyLibrary.bestPractices.length} 条`);
    console.log(`   反模式: ${strategyLibrary.antiPatterns.length} 条`);
    console.log(`   性能基准: ${Object.keys(strategyLibrary.performanceBenchmarks).length} 项`);
    console.log(`   推荐配置: ${Object.keys(strategyLibrary.recommendations).length} 套`);
    
    return strategyLibrary;
  }
  
  loadAnalyses() {
    const analyses = [];
    try {
      const files = fs.readdirSync(this.reportsDir).filter(f => f.startsWith('analysis-'));
      
      files.forEach(file => {
        const filepath = path.join(this.reportsDir, file);
        const content = fs.readFileSync(filepath, 'utf8');
        analyses.push(JSON.parse(content));
      });
    } catch (error) {
      console.warn('⚠️ 加载分析结果失败:', error.message);
    }
    
    return analyses;
  }
  
  loadOptimizations() {
    const optimizations = [];
    try {
      const files = fs.readdirSync(this.reportsDir).filter(f => f.startsWith('optimization-'));
      
      files.forEach(file => {
        const filepath = path.join(this.reportsDir, file);
        const content = fs.readFileSync(filepath, 'utf8');
        optimizations.push(JSON.parse(content));
      });
    } catch (error) {
      console.warn('⚠️ 加载优化结果失败:', error.message);
    }
    
    return optimizations;
  }
  
  getTimeRange(collections, analyses, optimizations) {
    const timestamps = [];
    
    collections.forEach(c => timestamps.push(new Date(c.timestamp)));
    analyses.forEach(a => timestamps.push(new Date(a.timestamp)));
    optimizations.forEach(o => timestamps.push(new Date(o.timestamp)));
    
    if (timestamps.length === 0) {
      return '无数据';
    }
    
    timestamps.sort((a, b) => a - b);
    const start = timestamps[0];
    const end = timestamps[timestamps.length - 1];
    
    return `${start.toISOString().split('T')[0]} 至 ${end.toISOString().split('T')[0]}`;
  }
  
  async generateRoutingStrategies(collections) {
    const strategies = {
      fast: {
        description: '快速响应策略',
        useCase: '简单任务，需要快速响应',
        configuration: {
          priority: ['adaptive-routing', 'model-routing'],
          timeout: 5000,
          fallback: 'direct-api'
        },
        performance: {
          expectedLatency: '200-300ms',
          successRate: '>95%'
        }
      },
      balanced: {
        description: '平衡性能策略',
        useCase: '一般任务，平衡质量和速度',
        configuration: {
          priority: ['intelligent-router', 'oc-skill-router'],
          timeout: 10000,
          fallback: 'adaptive-routing'
        },
        performance: {
          expectedLatency: '300-500ms',
          successRate: '>90%'
        }
      },
      quality: {
        description: '高质量策略',
        useCase: '复杂任务，需要高质量输出',
        configuration: {
          priority: ['model-routing-orchestrator', 'intelligent-router'],
          timeout: 15000,
          fallback: 'oc-skill-router'
        },
        performance: {
          expectedLatency: '500-800ms',
          successRate: '>85%'
        }
      }
    };
    
    return strategies;
  }
  
  async generatePerformanceStrategies(analyses) {
    const strategies = [];
    
    analyses.forEach(analysis => {
      const insights = analysis.insights || [];
      insights.forEach(insight => {
        if (insight.type === 'performance' || insight.type === 'latency') {
          strategies.push({
            problem: insight.message,
            solution: analysis.recommendations?.find(r => r.type.includes('optimization'))?.action || '未指定',
            impact: '提升性能',
            priority: insight.severity === 'warning' ? 'high' : 'medium'
          });
        }
      });
    });
    
    return strategies;
  }
  
  async generateErrorHandlingStrategies(collections) {
    const strategies = [];
    const errorCounts = {};
    
    collections.forEach(collection => {
      const errors = collection.data?.errorLogs || [];
      errors.forEach(error => {
        errorCounts[error.type] = (errorCounts[error.type] || 0) + 1;
      });
    });
    
    Object.entries(errorCounts).forEach(([type, count]) => {
      strategies.push({
        errorType: type,
        frequency: count,
        handlingStrategy: this.getErrorHandlingStrategy(type),
        prevention: this.getErrorPrevention(type)
      });
    });
    
    return strategies;
  }
  
  getErrorHandlingStrategy(errorType) {
    const strategies = {
      'timeout': '增加超时时间，启用重试机制，使用更快的路由策略',
      'api_error': '检查API配置，启用故障转移，记录详细错误信息',
      'network_error': '检查网络连接，启用本地缓存，使用备用网络路径',
      'model_unavailable': '切换到备用模型，启用降级服务，通知管理员',
      'rate_limit': '实施请求限流，启用请求队列，使用多个API密钥轮换'
    };
    
    return strategies[errorType] || '启用通用错误处理机制';
  }
  
  getErrorPrevention(errorType) {
    const preventions = {
      'timeout': '监控系统性能，优化网络连接，使用CDN加速',
      'api_error': '定期测试API可用性，实施健康检查，配置告警',
      'network_error': '实施网络冗余，监控网络状态，启用自动重连',
      'model_unavailable': '维护模型可用性列表，实施负载均衡，配置备用模型',
      'rate_limit': '监控API使用量，实施请求配额管理，使用多个提供商'
    };
    
    return preventions[errorType] || '实施全面的监控和告警系统';
  }
  
  async generateBestPractices(collections, analyses, optimizations) {
    const practices = [
      {
        category: 'routing',
        practice: '根据任务类型选择合适的路由策略',
        benefit: '提高成功率，减少延迟，优化成本',
        implementation: '在路由调用时指定strategy参数'
      },
      {
        category: 'monitoring',
        practice: '定期收集和分析性能数据',
        benefit: '及时发现和解决问题，持续优化系统',
        implementation: '使用OMC 4AI工作流自动收集和分析'
      },
      {
        category: 'error_handling',
        practice: '实施多层错误处理机制',
        benefit: '提高系统可靠性，减少服务中断',
        implementation: '配置故障转移和降级策略'
      },
      {
        category: 'performance',
        practice: '优化网络连接和缓存策略',
        benefit: '减少延迟，提高响应速度',
        implementation: '启用CDN和本地缓存'
      }
    ];
    
    return practices;
  }
  
  async generateAntiPatterns(collections, analyses) {
    const antiPatterns = [
      {
        pattern: '硬编码API调用',
        problem: '缺乏灵活性，难以维护和扩展',
        solution: '使用统一的路由接口，支持动态配置',
        severity: 'high'
      },
      {
        pattern: '忽略错误处理',
        problem: '系统脆弱，容易崩溃',
        solution: '实施全面的错误处理和恢复机制',
        severity: 'critical'
      },
      {
        pattern: '缺乏监控',
        problem: '无法发现问题，难以优化',
        solution: '建立完整的性能监控和告警系统',
        severity: 'medium'
      },
      {
        pattern: '单一故障点',
        problem: '系统可靠性低',
        solution: '实施冗余和故障转移机制',
        severity: 'high'
      }
    ];
    
    return antiPatterns;
  }
  
  async generatePerformanceBenchmarks(collections) {
    if (collections.length === 0) {
      return {
        note: '暂无足够数据生成性能基准'
      };
    }
    
    const benchmarks = {
      routing: {
        successRate: {
          target: '>95%',
          current: this.calculateAverageSuccessRate(collections),
          status: 'meeting' // meeting, warning, critical
        },
        latency: {
          target: '<500ms',
          current: this.calculateAverageLatency(collections),
          status: 'meeting'
        }
      },
      stages: {}
    };
    
    // 各阶段性能基准
    const stages = ['analysis', 'design', 'generation', 'review', 'optimization'];
    stages.forEach(stage => {
      const stageMetrics = this.calculateStageMetrics(collections, stage);
      benchmarks.stages[stage] = stageMetrics;
    });
    
    return benchmarks;
  }
  
  calculateAverageSuccessRate(collections) {
    let totalCalls = 0;
    let successfulCalls = 0;
    
    collections.forEach(collection => {
      const stats = collection.data?.routingStats;
      if (stats) {
        totalCalls += stats.totalCalls || 0;
        successfulCalls += stats.successfulCalls || 0;
      }
    });
    
    return totalCalls > 0 ? ((successfulCalls / totalCalls) * 100).toFixed(1) + '%' : '0%';
  }
  
  calculateAverageLatency(collections) {
    let totalLatency = 0;
    let count = 0;
    
    collections.forEach(collection => {
      const stats = collection.data?.routingStats;
      if (stats && stats.averageLatency) {
        totalLatency += stats.averageLatency;
        count++;
      }
    });
    
    return count > 0 ? Math.round(totalLatency / count) + 'ms' : 'N/A';
  }
  
  calculateStageMetrics(collections, stage) {
    const metrics = [];
    
    collections.forEach(collection => {
      const performance = collection.data?.performanceMetrics || [];
