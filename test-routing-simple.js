#!/usr/bin/env node
/**
 * 简单路由系统测试
 */

const RealOpenClawRouter = require('./real-openclaw-router');

async function testRouting() {
  console.log('🧪 测试OpenClaw真实路由系统...\n');
  
  const router = new RealOpenClawRouter();
  
  const testCases = [
    { stage: 'analysis', prompt: '分析一个电商系统的需求' },
    { stage: 'design', prompt: '设计微服务架构' },
    { stage: 'generation', prompt: '生成用户认证API' },
    { stage: 'review', prompt: '审查这段代码的质量' },
    { stage: 'optimization', prompt: '优化数据库查询性能' }
  ];
  
  let successCount = 0;
  
  for (const testCase of testCases) {
    console.log(`📋 测试阶段: ${testCase.stage}`);
    console.log(`   输入: ${testCase.prompt}`);
    
    try {
      const result = await router.unifiedRoute(testCase.stage, testCase.prompt, {
        strategy: 'balanced'
      });
      
      console.log(`   结果: ${result.success ? '✅ 成功' : '⚠️ 降级'}`);
      console.log(`   模型: ${result.model}`);
      console.log(`   路由技能: ${result.routerSkill}`);
      console.log(`   延迟: ${result.latency}ms`);
      console.log(`   方法: ${result.method}`);
      console.log();
      
      if (result.success) {
        successCount++;
      }
    } catch (error) {
      console.log(`   ❌ 失败: ${error.message}\n`);
    }
  }
  
  const successRate = (successCount / testCases.length * 100).toFixed(1);
  console.log('='.repeat(50));
  console.log(`测试完成! 成功率: ${successRate}% (${successCount}/${testCases.length})`);
  console.log('='.repeat(50));
  
  if (successCount === testCases.length) {
    console.log('🎉 所有测试通过! 路由系统工作正常。');
  } else if (successCount > 0) {
    console.log('⚠️ 部分测试通过，路由系统基本工作。');
  } else {
    console.log('❌ 路由系统存在问题，需要进一步调试。');
  }
}

// 运行测试
if (require.main === module) {
  testRouting()
    .then(() => {
      console.log('\n🚀 下一步: 集成到现有OMC工作流中。');
    })
    .catch(error => {
      console.error('❌ 测试失败:', error.message);
      process.exit(1);
    });
}

module.exports = { testRouting };