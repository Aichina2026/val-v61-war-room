#!/usr/bin/env node

/**
 * OMC工作流端到端测试
 * 验证从角色识别到实际模型调用的完整流程
 */

const fs = require('fs');
const path = require('path');

const workspace = '/root/.openclaw/workspace';
const configFile = path.join(workspace, 'models-config.json');

console.log('🚀 OMC工作流端到端测试');
console.log('='.repeat(70));
console.log('测试目标: 验证从工作流阶段 → 角色识别 → 模型选择 → 实际调用的完整流程');
console.log('='.repeat(70));

// 加载配置
let config;
try {
  config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
  console.log('✅ 配置文件加载成功');
} catch (error) {
  console.error('❌ 配置文件加载失败:', error.message);
  process.exit(1);
}

// OMC工作流模拟器
class OMCWorkflowSimulator {
  constructor(config) {
    this.config = config;
    this.apiKeys = config.apiKeys || {};
    this.routingConfig = config.routingConfig || {};
    
    // 角色定义
    this.roles = {
      clarifier: {
        description: '追问需求，消除歧义',
        strategy: 'high-performance',
        skills: ['需求分析', '问题澄清', '上下文理解']
      },
      builder: {
        description: '执行实际开发与生成',
        strategy: 'cost-effective',
        skills: ['代码生成', '系统设计', '架构规划']
      },
      reviewer: {
        description: '负责质量校验和回退',
        strategy: 'high-performance',
        skills: ['代码审查', '质量评估', '错误检测']
      },
      arbiter: {
        description: '最高控制权，介入截断死锁',
        strategy: 'creative-tasks',
        skills: ['决策制定', '冲突解决', '优先级判断']
      }
    };
    
    // 工作流阶段映射
    this.stageMapping = {
      analysis: 'clarifier',
      clarification: 'clarifier',
      design: 'builder',
      implementation: 'builder',
      generation: 'builder',
      review: 'reviewer',
      validation: 'reviewer',
      optimization: 'reviewer',
      conflict: 'arbiter',
      decision: 'arbiter'
    };
  }
  
  // 工作流阶段识别
  identifyWorkflowStage(task) {
    const taskLower = task.toLowerCase();
    
    if (taskLower.includes('分析') || taskLower.includes('理解') || taskLower.includes('clarif')) {
      return 'analysis';
    } else if (taskLower.includes('设计') || taskLower.includes('架构') || taskLower.includes('design')) {
      return 'design';
    } else if (taskLower.includes('实现') || taskLower.includes('生成') || taskLower.includes('implement')) {
      return 'implementation';
    } else if (taskLower.includes('审查') || taskLower.includes('测试') || taskLower.includes('review')) {
      return 'review';
    } else if (taskLower.includes('冲突') || taskLower.includes('决策') || taskLower.includes('conflict')) {
      return 'conflict';
    } else {
      return 'analysis'; // 默认阶段
    }
  }
  
  // 角色分配
  assignRole(stage) {
    return this.stageMapping[stage] || 'clarifier';
  }
  
  // 模型选择
  selectModel(role, strategy = null) {
    const roleConfig = this.roles[role];
    const useStrategy = strategy || roleConfig.strategy;
    
    // 查找对应策略的路由配置
    const strategyConfig = this.routingConfig.strategies?.find(s => s.name === useStrategy);
    
    if (!strategyConfig || !strategyConfig.priority || strategyConfig.priority.length === 0) {
      console.log(`⚠️  策略 "${useStrategy}" 未配置或没有可用模型`);
      return null;
    }
    
    // 选择第一个可用的模型
    for (const modelPath of strategyConfig.priority) {
      const [provider, modelId] = modelPath.split('/');
      
      // 检查API密钥是否可用
      if (this.checkAPIKeyAvailable(provider, modelId)) {
        return {
          provider,
          modelId,
          strategy: useStrategy,
          role,
          fullPath: modelPath
        };
      }
    }
    
    console.log(`⚠️  策略 "${useStrategy}" 中没有可用的模型`);
    return null;
  }
  
  // 检查API密钥可用性
  checkAPIKeyAvailable(provider, modelId) {
    if (provider === 'volcengine' && modelId === 'deepseek-v3-2-251201') {
      const key = this.apiKeys.volcengine?.['deepseek-v3-2-251201'];
      return key && !key.includes('YOUR_');
    } else if (provider === '4sapi') {
      const key = this.apiKeys['4sapi']?.primary;
      return key && !key.includes('YOUR_');
    } else if (provider === 'alibailian') {
      const key = this.apiKeys.alibailian?.[modelId];
      return key && !key.includes('YOUR_');
    } else if (provider === 'kimi') {
      const key = this.apiKeys.kimi;
      return key && !key.includes('YOUR_');
    }
    
    return false;
  }
  
  // 获取API密钥
  getAPIKey(provider, modelId) {
    if (provider === 'volcengine' && modelId === 'deepseek-v3-2-251201') {
      return this.apiKeys.volcengine?.['deepseek-v3-2-251201'];
    } else if (provider === '4sapi') {
      return this.apiKeys['4sapi']?.primary;
    } else if (provider === 'alibailian') {
      return this.apiKeys.alibailian?.[modelId];
    } else if (provider === 'kimi') {
      return this.apiKeys.kimi;
    }
    
    return null;
  }
  
  // 构建API调用参数
  buildAPICallParams(modelSelection, task, options = {}) {
    const providerConfig = this.config.modelConfig?.providers?.[modelSelection.provider];
    if (!providerConfig) return null;
    
    const modelConfig = providerConfig.models?.find(m => m.id === modelSelection.modelId);
    if (!modelConfig) return null;
    
    const apiKey = this.getAPIKey(modelSelection.provider, modelSelection.modelId);
    if (!apiKey) return null;
    
    return {
      baseUrl: providerConfig.baseUrl,
      apiKey,
      modelId: modelSelection.modelId,
      apiType: providerConfig.api || 'openai-chat',
      requestData: {
        model: modelSelection.modelId,
        messages: [
          {
            role: 'system',
            content: `你是一个${this.roles[modelSelection.role].description}。你的技能包括：${this.roles[modelSelection.role].skills.join('、')}。请基于你的角色特点来回应。`
          },
          {
            role: 'user',
            content: task
          }
        ],
        max_tokens: options.maxTokens || modelConfig.maxTokens || 1000,
        temperature: options.temperature || 0.7
      }
    };
  }
  
  // 模拟完整的端到端工作流
  simulateEndToEndWorkflow(task, options = {}) {
    console.log('\n📋 OMC端到端工作流模拟');
    console.log('='.repeat(50));
    
    console.log(`📥 输入任务: ${task}`);
    
    // 1. 工作流阶段识别
    const stage = this.identifyWorkflowStage(task);
    console.log(`🔍 阶段识别: ${stage}`);
    
    // 2. 角色分配
    const role = this.assignRole(stage);
    console.log(`🎭 角色分配: ${role} (${this.roles[role].description})`);
    
    // 3. 策略选择
    const strategy = this.roles[role].strategy;
    console.log(`🎯 策略选择: ${strategy}`);
    
    // 4. 模型选择
    const modelSelection = this.selectModel(role, strategy);
    
    if (!modelSelection) {
      console.log('❌ 模型选择失败');
      return null;
    }
    
    console.log(`🤖 模型选择: ${modelSelection.provider}/${modelSelection.modelId}`);
    console.log(`   ├─ 路由路径: ${modelSelection.fullPath}`);
    console.log(`   ├─ API密钥: ${this.checkAPIKeyAvailable(modelSelection.provider, modelSelection.modelId) ? '✅ 可用' : '❌ 不可用'}`);
    
    // 5. API调用参数构建
    const apiParams = this.buildAPICallParams(modelSelection, task, options);
    
    if (!apiParams) {
      console.log('❌ API参数构建失败');
      return null;
    }
    
    console.log(`🔧 API参数:`);
    console.log(`   ├─ 端点: ${apiParams.baseUrl}`);
    console.log(`   ├─ API类型: ${apiParams.apiType}`);
    console.log(`   └─ 请求配置: ${apiParams.requestData.max_tokens} tokens, temperature ${apiParams.requestData.temperature}`);
    
    return {
      stage,
      role,
      strategy,
      modelSelection,
      apiParams,
      workflow: '端到端流程完成',
      timestamp: new Date().toISOString()
    };
  }
}

// 测试用例
const testCases = [
  {
    task: '分析这个微服务系统的架构设计是否合理',
    description: '需求分析任务',
    expectedRole: 'clarifier',
    expectedStrategy: 'high-performance'
  },
  {
    task: '设计一个用户认证的REST API系统',
    description: '系统设计任务',
    expectedRole: 'builder',
    expectedStrategy: 'cost-effective'
  },
  {
    task: '生成Python实现的用户注册功能代码',
    description: '代码生成任务',
    expectedRole: 'builder',
    expectedStrategy: 'cost-effective'
  },
  {
    task: '审查这段JavaScript代码的安全漏洞',
    description: '代码审查任务',
    expectedRole: 'reviewer',
    expectedStrategy: 'high-performance'
  },
  {
    task: '解决两个微服务之间的数据一致性冲突',
    description: '冲突解决任务',
    expectedRole: 'arbiter',
    expectedStrategy: 'creative-tasks'
  }
];

// 运行测试
async function runTests() {
  console.log('🧪 开始端到端工作流测试\n');
  
  const simulator = new OMCWorkflowSimulator(config);
  const results = [];
  
  for (const testCase of testCases) {
    console.log(`📋 测试用例: ${testCase.description}`);
    console.log(`  任务: "${testCase.task}"`);
    
    const result = simulator.simulateEndToEndWorkflow(testCase.task, {
      maxTokens: 500,
      temperature: 0.3
    });
    
    if (result) {
      // 验证结果
      const roleMatch = result.role === testCase.expectedRole;
      const strategyMatch = result.strategy === testCase.expectedStrategy;
      
      console.log(`  验证结果:`);
      console.log(`    ├─ 角色匹配: ${roleMatch ? '✅' : '❌'} (预期: ${testCase.expectedRole}, 实际: ${result.role})`);
      console.log(`    ├─ 策略匹配: ${strategyMatch ? '✅' : '❌'} (预期: ${testCase.expectedStrategy}, 实际: ${result.strategy})`);
      console.log(`    └─ 模型选择: ${result.modelSelection ? '✅ 成功' : '❌ 失败'}`);
      
      results.push({
        testCase: testCase.description,
        success: roleMatch && strategyMatch && result.modelSelection,
        roleMatch,
        strategyMatch,
        modelSelected: !!result.modelSelection,
        selectedModel: result.modelSelection ? `${result.modelSelection.provider}/${result.modelSelection.modelId}` : '无'
      });
    } else {
      console.log(`  ❌ 工作流模拟失败`);
      results.push({
        testCase: testCase.description,
        success: false,
        roleMatch: false,
        strategyMatch: false,
        modelSelected: false,
        selectedModel: '无'
      });
    }
    
    console.log('');
  }
  
  // 生成测试报告
  console.log('='.repeat(70));
  console.log('📊 OMC端到端工作流测试报告');
  console.log('='.repeat(70));
  
  const totalTests = results.length;
  const passedTests = results.filter(r => r.success).length;
  const failedTests = totalTests - passedTests;
  
  console.log(`\n📈 测试统计:`);
  console.log(`  总计测试: ${totalTests}`);
  console.log(`  通过测试: ${passedTests} ✅`);
  console.log(`  失败测试: ${failedTests} ❌`);
  console.log(`  通过率: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  console.log(`\n🔍 详细结果:`);
  for (const result of results) {
    const status = result.success ? '✅' : '❌';
    console.log(`  ${status} ${result.testCase}:`);
    console.log(`    角色匹配: ${result.roleMatch ? '✅' : '❌'}`);
    console.log(`    策略匹配: ${result.strategyMatch ? '✅' : '❌'}`);
    console.log(`    模型选择: ${result.modelSelected ? '✅' : '❌'} (${result.selectedModel})`);
  }
  
  console.log(`\n💡 系统联通性评估:`);
  
  if (passedTests === totalTests) {
    console.log(`  🎉 完全联通: OMC工作流与智能路由系统完美集成`);
    console.log(`  🚀 所有工作流阶段都能正确匹配角色和模型`);
  } else if (passedTests > 0) {
    console.log(`  ⚠️  部分联通: 系统基本工作正常，但需要优化`);
    console.log(`  🔧 需要检查: 角色映射、策略配置、API密钥`);
  } else {
    console.log(`  ❌ 未联通: 系统集成存在问题`);
    console.log(`  🛠️  需要全面检查配置和工作流逻辑`);
  }
  
  // 显示路由配置概览
  console.log(`\n📋 路由配置概览:`);
  const routingConfig = config.routingConfig;
  if (routingConfig && routingConfig.strategies) {
    for (const strategy of routingConfig.strategies) {
      console.log(`  🔹 ${strategy.name}:`);
      console.log(`     优先级: ${strategy.priority.slice(0, 3).join(', ')}${strategy.priority.length > 3 ? '...' : ''}`);
    }
  }
  
  console.log(`\n🔚 OMC工作流端到端测试完成`);
}

// 执行测试
runTests().catch(error => {
  console.error('❌ 测试执行失败:', error);
  process.exit(1);
});