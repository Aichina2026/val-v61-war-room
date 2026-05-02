#!/usr/bin/env node

/**
 * 物理链路打通测试
 * 验证 OPENCLAW 4.1 与火山引擎 API 的真实连接
 */

const https = require('https');

// 从环境变量获取API密钥
const API_KEY = process.env.ARK_API_KEY || '0cf5aa07-5925-4fcf-a648-e1689107b97d';
const MODEL_ID = process.env.ARK_MODEL_ID || 'deepseek-v3-2-251201';

console.log('🚀 OPENCLAW 4.1 物理链路打通测试');
console.log('='.repeat(50));

// 测试端点连通性
function testEndpointConnectivity() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'ark.cn-beijing.volces.com',
      port: 443,
      path: '/api/coding/v3',
      method: 'HEAD',
      timeout: 10000
    };
    
    console.log(`🔗 测试端点连通性: ${options.hostname}${options.path}`);
    
    const req = https.request(options, (res) => {
      console.log(`  ✅ 端点连通性: HTTP ${res.statusCode}`);
      resolve({ connected: true, statusCode: res.statusCode });
    });
    
    req.on('error', (error) => {
      console.log(`  ❌ 端点连通失败: ${error.message}`);
      resolve({ connected: false, error: error.message });
    });
    
    req.on('timeout', () => {
      console.log('  ⏱️  连接超时');
      req.destroy();
      resolve({ connected: false, error: '连接超时' });
    });
    
    req.end();
  });
}

// 测试API认证
function testAPIAuthentication() {
  return new Promise((resolve) => {
    console.log('\n🔐 测试API密钥认证...');
    console.log(`  密钥: ${API_KEY.substring(0, 8)}...`);
    console.log(`  模型: ${MODEL_ID}`);
    
    // 尝试不同格式的请求
    const requestData = JSON.stringify({
      model: MODEL_ID,
      messages: [
        {
          role: 'user',
          content: '你好，我是 OPENCLAW 4.1，物理链路打通测试。请回复"OPENCLAW物理链路验证成功"。'
        }
      ],
      max_tokens: 50,
      temperature: 0.7
    });
    
    const options = {
      hostname: 'ark.cn-beijing.volces.com',
      port: 443,
      path: '/api/coding/v3/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Length': Buffer.byteLength(requestData)
      },
      timeout: 30000
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`  📥 API响应状态: HTTP ${res.statusCode}`);
        
        if (res.statusCode === 200) {
          try {
            const jsonData = JSON.parse(data);
            console.log('  ✅ API认证成功！');
            console.log(`  📄 模型响应: ${jsonData.choices?.[0]?.message?.content || '无内容'}`);
            resolve({ 
              authenticated: true, 
              statusCode: res.statusCode,
              response: jsonData 
            });
          } catch (error) {
            console.log(`  ⚠️  响应解析失败: ${error.message}`);
            console.log(`     原始响应: ${data.substring(0, 200)}...`);
            resolve({ 
              authenticated: false, 
              error: '响应解析失败',
              rawResponse: data 
            });
          }
        } else {
          console.log(`  ❌ API认证失败: HTTP ${res.statusCode}`);
          console.log(`     错误信息: ${data.substring(0, 200)}...`);
          resolve({ 
            authenticated: false, 
            statusCode: res.statusCode,
            error: data 
          });
        }
      });
    });
    
    req.on('error', (error) => {
      console.log(`  ❌ 请求失败: ${error.message}`);
      resolve({ authenticated: false, error: error.message });
    });
    
    req.on('timeout', () => {
      console.log('  ⏱️  请求超时');
      req.destroy();
      resolve({ authenticated: false, error: '请求超时' });
    });
    
    console.log('  📤 发送测试请求...');
    req.write(requestData);
    req.end();
  });
}

// 测试备用模型
function testBackupModel() {
  return new Promise((resolve) => {
    console.log('\n🔧 测试备用模型 GLM-4-7-251222...');
    
    const requestData = JSON.stringify({
      model: 'glm-4-7-251222',
      messages: [
        {
          role: 'user',
          content: '备用模型测试：OPENCLAW 4.1 物理链路验证。'
        }
      ],
      max_tokens: 50,
      temperature: 0.7
    });
    
    const options = {
      hostname: 'ark.cn-beijing.volces.com',
      port: 443,
      path: '/api/coding/v3/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Length': Buffer.byteLength(requestData)
      },
      timeout: 30000
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`  📥 备用模型响应: HTTP ${res.statusCode}`);
        
        if (res.statusCode === 200) {
          try {
            const jsonData = JSON.parse(data);
            console.log(`  ✅ 备用模型可用`);
            console.log(`     响应: ${jsonData.choices?.[0]?.message?.content?.substring(0, 100) || '无内容'}...`);
            resolve({ available: true, response: jsonData });
          } catch (error) {
            console.log(`  ⚠️  响应解析失败`);
            resolve({ available: false, error: '解析失败' });
          }
        } else {
          console.log(`  ❌ 备用模型不可用`);
          resolve({ available: false, statusCode: res.statusCode });
        }
      });
    });
    
    req.on('error', (error) => {
      console.log(`  ❌ 请求失败: ${error.message}`);
      resolve({ available: false, error: error.message });
    });
    
    req.on('timeout', () => {
      console.log('  ⏱️  请求超时');
      req.destroy();
      resolve({ available: false, error: '超时' });
    });
    
    req.write(requestData);
    req.end();
  });
}

// 主测试函数
async function runPhysicalConnectionTest() {
  console.log('🎯 目标：验证 OPENCLAW 4.1 与火山引擎的真实物理连接');
  console.log('📊 配置：');
  console.log(`   - 主节点: ${MODEL_ID}`);
  console.log(`   - 备用节点: glm-4-7-251222`);
  console.log(`   - API端点: ark.cn-beijing.volces.com`);
  console.log('');
  
  // 1. 测试端点连通性
  const connectivity = await testEndpointConnectivity();
  
  if (!connectivity.connected) {
    console.log('\n❌ 端点连通性测试失败，无法继续API测试');
    return;
  }
  
  // 2. 测试API认证
  const authResult = await testAPIAuthentication();
  
  // 3. 如果主节点失败，测试备用节点
  if (!authResult.authenticated) {
    console.log('\n🔄 主节点认证失败，尝试备用节点...');
    await testBackupModel();
  }
  
  // 生成测试报告
  console.log('\n' + '='.repeat(50));
  console.log('📊 物理链路测试报告');
  console.log('='.repeat(50));
  
  console.log(`1. 端点连通性: ${connectivity.connected ? '✅ 成功' : '❌ 失败'}`);
  console.log(`2. API认证: ${authResult.authenticated ? '✅ 成功' : '❌ 失败'}`);
  
  if (authResult.authenticated && authResult.response) {
    console.log('\n🎉 OPENCLAW 4.1 物理链路验证成功！');
    console.log('\n📄 【真实 HTTP Response Body 内容】:');
    console.log('='.repeat(50));
    console.log(JSON.stringify(authResult.response, null, 2));
    console.log('='.repeat(50));
  } else {
    console.log('\n⚠️  物理链路验证失败，需要检查：');
    console.log('  1. API密钥有效性');
    console.log('  2. 模型访问权限');
    console.log('  3. 网络配置');
    console.log('  4. 端点URL正确性');
  }
  
  console.log('\n🔚 测试完成');
}

// 执行测试
runPhysicalConnectionTest().catch(error => {
  console.error('❌ 测试执行失败:', error);
  process.exit(1);
});