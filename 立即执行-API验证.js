#!/usr/bin/env node

/**
 * 立即执行：API验证与打通虚幻环节
 * 第一步：验证API密钥配置，建立基础调用能力
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const workspace = '/root/.openclaw/workspace';
const configFile = path.join(workspace, 'openclaw-update-models.json');

console.log('🚀 立即执行：API验证与打通虚幻环节');
console.log('='.repeat(70));

// 1. 检查配置文件
console.log('\n📋 1. 检查配置文件...');

if (!fs.existsSync(configFile)) {
  console.error('❌ 配置文件不存在:', configFile);
  process.exit(1);
}

let config;
try {
  config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
  console.log('✅ 配置文件加载成功');
} catch (error) {
  console.error('❌ 配置文件解析失败:', error.message);
  process.exit(1);
}

// 2. 检查API密钥状态
console.log('\n📋 2. 检查API密钥状态...');

const providers = config.models?.providers || {};
const apiKeyStatus = {};

for (const [provider, providerConfig] of Object.entries(providers)) {
  const apiKey = providerConfig.apiKey;
  const isPlaceholder = apiKey === '__OPENCLAW_REDACTED__' || !apiKey;
  
  apiKeyStatus[provider] = {
    hasApiKey: !!apiKey,
    isPlaceholder,
    baseUrl: providerConfig.baseUrl,
    modelCount: providerConfig.models?.length || 0
  };
  
  console.log(`\n🔍 ${provider}:`);
  console.log(`   API密钥: ${isPlaceholder ? '❌ 占位符/未配置' : '✅ 已配置'}`);
  console.log(`   端点: ${providerConfig.baseUrl || '未设置'}`);
  console.log(`   模型数量: ${providerConfig.models?.length || 0}`);
}

// 3. 创建环境变量配置文件
console.log('\n📋 3. 创建环境变量配置模板...');

const envTemplate = `# API密钥配置
# 请将以下占位符替换为真实的API密钥

# 阿里百炼 API密钥
ALIBABA_API_KEY=your_actual_alibaba_api_key_here

# 4SAPI API密钥  
FOURSAPI_API_KEY=your_actual_4sapi_api_key_here

# 火山引擎 API密钥 (可选)
VOLCENGINE_API_KEY=your_volcengine_api_key_here

# Kimi API密钥 (可选)
KIMI_API_KEY=your_kimi_api_key_here

# 使用说明：
# 1. 将文件重命名为 .env
# 2. 替换所有your_actual_为真实密钥
# 3. 在脚本中通过 process.env.ALIBABA_API_KEY 访问
`;

const envFile = path.join(workspace, 'api-keys-template.env');
fs.writeFileSync(envFile, envTemplate, 'utf8');
console.log(`✅ 环境变量模板已创建: ${envFile}`);

// 4. 创建基础API调用测试脚本
console.log('\n📋 4. 创建基础API调用测试脚本...');

const testScript = `#!/usr/bin/env node

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
  console.log(\`\\n🔍 测试 \${provider} API...\`);
  
  if (!config.apiKey || config.apiKey.includes('your_actual')) {
    console.log(\`  ❌ API密钥未配置或为占位符\`);
    console.log(\`  请编辑.env文件配置有效的API密钥\`);
    return false;
  }
  
  console.log(\`  ✅ API密钥存在 (\${config.apiKey.substring(0, 10)}...)\`);
  console.log(\`  端点: \${config.baseUrl}\`);
  console.log(\`  测试模型: \${config.testModel}\`);
  
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
    path: \`\${url.pathname}/chat/completions\`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': \`Bearer \${config.apiKey}\`,
      'Content-Length': Buffer.byteLength(requestData)
    },
    timeout: 10000
  };
  
  return new Promise((resolve) => {
    console.log(\`  📤 发送测试请求...\`);
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(\`  📥 收到响应 - 状态码: \${res.statusCode}\`);
        
        if (res.statusCode === 200) {
          try {
            const jsonData = JSON.parse(data);
            console.log(\`  ✅ API调用成功！\`);
            console.log(\`     响应: \${jsonData.choices?.[0]?.message?.content || '无内容'}\`);
            resolve(true);
          } catch (error) {
            console.log(\`  ⚠️  响应解析失败: \${error.message}\`);
            console.log(\`     原始响应: \${data.substring(0, 200)}...\`);
            resolve(false);
          }
        } else {
          console.log(\`  ❌ API调用失败: HTTP \${res.statusCode}\`);
          console.log(\`     错误信息: \${data.substring(0, 200)}...\`);
          resolve(false);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log(\`  ❌ 请求失败: \${error.message}\`);
      resolve(false);
    });
    
    req.on('timeout', () => {
      console.log(\`  ⏱️  请求超时\`);
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
  
  console.log('\\n' + '='.repeat(50));
  
  if (allPassed) {
    console.log('🎉 所有API测试通过！系统已具备真实调用能力。');
  } else {
    console.log('⚠️  部分API测试失败，请检查API密钥配置。');
    console.log('💡 建议:');
    console.log('  1. 确认API密钥有效性');
    console.log('  2. 检查网络连接');
    console.log('  3. 验证API访问权限');
  }
  
  console.log('\\n🔚 测试完成');
}

// 执行
main().catch(error => {
  console.error('❌ 测试执行失败:', error);
  process.exit(1);
});
`;

const testFile = path.join(workspace, 'test-api-connectivity.js');
fs.writeFileSync(testFile, testScript, 'utf8');
console.log(`✅ 测试脚本已创建: ${testFile}`);

// 5. 创建路由系统集成脚本
console.log('\n📋 5. 创建路由系统集成基础...');

const routerIntegration = `#!/usr/bin/env node

/**
 * 路由系统集成基础
 * 将路由决策转换为实际API调用
 */

require('dotenv').config({ path: '.env' });

class RealRouter {
  constructor() {
    this.providers = this.loadProviders();
    this.routingRules = this.loadRoutingRules();
  }
  
  loadProviders() {
    return {
      alibailian: {
        baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        apiKey: process.env.ALIBABA_API_KEY,
        models: ['glm-5', 'qwen3.6-plus', 'qwen3-max', 'deepseek-v3.2']
      },
      '4sapi': {
        baseUrl: 'https://4sapi.com',
        apiKey: process.env.FOURSAPI_API_KEY,
        models: ['gemini-3.1-pro-preview', 'gpt-5.4', 'claude-opus-4.6']
      }
    };
  }
  
  loadRoutingRules() {
    return {
      analysis: {
        priority: ['gemini-3.1-pro-preview', 'glm-5', 'deepseek-v3.2'],
        strategy: 'balanced'
      },
      design: {
        priority: ['claude-opus-4.6', 'gpt-5.4', 'qwen3-max'],
        strategy: 'high-quality'
      },
      generation: {
        priority: ['deepseek-v3.2', 'glm-5', 'qwen3.6-plus'],
        strategy: 'cost-effective'
      }
    };
  }
  
  // 路由决策
  route(stage, prompt, options = {}) {
    const rule = this.routingRules[stage] || this.routingRules.analysis;
    const modelId = rule.priority[0];
    
    // 查找模型所属提供商
    for (const [provider, config] of Object.entries(this.providers)) {
      if (config.models.includes(modelId)) {
        return {
          provider,
          modelId,
          stage,
          strategy: rule.strategy,
          promptLength: prompt.length
        };
      }
    }
    
    // 默认回退
    return {
      provider: 'alibailian',
      modelId: 'deepseek-v3.2',
      stage,
      strategy: 'balanced',
      promptLength: prompt.length
    };
  }
  
  // 实际调用
  async call(route, prompt) {
    const provider = this.providers[route.provider];
    
    if (!provider || !provider.apiKey || provider.apiKey.includes('your_actual')) {
      throw new Error(\`\${route.provider} API密钥未配置\`);
    }
    
    const requestData = JSON.stringify({
      model: route.modelId,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: options.maxTokens || 1000
    });
    
    const url = new URL(provider.baseUrl);
    
    return new Promise((resolve, reject) => {
      const options = {
        hostname: url.hostname,
        port: 443,
        path: \`\${url.pathname}/chat/completions\`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${provider.apiKey}\`,
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
          if (res.statusCode === 200) {
            try {
              const jsonData = JSON.parse(data);
              resolve({
                success: true,
                content: jsonData.choices?.[0]?.message?.content,
                model: route.modelId,
                provider: route.provider,
                usage: jsonData.usage
              });
            } catch (error) {
              reject(new Error(\`响应解析失败: \${error.message}\`));
            }
          } else {
            reject(new Error(\`API调用失败: HTTP \${res.statusCode} - \${data.substring(0, 100)}\`));
          }
        });
      });
      
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('请求超时'));
      });
      
      req.write(requestData);
      req.end();
    });
  }
  
  // 路由并调用
  async routeAndCall(stage, prompt, options = {}) {
    console.log(\`\\n🔀 路由阶段: \${stage}\`);
    console.log(\`📝 提示长度: \${prompt.length} 字符\`);
    
    // 1. 路由决策
    const route = this.route(stage, prompt, options);
    console.log(\`🎯 路由结果: \${route.provider} - \${route.modelId} (\${route.strategy})\`);
    
    // 2. 调用API
    console.log(\`📤 调用API...\`);
    try {
      const result = await this.call(route, prompt);
      console.log(\`✅ 调用成功\`);
      console.log(\`📄 响应长度: \${result.content?.length || 0} 字符\`);
      return result;
    } catch (error) {
      console.log(\`❌ 调用失败: \${error.message}\`);
      throw error;
    }
  }
}

// 使用示例
async function main() {
  console.log('🚀 路由系统集成测试');
  console.log('='.repeat(50));
  
  const router = new RealRouter();
  
  // 测试不同阶段
  const testCases = [
    { stage: 'analysis', prompt: '分析这个系统的架构设计' },
    { stage: 'design', prompt: '设计一个微服务电商系统' },
    { stage: 'generation', prompt: '生成用户认证的REST API代码' }
  ];
  
  for (const testCase of testCases) {
    try {
      const result = await router.routeAndCall(testCase.stage, testCase.prompt);
      console.log(\`\\n📊 结果概要:\`);
      console.log(\`   模型: \${result.model}\`);
      console.log(\`   提供商: \${result.provider}\`);
      console.log(\`   内容预览: \${result.content?.substring(0, 100)}...\\n\`);
    } catch (error) {
      console.log(\`\\n⚠️  测试失败: \${testCase.stage}\`);
    }
  }
  
  console.log('🔚 路由系统集成测试完成');
}

// 执行
if (require.main === module) {
  main().catch(error => {
    console.error('❌ 测试失败:', error);
    process.exit(1);
  });
}

module.exports = RealRouter;
`;

const routerFile = path.join(workspace, 'real-router-integration.js');
fs.writeFileSync(routerFile, routerIntegration, 'utf8');
console.log(`✅ 路由集成脚本已创建: ${routerFile}`);

// 6. 创建执行计划
console.log('\n📋 6. 创建立即执行计划...');

const executionPlan = `# 立即执行计划：打通虚幻环节

## 第一步：配置API密钥 (立即)
1. 获取阿里百炼API密钥
2. 获取4SAPI API密钥
3. 配置环境变量文件 (.env)

## 第二步：验证基础连通性 (10分钟)
\`\`\`bash
# 安装依赖
npm install dotenv

# 运行API连通性测试
node test-api-connectivity.js
\`\`\`

## 第三步：测试路由系统集成 (30分钟)
\`\`\`bash
# 测试路由到实际调用
node real-router-integration.js
\`\`\`

## 第四步：验证完整工作流 (1小时)
1. 创建端到端测试脚本
2. 验证多阶段路由调用
3. 记录性能指标

## 关键检查点

### ✅ 完成标志
- [ ] API密钥有效配置
- [ ] 基础调用测试通过
- [ ] 路由系统集成成功
- [ ] 端到端工作流验证

### 🔧 故障排除
1. **API密钥无效**
   - 检查密钥权限
   - 验证API访问限制
   - 联系供应商支持

2. **网络连接问题**
   - 检查防火墙设置
   - 验证DNS解析
   - 测试代理配置

3. **响应格式错误**
   - 检查请求参数
   - 验证模型ID
   - 查看API文档

## 预期结果

### 技术成果
1. ✅ 真实API调用能力
2. ✅ 路由系统与实际调用打通
3. ✅ 基础错误处理机制
4. ✅ 调用监控与指标收集

### 业务价值
1. 🚀 消除虚幻环节，系统可实际运行
2. 📈 建立可靠的技术基础
3. 💡 为后续优化提供数据支持
4. 🎯 验证技术选型可行性

## 下一步行动

### 完成基础打通后
1. **集成零错误自治系统**
2. **实现多AI协同工作流**
3. **建立智能路由优化**
4. **完善监控与告警**

---

**执行时间**: 立即开始  
**预计耗时**: 2小时内完成基础打通  
**负责人**: OpenClaw AI Assistant  
**状态**: 准备就绪 🚀
`;

const planFile = path.join(workspace, '立即执行计划.md');
fs.writeFileSync(planFile, executionPlan, 'utf8');
console.log(`✅ 执行计划已创建: ${planFile}`);

// 7. 总结
console.log('\n' + '='.repeat(70));
console.log('🎉 立即执行方案准备完成');
console.log('='.repeat(70));

console.log('\n📁 生成的文件:');
console.log(`1. ${envFile} - 环境变量配置模板`);
console.log(`2. ${testFile} - API连通性测试脚本`);
console.log(`3. ${routerFile} - 路由系统集成脚本`);
console.log(`4. ${planFile} - 立即执行计划`);

console.log('\n🚀 下一步行动:');
console.log('1. 获取阿里百炼和4SAPI的API密钥');
console.log('2. 配置.env文件中的API密钥');
console.log('3. 运行测试脚本验证连通性');
console.log('4. 验证路由系统集成');

console.log('\n💡 关键提示:');
console.log('• API密钥是打通虚幻环节的关键');
console.log('• 先验证基础连通性，再集成复杂功能');
console.log('• 记录测试结果，为优化提供数据');

console.log('\n🔚 方案准备完成，请立即执行！');

// 设置执行权限
fs.chmodSync(testFile, '755');
fs.chmodSync(routerFile, '755');
console.log('\n✅ 脚本执行权限已设置');