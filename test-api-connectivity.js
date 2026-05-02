#!/usr/bin/env node

/**
 * 基础API调用测试脚本
 * 用于验证API密钥有效性和基本调用功能
 */

require('dotenv').config({ path: '.env' });

const https = require('https');

// API配置
const API_CONFIG = {
  alibailian: {
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    apiKey: process.env.ALIBABA_API_KEY,
    testModel: 'glm-5'
  },
  '4sapi': {
    baseUrl: 'https://4sapi.com',
    apiKey: process.env.FOURSAPI_API_KEY,
    testModel: 'gemini-3.1-pro-preview'
  }
};

// 测试函数
async function testAPI(provider, config) {
  console.log(`\n🔍 测试 ${provider} API...`);
  
  if (!config.apiKey || config.apiKey.includes('your_actual')) {
    console.log(`  ❌ API密钥未配置或为占位符`);
    console.log(`  请编辑.env文件配置有效的API密钥`);
    return false;
  }
  
  console.log(`  ✅ API密钥存在 (${config.apiKey.substring(0, 10)}...)`);
  console.log(`  端点: ${config.baseUrl}`);
  console.log(`  测试模型: ${config.testModel}`);
  
  // 构建测试请求
  const requestData = JSON.stringify({
    model: config.testModel,
    messages: [
      { role: 'system', content: '你是一个测试助手' },
      { role: 'user', content: '请回复"API测试成功"以验证连接。' }
    ],
    max_tokens: 50
  });
  
  const url = new URL(config.baseUrl);
  const options = {
    hostname: url.hostname,
    port: 443,
    path: `${url.pathname}/chat/completions`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Length': Buffer.byteLength(requestData)
    },
    timeout: 10000
  };
  
  return new Promise((resolve) => {
    console.log(`  📤 发送测试请求...`);
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`  📥 收到响应 - 状态码: ${res.statusCode}`);
        
        if (res.statusCode === 200) {
          try {
            const jsonData = JSON.parse(data);
            console.log(`  ✅ API调用成功！`);
            console.log(`     响应: ${jsonData.choices?.[0]?.message?.content || '无内容'}`);
            resolve(true);
          } catch (error) {
            console.log(`  ⚠️  响应解析失败: ${error.message}`);
            console.log(`     原始响应: ${data.substring(0, 200)}...`);
            resolve(false);
          }
        } else {
          console.log(`  ❌ API调用失败: HTTP ${res.statusCode}`);
          console.log(`     错误信息: ${data.substring(0, 200)}...`);
          resolve(false);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log(`  ❌ 请求失败: ${error.message}`);
      resolve(false);
    });
    
    req.on('timeout', () => {
      console.log(`  ⏱️  请求超时`);
      req.destroy();
      resolve(false);
    });
    
    req.write(requestData);
    req.end();
  });
}

// 主函数
async function main() {
  console.log('🚀 开始API连通性测试');
  console.log('='.repeat(50));
  
  let allPassed = true;
  
  for (const [provider, config] of Object.entries(API_CONFIG)) {
    const passed = await testAPI(provider, config);
    if (!passed) {
      allPassed = false;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  
  if (allPassed) {
    console.log('🎉 所有API测试通过！系统已具备真实调用能力。');
  } else {
    console.log('⚠️  部分API测试失败，请检查API密钥配置。');
    console.log('💡 建议:');
    console.log('  1. 确认API密钥有效性');
    console.log('  2. 检查网络连接');
    console.log('  3. 验证API访问权限');
  }
  
  console.log('\n🔚 测试完成');
}

// 执行
main().catch(error => {
  console.error('❌ 测试执行失败:', error);
  process.exit(1);
});
