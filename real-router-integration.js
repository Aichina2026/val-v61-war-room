#!/usr/bin/env node

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
      throw new Error(`${route.provider} API密钥未配置`);
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
        path: `${url.pathname}/chat/completions`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${provider.apiKey}`,
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
              reject(new Error(`响应解析失败: ${error.message}`));
            }
          } else {
            reject(new Error(`API调用失败: HTTP ${res.statusCode} - ${data.substring(0, 100)}`));
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
    console.log(`\n🔀 路由阶段: ${stage}`);
    console.log(`📝 提示长度: ${prompt.length} 字符`);
    
    // 1. 路由决策
    const route = this.route(stage, prompt, options);
    console.log(`🎯 路由结果: ${route.provider} - ${route.modelId} (${route.strategy})`);
    
    // 2. 调用API
    console.log(`📤 调用API...`);
    try {
      const result = await this.call(route, prompt);
      console.log(`✅ 调用成功`);
      console.log(`📄 响应长度: ${result.content?.length || 0} 字符`);
      return result;
    } catch (error) {
      console.log(`❌ 调用失败: ${error.message}`);
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
      console.log(`\n📊 结果概要:`);
      console.log(`   模型: ${result.model}`);
      console.log(`   提供商: ${result.provider}`);
      console.log(`   内容预览: ${result.content?.substring(0, 100)}...\n`);
    } catch (error) {
      console.log(`\n⚠️  测试失败: ${testCase.stage}`);
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
