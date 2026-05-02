#!/usr/bin/env node

/**
 * OMC工作流与智能路由系统联通性测试
 * 验证不同角色能否匹配不同大模型系统
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const workspace = '/root/.openclaw/workspace';
const configFile = path.join(workspace, 'models-config.json');

console.log('🚀 OMC工作流与智能路由系统联通性测试');
console.log('='.repeat(70));

// 1. 加载配置
let config;
try {
  config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
  console.log('✅ 配置文件加载成功');
} catch (error) {
  console.error('❌ 配置文件加载失败:', error.message);
  process.exit(1);
}

// 2. 定义角色-模型映射策略
const ROLE_MODEL_MAPPING = {
  // 澄清者 (Clarifier) - 需要深度理解和追问能力
  clarifier: {
    description: '追问需求，消除歧义',
    preferredModels: [
      { provider: '4sapi', model: 'claude-opus-4.6', reason: '深度理解能力强' },
      { provider: 'alibailian', model: 'glm-5', reason: '中文理解优秀' },
      { provider: 'kimi', model: 'moonshot-v1-128k', reason: '长上下文支持' }
    ],
    strategy: 'high-performance'
  },
  
  // 构建者 (Builder) - 需要代码生成和执行能力
  builder: {
    description: '执行实际开发与生成',
    preferredModels: [
      { provider: 'volcengine', model: 'deepseek-v3-2-251201', reason: '代码生成能力强' },
      { provider: 'alibailian', model: 'deepseek-v3.2', reason: '成本效益高' },
      { provider: 'alibailian', model: 'qwen3.6-plus', reason: '代码优化优秀' }
    ],
    strategy: 'cost-effective'
  },
  
  // 审查者 (Reviewer) - 需要严谨分析和质量检查能力
  reviewer: {
    description: '负责质量校验和回退',
    preferredModels: [
      { provider: '4sapi', model: 'gemini-3.1-pro-preview', reason: '多模态分析能力强' },
      { provider: 'alibailian', model: 'qwen3-max', reason: '综合评估能力强' },
      { provider: '4sapi', model: 'gpt-5.4', reason: '逻辑严谨性好' }
    ],
    strategy: 'high-performance'
  },
  
  // 仲裁者 (Arbiter) - 需要最高决策和冲突解决能力
  arbiter: {
    description: '最高控制权，介入截断死锁',
    preferredModels: [
      { provider: '4sapi', model: 'claude-opus-4.6', reason: '决策能力强' },
      { provider: '4sapi', model: 'gpt-5.4', reason: '综合判断优秀' },
      { provider: 'alibailian', model: 'glm-5', reason: '中文决策能力强' }
    ],
    strategy: 'creative-tasks'
  }
};

// 3. 测试API密钥有效性
async function testAPIKey(provider, modelInfo) {
  const providers = config.modelConfig?.providers || {};
  const apiKeys = config.apiKeys || {};
  
  let apiKey = '';
  let baseUrl = '';
  
  // 获取API密钥
  if (provider === 'volcengine' && modelInfo.id === 'deepseek-v3-2-251201') {
    apiKey = apiKeys.volcengine?.['deepseek-v3-2-251201'] || '';
  } else if (provider === '4sapi') {
    apiKey = apiKeys['4sapi']?.primary || '';
  } else if (provider === 'alibailian') {
    apiKey = apiKeys.alibailian?.[modelInfo.id] || providers.alibailian?.apiKey || '';
  } else if (provider === 'kimi') {
    apiKey = apiKeys.kimi || '';
  }
  
  // 获取baseUrl
  if (providers[provider]) {
    baseUrl = providers[provider].baseUrl;
  }
  
  return {
    provider,
    model: modelInfo.id,
    apiKey: apiKey ? `${apiKey.substring(0, 8)}...` : '未找到',
    baseUrl,
    hasApiKey: !!apiKey && !apiKey.includes('YOUR_')
  };
}

// 4. 测试角色-模型匹配
async function testRoleModelMatching() {
  console.log('\n📋 1. 角色-模型匹配测试');
  console.log('='.repeat(50));
  
  const results = [];
  
  for (const [role, roleConfig] of Object.entries(ROLE_MODEL_MAPPING)) {
    console.log(`\n🎭 ${role.toUpperCase()} (${roleConfig.description})`);
    console.log(`   策略: ${roleConfig.strategy}`);
    console.log('   推荐模型:');
    
    const roleResults = [];
    
    for (const model of roleConfig.preferredModels) {
      // 获取模型信息
      const modelInfo = config.modelConfig?.providers?.[model.provider]?.models?.find(m => m.id === model.model);
      
      if (!modelInfo) {
        console.log(`     ❌ ${model.provider}/${model.model}: 配置中未找到`);
        roleResults.push({ provider: model.provider, model: model.model, status: '配置缺失' });
        continue;
      }
      
      // 测试API密钥
      const apiTest = await testAPIKey(model.provider, modelInfo);
      
      const status = apiTest.hasApiKey ? '✅' : '❌';
      console.log(`     ${status} ${model.provider}/${model.model}: ${model.reason}`);
      console.log(`         密钥: ${apiTest.apiKey}`);
      console.log(`         端点: ${apiTest.baseUrl}`);
      
      roleResults.push({
        provider: model.provider,
        model: model.model,
        status: apiTest.hasApiKey ? '可用' : '密钥无效/缺失',
        hasApiKey: apiTest.hasApiKey,
        baseUrl: apiTest.baseUrl
      });
    }
    
    results.push({
      role,
      description: roleConfig.description,
      strategy: roleConfig.strategy,
      models: roleResults,
      hasAvailableModels: roleResults.some(r => r.hasApiKey)
    });
  }
  
  return results;
}

// 5. 测试实际API调用（针对已配置密钥的模型）
async function testActualAPICall(provider, modelId, apiKey, baseUrl) {
  return new Promise((resolve) => {
    console.log(`\n🔗 测试实际API调用: ${provider}/${modelId}`);
    
    if (!apiKey || apiKey.includes('YOUR_')) {
      console.log('   ⚠️  API密钥无效或为占位符');
      resolve({ success: false, error: 'API密钥无效' });
      return;
    }
    
    // 构建请求
    const requestData = JSON.stringify({
      model: modelId,
      messages: [
        {
          role: 'user',
          content: `角色测试：作为${provider}/${modelId}模型，请简要说明你的特长领域。`
        }
      ],
      max_tokens: 100,
      temperature: 0.7
    });
    
    let urlPath = '';
    let hostname = '';
    let pathname = '';
    
    try {
      const url = new URL(baseUrl);
      hostname = url.hostname;
      pathname = url.pathname;
      urlPath = `${pathname}/chat/completions`;
    } catch (error) {
      // 如果不是完整URL，使用默认路径
      hostname = baseUrl.replace('https://', '').replace('http://', '').split('/')[0];
      urlPath = '/chat/completions';
    }
    
    const options = {
      hostname,
      port: 443,
      path: urlPath,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(requestData)
      },
      timeout: 15000
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`   📥 响应状态: HTTP ${res.statusCode}`);
        
        if (res.statusCode === 200) {
          try {
            const jsonData = JSON.parse(data);
            console.log(`   ✅ API调用成功`);
            console.log(`      响应: ${jsonData.choices?.[0]?.message?.content?.substring(0, 80) || '无内容'}...`);
            resolve({ success: true, response: jsonData, statusCode: res.statusCode });
          } catch (error) {
            console.log(`   ⚠️  响应解析失败: ${error.message}`);
            resolve({ success: false, error: '解析失败', rawResponse: data.substring(0, 200) });
          }
        } else {
          console.log(`   ❌ API调用失败: HTTP ${res.statusCode}`);
          console.log(`      错误: ${data.substring(0, 200)}...`);
          resolve({ success: false, error: `HTTP ${res.statusCode}`, statusCode: res.statusCode });
        }
      });
    });
    
    req.on('error', (error) => {
      console.log(`   ❌ 请求失败: ${error.message}`);
      resolve({ success: false, error: error.message });
    });
    
    req.on('timeout', () => {
      console.log('   ⏱️  请求超时');
      req.destroy();
      resolve({ success: false, error: '请求超时' });
    });
    
    console.log('   📤 发送测试请求...');
    req.write(requestData);
    req.end();
  });
}

// 6. 测试OMC工作流路由决策
function testOMCWorkflowRouting() {
  console.log('\n📋 2. OMC工作流路由决策测试');
  console.log('='.repeat(50));
  
  // 模拟OMC工作流阶段
  const workflowStages = [
    { stage: 'clarification', description: '需求澄清阶段', expectedRole: 'clarifier' },
    { stage: 'design', description: '系统设计阶段', expectedRole: 'builder' },
    { stage: 'implementation', description: '实现阶段', expectedRole: 'builder' },
    { stage: 'review', description: '审查阶段', expectedRole: 'reviewer' },
    { stage: 'conflict', description: '冲突解决阶段', expectedRole: 'arbiter' }
  ];
  
  const routingConfig = config.routingConfig;
  console.log('📊 路由配置:');
  console.log(`   默认策略: ${routingConfig?.defaultStrategy || '未设置'}`);
  console.log(`   回退机制: ${routingConfig?.fallbackEnabled ? '启用' : '禁用'}`);
  console.log(`   并发限制: ${routingConfig?.concurrencyLimit || '未设置'}`);
  
  console.log('\n🔀 工作流阶段路由映射:');
  
  const routingResults = [];
  
  for (const stage of workflowStages) {
    const role = ROLE_MODEL_MAPPING[stage.expectedRole];
    
    if (!role) {
      console.log(`   ❌ ${stage.stage}: 未找到对应角色 ${stage.expectedRole}`);
      routingResults.push({ stage: stage.stage, status: '角色未定义' });
      continue;
    }
    
    // 根据角色策略选择路由策略
    const strategy = routingConfig?.strategies?.find(s => s.name === role.strategy);
    
    if (!strategy) {
      console.log(`   ⚠️  ${stage.stage}: 策略 "${role.strategy}" 未配置`);
      routingResults.push({ stage: stage.stage, status: '策略未配置' });
      continue;
    }
    
    console.log(`   ✅ ${stage.stage} (${stage.description}):`);
    console.log(`      角色: ${stage.expectedRole}`);
    console.log(`      策略: ${role.strategy}`);
    console.log(`      推荐模型: ${strategy.priority.slice(0, 3).join(', ')}...`);
    
    routingResults.push({
      stage: stage.stage,
      role: stage.expectedRole,
      strategy: role.strategy,
      status: '路由成功',
      availableModels: strategy.priority.slice(0, 3)
    });
  }
  
  return routingResults;
}

// 7. 主测试函数
async function runIntegrationTest() {
  console.log('🎯 测试目标: OMC工作流与智能路由系统联通性');
  console.log('🔍 验证内容: 不同角色能否匹配不同大模型系统\n');
  
  // 1. 测试角色-模型匹配
  const roleResults = await testRoleModelMatching();
  
  // 2. 测试OMC工作流路由决策
  const routingResults = testOMCWorkflowRouting();
  
  // 3. 测试实际API调用（针对第一个可用的模型）
  console.log('\n📋 3. 实际API联通性测试');
  console.log('='.repeat(50));
  
  // 找到第一个有有效API密钥的角色模型
  let testTarget = null;
  for (const roleResult of roleResults) {
    const availableModel = roleResult.models.find(m => m.hasApiKey && m.baseUrl);
    if (availableModel) {
      testTarget = {
        role: roleResult.role,
        provider: availableModel.provider,
        model: availableModel.model,
        baseUrl: availableModel.baseUrl
      };
      break;
    }
  }
  
  if (testTarget) {
    // 获取实际API密钥
    const apiKeys = config.apiKeys || {};
    let actualApiKey = '';
    
    if (testTarget.provider === 'volcengine' && testTarget.model === 'deepseek-v3-2-251201') {
      actualApiKey = apiKeys.volcengine?.['deepseek-v3-2-251201'] || '';
    } else if (testTarget.provider === '4sapi') {
      actualApiKey = apiKeys['4sapi']?.primary || '';
    }
    
    if (actualApiKey && !actualApiKey.includes('YOUR_')) {
      await testActualAPICall(testTarget.provider, testTarget.model, actualApiKey, testTarget.baseUrl);
    } else {
      console.log('⚠️  未找到可用于实际测试的有效API密钥');
    }
  } else {
    console.log('❌ 未找到任何配置了有效API密钥的模型');
  }
  
  // 生成测试报告
  console.log('\n' + '='.repeat(70));
  console.log('📊 OMC工作流与智能路由系统联通性测试报告');
  console.log('='.repeat(70));
  
  // 统计结果
  const totalRoles = roleResults.length;
  const rolesWithAvailableModels = roleResults.filter(r => r.hasAvailableModels).length;
  const totalModelsTested = roleResults.reduce((sum, r) => sum + r.models.length, 0);
  const modelsWithApiKeys = roleResults.reduce((sum, r) => sum + r.models.filter(m => m.hasApiKey).length, 0);
  
  console.log(`\n👥 角色配置: ${totalRoles} 个角色`);
  console.log(`   ✅ 有可用模型: ${rolesWithAvailableModels}/${totalRoles}`);
  
  console.log(`\n🤖 模型配置: ${totalModelsTested} 个推荐模型`);
  console.log(`   ✅ 配置API密钥: ${modelsWithApiKeys}/${totalModelsTested}`);
  
  console.log(`\n🔀 工作流路由: ${routingResults.length} 个阶段`);
  const successfulRoutings = routingResults.filter(r => r.status === '路由成功').length;
  console.log(`   ✅ 路由成功: ${successfulRoutings}/${routingResults.length}`);
  
  console.log('\n💡 系统联通性评估:');
  
  if (rolesWithAvailableModels === totalRoles && successfulRoutings === routingResults.length) {
    console.log('   🎉 完全联通: OMC工作流与智能路由系统完全联通');
    console.log('   🚀 所有角色均可匹配相应的大模型系统');
  } else if (rolesWithAvailableModels > 0 && successfulRoutings > 0) {
    console.log('   ⚠️  部分联通: 系统基本联通，但部分配置需要完善');
    console.log('   🔧 需要检查缺失的API密钥配置');
  } else {
    console.log('   ❌ 未联通: 系统尚未建立有效联通');
    console.log('   🛠️  需要配置有效的API密钥和路由策略');
  }
  
  console.log('\n🔚 测试完成');
}

// 执行测试
runIntegrationTest().catch(error => {
  console.error('❌ 测试执行失败:', error);
  process.exit(1);
});