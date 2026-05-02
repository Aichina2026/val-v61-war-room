  async routeAndExecute(routeRequest) {
    const routeDecision = await this.route(routeRequest);
    const result = await this.executeRouteDecision(routeDecision, routeRequest);
    return result;
  }
  
  extractFeatures(request) {
    const prompt = typeof request.request === 'string' ? request.request : 
                   JSON.stringify(request.request).toLowerCase();
    
    return {
      hasCodePattern: this.hasCodePattern(prompt),
      hasMathPattern: this.hasMathPattern(prompt),
      hasSearchPattern: this.hasSearchPattern(prompt),
      length: prompt.length,
      complexity: this.calculateComplexity(prompt),
      role: request.role,
      preferredModel: request.preferredModel
    };
  }
  
  hasCodePattern(text) {
    const patterns = [
      /\b(function|def|class|const|let|var)\b/,
      /[{}[\];]/,
      /\b(import|from|require)\b/,
      /\b(if|for|while|return)\b/,
      /\b(console|print|log)\b/,
      /[=+\-*/<>!]=?/,
      /\b(async|await|promise)\b/,
      /\b(type|interface|enum)\b/,
      /```[\s\S]*?```/
    ];
    return patterns.some(p => p.test(text));
  }
  
  hasMathPattern(text) {
    const patterns = [
      /\b(solve|calculate|compute|equation)\b/,
      /[+\-*/^=<>]/,
      /\b(integral|derivative|limit|sum)\b/,
      /\b(matrix|vector|tensor)\b/,
      /[0-9]+\s*[+\-*/^]\s*[0-9]+/,
      /\b(sin|cos|tan|log|exp)\b/
    ];
    return patterns.some(p => p.test(text));
  }
  
  hasSearchPattern(text) {
    const patterns = [
      /\b(search|find|look up|query)\b/,
      /\b(what is|who is|how to|why does)\b/,
      /\b(information|details|explain|describe)\b/,
      /\?$/,
      /\b(wikipedia|google|search engine)\b/
    ];
    return patterns.some(p => p.test(text));
  }
  
  calculateComplexity(text) {
    let complexity = 0;
    complexity += text.length / 100; // 长度因子
    complexity += (text.match(/[{}[\];]/g) || []).length * 5; // 代码结构
    complexity += (text.match(/\b(if|for|while|function|class)\b/g) || []).length * 10; // 控制结构
    complexity += (text.match(/[+\-*/^=<>]/g) || []).length * 2; // 运算符
    return Math.min(complexity, 100);
  }
  
  selectModel(role, intent, preferredModel) {
    // 基于角色和意图选择最优模型
    const modelMatrix = {
      clarifier: {
        mathReasoning: ['gemini-3.1-pro-preview', 'glm-5'],
        requirementAnalysis: ['glm-5', 'gemini-3.1-pro-preview'],
        general: ['glm-5', 'gemini-3.1-pro-preview']
      },
      builder: {
        codeGeneration: ['deepseek-v3.2', 'claude-sonnet-4.6'],
        architectureDesign: ['claude-sonnet-4.6', 'deepseek-v3.2'],
        general: ['deepseek-v3.2', 'claude-sonnet-4.6']
      },
      reviewer: {
        securityReview: ['claude-opus-4.6', 'kimi-k2.5'],
        codeReview: ['claude-opus-4.6', 'kimi-k2.5'],
        general: ['claude-opus-4.6', 'kimi-k2.5']
      },
      arbiter: {
        orchestration: ['gpt-5.4'],
        synthesis: ['gpt-5.4'],
        decisionMaking: ['gpt-5.4'],
        general: ['gpt-5.4']
      }
    };
    
    const roleModels = modelMatrix[role] || modelMatrix.builder;
    const intentKey = Object.keys(roleModels).find(key => intent.includes(key)) || 'general';
    const models = roleModels[intentKey];
    
    // 如果用户指定了偏好模型，优先使用
    if (preferredModel && models.includes(preferredModel)) {
      return {
        model: preferredModel,
        provider: this.getProvider(preferredModel),
        fallbackChain: models.filter(m => m !== preferredModel)
      };
    }
    
    return {
      model: models[0],
      provider: this.getProvider(models[0]),
      fallbackChain: models.slice(1)
    };
  }
  
  getProvider(model) {
    const providerMap = {
      'glm-5': '4sapi',
      'gemini-3.1-pro-preview': '4sapi',
      'deepseek-v3.2': '4sapi',
      'claude-sonnet-4.6': '4sapi',
      'claude-opus-4.6': '4sapi',
      'kimi-k2.5': '4sapi',
      'gpt-5.4': '4sapi',
      'glm-4-flash': '4sapi',
      'deepseek-v3.2-fast': '4sapi',
      'kimi-k2-fast': '4sapi',
      'gpt-4.1-mini': '4sapi'
    };
    
    return providerMap[model] || '4sapi';
  }
  
  estimateCost(model, features) {
    const costMatrix = {
      'glm-5': { input: 2.00, output: 12.00 },
      'gemini-3.1-pro-preview': { input: 2.00, output: 12.00 },
      'deepseek-v3.2': { input: 0.28, output: 0.42 },
      'claude-sonnet-4.6': { input: 3.00, output: 15.00 },
      'claude-opus-4.6': { input: 5.00, output: 25.00 },
      'kimi-k2.5': { input: 1.50, output: 6.00 },
      'gpt-5.4': { input: 2.50, output: 15.00 },
      'glm-4-flash': { input: 0.50, output: 1.50 },
      'deepseek-v3.2-fast': { input: 0.15, output: 0.25 },
      'kimi-k2-fast': { input: 0.30, output: 1.00 },
      'gpt-4.1-mini': { input: 0.50, output: 1.50 }
    };
    
    const modelCost = costMatrix[model] || costMatrix['deepseek-v3.2'];
    const estimatedTokens = Math.max(100, features.length / 4);
    
    // 简化成本计算：假设30%输入，70%输出
    const inputCost = (estimatedTokens * 0.3 / 1000000) * modelCost.input;
    const outputCost = (estimatedTokens * 0.7 / 1000000) * modelCost.output;
    
    return inputCost + outputCost;
  }
  
  async executeRouteDecision(decision, originalRequest) {
    // 这里应该实现实际的API调用
    // 简化实现，返回模拟结果
    return {
      success: true,
      decision: decision,
      result: `模拟API调用结果 for ${decision.model} (${decision.intent})`,
      latency: Math.random() * 1000 + 200,
      cost: decision.costEstimate,
      timestamp: new Date().toISOString()
    };
  }
  
  getStats() {
    return {
      totalRoutes: this.stats.totalRoutes,
      byIntent: this.stats.byIntent,
      byModel: this.stats.byModel,
      byProvider: this.stats.byProvider,
      decisionTree: this.decisionTree.getStats(),
      keyPool: this.keyPool.getStats()
    };
  }
}

class DecisionTreeClassifier {
  constructor() {
    this.root = this.buildTree();
    this.stats = { classifications: 0 };
  }
  
  buildTree() {
    // 简化的决策树结构
    return {
      feature: 'hasCodePattern',
      threshold: 0.5,
      left: {
        feature: 'hasMathPattern',
        threshold: 0.5,
        left: {
          feature: 'hasSearchPattern',
          threshold: 0.5,
          left: {
            feature: 'complexity',
            threshold: 50,
            left: { intent: 'text_analysis', confidence: 0.8, isLeaf: true },
            right: { intent: 'documentation', confidence: 0.75, isLeaf: true }
          },
          right: { intent: 'search_query', confidence: 0.9, isLeaf: true }
        },
        right: {
          feature: 'length',
          threshold: 500,
          left: { intent: 'math_calculation', confidence: 0.85, isLeaf: true },
          right: { intent: 'architecture_design', confidence: 0.7, isLeaf: true }
        }
      },
      right: {
        feature: 'complexity',
        threshold: 80,
        left: {
          feature: 'hasSearchPattern',
          threshold: 0.5,
          left: { intent: 'code_generation', confidence: 0.9, isLeaf: true },
          right: { intent: 'debugging', confidence: 0.85, isLeaf: true }
        },
        right: { intent: 'code_review', confidence: 0.8, isLeaf: true }
      }
    };
  }
  
  classify(features) {
    this.stats.classifications++;
    return this.traverse(features, this.root);
  }
  
  traverse(features, node) {
    if (node.isLeaf) {
      return node.intent;
    }
    
    const featureValue = this.getFeatureValue(features, node.feature);
    const nextNode = featureValue >= node.threshold ? node.left : node.right;
    return this.traverse(features, nextNode);
  }
  
  getFeatureValue(features, feature) {
    switch (feature) {
      case 'hasCodePattern': return features.hasCodePattern ? 1 : 0;
      case 'hasMathPattern': return features.hasMathPattern ? 1 : 0;
      case 'hasSearchPattern': return features.hasSearchPattern ? 1 : 0;
      case 'length': return features.length;
      case 'complexity': return features.complexity;
      default: return 0;
    }
  }
  
  getStats() {
    return {
      classifications: this.stats.classifications,
      treeSize: this.calculateTreeSize(this.root)
    };
  }
  
  calculateTreeSize(node) {
    if (node.isLeaf) return 1;
    return 1 + this.calculateTreeSize(node.left) + this.calculateTreeSize(node.right);
  }
}

class LockFreeKeyPool {
  constructor() {
    this.keys = this.loadKeys();
    this.index = { value: 0 };
    this.stats = { totalGets: 0, rotations: 0 };
  }
  
  loadKeys() {
    // 从环境变量加载密钥
    const keys = [];
    for (let i = 1; i <= 5; i++) {
      const key = process.env[`FOURSAPI_KEY_${i}`];
      if (key && key.trim()) {
        keys.push(key.trim());
      }
    }
    
    // 如果没有找到密钥，使用模拟密钥
    if (keys.length === 0) {
      console.warn('⚠️ 未找到环境变量中的4SAPI密钥，使用模拟密钥');
      for (let i = 0; i < 3; i++) {
        keys.push(`simulated-key-${i}-${Date.now()}`);
      }
    }
    
    console.log(`🔑 加载 ${keys.length} 个API密钥`);
    return keys;
  }
  
  getNextKey() {
    this.stats.totalGets++;
    
    // 模拟无锁操作
    const currentIndex = this.index.value;
    const key = this.keys[currentIndex % this.keys.length];
    
    // 原子递增
    this.index.value = (currentIndex + 1) % this.keys.length;
    
    if (this.index.value === 0) {
      this.stats.rotations++;
    }
    
    return key;
  }
  
  getStats() {
    return {
      totalKeys: this.keys.length,
      totalGets: this.stats.totalGets,
      rotations: this.stats.rotations,
      currentIndex: this.index.value
    };
  }
}

// 主执行函数
async function main() {
  try {
    const workflow = new Enhanced4AIWorkflowV2();
    
    // 测试不同工作流模式
    const testTask = "设计一个高性能的Web API服务，支持用户认证、文件上传和实时通知功能。要求使用Node.js和TypeScript，考虑安全性和可扩展性。";
    
    console.log('🧪 开始第二轮融合策略测试...\n');
    
    // 测试1: 并行模式
    console.log('=== 测试1: 4AI并行推演模式 ===');
    const parallelResult = await workflow.executeTask(testTask, 'parallel');
    console.log('结果:', parallelResult.success ? '✅ 成功' : '❌ 失败');
    
    // 测试2: 零错误模式
    console.log('\n=== 测试2: 零错误自治系统 ===');
    const zeroErrorResult = await workflow.executeTask(testTask, 'zeroError');
    console.log('结果:', zeroErrorResult.success ? '✅ 成功' : '❌ 失败');
    
    // 测试3: 辩证模式
    console.log('\n=== 测试3: 多AI辩证系统 ===');
    const dialecticResult = await workflow.executeTask(testTask, 'dialectic');
    console.log('结果:', dialecticResult.success ? '✅ 成功' : '❌ 失败');
    
    // 测试4: 流体模式
    console.log('\n=== 测试4: 4AI流体系统 ===');
    const fluidResult = await workflow.executeTask(testTask, 'fluid');
    console.log('结果:', fluidResult.success ? '✅ 成功' : '❌ 失败');
    
    // 显示综合指标
    console.log('\n📊 综合性能指标:');
    const metrics = workflow.getMetrics();
    console.log('总体请求统计:');
    console.log(`   总请求数: ${metrics.totalRequests}`);
    console.log(`   成功率: ${((metrics.successfulRequests / metrics.totalRequests) * 100 || 0).toFixed(2)}%`);
    console.log(`   平均延迟: ${metrics.averageLatency.toFixed(2)}ms`);
    
    console.log('\n工作流模式使用统计:');
    Object.entries(metrics.workflowModeUsage).forEach(([mode, count]) => {
      console.log(`   ${mode}: ${count} 次`);
    });
    
    console.log('\n技术特性状态:');
    console.log(`   熔断器V32: ${metrics.circuitBreaker.services} 个服务`);
    console.log(`   去重系统V8: 命中率 ${(metrics.deduplication.hitRate * 100).toFixed(2)}%`);
    console.log(`   自适应超时V26: ${metrics.adaptiveTimeout.services} 个服务`);
    console.log(`   智能路由: ${metrics.smartRouter.totalRoutes} 次路由`);
    
    // 保存配置
    const configPath = path.join(workflow.workspace, '4ai-role-system.json');
    fs.writeFileSync(configPath, JSON.stringify(workflow.config, null, 2));
    console.log(`\n💾 配置已保存到: ${configPath}`);
    
    console.log('\n🎉 第二轮融合策略测试完成!');
    
  } catch (error) {
    console.error('❌ 测试执行失败:', error);
    process.exit(1);
  }
}

// 命令行接口
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--test')) {
    main();
  } else if (args.includes('--help')) {
    console.log(`
用法: node omc-enhanced-workflow-v2.js [选项]

选项:
  --test       运行测试套件
  --help       显示帮助信息
  --mode <模式> 指定工作流模式 (parallel, zeroError, dialectic, fluid)
  --task <任务> 指定要执行的任务
  
示例:
  node omc-enhanced-workflow-v2.js --test
  node omc-enhanced-workflow-v2.js --mode parallel --task "设计一个系统"
    `);
  } else if (args.includes('--mode')) {
    const modeIndex = args.indexOf('--mode');
    const taskIndex = args.indexOf('--task');
    
    if (modeIndex === -1 || modeIndex + 1 >= args.length) {
      console.error('错误: 需要指定工作流模式');
      process.exit(1);
    }
    
    const mode = args[modeIndex + 1];
    const task = taskIndex !== -1 && taskIndex + 1 < args.length ? 
                 args[taskIndex + 1] : 
                 "默认测试任务";
    
    const workflow = new Enhanced4AIWorkflowV2();
    workflow.executeTask(task, mode).then(result => {
      console.log(JSON.stringify(result, null, 2));
    }).catch(error => {
      console.error('执行失败:', error);
      process.exit(1);
    });
  } else {
    console.log('使用 --help 查看使用说明');
  }
}

// 导出模块
module.exports = {
  Enhanced4AIWorkflowV2,
  CircuitBreakerV32,
  DeduplicationV8,
  AdaptiveTimeoutV26,
  SmartRouterIntegration,
  DecisionTreeClassifier,
  LockFreeKeyPool
};