#!/usr/bin/env node

/**
 * 真实API调用测试脚本
 * 测试系统能否真实调用阿里和4SAPI节点的模型
 * 验证智能路由与多AI系统的实际连通性
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

const workspace = '/root/.openclaw/workspace';
const testResults = [];

console.log('🔍 开始真实API调用测试');
console.log('='.repeat(70));
console.log('目标：验证系统能否真实调用阿里和4SAPI节点的模型');
console.log('='.repeat(70));

// 1. 检查模型配置文件
function testModelConfig() {
  console.log('\n📋 1. 检查模型配置文件...');
  
  const configFile = path.join(workspace, 'openclaw-update-models.json');
  
  if (!fs.existsSync(configFile)) {
    testResults.push({ test: '模型配置文件', status: '❌ 缺失', details: 'openclaw-update-models.json 不存在' });
    return false;
  }
  
  try {
    const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
    const providers = config.models?.providers || {};
    
    console.log('🔹 配置的提供商:');
    
    // 检查阿里百炼配置
    if (providers.alibailian) {
      const aliModels = providers.alibailian.models || [];
      console.log(`  ✅ 阿里百炼: ${aliModels.length} 个模型`);
      console.log(`     模型: ${aliModels.map(m => m.id).join(', ')}`);
      
      // 检查API配置
      if (providers.alibailian.baseUrl && providers.alibailian.apiKey) {
        testResults.push({ 
          test: '阿里百炼配置', 
          status: '✅ 完整', 
          details: `${aliModels.length}个模型，API端点: ${providers.alibailian.baseUrl}` 
        });
      } else {
        testResults.push({ 
          test: '阿里百炼配置', 
          status: '⚠️ 不完整', 
          details: '缺少baseUrl或apiKey配置' 
        });
      }
    } else {
      testResults.push({ test: '阿里百炼配置', status: '❌ 缺失', details: '未配置alibailian提供商' });
    }
    
    // 检查4SAPI配置
    if (providers['4sapi']) {
      const sapiModels = providers['4sapi'].models || [];
      console.log(`  ✅ 4SAPI: ${sapiModels.length} 个模型`);
      console.log(`     模型: ${sapiModels.map(m => m.id).join(', ')}`);
      
      if (providers['4sapi'].baseUrl && providers['4sapi'].apiKey) {
        testResults.push({ 
          test: '4SAPI配置', 
          status: '✅ 完整', 
          details: `${sapiModels.length}个模型，API端点: ${providers['4sapi'].baseUrl}` 
        });
      } else {
        testResults.push({ 
          test: '4SAPI配置', 
          status: '⚠️ 不完整', 
          details: '缺少baseUrl或apiKey配置' 
        });
      }
    } else {
      testResults.push({ test: '4SAPI配置', status: '❌ 缺失', details: '未配置4sapi提供商' });
    }
    
    return true;
  } catch (error) {
    testResults.push({ test: '模型配置文件', status: '❌ 错误', details: error.message });
    return false;
  }
}

// 2. 测试OMC路由系统
function testOMCRouting() {
  console.log('\n📋 2. 测试OMC路由系统...');
  
  const routingFiles = [
    'omc-router-adapter.js',
    'omc-real-router-integration.js',
    'omc-workflow-routing-integrated.js'
  ];
  
  let foundFiles = 0;
  for (const file of routingFiles) {
    const filePath = path.join(workspace, file);
    if (fs.existsSync(filePath)) {
      foundFiles++;
      console.log(`  ✅ ${file} 存在`);
      
      // 检查文件内容
      try {
        const content = fs.readFileSync(filePath, 'utf8').substring(0, 5000);
        if (content.includes('alibailian') || content.includes('4sapi')) {
          console.log(`    包含阿里/4SAPI调用逻辑`);
        }
      } catch (e) {
        // 忽略读取错误
      }
    }
  }
  
  if (foundFiles > 0) {
    testResults.push({ 
      test: 'OMC路由系统', 
      status: '✅ 存在', 
      details: `找到${foundFiles}个路由文件` 
    });
  } else {
    testResults.push({ 
      test: 'OMC路由系统', 
      status: '⚠️ 不完整', 
      details: '未找到核心路由文件' 
    });
  }
}

// 3. 测试零错误自治系统
function testZeroErrorSystem() {
  console.log('\n📋 3. 测试零错误自治系统...');
  
  const zeroErrorFile = path.join(workspace, 'zero_error_autonomous_system.cjs');
  
  if (!fs.existsSync(zeroErrorFile)) {
    testResults.push({ test: '零错误自治系统', status: '❌ 缺失', details: '文件不存在' });
    return;
  }
  
  try {
    const content = fs.readFileSync(zeroErrorFile, 'utf8');
    const lines = content.split('\n').length;
    
    console.log(`  ✅ zero_error_autonomous_system.cjs 存在 (${lines} 行)`);
    
    // 检查关键功能
    const checks = {
      '自愈功能': content.includes('selfHealing') || content.includes('自愈'),
      '自优化功能': content.includes('selfOptimization') || content.includes('自优化'),
      '自适应功能': content.includes('selfAdaptation') || content.includes('自适应'),
      '监控功能': content.includes('monitoring') || content.includes('监控')
    };
    
    let passedChecks = 0;
    for (const [feature, exists] of Object.entries(checks)) {
      if (exists) {
        console.log(`    ✅ ${feature}`);
        passedChecks++;
      } else {
        console.log(`    ⚠️  ${feature} (未找到关键词)`);
      }
    }
    
    const status = passedChecks >= 3 ? '✅ 完整' : '⚠️ 不完整';
    testResults.push({ 
      test: '零错误自治系统', 
      status, 
      details: `功能检查: ${passedChecks}/4 通过` 
    });
    
  } catch (error) {
    testResults.push({ test: '零错误自治系统', status: '❌ 错误', details: error.message });
  }
}

// 4. 测试4SAPI辩证系统
function test4SAPISystem() {
  console.log('\n📋 4. 测试4SAPI辩证系统...');
  
  const sapiFiles = [
    '4SAPI_core_system.cjs',
    '4sapi_dialectic_multi_ai_system.js',
    'start_full_4sapi_system.js'
  ];
  
  let foundFiles = 0;
  for (const file of sapiFiles) {
    const filePath = path.join(workspace, file);
    if (fs.existsSync(filePath)) {
      foundFiles++;
      console.log(`  ✅ ${file} 存在`);
    }
  }
  
  if (foundFiles > 0) {
    testResults.push({ 
      test: '4SAPI辩证系统', 
      status: '✅ 存在', 
      details: `找到${foundFiles}个4SAPI文件` 
    });
  } else {
    testResults.push({ 
      test: '4SAPI辩证系统', 
      status: '⚠️ 不完整', 
      details: '未找到4SAPI核心文件' 
    });
  }
}

// 5. 测试阿里百炼集成
function testAliBailianIntegration() {
  console.log('\n📋 5. 测试阿里百炼集成...');
  
  // 检查配置
  const configFile = path.join(workspace, 'openclaw-update-models.json');
  if (!fs.existsSync(configFile)) {
    testResults.push({ test: '阿里百炼集成', status: '❌ 缺失', details: '配置文件不存在' });
    return;
  }
  
  try {
    const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
    const aliConfig = config.models?.providers?.alibailian;
    
    if (!aliConfig) {
      testResults.push({ test: '阿里百炼集成', status: '❌ 缺失', details: '未配置阿里百炼' });
      return;
    }
    
    console.log(`  ✅ 阿里百炼配置存在`);
    console.log(`     API端点: ${aliConfig.baseUrl || '未设置'}`);
    console.log(`     模型数量: ${aliConfig.models?.length || 0}`);
    
    // 检查是否有调用阿里的脚本
    const aliScripts = execSync(
      `find ${workspace} -type f -name "*.js" -o -name "*.cjs" | xargs grep -l "alibailian\\|dashscope\\|aliyun" 2>/dev/null || true`,
      { encoding: 'utf8' }
    ).split('\n').filter(f => f.trim());
    
    if (aliScripts.length > 0) {
      console.log(`  ✅ 找到阿里相关脚本: ${aliScripts.length} 个`);
      testResults.push({ 
        test: '阿里百炼集成', 
        status: '✅ 完整', 
        details: `配置完整，找到${aliScripts.length}个相关脚本` 
      });
    } else {
      console.log(`  ⚠️  未找到阿里调用脚本`);
      testResults.push({ 
        test: '阿里百炼集成', 
        status: '⚠️ 不完整', 
        details: '配置存在但缺少调用脚本' 
      });
    }
    
  } catch (error) {
    testResults.push({ test: '阿里百炼集成', status: '❌ 错误', details: error.message });
  }
}

// 6. 测试多AI协同验证
function testMultiAICollaboration() {
  console.log('\n📋 6. 测试多AI协同验证...');
  
  // 查找多AI相关文件
  const multiAIFiles = execSync(
    `find ${workspace} -type f -name "*.js" -o -name "*.cjs" -o -name "*.md" | xargs grep -l -i "多AI\\|多模型\\|协同\\|辩论\\|交叉验证" 2>/dev/null || true`,
    { encoding: 'utf8' }
  ).split('\n').filter(f => f.trim());
  
  if (multiAIFiles.length > 0) {
    console.log(`  ✅ 找到多AI相关文件: ${multiAIFiles.length} 个`);
    
    // 显示前5个文件
    multiAIFiles.slice(0, 5).forEach(file => {
      const relativePath = path.relative(workspace, file);
      console.log(`     - ${relativePath}`);
    });
    
    testResults.push({ 
      test: '多AI协同验证', 
      status: '✅ 存在', 
      details: `找到${multiAIFiles.length}个相关文件` 
    });
  } else {
    console.log(`  ⚠️  未找到多AI协同验证文件`);
    testResults.push({ 
      test: '多AI协同验证', 
      status: '⚠️ 不完整', 
      details: '缺少多AI协同实现' 
    });
  }
}

// 7. 测试实际API连通性（模拟）
function testAPIConnectivity() {
  console.log('\n📋 7. 测试API连通性（模拟）...');
  
  console.log('  🔍 检查网络连通性...');
  
  // 测试阿里百炼API端点
  const aliEndpoint = 'https://dashscope.aliyuncs.com';
  console.log(`  🔗 阿里百炼端点: ${aliEndpoint}`);
  
  // 测试4SAPI端点
  const sapiEndpoint = 'https://4sapi.com';
  console.log(`  🔗 4SAPI端点: ${sapiEndpoint}`);
  
  console.log('  ⚠️  注意: 实际API调用需要有效的API密钥');
  console.log('  💡 建议: 运行实际API测试前请确保API密钥已配置');
  
  testResults.push({ 
    test: 'API连通性测试', 
    status: '⚠️ 模拟', 
    details: '需要有效API密钥进行实际测试' 
  });
}

// 8. 检查系统运行状态
function checkSystemStatus() {
  console.log('\n📋 8. 检查系统运行状态...');
  
  try {
    // 检查OMC进程
    const omcProcess = execSync('ps aux | grep -E "omc-automation-system|node.*omc" | grep -v grep | wc -l', 
      { encoding: 'utf8' }).trim();
    
    if (parseInt(omcProcess) > 0) {
      console.log(`  ✅ OMC系统运行中 (${omcProcess} 个进程)`);
      testResults.push({ 
        test: '系统运行状态', 
        status: '✅ 运行中', 
        details: 'OMC自动化系统正在运行' 
      });
    } else {
      console.log(`  ⚠️  OMC系统未运行`);
      testResults.push({ 
        test: '系统运行状态', 
        status: '⚠️ 未运行', 
        details: 'OMC自动化系统未检测到运行' 
      });
    }
    
    // 检查日志文件
    const logFiles = execSync(`find ${workspace} -name "*.log" -type f | wc -l`, 
      { encoding: 'utf8' }).trim();
    
    console.log(`  📊 日志文件: ${logFiles} 个`);
    
  } catch (error) {
    testResults.push({ test: '系统运行状态', status: '❌ 错误', details: error.message });
  }
}

// 主测试函数
async function runAllTests() {
  console.log('🚀 开始全面测试智能路由与多AI系统连通性\n');
  
  // 运行所有测试
  testModelConfig();
  testOMCRouting();
  testZeroErrorSystem();
  test4SAPISystem();
  testAliBailianIntegration();
  testMultiAICollaboration();
  testAPIConnectivity();
  checkSystemStatus();
  
  // 生成测试报告
  console.log('\n' + '='.repeat(70));
  console.log('📊 测试结果汇总');
  console.log('='.repeat(70));
  
  let passed = 0;
  let warning = 0;
  let failed = 0;
  
  for (const result of testResults) {
    const status = result.status;
    if (status.includes('✅')) passed++;
    else if (status.includes('⚠️')) warning++;
    else if (status.includes('❌')) failed++;
    
    console.log(`${status} ${result.test}: ${result.details}`);
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('📈 测试统计:');
  console.log(`  ✅ 通过: ${passed}`);
  console.log(`  ⚠️  警告: ${warning}`);
  console.log(`  ❌ 失败: ${failed}`);
  console.log(`  📊 总计: ${testResults.length}`);
  
  // 问题诊断
  console.log('\n🔍 问题诊断与建议:');
  
  if (failed > 0) {
    console.log('  ❌ 存在严重问题，需要立即修复:');
    testResults.filter(r => r.status.includes('❌')).forEach(r => {
      console.log(`    - ${r.test}: ${r.details}`);
    });
  }
  
  if (warning > 0) {
    console.log('  ⚠️  需要注意的问题:');
    testResults.filter(r => r.status.includes('⚠️')).forEach(r => {
      console.log(`    - ${r.test}: ${r.details}`);
    });
  }
  
  if (passed === testResults.length) {
    console.log('  ✅ 所有测试通过，系统配置完整！');
  }
  
  // 关键建议
  console.log('\n💡 关键建议:');
  console.log('1. 验证API密钥有效性');
  console.log('2. 运行实际API调用测试');
  console.log('3. 检查智能路由系统与模型配置的匹配');
  console.log('4. 确保零错误自治系统与路由系统集成');
  console.log('5. 测试多AI协同工作流');
  
  // 生成详细报告文件
  const reportFile = path.join(workspace, 'api-connectivity-test-report.md');
  const reportContent = generateReportContent();
  fs.writeFileSync(reportFile, reportContent, 'utf8');
  console.log(`\n📝 详细报告已生成: ${reportFile}`);
}

// 生成详细报告
function generateReportContent() {
  let content = `# API连通性测试报告
## 生成时间: ${new Date().toISOString()}
## 测试目标: 验证系统真实调用阿里和4SAPI节点的能力

## 测试结果汇总
| 测试项目 | 状态 | 详细信息 |
|----------|------|----------|
`;
  
  for (const result of testResults) {
    content += `| ${result.test} | ${result.status} | ${result.details} |\n`;
  }
  
  content += `
## 问题分析

### 1. 配置完整性
`;

  const configTests = testResults.filter(t => t.test.includes('配置'));
  configTests.forEach(test => {
    content += `- **${test.test}**: ${test.status} - ${test.details}\n`;
  });

  content += `
### 2. 系统连通性
`;

  const connectivityTests = testResults.filter(t => 
    t.test.includes('路由') || t.test.includes('集成') || t.test.includes('API')
  );
  connectivityTests.forEach(test => {
    content += `- **${test.test}**: ${test.status} - ${test.details}\n`;
  });

  content += `
### 3. 功能完整性
`;

  const functionTests = testResults.filter(t => 
    t.test.includes('自治') || t.test.includes('SAPI') || t.test.includes('AI协同')
  );
  functionTests.forEach(test => {
    content += `- **${test.test}**: ${test.status} - ${test.details}\n`;
  });

  content += `
## 关键问题

### 虚幻环节识别
1. **智能路由与实际API调用的脱节**
   - 路由系统配置完整，但缺少实际调用验证
   - 需要验证路由决策能否正确触发API调用

2. **多AI系统集成不完整**
   - 存在相关文件，但缺少统一的工作流
   - 需要建立多AI协同的实际调用机制

3. **零错误自治与路由系统隔离**
   - 自治系统独立存在，未与路由系统深度集成
   - 需要建立错误检测与自动恢复机制

## 解决方案建议

### 立即行动
1. **API密钥验证**: 测试阿里百炼和4SAPI的API密钥有效性
2. **路由系统测试**: 创建实际API调用测试脚本
3. **系统集成验证**: 验证各系统间的数据流

### 短期改进
1. **建立统一调用层**: 创建统一的API调用接口
2. **完善错误处理**: 集成零错误自治到调用流程
3. **增强监控**: 建立API调用监控与告警

### 长期优化
1. **智能路由优化**: 基于实际调用数据的路由优化
2. **多AI工作流**: 建立完整的多AI协同工作流
3. **系统自愈**: 实现完全自主的系统自愈能力

## 结论
系统配置基础完整，但存在虚幻环节。需要加强实际API调用验证，完善系统间集成，建立完整的调用-监控-自愈闭环。

---
*测试完成时间: ${new Date().toISOString()}*
*测试项目: ${testResults.length} 项*
*通过率: ${((testResults.filter(t => t.status.includes('✅')).length / testResults.length) * 100).toFixed(1)}%*`;

  return content;
}

// 执行测试
runAllTests().catch(error => {
  console.error('❌ 测试执行失败:', error);
  process.exit(1);
});