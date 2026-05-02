#!/usr/bin/env node

/**
 * 测试添加阿里GLM5模型配置
 */

const fs = require('fs').promises;
const path = require('path');

async function testAddGLM5Config() {
  console.log('🔧 测试添加阿里GLM5模型配置...\n');
  
  // 读取当前配置
  const configPath = '/root/.openclaw/openclaw.json';
  let config;
  
  try {
    const configContent = await fs.readFile(configPath, 'utf8');
    config = JSON.parse(configContent);
    console.log('✅ 已读取当前配置');
  } catch (error) {
    console.error('❌ 读取配置失败:', error.message);
    return;
  }
  
  // 检查当前模型配置
  console.log('\n📋 当前模型配置:');
  console.log('   模式:', config.models?.mode || '未设置');
  console.log('   提供商:', Object.keys(config.models?.providers || {}).join(', '));
  
  if (config.models?.providers?.ark) {
    console.log('   ARK模型:', config.models.providers.ark.models.map(m => m.id).join(', '));
  }
  
  // 创建GLM5配置
  const glm5Config = {
    name: 'glm-5-最新版',
    id: 'glm-5-latest',
    description: '阿里通义千问GLM5最新版本',
    provider: 'aliyun',
    apiType: 'chat',
    endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    apiKey: process.env.ALIYUN_API_KEY || '需要设置API密钥',
    contextWindow: 128000,
    maxTokens: 8192,
    supportedFeatures: ['function_calling', 'vision', 'json_mode', 'streaming']
  };
  
  console.log('\n🎯 GLM5配置:');
  console.log('   名称:', glm5Config.name);
  console.log('   提供商:', glm5Config.provider);
  console.log('   端点:', glm5Config.endpoint);
  console.log('   上下文窗口:', glm5Config.contextWindow, 'tokens');
  console.log('   支持功能:', glm5Config.supportedFeatures.join(', '));
  
  // 尝试配置添加
  console.log('\n🔧 配置添加步骤:');
  console.log('1. 检查OpenClaw是否支持aliyun提供商');
  console.log('2. 如果需要，添加新的提供商配置');
  console.log('3. 更新默认主模型设置');
  console.log('4. 验证模型可用性');
  
  // 检查是否有aliyun提供商
  const hasAliyun = config.models?.providers?.aliyun;
  console.log('\n📊 提供商状态:');
  console.log('   aliyun:', hasAliyun ? '✅ 已配置' : '❌ 未配置');
  console.log('   ark:', config.models?.providers?.ark ? '✅ 已配置' : '❌ 未配置');
  
  if (!hasAliyun) {
    console.log('\n⚠️  需要添加aliyun提供商配置');
    console.log('   需要以下信息:');
    console.log('   - API密钥 (ALIYUN_API_KEY)');
    console.log('   - 可选的定制端点');
    console.log('   - 模型特定参数');
  }
  
  // 显示当前主模型
  console.log('\n🎯 当前主模型:');
  const primaryModel = config.agents?.defaults?.model?.primary;
  console.log('   ', primaryModel || '未设置');
  
  // 提供配置示例
  console.log('\n📝 GLM5配置示例:');
  console.log(`
  // 在openclaw.json的models.providers中添加:
  "aliyun": {
    "baseUrl": "https://dashscope.aliyuncs.com/compatible-mode/v1",
    "apiKey": "your-api-key-here",
    "api": "openai-chat",
    "models": [
      {
        "id": "glm-5-latest",
        "name": "GLM-5 Latest",
        "reasoning": true,
        "input": ["text", "image"],
        "contextWindow": 128000,
        "maxTokens": 8192
      }
    ]
  }
  
  // 更新默认主模型:
  "agents": {
    "defaults": {
      "model": {
        "primary": "aliyun/glm-5-latest"
      }
    }
  }
  `);
  
  console.log('\n🔍 验证步骤:');
  console.log('1. 获取阿里云DashScope API密钥');
  console.log('2. 更新配置文件');
  console.log('3. 重启OpenClaw网关');
  console.log('4. 测试模型响应');
  
  console.log('\n📋 需要的环境变量:');
  console.log('   export ALIYUN_API_KEY="your-api-key"');
  console.log('   export ALIYUN_MODEL="glm-5-latest"');
  
  return { config, glm5Config, hasAliyun: !!hasAliyun };
}

// 运行测试
testAddGLM5Config().catch(console.error);