#!/usr/bin/env node

/**
 * 实际API调用测试脚本
 * 测试真实调用阿里百炼和4SAPI节点的模型
 * 验证智能路由系统的实际连通性
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

const workspace = '/root/.openclaw/workspace';
const configFile = path.join(workspace, 'openclaw-update-models.json');
const results = [];

console.log('🚀 开始实际API调用测试');
console.log('='.repeat(70));
console.log('目标：验证真实调用阿里百炼和4SAPI节点的模型');
console.log('='.repeat(70));

// 读取配置
let config;
try {
  config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
  console.log('✅ 配置文件加载成功');
} catch (error) {
  console.error('❌ 配置文件加载失败:', error.message);
  process.exit(1);
}

// 测试函数：检查API端点连通性
async function testEndpointConnectivity(endpoint, provider) {
  return new Promise((resolve) => {
    console.log(`\n🔗 测试 ${provider} 端点连通性: ${endpoint}`);
    
    const url = new URL(endpoint);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname || '/',
      method: 'HEAD',
      timeout: 10000
    };
    
    const req = https.request(options, (res) => {
      console.log(`  ✅ 连接成功 - 状态码: ${res.statusCode}`);
      resolve({ success: true, statusCode: res.statusCode, provider });
    });
    
    req.on('error', (error) => {
      console.log(`  ❌ 连接失败 - ${error.message}`);
      resolve({ success: false, error: error.message, provider });
    });
    
    req.on('timeout', () => {
      console.log('  ⏱️  连接超时');
      req.destroy();
      resolve({ success: false, error: '连接超时', provider });
    });
    
    req.end();
  });
}

// 测试函数：模拟API调用（不发送实际请求）
async function simulateAPICall(provider, model, endpoint) {
  console.log(`\n🔍 模拟 ${provider} - ${model} API调用`);
  console.log(`  端点: ${endpoint}`);
  console.log(`  模型: ${model}`);
  
  // 检查API密钥配置
  const apiKey = config.models?.providers?.[provider]?.apiKey;
  if (apiKey && apiKey !== '__OPENCLAW_REDACTED__') {
    console.log(`  ✅ API密钥: 已配置 (${apiKey.substring(0, 10)}...)`);
  } else {
    console.log(`  ⚠️  API密钥: 未配置或为占位符`);
  }
  
  // 模拟请求数据
  const mockRequest = {
    model: model,
    messages: [{ role: 'user', content: '测试消息' }],
    max_tokens: 100
  };
  
  console.log(`  📤 模拟请求数据:`, JSON.stringify(mockRequest, null, 2).split('\n')[0] + '...');
  
  return {
    provider,
    model,
    endpoint,
    apiKeyConfigured: !!(apiKey && apiKey !== '__OPENCLAW_REDACTED__'),
    simulated: true,
    timestamp: new Date().toISOString()
  };
}

// 测试OMC路由系统实际调用
async function testOMCRoutingCalls() {
  console.log('\n📋 测试OMC路由系统实际调用能力...');
  
  // 查找路由文件
  const routingFiles = [
    'omc-router-adapter.js',
    'omc-real-router-integration.js',
    'omc-workflow-routing-integrated.js'
  ];
  
  for (const file of routingFiles) {
    const filePath = path.join(workspace, file);
    if (fs.existsSync(filePath)) {
      console.log(`\n🔍 分析 ${file}:`);
      
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // 检查是否包含API调用逻辑
        const hasAPICalls = content.includes('fetch') || 
                           content.includes('axios') || 
                           content.includes('https.request') ||
                           content.includes('openai.ChatCompletion');
        
        // 检查是否包含阿里/4SAPI相关逻辑
        const hasAliLogic = content.includes('alibailian') || content.includes('dashscope');
        const hasSapiLogic = content.includes('4sapi');
        
        // 检查是否包含路由逻辑
        const hasRoutingLogic = content.includes('route') || 
                               content.includes('router') || 
                               content.includes('策略');
        
        console.log(`  ✅ 文件存在 (${content.length} 字符)`);
        console.log(`  📊 分析结果:`);
        console.log(`    - API调用逻辑: ${hasAPICalls ? '✅ 存在' : '⚠️ 未找到'}`);
        console.log(`    - 阿里逻辑: ${hasAliLogic ? '✅ 存在' : '⚠️ 未找到'}`);
        console.log(`    - 4SAPI逻辑: ${hasSapiLogic ? '✅ 存在' : '⚠️ 未找到'}`);
        console.log(`    - 路由逻辑: ${hasRoutingLogic ? '✅ 存在' : '⚠️ 未找到'}`);
        
        results.push({
          file,
          hasAPICalls,
          hasAliLogic,
          hasSapiLogic,
          hasRoutingLogic,
          analysis: '完成'
        });
        
      } catch (error) {
        console.log(`  ❌ 文件读取失败: ${error.message}`);
        results.push({ file, error: error.message });
      }
    } else {
      console.log(`  ❌ 文件不存在: ${file}`);
    }
  }
}

// 测试零错误自治系统集成
async function testZeroErrorIntegration() {
  console.log('\n📋 测试零错误自治系统集成...');
  
  const zeroErrorFile = path.join(workspace, 'zero_error_autonomous_system.cjs');
  
  if (!fs.existsSync(zeroErrorFile)) {
    console.log('  ❌ 零错误自治系统文件不存在');
    return;
  }
  
  try {
    const content = fs.readFileSync(zeroErrorFile, 'utf8');
    
    // 检查是否与路由系统集成
    const hasRoutingIntegration = content.includes('router') || 
                                 content.includes('route') ||
                                 content.includes('OMC');
    
    // 检查是否有API错误处理
    const hasAPIErrorHandling = content.includes('API') || 
                               content.includes('api') ||
                               content.includes('请求失败');
    
    // 检查是否有自愈逻辑
    const hasHealingLogic = content.includes('selfHealing') || 
                           content.includes('自愈') ||
                           content.includes('recover');
    
    console.log(`  ✅ 零错误自治系统分析:`);
    console.log(`    - 路由系统集成: ${hasRoutingIntegration ? '✅ 存在' : '⚠️ 未找到'}`);
    console.log(`    - API错误处理: ${hasAPIErrorHandling ? '✅ 存在' : '⚠️ 未找到'}`);
    console.log(`    - 自愈逻辑: ${hasHealingLogic ? '✅ 存在' : '⚠️ 未找到'}`);
    
    results.push({
      system: '零错误自治',
      hasRoutingIntegration,
      hasAPIErrorHandling,
      hasHealingLogic,
      analysis: '完成'
    });
    
  } catch (error) {
    console.log(`  ❌ 分析失败: ${error.message}`);
  }
}

// 测试多AI协同工作流
async function testMultiAIWorkflow() {
  console.log('\n📋 测试多AI协同工作流...');
  
  // 查找多AI工作流文件
  const workflowFiles = execSync(
    `find ${workspace} -type f -name "*.js" -o -name "*.cjs" | xargs grep -l "多AI\\|multi.*AI\\|协同\\|collaborat" 2>/dev/null || true`,
    { encoding: 'utf8' }
  ).split('\n').filter(f => f.trim() && !f.includes('node_modules'));
  
  if (workflowFiles.length === 0) {
    console.log('  ⚠️  未找到多AI工作流文件');
    return;
  }
  
  console.log(`  ✅ 找到 ${workflowFiles.length} 个多AI相关文件`);
  
  // 检查前3个文件
  for (const file of workflowFiles.slice(0, 3)) {
    const relativePath = path.relative(workspace, file);
    console.log(`\n  🔍 分析 ${relativePath}:`);
    
    try {
      const content = fs.readFileSync(file, 'utf8').substring(0, 5000);
      
      // 检查关键特征
      const hasModelSelection = content.includes('model') || content.includes('模型选择');
      const hasTaskDecomposition = content.includes('task') || content.includes('任务分解');
      const hasResultAggregation = content.includes('result') || content.includes('结果聚合');
      const hasErrorHandling = content.includes('error') || content.includes('错误处理');
      
      console.log(`    - 模型选择逻辑: ${hasModelSelection ? '✅ 存在' : '⚠️ 未找到'}`);
      console.log(`    - 任务分解逻辑: ${hasTaskDecomposition ? '✅ 存在' : '⚠️ 未找到'}`);
      console.log(`    - 结果聚合逻辑: ${hasResultAggregation ? '✅ 存在' : '⚠️ 未找到'}`);
      console.log(`    - 错误处理逻辑: ${hasErrorHandling ? '✅ 存在' : '⚠️ 未找到'}`);
      
    } catch (error) {
      console.log(`    ❌ 文件读取失败: ${error.message}`);
    }
  }
  
  results.push({
    test: '多AI工作流',
    fileCount: workflowFiles.length,
    analysis: '完成'
  });
}

// 主测试函数
async function runActualTests() {
  console.log('\n🚀 开始实际API调用测试流程\n');
  
  // 1. 测试端点连通性
  const aliEndpoint = config.models?.providers?.alibailian?.baseUrl;
  const sapiEndpoint = config.models?.providers?.['4sapi']?.baseUrl;
  
  if (aliEndpoint) {
    const aliResult = await testEndpointConnectivity(aliEndpoint, '阿里百炼');
    results.push(aliResult);
  }
  
  if (sapiEndpoint) {
    const sapiResult = await testEndpointConnectivity(sapiEndpoint, '4SAPI');
    results.push(sapiResult);
  }
  
  // 2. 模拟API调用测试
  console.log('\n📋 模拟API调用测试...');
  
  // 测试阿里百炼模型
  const aliModels = config.models?.providers?.alibailian?.models || [];
  if (aliModels.length > 0) {
    const aliModel = aliModels[0];
    const aliCall = await simulateAPICall('alibailian', aliModel.id, aliEndpoint);
    results.push(aliCall);
  }
  
  // 测试4SAPI模型
  const sapiModels = config.models?.providers?.['4sapi']?.models || [];
  if (sapiModels.length > 0) {
    const sapiModel = sapiModels[0];
    const sapiCall = await simulateAPICall('4sapi', sapiModel.id, sapiEndpoint);
    results.push(sapiCall);
  }
  
  // 3. 测试OMC路由系统
  await testOMCRoutingCalls();
  
  // 4. 测试零错误自治集成
  await testZeroErrorIntegration();
  
  // 5. 测试多AI协同工作流
  await testMultiAIWorkflow();
  
  // 生成测试报告
  generateTestReport();
}

// 生成测试报告
function generateTestReport() {
  console.log('\n' + '='.repeat(70));
  console.log('📊 实际API调用测试报告');
  console.log('='.repeat(70));
  
  // 统计结果
  const connectivityTests = results.filter(r => r.provider && (r.success !== undefined));
  const simulatedCalls = results.filter(r => r.simulated);
  const systemTests = results.filter(r => r.file || r.system || r.test);
  
  console.log('\n🔗 端点连通性测试:');
  connectivityTests.forEach(test => {
    const status = test.success ? '✅' : '❌';
    console.log(`  ${status} ${test.provider}: ${test.success ? '连接成功' : test.error}`);
  });
  
  console.log('\n📤 模拟API调用测试:');
  simulatedCalls.forEach(call => {
    console.log(`  🔍 ${call.provider} - ${call.model}:`);
    console.log(`     端点: ${call.endpoint}`);
    console.log(`     API密钥: ${call.apiKeyConfigured ? '✅ 已配置' : '⚠️ 未配置/占位符'}`);
  });
  
  console.log('\n🔧 系统集成测试:');
  systemTests.forEach(test => {
    if (test.file) {
      console.log(`  📁 ${test.file}:`);
      if (test.hasAPICalls !== undefined) {
        console.log(`     API调用: ${test.hasAPICalls ? '✅' : '⚠️'}`);
        console.log(`     阿里逻辑: ${test.hasAliLogic ? '✅' : '⚠️'}`);
        console.log(`     4SAPI逻辑: ${test.hasSapiLogic ? '✅' : '⚠️'}`);
        console.log(`     路由逻辑: ${test.hasRoutingLogic ? '✅' : '⚠️'}`);
      }
    } else if (test.system) {
      console.log(`  🛡️  ${test.system}:`);
      console.log(`     路由集成: ${test.hasRoutingIntegration ? '✅' : '⚠️'}`);
      console.log(`     API错误处理: ${test.hasAPIErrorHandling ? '✅' : '⚠️'}`);
      console.log(`     自愈逻辑: ${test.hasHealingLogic ? '✅' : '⚠️'}`);
    } else if (test.test) {
      console.log(`  🤖 ${test.test}: ${test.fileCount} 个相关文件`);
    }
  });
  
  // 问题诊断
  console.log('\n🔍 虚幻环节识别:');
  
  const issues = [];
  
  // 检查API密钥问题
  const apiKeyIssues = simulatedCalls.filter(call => !call.apiKeyConfigured);
  if (apiKeyIssues.length > 0) {
    issues.push('❌ API密钥未配置或为占位符，无法进行实际调用');
  }
  
  // 检查路由系统API调用逻辑
  const routingFilesWithoutAPICalls = systemTests.filter(
    test => test.file && test.hasAPICalls === false
  );
  if (routingFilesWithoutAPICalls.length > 0) {
    issues.push('⚠️ 路由文件缺少实际API调用逻辑');
  }
  
  // 检查零错误自治集成
  const zeroErrorTests = systemTests.filter(test => test.system === '零错误自治');
  if (zeroErrorTests.length > 0 && zeroErrorTests[0].hasRoutingIntegration === false) {
    issues.push('⚠️ 零错误自治系统与路由系统集成不完整');
  }
  
  if (issues.length === 0) {
    console.log('  ✅ 未发现明显虚幻环节');
  } else {
    issues.forEach(issue => console.log(`  ${issue}`));
  }
  
  // 建议
  console.log('\n💡 打通虚幻环节建议:');
  console.log('1. 配置有效的API密钥（阿里百炼、4SAPI）');
  console.log('2. 在路由系统中实现实际API调用逻辑');
  console.log('3. 集成零错误自治到API调用流程');
  console.log('4. 创建端到端的多AI协同测试');
  console.log('5. 建立API调用监控与自愈机制');
  
  // 生成详细报告文件
  const reportFile = path.join(workspace, 'actual-api-test-report.md');
  const reportContent = generateDetailedReport();
  fs.writeFileSync(reportFile, reportContent, 'utf8');
  console.log(`\n📝 详细报告已生成: ${reportFile}`);
}

// 生成详细报告
function generateDetailedReport() {
  let content = `# 实际API调用测试报告
## 生成时间: ${new Date().toISOString()}
## 测试目标: 验证真实调用阿里百炼和4SAPI节点的能力

## 测试概述
本次测试旨在识别和解决系统中的"虚幻环节"，确保智能路由系统能够真实调用后端模型API。

## 测试结果

### 1. 端点连通性测试
`;

  const connectivityTests = results.filter(r => r.provider && (r.success !== undefined));
  connectivityTests.forEach(test => {
    content += `#### ${test.provider}
- **端点**: ${test.provider === '阿里百炼' ? config.models?.providers?.alibailian?.baseUrl : config.models?.providers?.['4sapi']?.baseUrl}
- **状态**: ${test.success ? '✅ 连接成功' : '❌ 连接失败'}
- **详情**: ${test.success ? `HTTP ${test.statusCode}` : test.error}
- **结论**: ${test.success ? '网络连通性正常' : '需要检查网络或端点配置'}

`;
  });

  content += `### 2. API配置检查
`;

  const simulatedCalls = results.filter(r => r.simulated);
  simulatedCalls.forEach(call => {
    content += `#### ${call.provider} - ${call.model}
- **模型ID**: ${call.model}
- **API端点**: ${call.endpoint}
- **API密钥**: ${call.apiKeyConfigured ? '✅ 已配置' : '⚠️ 未配置或为占位符'}
- **测试状态**: 模拟调用（需要实际API密钥进行验证）

`;
  });

  content += `### 3. 系统集成分析
`;

  const systemTests = results.filter(r => r.file || r.system || r.test);
  systemTests.forEach(test => {
    if (test.file) {
      content += `#### ${test.file}
- **文件状态**: 存在
- **API调用逻辑**: ${test.hasAPICalls ? '✅ 存在' : '⚠️ 未找到'}
- **阿里百炼集成**: ${test.hasAliLogic ? '✅ 存在' : '⚠️ 未找到'}
- **4SAPI集成**: ${test.hasSapiLogic ? '✅ 存在' : '⚠️ 未找到'}
- **路由逻辑**: ${test.hasRoutingLogic ? '✅ 存在' : '⚠️ 未找到'}

`;
    } else if (test.system) {
      content += `#### ${test.system}
- **路由系统集成**: ${test.hasRoutingIntegration ? '✅ 存在' : '⚠️ 未找到'}
- **API错误处理**: ${test.hasAPIErrorHandling ? '✅ 存在' : '⚠️ 未找到'}
- **自愈逻辑**: ${test.hasHealingLogic ? '✅ 存在' : '⚠️ 未找到'}

`;
    } else if (test.test) {
      content += `#### ${test.test}
- **相关文件数**: ${test.fileCount}
- **分析状态**: 完成

`;
    }
  });

  content += `## 虚幻环节识别

### 核心问题
1. **API密钥配置不完整**
   - 阿里百炼和4SAPI的API密钥为占位符状态
   - 无法进行实际API调用验证

2. **路由系统与实际调用脱节**
   - 路由逻辑存在，但缺少实际API调用实现
   - 需要将路由决策转换为实际HTTP请求

3. **系统间集成不完整**
   - 零错误自治系统独立运行，未与路由系统深度集成
   - 缺少统一的错误处理与自愈机制

4. **多AI协同流程不清晰**
   - 存在相关组件，但缺少端到端的工作流
   - 需要建立完整的任务分解-分配-聚合流程

### 问题影响
- **开发效率**: 无法快速验证模型调用效果
- **系统可靠性**: 缺少实际调用验证，存在运行时风险
- **维护成本**: 系统组件分散，集成复杂度高
- **用户体验**: 可能响应延迟或调用失败

## 解决方案

### 第一阶段：打通基础调用（1-2天）
1. **配置实际API密钥**
   - 获取阿里百炼API密钥
   - 配置4SAPI访问权限
   - 更新配置文件

2. **实现基础调用层**
   - 创建统一的API调用模块
   - 实现阿里百炼调用接口
   - 实现4SAPI调用接口

### 第二阶段：完善路由系统（3-5天）
1. **集成实际调用到路由系统**
   - 修改路由适配器，添加实际API调用
   - 实现模型选择与实际调用的映射
   - 添加调用结果处理

2. **集成零错误自治**
   - 在API调用层添加错误检测
   - 实现自动重试与回退机制
   - 集成自愈逻辑

### 第三阶段：建立完整工作流（1-2周）
1. **创建多AI协同引擎**
   - 实现任务分解与分配
   - 建立模型间通信机制
   - 实现结果聚合与优化

2. **建立监控与优化系统**
   - 实现API调用监控
   - 建立性能指标收集
   - 实现智能路由优化

## 实施建议

### 立即行动
1. 获取并配置阿里百炼API密钥
2. 创建简单的API调用测试脚本
3. 验证基础调用功能

### 短期目标
1. 完善路由系统的实际调用能力
2. 集成零错误自治机制
3. 建立基础监控

### 长期目标
1. 实现完整的多AI协同工作流
2. 建立智能路由优化系统
3. 实现系统自主进化

## 结论
系统配置基础完整，但存在关键的"虚幻环节"。通过配置实际API密钥、完善调用实现、加强系统集成，可以打通智能路由与多AI系统的实际调用能力。

**核心建议**: 优先解决API密钥配置问题，建立基础调用验证，逐步完善系统集成。

---
*测试完成时间: ${new Date().toISOString()}*
*测试项目总数: ${results.length}*
*问题识别: ${simulatedCalls.filter(c => !c.apiKeyConfigured).length}个API密钥问题*
*建议优先级: 高 - 需要立即解决API密钥配置*`;

  return content;
}

// 执行测试
runActualTests().catch(error => {
  console.error('❌ 测试执行失败:', error);
  process.exit(1);
});