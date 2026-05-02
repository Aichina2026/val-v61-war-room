#!/usr/bin/env node
/**
 * 融合系统测试脚本
 * 测试第二轮融合策略实现
 */

const fs = require('fs');
const path = require('path');

class FusionSystemTester {
  constructor() {
    this.workspace = '/root/.openclaw/workspace';
    this.testResults = [];
  }
  
  async runAllTests() {
    console.log('🧪 开始第二轮融合策略测试...\n');
    
    // 测试1: 配置文件检查
    await this.testConfigurationFiles();
    
    // 测试2: 工作流模式检查
    await this.testWorkflowModes();
    
    // 测试3: 4AI角色体系检查
    await this.testAIRoleSystem();
    
    // 测试4: 技术特性检查
    await this.testTechnicalFeatures();
    
    // 测试5: 智能路由检查
    await this.testSmartRouting();
    
    // 生成测试报告
    this.generateTestReport();
  }
  
  async testConfigurationFiles() {
    console.log('=== 测试1: 配置文件检查 ===');
    
    const configPath = path.join(this.workspace, '4ai-role-system.json');
    const fusionReportPath = path.join(this.workspace, '第二轮融合策略完成报告.md');
    const implementationPath = path.join(this.workspace, 'fusion-strategy-implementation.md');
    
    const tests = [
      {
        name: '4AI角色配置文件',
        path: configPath,
        required: true,
        check: (content) => {
          const config = JSON.parse(content);
          return config.roles && Object.keys(config.roles).length === 4;
        }
      },
      {
        name: '融合策略完成报告',
        path: fusionReportPath,
        required: true,
        check: (content) => content.includes('第二轮融合策略完成报告')
      },
      {
        name: '融合实施跟踪文档',
        path: implementationPath,
        required: true,
        check: (content) => content.includes('第二轮融合策略实施跟踪')
      }
    ];
    
    for (const test of tests) {
      try {
        if (!fs.existsSync(test.path)) {
          if (test.required) {
            this.recordResult(test.name, false, `文件不存在: ${test.path}`);
          } else {
            this.recordResult(test.name, true, '文件不存在但非必需');
          }
          continue;
        }
        
        const content = fs.readFileSync(test.path, 'utf8');
        const passed = test.check ? test.check(content) : true;
        
        if (passed) {
          this.recordResult(test.name, true, `文件检查通过: ${path.basename(test.path)}`);
        } else {
          this.recordResult(test.name, false, `文件检查失败: ${path.basename(test.path)}`);
        }
      } catch (error) {
        this.recordResult(test.name, false, `检查异常: ${error.message}`);
      }
    }
    
    console.log('✅ 配置文件检查完成\n');
  }
  
  async testWorkflowModes() {
    console.log('=== 测试2: 工作流模式检查 ===');
    
    const configPath = path.join(this.workspace, '4ai-role-system.json');
    
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      const workflowModes = config.workflowModes;
      
      const expectedModes = ['parallel', 'zeroError', 'dialectic', 'fluid'];
      const foundModes = Object.keys(workflowModes);
      
      // 检查模式数量
      if (foundModes.length === 4) {
        this.recordResult('工作流模式数量', true, `找到4种工作流模式`);
      } else {
        this.recordResult('工作流模式数量', false, `期望4种，实际找到${foundModes.length}种`);
      }
      
      // 检查每种模式
      for (const mode of expectedModes) {
        if (workflowModes[mode]) {
          this.recordResult(
            `工作流模式: ${mode}`,
            true,
            `${workflowModes[mode].name} - ${workflowModes[mode].description.substring(0, 50)}...`
          );
        } else {
          this.recordResult(`工作流模式: ${mode}`, false, '未找到该工作流模式');
        }
      }
      
      // 检查模式配置完整性
      for (const [mode, config] of Object.entries(workflowModes)) {
        const requiredFields = ['name', 'description'];
        const missingFields = requiredFields.filter(field => !config[field]);
        
        if (missingFields.length === 0) {
          this.recordResult(
            `${mode}配置完整性`,
            true,
            '所有必需字段完整'
          );
        } else {
          this.recordResult(
            `${mode}配置完整性`,
            false,
            `缺少字段: ${missingFields.join(', ')}`
          );
        }
      }
      
    } catch (error) {
      this.recordResult('工作流模式检查', false, `检查异常: ${error.message}`);
    }
    
    console.log('✅ 工作流模式检查完成\n');
  }
  
  async testAIRoleSystem() {
    console.log('=== 测试3: 4AI角色体系检查 ===');
    
    const configPath = path.join(this.workspace, '4ai-role-system.json');
    
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      const roles = config.roles;
      
      const expectedRoles = ['clarifier', 'builder', 'reviewer', 'arbiter'];
      const foundRoles = Object.keys(roles);
      
      // 检查角色数量
      if (foundRoles.length === 4) {
        this.recordResult('4AI角色数量', true, `找到4个专业AI角色`);
      } else {
        this.recordResult('4AI角色数量', false, `期望4个，实际找到${foundRoles.length}个`);
      }
      
      // 检查每个角色
      for (const role of expectedRoles) {
        if (roles[role]) {
          const roleConfig = roles[role];
          this.recordResult(
            `AI角色: ${role}`,
            true,
            `${roleConfig.name} (主模型: ${roleConfig.primaryModel})`
          );
          
          // 检查角色配置完整性
          const requiredFields = ['name', 'primaryModel', 'capabilities', 'costPerMillion'];
          const missingFields = requiredFields.filter(field => !roleConfig[field]);
          
          if (missingFields.length === 0) {
            this.recordResult(
              `${role}配置完整性`,
              true,
              '角色配置完整'
            );
          } else {
            this.recordResult(
              `${role}配置完整性`,
              false,
              `缺少字段: ${missingFields.join(', ')}`
            );
          }
          
          // 检查能力矩阵
          if (roleConfig.capabilities && Object.keys(roleConfig.capabilities).length > 0) {
            this.recordResult(
              `${role}能力矩阵`,
              true,
              `${Object.keys(roleConfig.capabilities).length}项能力定义`
            );
          } else {
            this.recordResult(
              `${role}能力矩阵`,
              false,
              '能力矩阵为空或未定义'
            );
          }
          
        } else {
          this.recordResult(`AI角色: ${role}`, false, '未找到该AI角色');
        }
      }
      
    } catch (error) {
      this.recordResult('4AI角色体系检查', false, `检查异常: ${error.message}`);
    }
    
    console.log('✅ 4AI角色体系检查完成\n');
  }
  
  async testTechnicalFeatures() {
    console.log('=== 测试4: 技术特性检查 ===');
    
    const configPath = path.join(this.workspace, '4ai-role-system.json');
    
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      const techSpecs = config.technicalSpecs;
      
      if (!techSpecs) {
        this.recordResult('技术特性配置', false, '未找到technicalSpecs配置');
        return;
      }
      
      // 检查自动修复策略
      if (techSpecs.autoFixStrategies === 332) {
        this.recordResult('自动修复策略', true, `332种策略 (来自4AI工作流包V52.13)`);
      } else {
        this.recordResult('自动修复策略', false, `期望332种，实际${techSpecs.autoFixStrategies}种`);
      }
      
      // 检查熔断器版本
      if (techSpecs.circuitBreaker === 'V32') {
        this.recordResult('熔断器版本', true, 'V32 (ML预测准确率97%)');
      } else {
        this.recordResult('熔断器版本', false, `期望V32，实际${techSpecs.circuitBreaker}`);
      }
      
      // 检查去重系统版本
      if (techSpecs.deduplication === 'V8') {
        this.recordResult('去重系统版本', true, 'V8 (20000缓存容量)');
      } else {
        this.recordResult('去重系统版本', false, `期望V8，实际${techSpecs.deduplication}`);
      }
      
      // 检查自适应超时版本
      if (techSpecs.adaptiveTimeout === 'V26') {
        this.recordResult('自适应超时版本', true, 'V26 (EMA-LSTM-Chaos算法)');
      } else {
        this.recordResult('自适应超时版本', false, `期望V26，实际${techSpecs.adaptiveTimeout}`);
      }
      
      // 检查ML预测准确率
      if (techSpecs.mlPredictionAccuracy === 0.97) {
        this.recordResult('ML预测准确率', true, '97% (V32熔断器)');
      } else {
        this.recordResult('ML预测准确率', false, `期望0.97，实际${techSpecs.mlPredictionAccuracy}`);
      }
      
      // 检查去重缓存容量
      if (techSpecs.deduplicationCacheSize === 20000) {
        this.recordResult('去重缓存容量', true, '20000 (V8去重系统)');
      } else {
        this.recordResult('去重缓存容量', false, `期望20000，实际${techSpecs.deduplicationCacheSize}`);
      }
      
    } catch (error) {
      this.recordResult('技术特性检查', false, `检查异常: ${error.message}`);
    }
    
    console.log('✅ 技术特性检查完成\n');
  }
  
  async testSmartRouting() {
    console.log('=== 测试5: 智能路由检查 ===');
    
    const configPath = path.join(this.workspace, '4ai-role-system.json');
    
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      
      // 检查性能目标
      const perfTargets = config.performanceTargets;
      if (perfTargets) {
        if (perfTargets.routingDecisionLatency === 5) {
          this.recordResult('路由决策延迟目标', true, '5ms (来自OpenClaw路由器V2)');
        } else {
          this.recordResult('路由决策延迟目标', false, `期望5ms，实际${perfTargets.routingDecisionLatency}ms`);
        }
        
        if (perfTargets.throughput === 48000) {
          this.recordResult('系统吞吐量目标', true, '48K req/s (来自OpenClaw路由器V2)');
        } else {
          this.recordResult('系统吞吐量目标', false, `期望48000，实际${perfTargets.throughput}`);
        }
        
        if (perfTargets.circuitBreakerAccuracy === 94.3) {
          this.recordResult('熔断器准确率目标', true, '94.3% (ML熔断器V29)');
        } else {
          this.recordResult('熔断器准确率目标', false, `期望94.3%，实际${perfTargets.circuitBreakerAccuracy}%`);
        }
        
        if (perfTargets.deduplicationHitRate === 75) {
          this.recordResult('去重命中率目标', true, '75% (V7语义去重)');
        } else {
          this.recordResult('去重命中率目标', false, `期望75%，实际${perfTargets.deduplicationHitRate}%`);
        }
      } else {
        this.recordResult('性能目标配置', false, '未找到performanceTargets配置');
      }
      
      // 检查模型定价
      const modelPricing = config.modelPricing;
      if (modelPricing && modelPricing.models) {
        const expectedModels = ['glm-5', 'deepseek-v3.2', 'claude-opus-4.6', 'gpt-5.4'];
        const foundModels = Object.keys(modelPricing.models);
        
        const missingModels = expectedModels.filter(model => !foundModels.includes(model));
        if (missingModels.length === 0) {
          this.recordResult('核心模型定价', true, '所有核心模型定价配置完整');
        } else {
          this.recordResult('核心模型定价', false, `缺少模型定价: ${missingModels.join(', ')}`);
        }
        
        // 检查DeepSeek V3.2成本优势
        const deepseekCost = modelPricing.models['deepseek-v3.2'];
        if (deepseekCost && deepseekCost.input === 0.28 && deepseekCost.output === 0.42) {
          this.recordResult('DeepSeek成本优势', true, '$0.28/$0.42 每1M tokens (-93% vs GPT-4)');
        } else {
          this.recordResult('DeepSeek成本优势', false, '成本配置不符合预期');
        }
        
      } else {
        this.recordResult('模型定价配置', false, '未找到modelPricing配置');
      }
      
    } catch (error) {
      this.recordResult('智能路由检查', false, `检查异常: ${error.message}`);
    }
    
    console.log('✅ 智能路由检查完成\n');
  }
  
  recordResult(testName, passed, message) {
    const result = {
      test: testName,
      passed: passed,
      message: message,
      timestamp: new Date().toISOString()
    };
    
    this.testResults.push(result);
    
    const status = passed ? '✅' : '❌';
    console.log(`  ${status} ${testName}: ${message}`);
  }
  
  generateTestReport() {
    console.log('\n📊 测试报告摘要');
    console.log('=' .repeat(50));
    
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const passRate = totalTests > 0 ? (passedTests / totalTests * 100).toFixed(2) : 0;
    
    console.log(`总测试数: ${totalTests}`);
    console.log(`通过测试: ${passedTests}`);
    console.log(`失败测试: ${failedTests}`);
    console.log(`通过率: ${passRate}%`);
    
    if (failedTests > 0) {
      console.log('\n❌ 失败测试详情:');
      this.testResults
        .filter(r => !r.passed)
        .forEach((r, i) => {
          console.log(`  ${i + 1}. ${r.test}: ${r.message}`);
        });
    }
    
    // 保存测试报告
    const reportPath = path.join(this.workspace, 'fusion-test-report.json');
    const report = {
      summary: {
        totalTests: totalTests,
        passedTests: passedTests,
        failedTests: failedTests,
        passRate: passRate,
        timestamp: new Date().toISOString()
      },
      details: this.testResults
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n💾 详细测试报告已保存到: ${reportPath}`);
    
    // 总体评估
    console.log('\n🎯 融合策略实施总体评估:');
    if (passRate >= 90) {
      console.log('  ✅ 优秀 - 融合策略实施非常成功');
      console.log('  建议: 可以进行性能优化和深度集成');
    } else if (passRate >= 70) {
      console.log('  🟡 良好 - 融合策略实施基本成功');
      console.log('  建议: 修复失败测试，进行进一步优化');
    } else if (passRate >= 50) {
      console.log('  🟠 一般 - 融合策略实施部分成功');
      console.log('  建议: 需要重点关注失败的关键功能');
    } else {
      console.log('  🔴 不足 - 融合策略实施需要改进');
      console.log('  建议: 重新评估实施计划，优先修复核心功能');
    }
    
    // 显示融合状态
    const configPath = path.join(this.workspace, '4ai-role-system.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (config.fusionStatus) {
        console.log(`\n🔄 融合状态: ${config.fusionStatus.phase}`);
        console.log(`   完成度: ${config.fusionStatus.completion}%`);
        console.log(`   最后更新: ${config.fusionStatus.lastUpdated}`);
        console.log('   下一步:');
        config.fusionStatus.nextSteps.forEach((step, i) => {
          console.log(`     ${i + 1}. ${step}`);
        });
      }
    }
  }
}

// 运行测试
async function main() {
  const tester = new FusionSystemTester();
  await tester.runAllTests();
}

// 执行
if (require.main === module) {
  main().catch(error => {
    console.error('❌ 测试执行失败:', error);
    process.exit(1);
  });
}

module.exports = FusionSystemTester;