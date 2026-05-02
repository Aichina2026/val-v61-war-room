#!/usr/bin/env node
/**
 * OMC工作流路由集成器
 * 将现有OMC工作流升级为使用OpenClaw智能路由系统
 */

const fs = require('fs');
const path = require('path');

class RoutingIntegrator {
  constructor() {
    this.workspace = '/root/.openclaw/workspace';
    this.realRouterPath = path.join(this.workspace, 'real-openclaw-router.js');
    this.omcFiles = this.findOMCFiles();
  }
  
  findOMCFiles() {
    const files = [];
    const patterns = [
      /omc.*\.js$/,
      /workflow.*\.js$/,
      /enhanced.*\.js$/,
      /free.*\.js$/
    ];
    
    const walkDir = (dir) => {
      try {
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory()) {
            if (!this.shouldSkipDir(item)) {
              walkDir(fullPath);
            }
          } else if (stat.isFile() && item.endsWith('.js')) {
            const relativePath = path.relative(this.workspace, fullPath);
            
            // 检查是否匹配模式
            for (const pattern of patterns) {
              if (pattern.test(item.toLowerCase())) {
                files.push({
                  path: fullPath,
                  relativePath: relativePath,
                  filename: item,
                  size: stat.size
                });
                break;
              }
            }
          }
        }
      } catch (error) {
        // 跳过错误
      }
    };
    
    walkDir(this.workspace);
    
    // 按路径长度排序，优先处理根目录文件
    files.sort((a, b) => a.relativePath.split('/').length - b.relativePath.split('/').length);
    
    return files;
  }
  
  shouldSkipDir(dirName) {
    const skipDirs = [
      'node_modules', '.git', '.cache', '__pycache__',
      'venv', 'env', '.venv', 'dist', 'build',
      'coverage', '.idea', '.vscode', 'backup'
    ];
    return skipDirs.includes(dirName) || dirName.startsWith('.');
  }
  
  analyzeFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    const analysis = {
      filePath: filePath,
      lines: content.split('\n').length,
      size: content.length,
      hasModelConfig: false,
      hasDirectAPICalls: false,
      hasSimulatedCalls: false,
      canBeIntegrated: false,
      integrationType: null,
      suggestedChanges: []
    };
    
    // 检查是否有模型配置
    const modelKeywords = [
      'gemini',
      'deepseek',
      'claude',
      'gpt',
      'models',
      'modelConfig',
      'apiKey',
      'OpenAI',
      'Anthropic',
      'Google'
    ];
    
    for (const keyword of modelKeywords) {
      if (content.toLowerCase().includes(keyword.toLowerCase())) {
        analysis.hasModelConfig = true;
        break;
      }
    }
    
    // 检查是否有直接API调用
    const apiCallPatterns = [
      /fetch\(/,
      /axios\./,
      /https\.request/,
      /openai\./,
      /anthropic\./,
      /gemini\./,
      /\.completions\.create/,
      /\.chat\.create/,
      /\.generateContent/
    ];
    
    for (const pattern of apiCallPatterns) {
      if (pattern.test(content)) {
        analysis.hasDirectAPICalls = true;
        break;
      }
    }
    
    // 检查是否有模拟调用
    const simulatedPatterns = [
      /simulate/,
      /mock/,
      /fake/,
      /dummy/,
      /setTimeout.*content/,
      /return.*promise/i
    ];
    
    for (const pattern of simulatedPatterns) {
      if (pattern.test(content)) {
        analysis.hasSimulatedCalls = true;
        break;
      }
    }
    
    // 确定集成类型
    if (analysis.hasDirectAPICalls || analysis.hasSimulatedCalls) {
      analysis.canBeIntegrated = true;
      analysis.integrationType = analysis.hasDirectAPICalls ? 'replace-api-calls' : 'replace-simulations';
    }
    
    // 生成建议更改
    if (analysis.canBeIntegrated) {
      analysis.suggestedChanges = this.generateSuggestedChanges(analysis, content);
    }
    
    return analysis;
  }
  
  generateSuggestedChanges(analysis, content) {
    const changes = [];
    
    // 1. 添加导入
    if (!content.includes('RealOpenClawRouter') && !content.includes('real-openclaw-router')) {
      changes.push({
        type: 'import',
        description: '导入真实路由调用器',
        oldText: analysis.filePath.endsWith('omc-workflow.js') 
          ? 'const fs = require(\'fs\');\nconst path = require(\'path\');'
          : 'const fs = require(\'fs\');',
        newText: analysis.filePath.endsWith('omc-workflow.js')
          ? 'const fs = require(\'fs\');\nconst path = require(\'path\');\nconst RealOpenClawRouter = require(\'./real-openclaw-router\');'
          : 'const fs = require(\'fs\');\nconst RealOpenClawRouter = require(\'./real-openclaw-router\');'
      });
    }
    
    // 2. 在构造函数中添加路由实例
    if (!content.includes('this.router =') && !content.includes('router =')) {
      const constructorMatch = content.match(/constructor\([^)]*\)\s*{([^}]+)}/);
      if (constructorMatch) {
        changes.push({
          type: 'constructor',
          description: '添加路由实例到构造函数',
          oldText: constructorMatch[0],
          newText: constructorMatch[0].replace(
            constructorMatch[1],
            constructorMatch[1] + '\n    this.router = new RealOpenClawRouter();'
          )
        });
      }
    }
    
    // 3. 替换模型调用
    if (analysis.hasModelConfig) {
      changes.push({
        type: 'call-replacement',
        description: '将直接模型调用替换为路由调用',
        examples: [
          '// 替换前: await callGemini(prompt)',
          '// 替换后: await this.router.unifiedRoute(\'analysis\', prompt)'
        ]
      });
    }
    
    return changes;
  }
  
  createIntegrationPlan() {
    const plan = {
      files: [],
      summary: {
        totalFiles: this.omcFiles.length,
        canBeIntegrated: 0,
        integrationTypes: {}
      }
    };
    
    for (const file of this.omcFiles) {
      const analysis = this.analyzeFile(file.path);
      
      plan.files.push({
        path: file.relativePath,
        filename: file.filename,
        analysis: analysis
      });
      
      if (analysis.canBeIntegrated) {
        plan.summary.canBeIntegrated++;
        
        if (analysis.integrationType) {
          if (!plan.summary.integrationTypes[analysis.integrationType]) {
            plan.summary.integrationTypes[analysis.integrationType] = 0;
          }
          plan.summary.integrationTypes[analysis.integrationType]++;
        }
      }
    }
    
    return plan;
  }
  
  generateIntegrationReport(plan) {
    const report = {
      timestamp: new Date().toISOString(),
      workspace: this.workspace,
      plan: plan,
      recommendations: [],
      stepByStepPlan: this.generateStepByStepPlan(plan)
    };
    
    // 生成推荐
    if (plan.summary.canBeIntegrated > 0) {
      report.recommendations.push({
        priority: 'high',
        action: '开始集成',
        description: `${plan.summary.canBeIntegrated} 个文件可以集成OpenClaw路由系统`
      });
      
      report.recommendations.push({
        priority: 'medium',
        action: '按优先级集成',
        description: '优先集成核心工作流文件，然后是辅助工具'
      });
    } else {
      report.recommendations.push({
        priority: 'info',
        action: '无需集成',
        description: '没有找到需要集成路由系统的文件'
      });
    }
    
    return report;
  }
  
  generateStepByStepPlan(plan) {
    const steps = [];
    let stepNumber = 1;
    
    // 按优先级排序文件
    const prioritizedFiles = plan.files.filter(f => f.analysis.canBeIntegrated).sort((a, b) => {
      // 优先级: omc-workflow > workflow > enhanced > 其他
      const priorityMap = {
        'omc-workflow': 1,
        'workflow': 2,
        'enhanced': 3,
        'free': 4
      };
      
      const aPriority = priorityMap[Object.keys(priorityMap).find(key => a.filename.includes(key))] || 5;
      const bPriority = priorityMap[Object.keys(priorityMap).find(key => b.filename.includes(key))] || 5;
      
      return aPriority - bPriority;
    });
    
    for (const file of prioritizedFiles) {
      steps.push({
        step: stepNumber++,
        file: file.path,
        type: file.analysis.integrationType,
        changes: file.analysis.suggestedChanges.length,
        description: `集成路由系统到 ${file.filename}`,
        details: file.analysis.suggestedChanges.map(c => `- ${c.description}`).join('\n')
      });
    }
    
    return steps;
  }
  
  saveReport(report) {
    const reportDir = path.join(this.workspace, 'integration-reports');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(reportDir, `routing-integration-plan-${timestamp}.json`);
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
    
    // 生成可读的markdown报告
    const mdReport = this.generateMarkdownReport(report);
    const mdPath = path.join(reportDir, `routing-integration-plan-${timestamp}.md`);
    fs.writeFileSync(mdPath, mdReport, 'utf8');
    
    return { json: reportPath, md: mdPath };
  }
  
  generateMarkdownReport(report) {
    let md = `# OpenClaw路由系统集成计划\n\n`;
    md += `**生成时间**: ${report.timestamp}\n`;
    md += `**工作空间**: ${report.workspace}\n\n`;
    
    md += `## 概要\n`;
    md += `- 发现OMC相关文件: ${report.plan.summary.totalFiles} 个\n`;
    md += `- 可以集成的文件: ${report.plan.summary.canBeIntegrated} 个\n`;
    
    if (Object.keys(report.plan.summary.integrationTypes).length > 0) {
      md += `- 集成类型分布:\n`;
      for (const [type, count] of Object.entries(report.plan.summary.integrationTypes)) {
        md += `  - ${type}: ${count} 个文件\n`;
      }
    }
    
    md += `\n## 推荐操作\n`;
    for (const rec of report.recommendations) {
      md += `### ${rec.priority.toUpperCase()}: ${rec.action}\n`;
      md += `${rec.description}\n\n`;
    }
    
    md += `## 逐步执行计划\n`;
    for (const step of report.stepByStepPlan) {
      md += `### 步骤 ${step.step}: ${step.description}\n`;
      md += `**文件**: ${step.file}\n`;
      md += `**类型**: ${step.type}\n`;
      md += `**变更数量**: ${step.changes}\n`;
      md += `**详情**:\n${step.details}\n\n`;
    }
    
    md += `## 技术细节\n`;
    md += `### 需要集成的文件列表:\n`;
    md += `| 文件 | 是否可集成 | 集成类型 | 变更建议 |\n`;
    md += `|------|-----------|----------|----------|\n`;
    
    for (const file of report.plan.files) {
      const canIntegrate = file.analysis.canBeIntegrated ? '✅' : '❌';
      const type = file.analysis.integrationType || '-';
      const changes = file.analysis.suggestedChanges.length;
      
      md += `| ${file.path} | ${canIntegrate} | ${type} | ${changes} 项变更 |\n`;
    }
    
    md += `\n## 下一步\n`;
    md += `1. **测试备份**: 在集成前备份所有文件\n`;
    md += `2. **逐步实施**: 按照上述计划从步骤1开始\n`;
    md += `3. **验证测试**: 每个文件集成后进行测试\n`;
    md += `4. **文档更新**: 更新相关文档反映变更\n`;
    
    md += `\n---\n`;
    md += `*生成: OpenClaw路由系统集成器*\n`;
    
    return md;
  }
}

// 主执行函数
async function main() {
  console.log('🚀 OMC工作流路由系统集成计划生成器\n');
  console.log('正在分析工作空间...\n');
  
  const integrator = new RoutingIntegrator();
  
  // 分析文件
  console.log('📋 分析OMC相关文件...');
  const plan = integrator.createIntegrationPlan();
  
  console.log(`  发现 ${plan.summary.totalFiles} 个OMC相关文件`);
  console.log(`  其中 ${plan.summary.canBeIntegrated} 个可以集成路由系统\n`);
  
  if (plan.summary.canBeIntegrated === 0) {
    console.log('❌ 没有找到需要集成路由系统的文件');
    return;
  }
  
  // 生成报告
  console.log('📄 生成集成计划...');
  const report = integrator.generateIntegrationReport(plan);
  
  // 保存报告
  const savedPaths = integrator.saveReport(report);
  
  console.log('✅ 集成计划已生成!');
  console.log(`  JSON报告: ${savedPaths.json}`);
  console.log(`  Markdown报告: ${savedPaths.md}`);
  
  // 显示摘要
  console.log('\n📊 集成计划摘要:');
  console.log('='.repeat(50));
  
  for (const step of report.stepByStepPlan) {
    console.log(`步骤 ${step.step}: ${step.file}`);
    console.log(`  类型: ${step.type}, 变更: ${step.changes} 项`);
  }
  
  console.log('='.repeat(50));
  console.log('\n🚀 下一步:');
  console.log('  1. 查看详细计划: 阅读生成的Markdown报告');
  console.log('  2. 开始集成: 按照步骤逐步实施');
  console.log('  3. 测试验证: 确保每个集成都正常工作');
}

// 运行
if (require.main === module) {
  main().catch(error => {
    console.error('❌ 生成集成计划失败:', error.message);
    process.exit(1);
  });
}

module.exports = RoutingIntegrator;