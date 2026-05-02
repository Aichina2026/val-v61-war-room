#!/usr/bin/env node

/**
 * 更新OpenClaw模型配置，添加GLM5支持
 */

const fs = require('fs').promises;
const path = require('path');

async function updateModelConfig() {
  console.log('🔄 更新OpenClaw模型配置...\n');
  
  const configPath = '/root/.openclaw/openclaw.json';
  
  // 读取当前配置
  let config;
  try {
    const configContent = await fs.readFile(configPath, 'utf8');
    config = JSON.parse(configContent);
    console.log('✅ 已读取当前配置');
  } catch (error) {
    console.error('❌ 读取配置失败:', error.message);
    return;
  }
  
  // 检查OpenClaw支持的提供商
  console.log('\n🔍 检查当前配置结构...');
  
  // 确保models配置存在
  if (!config.models) {
    config.models = { mode: 'merge', providers: {} };
  }
  
  if (!config.models.providers) {
    config.models.providers = {};
  }
  
  // 检查是否已有aliyun提供商
  const currentProviders = Object.keys(config.models.providers);
  console.log('   当前提供商:', currentProviders.join(', '));
  
  // 添加aliyun/GLM5配置
  console.log('\n➕ 添加aliyun/GLM5配置...');
  
  // GLM5配置（需要你提供实际的API密钥）
  const glm5Config = {
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    apiKey: process.env.ALIYUN_API_KEY || 'YOUR_ALIYUN_API_KEY_HERE',
    api: 'openai-chat',
    models: [
      {
        id: 'glm-5-latest',
        name: 'GLM-5 Latest',
        reasoning: true,
        input: ['text', 'image'],
        contextWindow: 128000,
        maxTokens: 8192,
        cost: {
          input: 0.001,  // 示例价格，单位：元/千tokens
          output: 0.002   // 示例价格，单位：元/千tokens
        }
      }
    ]
  };
  
  // 检查是否已经有aliyun配置
  if (config.models.providers.aliyun) {
    console.log('   ⚠️  aliyun提供商已存在，将更新配置');
    
    // 检查是否已有GLM5模型
    const existingModels = config.models.providers.aliyun.models || [];
    const hasGLM5 = existingModels.some(m => m.id === 'glm-5-latest');
    
    if (!hasGLM5) {
      config.models.providers.aliyun.models.push(glm5Config.models[0]);
      console.log('   ✅ 已添加GLM-5模型');
    } else {
      console.log('   ⚠️  GLM-5模型已存在');
    }
    
    // 更新基础配置
    config.models.providers.aliyun.baseUrl = glm5Config.baseUrl;
    if (glm5Config.apiKey !== 'YOUR_ALIYUN_API_KEY_HERE') {
      config.models.providers.aliyun.apiKey = glm5Config.apiKey;
    }
  } else {
    // 添加新的aliyun提供商
    config.models.providers.aliyun = glm5Config;
    console.log('   ✅ 已添加aliyun提供商');
  }
  
  // 更新默认主模型
  console.log('\n🎯 更新默认主模型...');
  
  if (!config.agents) {
    config.agents = { defaults: {} };
  }
  
  if (!config.agents.defaults) {
    config.agents.defaults = {};
  }
  
  // 设置GLM5为主模型
  config.agents.defaults.model = {
    primary: 'aliyun/glm-5-latest',
    fallback: 'ark/deepseek-v3.2'  // 保留回退模型
  };
  
  console.log('   ✅ 主模型: aliyun/glm-5-latest');
  console.log('   ✅ 回退模型: ark/deepseek-v3.2');
  
  // 保存配置
  try {
    const configContent = JSON.stringify(config, null, 2);
    await fs.writeFile(configPath, configContent, 'utf8');
    console.log('\n💾 配置已保存到:', configPath);
  } catch (error) {
    console.error('❌ 保存配置失败:', error.message);
    return;
  }
  
  // 显示最终的模型列表
  console.log('\n📋 最终模型列表:');
  
  Object.entries(config.models.providers).forEach(([provider, providerConfig]) => {
    console.log(`   ${provider}:`);
    if (providerConfig.models && Array.isArray(providerConfig.models)) {
      providerConfig.models.forEach(model => {
        const isPrimary = config.agents.defaults.model?.primary === `${provider}/${model.id}`;
        console.log(`     ${model.id} ${isPrimary ? '🎯 (主模型)' : ''}`);
      });
    }
  });
  
  // 提供后续步骤
  console.log('\n🔧 后续步骤:');
  console.log('   1. 获取阿里云DashScope API密钥');
  console.log('   2. 更新配置文件中的apiKey字段');
  console.log('   3. 重启OpenClaw网关服务');
  console.log('   4. 运行测试验证模型可用性');
  
  console.log('\n📝 获取API密钥:');
  console.log('   访问: https://help.aliyun.com/zh/dashscope/developer-reference/activate-dashscope-and-create-an-api-key');
  console.log('   创建API密钥后，更新配置文件:');
  console.log(`   nano ${configPath}`);
  console.log('   将 "YOUR_ALIYUN_API_KEY_HERE" 替换为你的实际API密钥');
  
  console.log('\n🚀 重启服务命令:');
  console.log('   openclaw gateway restart');
  
  console.log('\n🧪 测试命令:');
  console.log('   openclaw models list');
  console.log('   openclaw chat --model aliyun/glm-5-latest');
  
  return config;
}

// 运行更新
updateModelConfig().catch(console.error);