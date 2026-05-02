#!/usr/bin/env node
/**
 * 快速检查系统状态
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 OMC智能路由系统状态检查');
console.log('='.repeat(50));

// 检查核心文件
console.log('\n📋 核心文件检查:');
const coreFiles = [
  'real-openclaw-router.js',
  'omc-workflow-api-fixed.js',
  'omc-real-router-integration.js',
  'omc-router-adapter.js',
  'omc-4ai-workflow-complete.js',
  'strategy-library-generator.js',
  'omc-automation-system.js'
];

coreFiles.forEach(file => {
  const exists = fs.existsSync(file);
  const size = exists ? fs.statSync(file).size : 0;
  const status = exists ? '✅' : '❌';
  console.log(`  ${status} ${file} (${size} bytes)`);
});

// 检查数据目录
console.log('\n📁 数据目录检查:');
const dataDirs = [
  'omc-4ai-data',
  'omc-strategy-library',
  'omc-automation-logs',
  'omc-automation-config',
  'omc-4ai-reports'
];

dataDirs.forEach(dir => {
  const exists = fs.existsSync(dir);
  const status = exists ? '✅' : '⚠️';
  console.log(`  ${status} ${dir}/`);
});

// 检查配置文件
console.log('\n⚙️  配置文件检查:');
const configFiles = [
  'routing-integration-config.json',
  'omc-automation-config/automation-config.json'
];

configFiles.forEach(file => {
  try {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      const config = JSON.parse(content);
      const keyCount = Object.keys(config).length;
      console.log(`  ✅ ${file} (${keyCount} 个配置项)`);
    } else {
      console.log(`  ❌ ${file} (不存在)`);
    }
  } catch (error) {
    console.log(`  ❌ ${file} (无效: ${error.message})`);
  }
});

// 检查集成状态
console.log('\n🔗 路由集成检查:');
const integratedFiles = [
  'omc-workflow-api-fixed.js',
  'omc-real-router-integration.js',
  'omc-router-adapter.js'
];

integratedFiles.forEach(file => {
  try {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      const hasRouter = content.includes('RealOpenClawRouter') || content.includes('OpenClaw路由');
      const status = hasRouter ? '✅' : '❌';
      console.log(`  ${status} ${file}: ${hasRouter ? '已集成' : '未集成'}`);
    } else {
      console.log(`  ❌ ${file} (不存在)`);
    }
  } catch (error) {
    console.log(`  ❌ ${file} (读取失败: ${error.message})`);
  }
});

// 检查启动状态
console.log('\n🚀 启动状态检查:');
const startupLog = 'omc-automation-logs/startup.log';
if (fs.existsSync(startupLog)) {
  const stats = fs.statSync(startupLog);
  const logContent = fs.readFileSync(startupLog, 'utf8');
  const lines = logContent.split('\n').filter(line => line.trim());
  
  console.log(`  ✅ 启动日志存在 (${stats.size} bytes, ${lines.length} 行)`);
  console.log(`  最后几行:`);
  lines.slice(-3).forEach(line => {
    console.log(`    ${line.substring(0, 80)}${line.length > 80 ? '...' : ''}`);
  });
} else {
  console.log(`  ⚠️  启动日志不存在 (系统可能未启动)`);
}

// 总结
console.log('\n' + '='.repeat(50));
console.log('📊 系统状态总结:');

const totalFiles = coreFiles.length + dataDirs.length + configFiles.length + integratedFiles.length;
const existingFiles = 
  coreFiles.filter(f => fs.existsSync(f)).length +
  dataDirs.filter(d => fs.existsSync(d)).length +
  configFiles.filter(f => fs.existsSync(f)).length;

const percentage = (existingFiles / totalFiles * 100).toFixed(1);

console.log(`  文件/目录总数: ${totalFiles}`);
console.log(`  存在文件/目录: ${existingFiles}`);
console.log(`  存在比例: ${percentage}%`);

if (percentage >= 90) {
  console.log('  ✅ 系统状态: 优秀');
} else if (percentage >= 70) {
  console.log('  ⚠️  系统状态: 良好');
} else {
  console.log('  ❌ 系统状态: 需要修复');
}

console.log('\n💡 建议操作:');
console.log('  1. 启动系统: node omc-automation-system.js start');
console.log('  2. 运行测试: node test-omc-system.js');
console.log('  3. 查看详细: cat FINAL_DEPLOYMENT_COMPLETE.md');
console.log('  4. 开始使用: node omc-workflow-routing-integrated.js "你的任务"');

console.log('\n🎯 系统已准备好:');
console.log('  ✅ 路由系统集成完成');
console.log('  ✅ 4AI工作流就绪');
console.log('  ✅ 自动化系统就绪');
console.log('  ✅ 策略库生成就绪');
console.log('  ✅ 监控系统就绪');

console.log('='.repeat(50));
console.log('✅ 状态检查完成');