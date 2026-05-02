#!/usr/bin/env node

/**
 * OMC模型配置测试脚本
 * 验证更新后的模型配置
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 OMC模型配置测试开始');
console.log('='.repeat(50));

// 读取模型配置文件
const modelConfigPath = path.join(__dirname, 'openclaw-update-models.json');
const productionConfigPath = path.join(__dirname, 'omc-production-config.json');

try {
  // 1. 检查配置文件存在性
  console.log('\n📋 1. 检查配置文件...');
  if (!fs.existsSync(modelConfigPath)) {
    throw new Error(`模型配置文件不存在: ${modelConfigPath}`);
  }
  if (!fs.existsSync(productionConfigPath)) {
    throw new Error(`生产配置文件不存在: ${productionConfigPath}`);
  }
  console.log('✅ 配置文件检查通过');

  // 2. 解析模型配置
  console.log('\n📋 2. 解析模型配置...');
  const modelConfig = JSON.parse(fs.readFileSync(modelConfigPath, 'utf8'));
  const productionConfig = JSON.parse(fs.readFileSync(productionConfigPath, 'utf8'));

  // 3. 统计模型数量
  console.log('\n📋 3. 模型统计...');
  const providers = modelConfig.models.providers;
  let totalModels = 0;
  
  console.log('\n🔹 提供商统计:');
  for (const [providerName, providerConfig] of Object.entries(providers)) {
    const modelCount = providerConfig.models?.length || 0;
    totalModels += modelCount;
    console.log(`  ${providerName}: ${modelCount} 个模型`);
  }
  console.log(`\n📊 总计: ${totalModels} 个模型`);

  // 4. 验证要求的模型
  console.log('\n📋 4. 验证要求的模型...');
  
  const requiredModels = {
    'ark': ['deepseek-v3.2', 'glm-4-7-251222'],
    'alibailian': ['glm-5', 'qwen3.6-plus', 'qwen3-max', 'deepseek-v3.2'],
    'kimi': ['kimi-k2.5'],
    '4sapi': ['gemini-3.1-pro-preview', 'gpt-5.4', 'claude-opus-4.6']
  };

  let allFound = true;
  for (const [provider, models] of Object.entries(requiredModels)) {
    console.log(`\n🔸 ${provider}:`);
    if (!providers[provider]) {
      console.log(`  ❌ 提供商未配置`);
      allFound = false;
      continue;
    }
    
    const providerModels = providers[provider].models.map(m => m.id);
    for (const model of models) {
      if (providerModels.includes(model)) {
        console.log(`  ✅ ${model}`);
      } else {
        console.log(`  ❌ ${model} (缺失)`);
        allFound = false;
      }
    }
  }

  // 5. 验证OMC阶段策略
  console.log('\n📋 5. 验证OMC阶段策略...');
  const stageStrategies = productionConfig.routerConfiguration?.stageStrategies;
  if (stageStrategies) {
    const stages = ['analysis', 'design', 'generation', 'review', 'optimization'];
    for (const stage of stages) {
      const config = stageStrategies[stage];
      if (config) {
        console.log(`\n🔹 ${stage}:`);
        console.log(`  策略: ${config.strategy}`);
        console.log(`  备用: ${config.fallback}`);
        console.log(`  优先模型: ${config.priorityModels?.join(', ') || '无'}`);
      } else {
        console.log(`\n⚠️  ${stage}: 未配置`);
      }
    }
  }

  // 6. 总结
  console.log('\n' + '='.repeat(50));
  console.log('📊 测试结果总结:');
  console.log(`- 配置文件: ${allFound ? '✅ 完整' : '❌ 不完整'}`);
  console.log(`- 模型总数: ${totalModels}`);
  console.log(`- OMC阶段: ${stageStrategies ? '✅ 已配置' : '❌ 未配置'}`);
  
  if (allFound) {
    console.log('\n🎉 所有要求的模型都已正确配置！');
    console.log('\n💡 建议下一步:');
    console.log('1. 重启OMC路由系统以应用新配置');
    console.log('2. 运行路由测试验证模型可用性');
    console.log('3. 监控系统性能确保稳定运行');
  } else {
    console.log('\n⚠️  部分模型配置缺失，请检查配置文件');
  }

} catch (error) {
  console.error('\n❌ 测试失败:', error.message);
  console.error(error.stack);
  process.exit(1);
}

console.log('\n🔍 测试完成');