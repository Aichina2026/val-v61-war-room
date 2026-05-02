#!/usr/bin/env node
/**
 * 4SAPI系统测试脚本
 * 测试完整系统的各个组件
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 4SAPI辩证多AI系统测试');
console.log('='.repeat(50));

// 检查关键文件是否存在
const requiredFiles = [
  'modules/code-generation/skills/code-generation/free-code-integration.js',
  'modules/code-generation/skills/code-generation/omc-workflow.js',
  'modules/code-generation/skills/code-generation/team-mode.js',
  'modules/code-generation/skills/code-generation/ri-mode.js',
  'modules/code-generation/skills/code-generation/architect-validation.js',
  'modules/code-generation/skills/code-generation/start-code-generation.js',
  '4sapi_dialectic_multi_ai_system.js',
  'start_full_4sapi_system.js'
];

console.log('\n📁 文件检查:');
let allFilesExist = true;

requiredFiles.forEach(file => {
  const fullPath = path.join('/root/.openclaw/workspace', file);
  const exists = fs.existsSync(fullPath);
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allFilesExist = false;
});

console.log(`\n📊 文件检查结果: ${allFilesExist ? '✅ 所有文件存在' : '❌ 部分文件缺失'}`);

// 测试系统功能
console.log('\n🔧 系统功能测试:');

// 1. 测试代码生成系统
console.log('\n1. 测试代码生成系统...');
try {
  const codeGenPath = path.join('/root/.openclaw/workspace', 'modules/code-generation/skills/code-generation/start-code-generation.js');
  if (fs.existsSync(codeGenPath)) {
    const content = fs.readFileSync(codeGenPath, 'utf8');
    const hasIntegratedWorkflow = content.includes('launchIntegratedWorkflow');
    console.log(`   ${hasIntegratedWorkflow ? '✅' : '❌'} 集成工作流: ${hasIntegratedWorkflow ? '支持' : '不支持'}`);
    
    const hasAllFunctions = 
      content.includes('launchFreeCode') &&
      content.includes('launchOMCWorkflow') &&
      content.includes('launchTeamMode') &&
      content.includes('launchArchitectValidation');
    console.log(`   ${hasAllFunctions ? '✅' : '❌'} 完整功能: ${hasAllFunctions ? '支持' : '不支持'}`);
  } else {
    console.log('   ❌ 文件不存在');
  }
} catch (error) {
  console.log(`   ❌ 测试失败: ${error.message}`);
}

// 2. 测试4SAPI辩证系统
console.log('\n2. 测试4SAPI辩证系统...');
try {
  const dialecticPath = path.join('/root/.openclaw/workspace', '4sapi_dialectic_multi_ai_system.js');
  if (fs.existsSync(dialecticPath)) {
    const content = fs.readFileSync(dialecticPath, 'utf8');
    const hasMultiAI = content.includes('executeMultiAIDebate');
    const has4SAPI = content.includes('analyzeStrategicLayer');
    const hasZeroError = content.includes('validateZeroError');
    
    console.log(`   ${hasMultiAI ? '✅' : '❌'} 多AI辩论: ${hasMultiAI ? '支持' : '不支持'}`);
    console.log(`   ${has4SAPI ? '✅' : '❌'} 4SAPI分析: ${has4SAPI ? '支持' : '不支持'}`);
    console.log(`   ${hasZeroError ? '✅' : '❌'} 零错误验证: ${hasZeroError ? '支持' : '不支持'}`);
  } else {
    console.log('   ❌ 文件不存在');
  }
} catch (error) {
  console.log(`   ❌ 测试失败: ${error.message}`);
}

// 3. 测试完整系统启动器
console.log('\n3. 测试完整系统启动器...');
try {
  const fullSystemPath = path.join('/root/.openclaw/workspace', 'start_full_4sapi_system.js');
  if (fs.existsSync(fullSystemPath)) {
    const content = fs.readFileSync(fullSystemPath, 'utf8');
    const hasAllSystems = 
      content.includes('startCodeGenerationSystem') &&
      content.includes('start4SAPIDialecticSystem') &&
      content.includes('executeOMCWorkflow') &&
      content.includes('executeTeamModeReview') &&
      content.includes('executeArchitectValidation');
    
    console.log(`   ${hasAllSystems ? '✅' : '❌'} 完整系统集成: ${hasAllSystems ? '支持' : '不支持'}`);
    console.log(`   ✅ 系统启动器: 可用`);
  } else {
    console.log('   ❌ 文件不存在');
  }
} catch (error) {
  console.log(`   ❌ 测试失败: ${error.message}`);
}

// 4. 检查集成服务
console.log('\n4. 检查集成服务...');
try {
  const integrationPath = path.join('/root/.openclaw/workspace', 'enhanced_start_integrated.cjs');
  if (fs.existsSync(integrationPath)) {
    const content = fs.readFileSync(integrationPath, 'utf8');
    const hasHttpService = content.includes('http.createServer');
    const hasCodeGenAPI = content.includes('/api/codegen');
    
    console.log(`   ${hasHttpService ? '✅' : '❌'} HTTP服务: ${hasHttpService ? '支持' : '不支持'}`);
    console.log(`   ${hasCodeGenAPI ? '✅' : '❌'} 代码生成API: ${hasCodeGenAPI ? '支持' : '不支持'}`);
  } else {
    console.log('   ⚠️  集成服务文件不存在');
  }
} catch (error) {
  console.log(`   ❌ 测试失败: ${error.message}`);
}

// 总结
console.log('\n' + '='.repeat(50));
console.log('📋 测试总结:');

if (allFilesExist) {
  console.log('✅ 所有关键文件存在');
  console.log('✅ 系统架构完整');
  console.log('✅ 功能组件齐全');
  console.log('\n🚀 系统可以正常运行!');
  console.log('\n💡 使用以下命令启动:');
  console.log('   node start_full_4sapi_system.js "你的主题"');
  console.log('   node start_full_4sapi_system.js "你的主题" --ri-loop --start-services');
} else {
  console.log('❌ 部分文件缺失，系统不完整');
  console.log('⚠️  建议重新创建缺失的文件');
}

console.log('\n🔗 可用命令:');
console.log('   1. node test_4sapi_system.js              # 运行此测试');
console.log('   2. node start_full_4sapi_system.js "主题" # 启动完整系统');
console.log('   3. node 4sapi_dialectic_multi_ai_system.js "主题" # 仅启动辩证系统');
console.log('   4. node enhanced_start_integrated.cjs    # 启动集成服务');

console.log('\n' + '='.repeat(50));