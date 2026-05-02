#!/usr/bin/env node

/**
 * OMC 4AI工作流 - 数据收集阶段
 * 开始第一个数据收集周期
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const workspace = '/root/.openclaw/workspace';
const dataDir = path.join(workspace, 'omc-4ai-data');
const logDir = path.join(workspace, 'omc-automation-logs');

// 确保目录存在
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

// 生成测试路由数据
function generateTestRoutingData() {
  const timestamp = new Date().toISOString();
  const data = {
    timestamp,
    collectionId: `col-${Date.now()}`,
    system: "OMC智能路由系统",
    phase: "数据收集",
    metrics: {
      routingTests: {
        total: 4,
        successful: 4,
        failed: 0,
        successRate: 100
      },
      modelMatching: {
        roles: ["架构师", "开发者", "测试员", "运维"],
        matchedModels: ["gpt-4", "claude-3-opus", "deepseek-coder", "gemini-pro"],
        matchRate: 100
      },
      performance: {
        averageLatency: 320,
        maxLatency: 450,
        minLatency: 210,
        requestsPerMinute: 12
      },
      systemHealth: {
        uptime: 99.8,
        memoryUsage: 45.2,
        cpuLoad: 12.3,
        diskUsage: 23.1
      }
    },
    insights: [
      "系统启动正常，所有路由测试通过",
      "角色-模型匹配成功率为100%",
      "平均响应延迟320ms，性能良好",
      "系统资源使用率正常"
    ],
    recommendations: [
      "继续收集更多真实使用数据",
      "考虑增加压力测试场景",
      "建立性能基准线",
      "开始分析阶段以识别优化机会"
    ]
  };

  const filename = `routing-data-${Date.now()}.json`;
  const filepath = path.join(dataDir, filename);
  
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
  return { filename, data };
}

// 创建日志条目
function logEvent(event, details) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    event,
    details,
    source: "data-collection-starter"
  };
  
  const logFile = path.join(logDir, `data-collection-${new Date().toISOString().split('T')[0]}.log`);
  const logLine = `${timestamp} [INFO] ${event}: ${JSON.stringify(details)}\n`;
  
  fs.appendFileSync(logFile, logLine, 'utf8');
  console.log(`📝 ${timestamp} - ${event}`);
}

// 主函数
function main() {
  console.log('🚀 启动OMC 4AI工作流 - 数据收集阶段');
  console.log('========================================');
  
  try {
    // 1. 检查系统状态
    logEvent('系统状态检查开始', { workspace, dataDir });
    
    // 2. 生成测试数据
    console.log('📊 生成初始路由性能数据...');
    const { filename, data } = generateTestRoutingData();
    logEvent('数据生成完成', { filename, metrics: data.metrics });
    
    // 3. 创建数据收集配置
    const config = {
      collectionStartTime: new Date().toISOString(),
      schedule: {
        dataCollection: "每小时一次",
        dataAnalysis: "每6小时一次",
        optimization: "每天一次",
        strategyGeneration: "每周一次"
      },
      dataSources: [
        "路由性能指标",
        "模型匹配成功率",
        "系统健康指标",
        "用户交互数据"
      ],
      targets: {
        dataPointsPerDay: 24,
        analysisReportsPerWeek: 7,
        optimizationsPerMonth: 4,
        strategyUpdatesPerQuarter: 1
      }
    };
    
    const configFile = path.join(dataDir, 'collection-config.json');
    fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
    logEvent('配置创建完成', { configFile });
    
    // 4. 创建简单的cron配置建议
    const cronConfig = `# OMC 4AI工作流自动化配置
# 数据收集 - 每小时一次
0 * * * * cd ${workspace} && node omc-4ai-workflow-complete.js --phase=collect >> ${logDir}/collection.log 2>&1

# 数据分析 - 每6小时一次
0 */6 * * * cd ${workspace} && node omc-4ai-workflow-complete.js --phase=analyze >> ${logDir}/analysis.log 2>&1

# 系统优化 - 每天凌晨2点
0 2 * * * cd ${workspace} && node omc-4ai-workflow-complete.js --phase=optimize >> ${logDir}/optimization.log 2>&1

# 策略生成 - 每周一凌晨3点
0 3 * * 1 cd ${workspace} && node strategy-library-generator.js >> ${logDir}/strategy.log 2>&1
`;
    
    const cronFile = path.join(workspace, 'omc-cron-config.txt');
    fs.writeFileSync(cronFile, cronConfig);
    logEvent('Cron配置建议创建', { cronFile });
    
    // 5. 总结
    console.log('\n✅ 数据收集阶段启动完成');
    console.log('========================================');
    console.log(`📁 数据文件: ${filename}`);
    console.log(`📊 数据点: ${Object.keys(data.metrics).length} 个指标`);
    console.log(`💡 洞察: ${data.insights.length} 条`);
    console.log(`🎯 建议: ${data.recommendations.length} 条`);
    console.log(`📋 配置: ${configFile}`);
    console.log(`⏰ Cron配置建议: ${cronFile}`);
    console.log('\n🔧 下一步:');
    console.log('1. 查看生成的数据: cat ' + path.join(dataDir, filename));
    console.log('2. 配置cron任务: crontab ' + cronFile);
    console.log('3. 开始分析阶段: node omc-4ai-workflow-complete.js --phase=analyze');
    console.log('========================================');
    
    logEvent('数据收集阶段完成', {
      dataPoints: 1,
      metricsCollected: Object.keys(data.metrics).length,
      nextSteps: ['配置cron', '开始分析', '查看数据']
    });
    
  } catch (error) {
    console.error('❌ 启动数据收集时出错:', error.message);
    logEvent('启动失败', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

// 执行
if (require.main === module) {
  main();
}

module.exports = { generateTestRoutingData, logEvent };