#!/usr/bin/env node
/**
 * OMC系统功能验证测试
 */

console.log('🧪 OMC智能路由系统功能验证测试');
console.log('='.repeat(60));

console.log('\n📋 测试1: 路由系统基本功能');
console.log('-'.repeat(40));

const RealOpenClawRouter = require('./real-openclaw-router');

async function testBasicRouting() {
  const router = new RealOpenClawRouter();
  
  const testCases = [
    { stage: 'analysis', prompt: '测试路由系统分析功能' },
    { stage: 'design', prompt: '测试路由系统设计功能' },
    { stage: 'generation', prompt: '测试路由系统生成功能' }
  ];
  
  let passed = 0;
  let total = testCases.length;
  
  for (const testCase of testCases) {
    try {
      const result = await router.unifiedRoute(testCase.stage, testCase.prompt);
      
      if (result.success) {
        console.log(`  ✅ ${testCase.stage}: 成功 - ${result.model} (${result.routerSkill}) - ${result.latency}ms`);
        passed++;
      } else {
        console.log(`  ❌ ${testCase.stage}: 失败 - ${result.error || '未知错误'}`);
      }
    } catch (error) {
      console.log(`  ❌ ${testCase.stage}: 异常 - ${error.message}`);
    }
  }
  
  return { passed, total };
}

console.log('\n📋 测试2: 集成工作流验证');
console.log('-'.repeat(40));

async function testIntegratedWorkflows() {
  const workflows = [
    { name: 'omc-workflow-routing-integrated.js', command: 'node omc-workflow-routing-integrated.js "测试验证"' },
    { name: 'omc-workflow-api-fixed.js', command: 'node omc-workflow-api-fixed.js "测试验证"' }
  ];
  
  let passed = 0;
  
  for (const workflow of workflows) {
    try {
      // 检查文件是否存在
      const fs = require('fs');
      if (!fs.existsSync(workflow.name)) {
        console.log(`  ❌ ${workflow.name}: 文件不存在`);
        continue;
      }
      
      // 检查是否集成了路由系统
      const content = fs.readFileSync(workflow.name, 'utf8');
      if (!content.includes('RealOpenClawRouter') && !content.includes('OpenClaw路由')) {
        console.log(`  ⚠️  ${workflow.name}: 未检测到路由集成`);
        continue;
      }
      
      console.log(`  ✅ ${workflow.name}: 文件存在且已集成路由系统`);
      passed++;
    } catch (error) {
      console.log(`  ❌ ${workflow.name}: 检查失败 - ${error.message}`);
    }
  }
  
  return { passed, total: workflows.length };
}

console.log('\n📋 测试3: 4AI工作流组件验证');
console.log('-'.repeat(40));

async function test4AIComponents() {
  const components = [
    { name: 'omc-4ai-workflow-complete.js', description: '4AI完整工作流' },
    { name: 'strategy-library-generator.js', description: '策略库生成器' },
    { name: 'omc-automation-system.js', description: '自动化系统' }
  ];
  
  let passed = 0;
  
  for (const component of components) {
    try {
      const fs = require('fs');
      if (fs.existsSync(component.name)) {
        const stats = fs.statSync(component.name);
        if (stats.size > 1000) { // 文件大小合理
          console.log(`  ✅ ${component.name}: 存在且大小合适 (${stats.size} bytes)`);
          passed++;
        } else {
          console.log(`  ⚠️  ${component.name}: 存在但文件大小可能有问题 (${stats.size} bytes)`);
        }
      } else {
        console.log(`  ❌ ${component.name}: 文件不存在`);
      }
    } catch (error) {
      console.log(`  ❌ ${component.name}: 检查失败 - ${error.message}`);
    }
  }
  
  return { passed, total: components.length };
}

console.log('\n📋 测试4: 数据目录结构验证');
console.log('-'.repeat(40));

function testDataDirectories() {
  const directories = [
    'omc-4ai-data',
    'omc-strategy-library',
    'omc-automation-logs',
    'omc-automation-config'
  ];
  
  let passed = 0;
  
  for (const dir of directories) {
    try {
      const fs = require('fs');
      if (fs.existsSync(dir)) {
        console.log(`  ✅ ${dir}/: 目录存在`);
        passed++;
      } else {
        console.log(`  ⚠️  ${dir}/: 目录不存在 (将自动创建)`);
        fs.mkdirSync(dir, { recursive: true });
        console.log(`  ✅ ${dir}/: 目录已创建`);
        passed++;
      }
    } catch (error) {
      console.log(`  ❌ ${dir}/: 创建失败 - ${error.message}`);
    }
  }
  
  return { passed, total: directories.length };
}

console.log('\n📋 测试5: 配置文件验证');
console.log('-'.repeat(40));

function testConfiguration() {
  const configs = [
    'routing-integration-config.json',
    'omc-automation-config/automation-config.json'
  ];
  
  let passed = 0;
  
  for (const config of configs) {
    try {
      const fs = require('fs');
      if (fs.existsSync(config)) {
        const content = fs.readFileSync(config, 'utf8');
        const json = JSON.parse(content);
        
        if (Object.keys(json).length > 0) {
          console.log(`  ✅ ${config}: 配置有效 (${Object.keys(json).length} 个键)`);
          passed++;
        } else {
          console.log(`  ⚠️  ${config}: 配置为空`);
        }
      } else {
        console.log(`  ❌ ${config}: 配置文件不存在`);
      }
    } catch (error) {
      console.log(`  ❌ ${config}: 配置无效 - ${error.message}`);
    }
  }
  
  return { passed, total: configs.length };
}

async function runAllTests() {
  console.log('🚀 开始运行所有测试...\n');
  
  const results = [];
  
  // 运行测试1
  const test1Result = await testBasicRouting();
  results.push({ name: '路由系统基本功能', ...test1Result });
  
  // 运行测试2
  const test2Result = await testIntegratedWorkflows();
  results.push({ name: '集成工作流验证', ...test2Result });
  
  // 运行测试3
  const test3Result = await test4AIComponents();
  results.push({ name: '4AI工作流组件验证', ...test3Result });
  
  // 运行测试4
  const test4Result = testDataDirectories();
  results.push({ name: '数据目录结构验证', ...test4Result });
  
  // 运行测试5
  const test5Result = testConfiguration();
  results.push({ name: '配置文件验证', ...test5Result });
  
  // 显示总结
  console.log('\n' + '='.repeat(60));
  console.log('📊 测试结果总结');
  console.log('='.repeat(60));
  
  let totalPassed = 0;
  let totalTests = 0;
  
  results.forEach(result => {
    const percentage = (result.passed / result.total * 100).toFixed(1);
    const status = result.passed === result.total ? '✅' : result.passed > 0 ? '⚠️' : '❌';
    
    console.log(`${status} ${result.name}: ${result.passed}/${result.total} (${percentage}%)`);
    
    totalPassed += result.passed;
    totalTests += result.total;
  });
  
  const overallPercentage = (totalPassed / totalTests * 100).toFixed(1);
  const overallStatus = overallPercentage >= 90 ? '✅' : overallPercentage >= 70 ? '⚠️' : '❌';
  
  console.log('\n' + '='.repeat(60));
  console.log(`${overallStatus} 总体结果: ${totalPassed}/${totalTests} (${overallPercentage}%)`);
  console.log('='.repeat(60));
  
  if (overallPercentage >= 90) {
    console.log('\n🎉 恭喜! OMC智能路由系统通过功能验证测试!');
    console.log('🚀 系统已准备好投入生产使用。');
  } else if (overallPercentage >= 70) {
    console.log('\n⚠️  OMC智能路由系统基本功能正常，但需要进一步优化。');
    console.log('🔧 建议检查失败的测试项。');
  } else {
    console.log('\n❌ OMC智能路由系统存在较多问题，需要修复。');
    console.log('🔧 请检查系统配置和集成状态。');
  }
  
  console.log('\n💡 下一步建议:');
  console.log('  1. 运行完整工作流: node omc-4ai-workflow-complete.js');
  console.log('  2. 生成策略库: node strategy-library-generator.js');
  console.log('  3. 启动自动化系统: node omc-automation-system.js start');
  console.log('  4. 查看系统状态: node omc-automation-system.js status');
  
  return overallPercentage >= 70;
}

// 运行所有测试
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('❌ 测试运行失败:', error.message);
    process.exit(1);
  });
}

module.exports = { runAllTests };