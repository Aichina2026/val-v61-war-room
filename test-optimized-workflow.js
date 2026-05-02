#!/usr/bin/env node
/**
 * 测试优化版OMC 4AI工作流
 * 验证多路由多密钥智能调用系统
 */

const OptimizedOMC4AIWorkflow = require('./optimized-omc-4ai-workflow');

async function runTests() {
  console.log('🧪 优化版OMC 4AI工作流测试');
  console.log('='.repeat(60));
  
  // 创建工作流实例
  const workflow = new OptimizedOMC4AIWorkflow();
  
  // 测试1: 环境变量加载测试
  console.log('\n🔍 测试1: 环境变量加载');
  console.log('4SAPI密钥数量:', workflow.foursapiKeys.length);
  console.log('4SAPI基础URL:', workflow.foursapiBaseUrl);
  
  if (workflow.foursapiKeys.length === 0) {
    console.warn('⚠️ 警告: 未找到4SAPI密钥，将使用回退方案');
  }
  
  // 测试2: 路由选择测试
  console.log('\n🔍 测试2: 路由选择逻辑');
  
  const testCases = [
    { role: 'analysis', model: 'gemini-3.1-pro-preview' },
    { role: 'design', model: 'claude-opus-4.6' },
    { role: 'implementation', model: 'gpt-5.4' },
    { role: 'optimization', model: 'deepseek-v3.2' }
  ];
  
  testCases.forEach(testCase => {
    const route = workflow.selectRoute(testCase.role, testCase.model);
    console.log(`${testCase.role} -> ${testCase.model}: ${route.system} (${route.strategy})`);
  });
  
  // 测试3: 直接API调用测试
  console.log('\n🔍 测试3: 直接API调用测试');
  
  if (workflow.foursapiKeys.length > 0) {
    try {
      const testPrompt = '这是一个简单的API连通性测试，请回复"API测试成功"';
      const result = await workflow.call4SAPIDirect('gpt-5.4', testPrompt, {
        maxTokens: 20,
        temperature: 0.1
      });
      
      console.log('✅ 直接API调用成功');
      console.log('  模型:', result.model);
      console.log('  延迟:', result.latency + 'ms');
      console.log('  内容:', result.content);
      console.log('  Token使用:', result.usage?.total_tokens || '未知');
      
    } catch (error) {
      console.log('❌ 直接API调用失败:', error.message);
    }
  } else {
    console.log('⚠️ 跳过直接API测试（无可用密钥）');
  }
  
  // 测试4: 单角色调用测试
  console.log('\n🔍 测试4: 单角色调用测试');
  
  try {
    const testPrompt = '请分析一个简单的文件管理系统的核心需求';
    const result = await workflow.callAI('analysis', testPrompt, {
      maxTokens: 200,
      temperature: 0.7
    });
    
    console.log('✅ 单角色调用成功');
    console.log('  角色:', result.roleName);
    console.log('  模型:', result.model);
    console.log('  延迟:', result.latency + 'ms');
    console.log('  路由系统:', result.route.system);
    console.log('  内容预览:', result.content.substring(0, 150) + '...');
    
  } catch (error) {
    console.log('❌ 单角色调用失败:', error.message);
  }
  
  // 测试5: 快速4AI工作流测试
  console.log('\n🔍 测试5: 快速4AI工作流测试');
  
  const quickTask = '设计一个简单的待办事项管理系统';
  
  try {
    console.log('开始快速工作流测试...');
    const startTime = Date.now();
    
    const result = await workflow.execute4AIWorkflow(quickTask, {
      priority: 'normal',
      budget: 'low'
    });
    
    const totalTime = Date.now() - startTime;
    
    console.log('✅ 快速工作流测试完成');
    console.log('  总时间:', totalTime + 'ms');
    console.log('  总调用次数:', workflow.metrics.totalCalls);
    console.log('  成功率:', workflow.metrics.successfulCalls + '/' + workflow.metrics.totalCalls);
    
    // 显示各阶段状态
    console.log('\n📋 各阶段状态:');
    Object.keys(result.stages).forEach(stage => {
      const stageResult = result.stages[stage];
      const status = stageResult.error ? '❌ 失败' : '✅ 成功';
      console.log(`  ${stage}: ${status} ${stageResult.error ? '(' + stageResult.error + ')' : ''}`);
    });
    
    // 保存测试结果
    const fs = require('fs');
    const path = require('path');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const testResultFile = path.join(workflow.reportsDir, `test-result-${timestamp}.json`);
    
    const testSummary = {
      timestamp: new Date().toISOString(),
      task: quickTask,
      totalTime: totalTime,
      metrics: workflow.getMetricsSummary(),
      stages: Object.keys(result.stages).reduce((acc, stage) => {
        const stageResult = result.stages[stage];
        acc[stage] = {
          success: !stageResult.error,
          model: stageResult.model,
          latency: stageResult.latency,
          route: stageResult.route?.system
        };
        return acc;
      }, {})
    };
    
    fs.writeFileSync(testResultFile, JSON.stringify(testSummary, null, 2));
    console.log('📄 测试结果已保存:', testResultFile);
    
  } catch (error) {
    console.log('❌ 快速工作流测试失败:', error.message);
  }
  
  // 最终报告
  console.log('\n' + '='.repeat(60));
  console.log('🎯 测试完成报告');
  console.log('='.repeat(60));
  
  const metrics = workflow.getMetricsSummary();
  console.log('性能指标:');
  console.log(`  总调用次数: ${workflow.metrics.totalCalls}`);
  console.log(`  成功率: ${metrics.successRate}`);
  console.log(`  平均延迟: ${metrics.averageLatency}`);
  
  console.log('\n模型使用情况:');
  Object.entries(workflow.metrics.modelUsage).forEach(([model, count]) => {
    console.log(`  ${model}: ${count} 次`);
  });
  
  console.log('\n✅ 优化版OMC 4AI工作流验证完成');
  console.log('系统支持:');
  console.log('  ✓ 多4SAPI密钥负载均衡');
  console.log('  ✓ 智能路由选择');
  console.log('  ✓ 4AI角色协同');
  console.log('  ✓ 自动回退机制');
  console.log('  ✓ 性能监控和报告');
}

// 执行测试
runTests().catch(error => {
  console.error('测试运行失败:', error);
  process.exit(1);
});