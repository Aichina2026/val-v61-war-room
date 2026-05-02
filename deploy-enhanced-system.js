  .contextCircuitBreaker.enabled ? '✅ 已启动' : '❌ 未启动'}`);
      
      console.log('\n📈 初始性能指标:');
      console.log(`   当前上下文使用: ${this.contextBuffer.currentTokens}/${this.config.contextCircuitBreaker.maxContextTokens} tokens`);
      console.log(`   历史重启次数: ${this.metrics.contextRestarts}`);
      console.log(`   自动任务执行: ${this.metrics.autoTasksExecuted}`);
      console.log(`   数据收集点: ${this.metrics.dataPointsCollected}`);
      
      console.log('\n🔧 系统将保持运行，按Ctrl+C停止...');
      
      // 保存初始配置

      const initialConfigFile = path.join(this.reportsDir, 'initial_deployment.json');
      fs.writeFileSync(initialConfigFile, JSON.stringify({
        deploymentTime: new Date().toISOString(),
        config: this.config,
        metrics: this.metrics,
        contextBuffer: this.contextBuffer
      }, null, 2));
      
      console.log(`💾 初始配置已保存到: ${initialConfigFile}`);
      
      // 保持进程运行

      return new Promise((resolve) => {
        // 处理退出信号

        process.on('SIGINT', () => {
          console.log('\n\n🛑 收到停止信号，正在清理...');
          this.cleanup();
          resolve();
        });
      });
      
    } catch (error) {
      console.error('❌ 部署失败:', error);
      this.cleanup();
      throw error;
    }
  }
  
  async runTests() {
    console.log('🧪 运行系统测试...');
    
    const testResults = [];
    
    // 测试1: 任务识别测试
    testResults.push(await this.testTaskRecognition());
    
    // 测试2: 上下文熔断测试
    testResults.push(await this.testContextCircuitBreaker());
    
    // 测试3: 自动迭代测试
    testResults.push(await this.testAutoIteration());
    
    // 测试4: 数据收集测试
    testResults.push(await this.testDataCollection());
    
    // 总结测试结果

    const totalTests = testResults.length;
    const passedTests = testResults.filter(r => r.passed).length;
    
    console.log('\n📊 测试结果摘要:');
    console.log(`   总测试数: ${totalTests}`);
    console.log(`   通过测试: ${passedTests}`);
    console.log(`   失败测试: ${totalTests - passedTests}`);
    console.log(`   通过率: ${((passedTests / totalTests) * 100).toFixed(2)}%`);
    
    // 保存测试报告

    const testReportFile = path.join(this.reportsDir, 'system_tests_report.json');
    fs.writeFileSync(testReportFile, JSON.stringify({
      timestamp: Date.now(),
      totalTests: totalTests,
      passedTests: passedTests,
      failedTests: totalTests - passedTests,
      passRate: (passedTests / totalTests) * 100,
      details: testResults
    }, null, 2));
    
    console.log(`💾 测试报告已保存到: ${testReportFile}`);
  }
  
  async testTaskRecognition() {
    console.log('  🔍 测试任务识别...');
    
    try {
      const testTask = {
        source: '测试',
        content: '设计一个高性能的分布式缓存系统',
        timestamp: Date.now()
      };
      
      const analysis = await this.analyzeTask(testTask);
      
      const passed = analysis.confidence >= this.config.autoRecognition.confidenceThreshold &&
                    analysis.type !== 'unknown';
      
      console.log(`    结果: ${passed ? '✅ 通过' : '❌ 失败'}`);
      console.log(`    识别类型: ${analysis.type}`);
      console.log(`    置信度: ${(analysis.confidence * 100).toFixed(2)}%`);
      
      return {
        test: 'task_recognition',
        passed: passed,
        details: analysis,
        timestamp: Date.now()
      };
      
    } catch (error) {
      console.error(`    错误: ${error.message}`);
      return {
        test: 'task_recognition',
        passed: false,
        error: error.message,
        timestamp: Date.now()
      };
    }
  }
  
  async testContextCircuitBreaker() {
    console.log('  🛡️  测试上下文熔断...');
    
    try {
      // 模拟上下文增长

      const initialTokens = this.contextBuffer.currentTokens;
      const testTokens = this.config.contextCircuitBreaker.maxContextTokens * 0.8;
      
      this.contextBuffer.currentTokens = testTokens;
      
      // 触发预警

      this.monitorContextUsage();
      
      // 检查是否触发了预警

      const passed = this.contextBuffer.warningIssued;
      
      console.log(`    结果: ${passed ? '✅ 通过' : '❌ 失败'}`);
      console.log(`    当前上下文: ${this.contextBuffer.currentTokens}/${this.config.contextCircuitBreaker.maxContextTokens}`);
      console.log(`    预警状态: ${this.contextBuffer.warningIssued ? '已触发' : '未触发'}`);
      
      // 重置

      this.contextBuffer.currentTokens = initialTokens;
      this.contextBuffer.warningIssued = false;
      
      return {
        test: 'context_circuit_breaker',
        passed: passed,
        details: {
          initialTokens: initialTokens,
          testTokens: testTokens,
          warningThreshold: this.config.contextCircuitBreaker.warningThreshold,
          warningTriggered: this.contextBuffer.warningIssued
        },
        timestamp: Date.now()
      };
      
    } catch (error) {
      console.error(`    错误: ${error.message}`);
      return {
        test: 'context_circuit_breaker',
        passed: false,
        error: error.message,
        timestamp: Date.now()
      };
    }
  }
  
  async testAutoIteration() {
    console.log('  🔄 测试自动迭代...');
    
    try {
      // 创建模拟指标

      const testMetrics = {
        totalRequests: 1000,
        successfulRequests: 800, // 80%成功率，低于阈值
        failedRequests: 200,
        successRate: 0.8,
        avgResponseTime: this.config.autoIteration.triggerThresholds.avgResponseTimeAbove + 500, // 高于阈值
        contextRestarts: 5,
        autoTasksExecuted: 10,
        iterationsCompleted: 0,
        dataPointsCollected: 50
      };
      
      // 检查是否应该触发迭代

      const shouldIterate = this.checkIterationTriggers(testMetrics);
      
      const passed = shouldIterate; // 应该触发迭代
      
      console.log(`    结果: ${passed ? '✅ 通过' : '❌ 失败'}`);
      console.log(`    成功率: ${(testMetrics.successRate * 100).toFixed(2)}%`);
      console.log(`    响应时间: ${testMetrics.avgResponseTime.toFixed(2)}ms`);
      console.log(`    是否触发迭代: ${shouldIterate ? '是' : '否'}`);
      
      return {
        test: 'auto_iteration',
        passed: passed,
        details: {
          metrics: testMetrics,
          shouldIterate: shouldIterate,
          thresholds: this.config.autoIteration.triggerThresholds
        },
        timestamp: Date.now()
      };
      
    } catch (error) {
      console.error(`    错误: ${error.message}`);
      return {
        test: 'auto_iteration',
        passed: false,
        error: error.message,
        timestamp: Date.now()
      };
    }
  }
  
  async testDataCollection() {
    console.log('  📊 测试数据收集...');
    
    try {
      // 收集初始数据

      const initialSnapshot = await this.collectMetricsSnapshot();
      
      // 模拟一些活动

      this.metrics.totalRequests += 10;
      this.metrics.successfulRequests += 8;
      this.metrics.averageResponseTime = (this.metrics.averageResponseTime + 150) / 2;
      
      // 再次收集数据

      await new Promise(resolve => setTimeout(resolve, 100));
      const newSnapshot = await this.collectMetricsSnapshot();
      
      // 检查数据是否更新

      const passed = newSnapshot.totalRequests > initialSnapshot.totalRequests &&
                    newSnapshot.dataPointsCollected > initialSnapshot.dataPointsCollected;
      
      console.log(`    结果: ${passed ? '✅ 通过' : '❌ 失败'}`);
      console.log(`    初始请求数: ${initialSnapshot.totalRequests}`);
      console.log(`    当前请求数: ${newSnapshot.totalRequests}`);
      console.log(`    数据收集点: ${newSnapshot.dataPointsCollected}`);
      
      return {
        test: 'data_collection',
        passed: passed,
        details: {
          initial: initialSnapshot,
          current: newSnapshot,
          difference: {
            totalRequests: newSnapshot.totalRequests - initialSnapshot.totalRequests,
            dataPoints: newSnapshot.dataPointsCollected - initialSnapshot.dataPointsCollected
          }
        },
        timestamp: Date.now()
      };
      
    } catch (error) {
      console.error(`    错误: ${error.message}`);
      return {
        test: 'data_collection',
        passed: false,
        error: error.message,
        timestamp: Date.now()
      };
    }
  }
  
  cleanup() {
    console.log('🧹 清理定时任务和资源...');
    
    // 清除所有定时任务

    for (const [name, task] of this.scheduledTasks) {
      if (typeof task === 'object' && task.unref) {
        clearInterval(task);
      }
    }
    
    this.scheduledTasks.clear();
    
    // 保存最终状态

    const finalMetricsFile = path.join(this.reportsDir, 'final_metrics.json');
    const finalData = {
      shutdownTime: Date.now(),
      metrics: this.metrics,
      dataCollector: {
        taskLogsCount: this.dataCollector.taskLogs.length,
        errorLogsCount: this.dataCollector.errorLogs.length,
        performanceSnapshotsCount: this.dataCollector.performanceSnapshots.length
      },
      contextBuffer: {
        currentTokens: this.contextBuffer.currentTokens,
        historyLength: this.contextBuffer.history.length,
        conversationThreads: this.contextBuffer.conversationThreads.length
      }
    };
    
    fs.writeFileSync(finalMetricsFile, JSON.stringify(finalData, null, 2));
    console.log(`💾 最终指标已保存到: ${finalMetricsFile}`);
    
    console.log('✅ 清理完成');
  }
}

// 主执行函数
async function main() {
  try {
    const deployer = new EnhancedSystemDeployer();
    await deployer.deployAndTest();
  } catch (error) {
    console.error('❌ 系统部署失败:', error);
    process.exit(1);
  }
}

// 命令行接口
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    console.log(`
用法: node deploy-enhanced-system.js [选项]

选项:
  --deploy    部署并运行增强系统
  --test      只运行测试，不部署
  --help      显示帮助信息

示例:
  node deploy-enhanced-system.js --deploy
  node deploy-enhanced-system.js --test
    `);
  } else if (args.includes('--test')) {
    const deployer = new EnhancedSystemDeployer();
    deployer.runTests().then(() => {
      console.log('✅ 测试完成');
      process.exit(0);
    }).catch(error => {
      console.error('❌ 测试失败:', error);
      process.exit(1);
    });
  } else {
    // 默认部署模式
    main().catch(error => {
      console.error('❌ 执行失败:', error);
      process.exit(1);
    });
  }
}

module.exports = EnhancedSystemDeployer;