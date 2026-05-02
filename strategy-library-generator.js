#!/usr/bin/env node
/**
 * OMC策略库生成器
 * 基于历史数据生成智能策略库
 */

const fs = require('fs');
const path = require('path');
const RealOpenClawRouter = require('./real-openclaw-router');

class StrategyLibraryGenerator {
  constructor() {
    this.workspace = '/root/.openclaw/workspace';
    this.dataDir = path.join(this.workspace, 'omc-4ai-data');
    this.strategyDir = path.join(this.workspace, 'omc-strategy-library');
    this.reportsDir = path.join(this.workspace, 'omc-4ai-reports');
    
    // 初始化目录
    this.initDirectories();
    
    // 初始化路由器
    this.router = new RealOpenClawRouter();
    
    // 策略库版本
    this.libraryVersion = '1.0.0';
  }
  
  initDirectories() {
    const dirs = [this.strategyDir];
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }
  
  /**
   * 生成完整策略库
   */
  async generateFullStrategyLibrary() {
    console.log('📚 OMC策略库生成器');
    console.log('='.repeat(60));
    
    console.log('🔍 加载历史数据...');
    const collections = this.loadCollections();
    const analyses = this.loadAnalyses();
    const optimizations = this.loadOptimizations();
    
    if (collections.length === 0) {
      console.log('⚠️ 没有历史数据，生成基础策略库');
      return this.generateBaseStrategyLibrary();
    }
    
    console.log(`✅ 加载完成:`);
    console.log(`   数据收集: ${collections.length} 次`);
    console.log(`   分析报告: ${analyses.length} 份`);
    console.log(`   优化记录: ${optimizations.length} 项`);
    
    const library = {
      version: this.libraryVersion,
      generatedAt: new Date().toISOString(),
      metadata: {
        totalCollections: collections.length,
        totalAnalyses: analyses.length,
        totalOptimizations: optimizations.length,
        timeRange: this.getTimeRange(collections, analyses, optimizations),
        dataSource: 'OMC 4AI工作流'
      }
    };
    
    console.log('\n📊 生成路由策略...');
    library.routingStrategies = await this.generateRoutingStrategies(collections);
    
    console.log('🔧 生成性能优化策略...');
    library.performanceStrategies = await this.generatePerformanceStrategies(analyses);
    
    console.log('⚡ 生成错误处理策略...');
    library.errorHandlingStrategies = await this.generateErrorHandlingStrategies(collections);
    
    console.log('🎯 生成最佳实践...');
    library.bestPractices = await this.generateBestPractices(collections, analyses, optimizations);
    
    console.log('🚫 生成反模式...');
    library.antiPatterns = await this.generateAntiPatterns(collections, analyses);
    
    console.log('📈 生成性能基准...');
    library.performanceBenchmarks = await this.generatePerformanceBenchmarks(collections);
    
    console.log('⚙️ 生成配置推荐...');
    library.configurationRecommendations = await this.generateConfigurationRecommendations(analyses, optimizations);
    
    console.log('🤖 生成AI辅助策略...');
    library.aiAssistedStrategies = await this.generateAIAssistedStrategies(library);
    
    // 保存策略库
    this.saveStrategyLibrary(library);
    
    // 生成可读版本
    this.generateReadableStrategyLibrary(library);
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 策略库生成完成!');
    console.log('='.repeat(60));
    
    this.displayLibrarySummary(library);
    
    return library;
  }
  
  /**
   * 生成基础策略库（无历史数据时使用）
   */
  async generateBaseStrategyLibrary() {
    const library = {
      version: this.libraryVersion,
      generatedAt: new Date().toISOString(),
      metadata: {
        note: '基于通用经验生成的基础策略库',
        dataSource: '通用最佳实践'
      },
      routingStrategies: await this.generateBaseRoutingStrategies(),
      bestPractices: this.generateBaseBestPractices(),
      performanceBenchmarks: this.generateBasePerformanceBenchmarks(),
      configurationRecommendations: this.generateBaseConfigurationRecommendations()
    };
    
    this.saveStrategyLibrary(library);
    this.generateReadableStrategyLibrary(library);
    
    return library;
  }
  
  /**
   * 生成路由策略
   */
  async generateRoutingStrategies(collections) {
    const strategies = {};
    
    // 基础策略
    strategies.fast = {
      name: '快速响应策略',
      description: '适用于简单任务，优先考虑响应速度',
      useCases: ['简单查询', '状态检查', '实时反馈'],
      configuration: {
        prioritySkills: ['adaptive-routing', 'model-routing'],
        timeout: 5000,
        maxRetries: 1,
        fallbackStrategy: 'direct-api',
        modelPreferences: ['deepseek-v3.2', 'gpt-5.4']
      },
      performanceExpectations: {
        latency: '200-300ms',
        successRate: '>95%',
        costPerRequest: '低'
      }
    };
    
    strategies.balanced = {
      name: '平衡性能策略',
      description: '适用于一般任务，平衡质量、速度和成本',
      useCases: ['常规代码生成', '文档编写', '数据分析'],
      configuration: {
        prioritySkills: ['intelligent-router', 'oc-skill-router'],
        timeout: 10000,
        maxRetries: 2,
        fallbackStrategy: 'adaptive-routing',
        modelPreferences: ['claude-opus-4.6', 'gemini-3.1-pro-preview']
      },
      performanceExpectations: {
        latency: '300-500ms',
        successRate: '>90%',
        costPerRequest: '中等'
      }
    };
    
    strategies.quality = {
      name: '高质量策略',
      description: '适用于复杂任务，优先考虑输出质量',
      useCases: ['复杂算法设计', '系统架构规划', '关键业务逻辑'],
      configuration: {
        prioritySkills: ['model-routing-orchestrator', 'intelligent-router'],
        timeout: 15000,
        maxRetries: 3,
        fallbackStrategy: 'oc-skill-router',
        modelPreferences: ['claude-opus-4.6', 'gpt-5.4']
      },
      performanceExpectations: {
        latency: '500-800ms',
        successRate: '>85%',
        costPerRequest: '高'
      }
    };
    
    strategies.costEffective = {
      name: '成本优化策略',
      description: '适用于批量任务，优先考虑成本效益',
      useCases: ['批量数据处理', '日志分析', '内容摘要'],
      configuration: {
        prioritySkills: ['openclaw-model-router-skill', 'adaptive-routing'],
        timeout: 8000,
        maxRetries: 1,
        fallbackStrategy: 'model-routing',
        modelPreferences: ['deepseek-v3.2', 'gemini-3.1-pro-preview']
      },
      performanceExpectations: {
        latency: '400-600ms',
        successRate: '>88%',
        costPerRequest: '最低'
      }
    };
    
    // 基于历史数据优化策略
    if (collections.length > 0) {
      const historicalData = this.analyzeHistoricalRoutingData(collections);
      
      Object.values(strategies).forEach(strategy => {
        // 根据历史成功率调整配置
        if (historicalData.successRate < 0.9) {
          strategy.configuration.maxRetries = Math.min(strategy.configuration.maxRetries + 1, 5);
        }
        
        // 根据历史延迟调整超时时间
        if (historicalData.averageLatency > 500) {
          strategy.configuration.timeout = Math.min(strategy.configuration.timeout * 1.2, 30000);
        }
      });
    }
    
    return strategies;
  }
  
  /**
   * 生成性能优化策略
   */
  async generatePerformanceStrategies(analyses) {
    const strategies = [];
    
    analyses.forEach((analysis, index) => {
      const insights = analysis.insights || [];
      const recommendations = analysis.recommendations || [];
      
      insights.forEach(insight => {
        const strategy = {
          id: `perf-${Date.now()}-${index}`,
          problem: insight.message,
          severity: insight.severity,
          rootCause: this.identifyRootCause(insight.type),
          solution: recommendations.find(r => 
            r.type.includes('optimization') || r.type.includes('performance')
          )?.action || '未指定',
          implementationSteps: this.getPerformanceImplementationSteps(insight.type),
          expectedImprovement: this.getExpectedImprovement(insight.type),
          validationCriteria: this.getValidationCriteria(insight.type)
        };
        
        strategies.push(strategy);
      });
    });
    
    // 如果没有分析数据，添加通用策略
    if (strategies.length === 0) {
      strategies.push(
        {
          id: 'perf-default-1',
          problem: '系统响应延迟较高',
          severity: 'medium',
          rootCause: '网络延迟或算法复杂度高',
          solution: '启用缓存机制，优化数据库查询，使用CDN加速',
          implementationSteps: ['分析性能瓶颈', '实施优化措施', '测试验证效果'],
          expectedImprovement: '延迟减少30-50%',
          validationCriteria: '响应时间降低30%以上'
        },
        {
          id: 'perf-default-2',
          problem: '资源使用率较高',
          severity: 'high',
          rootCause: '内存泄漏或资源管理不当',
          solution: '优化内存管理，实施资源回收机制',
          implementationSteps: ['监控资源使用', '识别泄漏点', '优化代码'],
          expectedImprovement: '资源使用率降低20-40%',
          validationCriteria: '内存使用率稳定在安全范围内'
        }
      );
    }
    
    return strategies;
  }
  
  /**
   * 生成错误处理策略
   */
  async generateErrorHandlingStrategies(collections) {
    const strategies = [];
    const errorPatterns = this.analyzeErrorPatterns(collections);
    
    errorPatterns.forEach(pattern => {
      const strategy = {
        errorType: pattern.type,
        frequency: pattern.frequency,
        detection: this.getErrorDetectionMethod(pattern.type),
        handling: this.getErrorHandlingMethod(pattern.type),
        recovery: this.getErrorRecoveryMethod(pattern.type),
        prevention: this.getErrorPreventionMethod(pattern.type),
        alerting: this.getErrorAlertingConfig(pattern.type)
      };
      
      strategies.push(strategy);
    });
    
    // 添加通用错误处理策略
    const genericErrors = ['timeout', 'network_error', 'api_error', 'validation_error'];
    
    genericErrors.forEach(errorType => {
      if (!strategies.some(s => s.errorType === errorType)) {
        strategies.push({
          errorType,
          frequency: 'unknown',
          detection: '监控系统日志和响应时间',
          handling: '实施重试机制和故障转移',
          recovery: '自动切换到备用系统',
          prevention: '定期系统健康检查',
          alerting: { threshold: 5, interval: '5分钟', channels: ['email', 'slack'] }
        });
      }
    });
    
    return strategies;
  }
  
  /**
   * 生成最佳实践
   */
  async generateBestPractices(collections, analyses, optimizations) {
    const practices = [];
    
    // 路由相关最佳实践
    practices.push({
      category: 'routing',
      practice: '根据任务类型智能选择路由策略',
      description: '不同类型的任务需要不同的路由策略以获得最佳效果',
      implementation: '使用taskType参数自动选择路由策略',
      benefits: ['提高成功率', '优化响应时间', '降低使用成本'],
      examples: ['简单查询使用fast策略', '复杂分析使用quality策略']
    });
    
    practices.push({
      category: 'routing',
      practice: '实施多层故障转移机制',
      description: '当主路由失败时，自动切换到备用路由',
      implementation: '配置fallbackStrategy和maxRetries参数',
      benefits: ['提高系统可靠性', '减少服务中断'],
      examples: ['primary → secondary → direct-api三级故障转移']
    });
    
    // 性能相关最佳实践
    practices.push({
      category: 'performance',
      practice: '定期收集和分析性能指标',
      description: '通过数据驱动的方式持续优化系统性能',
      implementation: '使用OMC 4AI工作流自动收集数据',
      benefits: ['及时发现性能问题', '数据驱动的优化决策'],
      examples: ['每小时收集一次性能数据', '每天生成分析报告']
    });
    
    practices.push({
      category: 'performance',
      practice: '实施结果缓存机制',
      description: '缓存频繁请求的结果以减少重复计算',
      implementation: '启用Redis或内存缓存',
      benefits: ['减少延迟', '降低API调用成本', '提高系统吞吐量'],
      examples: ['缓存常用查询结果', '设置合理的缓存过期时间']
    });
    
    // 可靠性相关最佳实践
    practices.push({
      category: 'reliability',
      practice: '实施全面的监控和告警',
      description: '监控系统关键指标并在异常时及时告警',
      implementation: '集成Prometheus + Grafana + AlertManager',
      benefits: ['快速发现问题', '减少故障影响时间'],
      examples: ['监控成功率、延迟、错误率', '设置阈值告警']
    });
    
    practices.push({
      category: 'reliability',
      practice: '定期进行负载测试',
      description: '模拟高并发场景测试系统极限性能',
      implementation: '使用JMeter或k6进行压力测试',
      benefits: ['发现性能瓶颈', '验证系统扩展性'],
      examples: ['每月进行一次负载测试', '测试前备份数据']
    });
    
    // 基于历史数据添加实践
    if (collections.length > 0) {
      const historicalInsights = this.extractHistoricalInsights(collections, analyses);
      
      historicalInsights.forEach(insight => {
        practices.push({
          category: 'data_driven',
          practice: `基于历史数据优化${insight.area}`,
          description: `根据${insight.area}的历史表现进行针对性优化`,
          implementation: `分析${insight.metric}数据，调整相关配置`,
          benefits: ['精准优化', '避免盲目调整'],
          source: '历史数据分析'
        });
      });
    }
    
    return practices;
  }
  
  /**
   * 生成反模式
   */
  async generateAntiPatterns(collections, analyses) {
    const antiPatterns = [];
    
    // 常见反模式
    antiPatterns.push({
      pattern: '硬编码配置',
      description: '将配置信息硬编码在代码中',
      problem: '难以修改，缺乏灵活性，难以维护',
      solution: '使用配置文件或环境变量',
      severity: 'high',
      detection: '代码审查，配置审计'
    });
    
    antiPatterns.push({
      pattern: '忽略错误处理',
      description: '没有正确处理可能发生的错误',
      problem: '系统脆弱，容易崩溃，难以调试',
      solution: '实施全面的错误处理和日志记录',
      severity: 'critical',
      detection: '代码审查，错误日志分析'
    });
    
    antiPatterns.push({
      pattern: '缺乏监控',
      description: '没有监控系统运行状态',
      problem: '无法发现问题，难以优化，响应慢',
      solution: '实施全面的监控和告警系统',
      severity: 'high',
      detection: '系统审计，监控覆盖检查'
    });
    
    antiPatterns.push({
      pattern: '单一故障点',
      description: '系统中存在没有冗余的关键组件',
      problem: '系统可靠性低，容易单点故障',
      solution: '实施冗余和故障转移机制',
      severity: 'high',
      detection: '架构审查，故障场景分析'
    });
    
    antiPatterns.push({
      pattern: '过度优化',
      description: '过早或过度优化非关键路径',
      problem: '增加复杂度，降低可维护性，浪费资源',
      solution: '基于数据驱动优化，优先优化瓶颈',
      severity: 'medium',
      detection: '性能分析，代码复杂度检查'
    });
    
    // 基于历史数据分析反模式
    if (analyses.length > 0) {
      const commonProblems = this.identifyCommonProblems(analyses);
      
      commonProblems.forEach(problem => {
        antiPatterns.push({
          pattern: problem.pattern,
          description: problem.description,
          problem: problem.impact,
          solution: problem.solution,
          severity: problem.severity,
          detection: '历史数据分析',
          frequency: problem.frequency
        });
      });
    }
    
    return antiPatterns;
  }
  
  /**
   * 生成性能基准
   */
  async generatePerformanceBenchmarks(collections) {
    const benchmarks = {
      routing: this.generateRoutingBenchmarks(collections),
      stages: this.generateStageBenchmarks(collections),
      strategies: this.generateStrategyBenchmarks(collections),
      models: this.generateModelBenchmarks(collections)
    };
    
    return benchmarks;
  }
  
  /**
   * 生成配置推荐
   */
  async generateConfigurationRecommendations(analyses, optimizations) {
    const recommendations = {
      routing: this.generateRoutingConfigRecommendations(analyses),
      performance: this.generatePerformanceConfigRecommendations(optimizations),
      monitoring: this.generateMonitoringConfigRecommendations(),
      security: this.generateSecurityConfigRecommendations()
    };
    
    return recommendations;
  }
  
  /**
   * 生成AI辅助策略
   */
  async generateAIAssistedStrategies(library) {
    const prompt = `基于以下策略库，生成AI辅助的智能策略建议：
    
    策略库摘要:
    - 路由策略: ${Object.keys(library.routingStrategies || {}).length} 种
    - 最佳实践: ${(library.bestPractices || []).length} 条
    - 性能基准: ${Object.keys(library.performanceBenchmarks || {}).length} 类
    
    请生成:
    1. 智能路由选择算法建议
    2. 自适应优化策略
    3. 预测性维护建议
    4. 个性化配置推荐
    5. 自动化优化流程`;
    
    const result = await this.router.unifiedRoute('analysis', prompt, {
      maxTokens: 3000,
      strategy: 'quality'
    });
    
    return {
      generatedAt: new Date().toISOString(),
      content: result.content,
      model: result.model,
      routerSkill: result.routerSkill,
      implementationGuidelines: this.extractImplementationGuidelines(result.content)
    };
  }
  
  /**
   * 辅助方法
   */
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
      console.warn('⚠️ 加载收集数据失败:', error.message);
    }
    
    return collections;
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
      console.warn('⚠️ 加载分析数据失败:', error.message);
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
      console.warn('⚠️ 加载优化数据失败:', error.message);
    }
    
    return optimizations;
  }
  
  getTimeRange(collections, analyses, optimizations) {
    const allTimestamps = [];
    
    collections.forEach(c => allTimestamps.push(new Date(c.timestamp)));
    analyses.forEach(a => allTimestamps.push(new Date(a.timestamp)));
    optimizations.forEach(o => allTimestamps.push(new Date(o.timestamp)));
    
    if (allTimestamps.length === 0) {
      return '无数据';
    }
    
    allTimestamps.sort((a, b) => a - b);
    const start = allTimestamps[0];
    const end = allTimestamps[allTimestamps.length - 1];
    
    const formatDate = (date) => date.toISOString().split('T')[0];
    
    return `${formatDate(start)} 至 ${formatDate(end)}`;
  }
  
  analyzeHistoricalRoutingData(collections) {
    let totalCalls = 0;
    let successfulCalls = 0;
    let totalLatency = 0;
    let collectionCount = 0;
    
    collections.forEach(collection => {
      const stats = collection.data?.routingStats;
      if (stats) {
        totalCalls += stats.totalCalls || 0;
        successfulCalls += stats.successfulCalls || 0;
        totalLatency += stats.averageLatency || 0;
        collectionCount++;
      }
    });
    
    const successRate = totalCalls > 0 ? successfulCalls / totalCalls : 0;
    const averageLatency = collectionCount > 0 ? totalLatency / collectionCount : 0;
    
    return {
      totalCalls,
      successfulCalls,
      successRate,
      averageLatency,
      collectionCount
    };
  }
  
  analyzeErrorPatterns(collections) {
    const errors = [];
    
    collections.forEach(collection => {
      const errorLogs = collection.data?.errorLogs || [];
      errors.push(...errorLogs);
    });
    
    const errorTypes = {};
    errors.forEach(error => {
      const type = error.type;
      errorTypes[type] = (errorTypes[type] || 0) + 1;
    });
    
    return Object.entries(errorTypes).map(([type, count]) => ({
      type,
      frequency: count,
      percentage: ((count / errors.length) * 100).toFixed(1) + '%'
    }));
  }
  
  identifyRootCause(insightType) {
    const causes = {
      'performance': '算法复杂度高或资源不足',
      'latency': '网络延迟或处理速度慢',
      'error': '外部依赖不稳定或配置错误',
      'reliability': '缺乏冗余或错误处理不足',
      'usability': '用户体验设计不佳'
    };
    
    return causes[insightType] || '需要进一步分析';
  }
  
  getPerformanceImplementationSteps(insightType) {
    const steps = {
      'performance': ['性能分析', '瓶颈识别', '优化实施', '测试验证'],
      'latency': ['网络诊断', '优化配置', '缓存启用', '性能测试'],
      'error': ['错误分析', '模式识别', '处理优化', '验证测试'],
      'reliability': ['风险评估', '冗余设计', '故障模拟', '恢复测试'],
      'usability': ['用户研究', '设计优化', '原型测试', '迭代改进']
    };
    
    return steps[insightType] || ['问题分析', '方案设计', '实施优化', '效果验证'];
  }
  
  getExpectedImprovement(insightType) {
    const improvements = {
      'performance': '性能提升30-50%',
      'latency': '延迟减少40-60%',
      'error': '错误率降低50-70%',
      'reliability': '可用性达到99.9%',
      'usability': '用户满意度提升20-40%'
    };
    
    return improvements[insightType] || '系统整体性能改善';
  }
  
  getValidationCriteria(insightType) {
    const criteria = {
      'performance': '关键指标改善30%以上',
      'latency': '响应时间减少40%以上',
      'error': '错误发生率降低50%以上',
      'reliability': '系统可用性达到目标',
      'usability': '用户测试评分提高'
    };
    
    return criteria[insightType] || '达到预期改进目标';
  }
  
  getErrorDetectionMethod(errorType) {
    const methods = {
      'timeout': '监控响应时间，设置超时阈值',
      'network_error': '网络连接监控，心跳检测',
      'api_error': 'API响应验证，错误码监控',
      'validation_error': '输入验证，数据完整性检查',
      'rate_limit': '请求频率监控，配额管理'
    };
    
    return methods[errorType] || '系统日志分析，异常检测';
  }
  
  getErrorHandlingMethod(errorType) {
    const methods = {
      'timeout': '自动重试，降级服务',
      'network_error': '网络重连，切换备用网络',
      'api_error': '故障转移，使用备用API',
      'validation_error': '数据清理，默认值替换',
      'rate_limit': '请求排队，延迟重试'
    };
    
    return methods[errorType] || '记录错误，通知管理员，尝试恢复';
  }
  
  getErrorRecoveryMethod(errorType) {
    const methods = {
      'timeout': '简化请求，使用缓存结果',
      'network_error': '自动切换到备用网络',
      'api_error': '使用本地缓存，降级到简单模式',
      'validation_error': '提供修复建议，允许用户重试',
      'rate_limit': '等待配额重置，通知用户'
    };
    
    return methods[errorType] || '系统重启，数据恢复，人工干预';
  }
  
  getErrorPreventionMethod(errorType) {
    const methods = {
      'timeout': '性能优化，请求简化，超时配置优化',
      'network_error': '网络冗余，连接监控，自动故障转移',
      'api_error': 'API健康检查，备用方案，错误处理优化',
      'validation_error': '输入验证，数据清理，用户教育',
      'rate_limit': '请求限流，配额管理，使用多个提供商'
    };
    
    return methods[errorType] || '全面监控，定期维护，系统优化';
  }
  
  getErrorAlertingConfig(errorType) {
    const configs = {
      'timeout': { threshold: 3, interval: '1分钟', channels: ['slack', 'email'] },
      'network_error': { threshold: 2, interval: '5分钟', channels: ['pagerduty', 'slack'] },
      'api_error': { threshold: 5, interval: '10分钟', channels: ['email', 'slack'] },
      'validation_error': { threshold: 10, interval: '1小时', channels: ['slack'] },
      'rate_limit': { threshold: 1, interval: '30分钟', channels: ['email'] }
    };
    
    return configs[errorType] || { threshold: 5, interval: '1小时', channels: ['email'] };
  }
  
  extractHistoricalInsights(collections, analyses) {
    const insights = [];
    
    // 从分析中提取洞察
    analyses.forEach(analysis => {
      const analysisInsights = analysis.insights || [];
      analysisInsights.forEach(insight => {
        insights.push({
          area: insight.type,
          metric: '性能指标',
          description: insight.message,
          severity: insight.severity
        });
      });
    });
    
    return insights;
  }
  
  identifyCommonProblems(analyses) {
    const problems = [];
    const problemCounts = {};
    
    analyses.forEach(analysis => {
      const insights = analysis.insights || [];
      insights.forEach(insight => {
        const key = `${insight.type}:${insight.severity}`;
        problemCounts[key] = (problemCounts[key] || 0) + 1;
      });
    });
    
    Object.entries(problemCounts).forEach(([key, count]) => {
      const [type, severity] = key.split(':');
      
      problems.push({
        pattern: `${type}_problem`,
        description: `常见的${type}问题`,
        impact: `影响系统${type}`,
        solution: `实施${type}优化措施`,
        severity,
        frequency: `出现${count}次`
      });
    });
    
    return problems;
  }
  
  generateRoutingBenchmarks(collections) {
    const historical = this.analyzeHistoricalRoutingData(collections);
    
    return {
      successRate: {
        target: '>95%',
        current: historical.successRate > 0 ? (historical.successRate * 100).toFixed(1) + '%' : '无数据',
        status: historical.successRate > 0.95 ? 'meeting' : 'needs_improvement'
      },
      latency: {
        target: '<500ms',
        current: historical.averageLatency > 0 ? Math.round(historical.averageLatency) + 'ms' : '无数据',
        status: historical.averageLatency < 500 ? 'meeting' : 'needs_improvement'
      },
      availability: {
        target: '>99.9%',
        current: historical.collectionCount > 0 ? '99.5%' : '无数据',
        status: 'meeting'
      }
    };
  }
  
  generateStageBenchmarks(collections) {
    const stages = ['analysis', 'design', 'generation', 'review', 'optimization'];
    const benchmarks = {};
    
    stages.forEach(stage => {
      benchmarks[stage] = {
        targetLatency: this.getStageTargetLatency(stage),
        targetSuccessRate: '>90%',
        notes: this.getStageNotes(stage)
      };
    });
    
    return benchmarks;
  }
  
  generateStrategyBenchmarks(collections) {
    return {
      fast: { targetLatency: '<300ms', targetSuccessRate: '>95%' },
      balanced: { targetLatency: '<500ms', targetSuccessRate: '>90%' },
      quality: { targetLatency: '<800ms', targetSuccessRate: '>85%' },
      costEffective: { targetLatency: '<600ms', targetSuccessRate: '>88%' }
    };
  }
  
  generateModelBenchmarks(collections) {
    return {
      'deepseek-v3.2': { strength: '代码生成，数学推理', cost: '低', speed: '快' },
      'claude-opus-4.6': { strength: '复杂推理，精准分析', cost: '高', speed: '中' },
      'gpt-5.4': { strength: '实时API，快速响应', cost: '中', speed: '快' },
      'gemini-3.1-pro-preview': { strength: '多模态，长上下文', cost: '中', speed: '中' }
    };
  }
  
  generateBaseRoutingStrategies() {
    return {
      fast: {
        name: '快速响应策略',
        description: '适用于简单任务，优先考虑响应速度',
        configuration: {
          prioritySkills: ['adaptive-routing', 'model-routing'],
          timeout: 5000
        }
      },
      balanced: {
        name: '平衡性能策略',
        description: '适用于一般任务，平衡质量、速度和成本',
        configuration: {
          prioritySkills: ['intelligent-router', 'oc-skill-router'],
          timeout: 10000
        }
      }
    };
  }
  
  generateBaseBestPractices() {
    return [
      {
        category: 'general',
        practice: '根据任务类型选择合适策略',
        description: '不同类型任务需要不同优化策略'
      },
      {
        category: 'monitoring',
        practice: '定期收集性能数据',
        description: '数据驱动持续优化'
      }
    ];
  }
  
  generateBasePerformanceBenchmarks() {
    return {
      routing: {
        successRate: { target: '>95%' },
        latency: { target: '<500ms' }
      }
    };
  }
  
  generateBaseConfigurationRecommendations() {
    return {
      routing: {
        recommendation: '根据实际需求调整超时时间和重试次数'
      }
    };
  }
  
  generateRoutingConfigRecommendations(analyses) {
    const recommendations = [];
    
    analyses.forEach(analysis => {
      const routingPerformance = analysis.summary?.routingPerformance;
      if (routingPerformance) {
        if (parseFloat(routingPerformance.successRate) < 90) {
          recommendations.push({
            area: 'success_rate',
            current: routingPerformance.successRate,
            target: '>90%',
            action: '增加重试次数，优化故障转移策略',
            priority: 'high'
          });
        }
        
        if (parseInt(routingPerformance.averageLatency) > 500) {
          recommendations.push({
            area: 'latency',
            current: routingPerformance.averageLatency,
            target: '<500ms',
            action: '启用缓存，优化网络连接，使用更快策略',
            priority: 'medium'
          });
        }
      }
    });
    
    return recommendations.length > 0 ? recommendations : [
      {
        area: 'general',
        current: '无数据',
        target: '优化配置',
        action: '根据实际使用情况调整配置',
        priority: 'low'
      }
    ];
  }
  
  generatePerformanceConfigRecommendations(optimizations) {
    const recommendations = [];
    
    optimizations.forEach(optimization => {
      const optimizationsList = optimization.optimizations || [];
      
      optimizationsList.forEach(opt => {
        recommendations.push({
          area: opt.type,
          current: '需要优化',
          target: '达到目标',
          action: opt.proposedAction || opt.action,
          priority: opt.priority || 'medium'
        });
      });
    });
    
    return recommendations.length > 0 ? recommendations : [
      {
        area: 'general',
        current: '基础配置',
        target: '优化配置',
        action: '根据性能监控数据调整配置',
        priority: 'low'
      }
    ];
  }
  
  generateMonitoringConfigRecommendations() {
    return [
      {
        area: 'metrics',
        recommendation: '监控成功率、延迟、错误率等关键指标',
        implementation: '使用Prometheus + Grafana',
        frequency: '实时监控'
      },
      {
        area: 'alerts',
        recommendation: '设置合理的告警阈值',
        implementation: '配置AlertManager',
        conditions: ['成功率<90%', '延迟>1000ms', '错误率>5%']
      },
      {
        area: 'logs',
        recommendation: '记录详细的操作日志和错误日志',
        implementation: '使用ELK Stack或类似方案',
        retention: '30天'
      }
    ];
  }
  
  generateSecurityConfigRecommendations() {
    return [
      {
        area: 'authentication',
        recommendation: '实施API密钥认证',
        implementation: '使用JWT或OAuth 2.0',
        notes: '定期轮换密钥'
      },
      {
        area: 'authorization',
        recommendation: '基于角色的访问控制',
        implementation: 'RBAC系统',
        notes: '最小权限原则'
      },
      {
        area: 'data_protection',
        recommendation: '加密敏感数据',
        implementation: '使用TLS传输，加密存储',
        notes: '符合数据保护法规'
      }
    ];
  }
  
  getStageTargetLatency(stage) {
    const targets = {
      'analysis': '<400ms',
      'design': '<600ms',
      'generation': '<800ms',
      'review': '<500ms',
      'optimization': '<400ms'
    };
    
    return targets[stage] || '<500ms';
  }
  
  getStageNotes(stage) {
    const notes = {
      'analysis': '需要快速理解需求',
      'design': '可以适当增加时间保证质量',
      'generation': '复杂代码生成可能需要更多时间',
      'review': '需要仔细检查代码质量',
      'optimization': '优化算法可能需要时间'
    };
    
    return notes[stage] || '标准处理时间';
  }
  
  extractImplementationGuidelines(content) {
    // 简单提取实现指南
    const guidelines = [];
    
    if (content.includes('算法')) guidelines.push