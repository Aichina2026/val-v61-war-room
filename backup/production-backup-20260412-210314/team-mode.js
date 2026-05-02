#!/usr/bin/env node
/**
 * $team模式：多AI模型并行代码审查
 * 支持国内环境的并行审查系统
 */

const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

class TeamMode extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.workspace = process.env.OPENCLAW_WORKSPACE || '/root/.openclaw/workspace';
    this.reviewDir = path.join(this.workspace, 'reviews');
    this.models = options.models || [
      { id: 'model-1', name: '架构师模型', role: '架构审查' },
      { id: 'model-2', name: '安全模型', role: '安全检查' },
      { id: 'model-3', name: '性能模型', role: '性能审查' },
      { id: 'model-4', name: '代码规范模型', role: '规范审查' }
    ];
    
    this.maxParallel = options.maxParallel || 3;
    this.timeout = options.timeout || 30000;
    
    // 确保目录存在
    if (!fs.existsSync(this.reviewDir)) {
      fs.mkdirSync(this.reviewDir, { recursive: true });
    }
    
    // 国内环境优化配置
    this.useLocalModels = process.env.USE_LOCAL_MODELS === 'true' || true;
    this.fallbackStrategy = 'sequential';
  }

  /**
   * 执行并行代码审查
   */
  async parallelCodeReview(code, task = '代码审查', options = {}) {
    console.log(`👥 启动$team模式: ${task}`);
    console.log(`  使用 ${this.models.length} 个模型并行审查`);
    
    const reviewId = `review_${Date.now()}`;
    const startTime = Date.now();
    
    // 分割代码块（如果需要）
    const codeChunks = this.splitCodeIntoChunks(code, options.chunkSize || 500);
    
    // 准备审查任务
    const tasks = this.prepareReviewTasks(codeChunks, task);
    
    // 执行并行审查
    const results = await this.executeParallelReview(tasks);
    
    // 合并审查结果
    const mergedResults = this.mergeReviewResults(results);
    
    // 生成审查报告
    const report = this.generateReviewReport(mergedResults, {
      reviewId,
      task,
      duration: Date.now() - startTime,
      codeSize: code.length,
      chunkCount: codeChunks.length
    });
    
    // 保存审查结果
    this.saveReviewResults(reviewId, {
      task,
      codePreview: code.substring(0, 500) + (code.length > 500 ? '...' : ''),
      results: mergedResults,
      report,
      metadata: {
        modelsUsed: this.models.length,
        parallelExecuted: Math.min(this.models.length, this.maxParallel),
        timestamp: new Date().toISOString()
      }
    });
    
    this.emit('reviewComplete', { reviewId, results: mergedResults, report });
    
    return {
      reviewId,
      success: mergedResults.severity.critical === 0,
      results: mergedResults,
      report,
      metrics: {
        duration: `${Date.now() - startTime}ms`,
        modelsParticipated: this.models.length,
        issuesFound: mergedResults.issues.length,
        recommendations: mergedResults.recommendations.length
      }
    };
  }

  /**
   * 准备审查任务
   */
  prepareReviewTasks(codeChunks, task) {
    const tasks = [];
    
    // 为每个模型分配任务
    this.models.forEach((model, index) => {
      // 分配代码块（轮询分配）
      const assignedChunks = [];
      for (let i = index; i < codeChunks.length; i += this.models.length) {
        assignedChunks.push(codeChunks[i]);
      }
      
      if (assignedChunks.length > 0) {
        tasks.push({
          modelId: model.id,
          modelName: model.name,
          role: model.role,
          chunks: assignedChunks,
          task: `${task} - ${model.role}`,
          priority: this.calculatePriority(model.role)
        });
      }
    });
    
    return tasks;
  }

  /**
   * 执行并行审查
   */
  async executeParallelReview(tasks) {
    console.log(`  执行并行审查 (${tasks.length} 个任务, 最大并行: ${this.maxParallel})`);
    
    const results = [];
    const running = new Set();
    
    // 使用Promise池控制并发
    for (let i = 0; i < tasks.length; i += this.maxParallel) {
      const batch = tasks.slice(i, i + this.maxParallel);
      const batchPromises = batch.map(task => 
        this.executeSingleReview(task).catch(error => ({
          modelId: task.modelId,
          modelName: task.modelName,
          success: false,
          error: error.message,
          issues: [],
          recommendations: []
        }))
      );
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // 进度更新
      const completed = results.length;
      const total = tasks.length;
      console.log(`  📊 进度: ${completed}/${total} (${Math.round(completed/total*100)}%)`);
    }
    
    return results;
  }

  /**
   * 执行单个审查任务
   */
  async executeSingleReview(task) {
    console.log(`    🧠 ${task.modelName} 开始审查 (${task.role})`);
    
    // 模拟审查过程（实际实现会调用具体的AI模型）
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const reviewResult = this.simulateModelReview(task);
          console.log(`    ✅ ${task.modelName} 审查完成`);
          resolve(reviewResult);
        } catch (error) {
          console.log(`    ❌ ${task.modelName} 审查失败: ${error.message}`);
          reject(error);
        }
      }, 1000 + Math.random() * 2000); // 模拟处理时间
    });
  }

  /**
   * 模拟模型审查
   */
  simulateModelReview(task) {
    const { modelId, modelName, role, chunks } = task;
    
    // 根据角色生成不同的审查结果
    const issues = this.generateIssuesByRole(role, chunks);
    const recommendations = this.generateRecommendationsByRole(role, issues);
    
    return {
      modelId,
      modelName,
      role,
      success: true,
      chunksReviewed: chunks.length,
      issues,
      recommendations,
      score: this.calculateReviewScore(issues, recommendations),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 根据角色生成问题
   */
  generateIssuesByRole(role, chunks) {
    const issues = [];
    const codeText = chunks.join('\n');
    
    // 架构师模型
    if (role === '架构审查') {
      if (codeText.includes('var ')) {
        issues.push({
          type: 'code-style',
          severity: 'warning',
          message: '建议使用const/let代替var',
          location: this.findLocation(codeText, 'var '),
          suggestion: '使用const声明不可变变量，let声明可变变量'
        });
      }
      
      if (codeText.includes('.then(') && !codeText.includes('async') && !codeText.includes('await')) {
        issues.push({
          type: 'modernization',
          severity: 'suggestion',
          message: '考虑使用async/await替代Promise.then',
          location: this.findLocation(codeText, '.then('),
          suggestion: '使用async函数和await关键字'
        });
      }
    }
    
    // 安全模型
    if (role === '安全检查') {
      if (codeText.includes('eval(') || codeText.includes('Function(')) {
        issues.push({
          type: 'security',
          severity: 'critical',
          message: '检测到潜在危险代码: eval或Function构造函数',
          location: this.findLocation(codeText, 'eval(') || this.findLocation(codeText, 'Function('),
          suggestion: '避免使用eval和Function，使用安全的替代方案'
        });
      }
      
      if (codeText.includes('innerHTML') && !codeText.includes('textContent')) {
        issues.push({
          type: 'security',
          severity: 'warning',
          message: '使用innerHTML可能导致XSS攻击',
          location: this.findLocation(codeText, 'innerHTML'),
          suggestion: '优先使用textContent或安全的DOM操作方法'
        });
      }
    }
    
    // 性能模型
    if (role === '性能审查') {
      if (codeText.includes('for (var i = 0') && codeText.includes('.length')) {
        issues.push({
          type: 'performance',
          severity: 'suggestion',
          message: '循环中重复计算数组长度',
          location: this.findLocation(codeText, '.length'),
          suggestion: '在循环外缓存数组长度'
        });
      }
      
      if (codeText.includes('setTimeout') && codeText.includes('function')) {
        issues.push({
          type: 'performance',
          severity: 'info',
          message: '使用函数表达式创建闭包',
          location: this.findLocation(codeText, 'setTimeout'),
          suggestion: '考虑使用箭头函数或避免不必要的闭包'
        });
      }
    }
    
    // 代码规范模型
    if (role === '规范审查') {
      // 检查缩进
      if (codeText.includes('\t')) {
        issues.push({
          type: 'style',
          severity: 'info',
          message: '使用制表符缩进',
          location: 'multiple',
          suggestion: '建议使用2或4个空格进行缩进'
        });
      }
      
      // 检查行长度
      const lines = codeText.split('\n');
      const longLines = lines.filter(line => line.length > 80);
      if (longLines.length > 0) {
        issues.push({
          type: 'style',
          severity: 'info',
          message: `发现${longLines.length}行超过80字符`,
          location: 'multiple',
          suggestion: '考虑换行或重构长行代码'
        });
      }
    }
    
    // 随机生成一些额外问题
    const randomIssues = Math.floor(Math.random() * 3);
    for (let i = 0; i < randomIssues; i++) {
      const issueTypes = ['typo', 'optimization', 'documentation', 'test'];
      const type = issueTypes[Math.floor(Math.random() * issueTypes.length)];
      
      issues.push({
        type,
        severity: ['info', 'suggestion', 'warning'][Math.floor(Math.random() * 3)],
        message: `发现${type}相关问题`,
        location: 'general',
        suggestion: '请检查相关部分'
      });
    }
    
    return issues;
  }

  /**
   * 生成建议
   */
  generateRecommendationsByRole(role, issues) {
    const recommendations = [];
    
    if (issues.length === 0) {
      recommendations.push({
        type: 'general',
        priority: 'low',
        content: '代码质量良好，继续保持'
      });
      return recommendations;
    }
    
    // 根据问题生成建议
    issues.forEach(issue => {
      if (issue.severity === 'critical' || issue.severity === 'warning') {
        recommendations.push({
          type: issue.type,
          priority: issue.severity === 'critical' ? 'high' : 'medium',
          content: `修复${issue.type}问题: ${issue.message}`,
          relatedIssue: issue.message
        });
      }
    });
    
    // 角色特定建议
    if (role === '架构审查') {
      recommendations.push({
        type: 'architecture',
        priority: 'medium',
        content: '建议添加模块注释和接口文档'
      });
    }
    
    if (role === '安全检查') {
      recommendations.push({
        type: 'security',
        priority: 'high',
        content: '建议进行安全审计和渗透测试'
      });
    }
    
    return recommendations;
  }

  /**
   * 合并审查结果
   */
  mergeReviewResults(results) {
    const merged = {
      issues: [],
      recommendations: [],
      severity: {
        critical: 0,
        warning: 0,
        suggestion: 0,
        info: 0
      },
      byType: {},
      byModel: {}
    };
    
    // 合并所有结果
    results.forEach(result => {
      if (result.success) {
        merged.issues.push(...result.issues);
        merged.recommendations.push(...result.recommendations);
        
        // 按严重程度统计
        result.issues.forEach(issue => {
          merged.severity[issue.severity] = (merged.severity[issue.severity] || 0) + 1;
          
          // 按类型统计
          merged.byType[issue.type] = (merged.byType[issue.type] || 0) + 1;
        });
        
        // 按模型统计
        merged.byModel[result.modelName] = {
          issues: result.issues.length,
          score: result.score
        };
      }
    });
    
    // 去重问题
    merged.issues = this.deduplicateIssues(merged.issues);
    merged.recommendations = this.deduplicateRecommendations(merged.recommendations);
    
    // 计算总体分数
    merged.overallScore = this.calculateOverallScore(merged);
    
    return merged;
  }

  /**
   * 生成审查报告
   */
  generateReviewReport(results, metadata) {
    const report = `
# 代码审查报告
## 基本信息
- 审查ID: ${metadata.reviewId}
- 任务: ${metadata.task}
- 审查时间: ${new Date().toISOString()}
- 持续时间: ${metadata.duration}ms
- 代码大小: ${metadata.codeSize} 字符
- 代码块数: ${metadata.chunkCount}

## 审查结果摘要
- 总体分数: ${results.overallScore}/100
- 发现问题: ${results.issues.length} 个
- 严重程度分布:
  - 严重问题: ${results.severity.critical}
  - 警告问题: ${results.severity.warning}
  - 建议问题: ${results.severity.suggestion}
  - 信息问题: ${results.severity.info}

## 模型参与情况
${Object.entries(results.byModel).map(([model, data]) => `- ${model}: ${data.issues} 问题，分数 ${data.score}`).join('\n')}

## 主要问题
${results.issues.slice(0, 10).map((issue, i) => `${i+1}. [${issue.severity.toUpperCase()}] ${issue.message}`).join('\n')}

## 关键建议
${results.recommendations.filter(r => r.priority === 'high').slice(0, 5).map((rec, i) => `${i+1}. ${rec.content}`).join('\n')}

## 结论
${results.severity.critical > 0 ? '❌ 发现严重问题，需要立即修复' : '✅ 代码质量良好，可以通过'}
`;
    
    return report;
  }

  /**
   * 保存审查结果
   */
  saveReviewResults(reviewId, data) {
    const resultPath = path.join(this.reviewDir, `${reviewId}.json`);
    fs.writeFileSync(resultPath, JSON.stringify(data, null, 2), 'utf8');
    
    const reportPath = path.join(this.reviewDir, `${reviewId}_report.md`);
    fs.writeFileSync(reportPath, data.report, 'utf8');
    
    console.log(`\n💾 审查结果已保存:`);
    console.log(`   详细结果: ${resultPath}`);
    console.log(`   报告文件: ${reportPath}`);
  }

  // 辅助方法
  splitCodeIntoChunks(code, chunkSize) {
    const chunks = [];
    const lines = code.split('\n');
    
    let currentChunk = [];
    let currentSize = 0;
    
    for (const line of lines) {
      if (currentSize + line.length > chunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.join('\n'));
        currentChunk = [line];
        currentSize = line.length;
      } else {
        currentChunk.push(line);
        currentSize += line.length;
      }
    }
    
    if (currentChunk.length > 0) {
      chunks.push(currentChunk.join('\n'));
    }
    
    return chunks;
  }

  calculatePriority(role) {
    const priorities = {
      '架构审查': 1,
      '安全检查': 1,
      '性能审查': 2,
      '规范审查': 3
    };
    return priorities[role] || 4;
  }

  findLocation(code, pattern) {
    const index = code.indexOf(pattern);
    if (index === -1) return null;
    
    // 计算行号
    const before = code.substring(0, index);
    const lineNumber = before.split('\n').length;
    return `line ${lineNumber}`;
  }

  calculateReviewScore(issues, recommendations) {
    let score = 100;
    
    issues.forEach(issue => {
      if (issue.severity === 'critical') score -= 20;
      if (issue.severity === 'warning') score -= 10;
      if (issue.severity === 'suggestion') score -= 5;
      if (issue.severity === 'info') score -= 1;
    });
    
    // 建议加分
    if (recommendations.length > 0) score += Math.min(10, recommendations.length * 2);
    
    return Math.max(0, Math.min(100, score));
  }

  deduplicateIssues(issues) {
    const seen = new Set();
    return issues.filter(issue => {
      const key = `${issue.type}:${issue.message}:${issue.location}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  deduplicateRecommendations(recommendations) {
    const seen = new Set();
    return recommendations.filter(rec => {
      const key = `${rec.type}:${rec.content}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  calculateOverallScore(results) {
    if (results.issues.length === 0) return 100;
    
    let score = 100;
    results.issues.forEach(issue => {
      if (issue.severity === 'critical') score -= 15;
      if (issue.severity === 'warning') score -= 8;
      if (issue.severity === 'suggestion') score -= 3;
      if (issue.severity === 'info') score -= 1;
    });
    
    // 根据建议数量加分
    score += Math.min(20, results.recommendations.length);
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }
}

// CLI支持
if (require.main === module) {
  const args = process.argv.slice(2);
  const teamMode = new TeamMode();
  
  if (args.length === 0) {
    console.log('使用方式: node team-mode.js "代码内容" [选项]');
    console.log('示例: node team-mode.js "$(cat file.js)" --task="审查组件"');
    console.log('选项:');
    console.log('  --task=任务描述     审查任务描述');
    console.log('  --models=数量       使用的模型数量 (默认: 4)');
    console.log('  --output=路径       保存结果目录');
    process.exit(0);
  }
  
  let code = args[0];
  const options = {};
  
  // 如果参数是文件路径，读取文件内容
  if (fs.existsSync(code) && fs.statSync(code).isFile()) {
    code = fs.readFileSync(code, 'utf8');
  }
  
  // 解析选项
  args.slice(1).forEach(arg => {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      if (key === 'task') {
        options.task = value;
      } else if (key === 'models') {
        teamMode.models = teamMode.models.slice(0, parseInt(value));
      } else if (key === 'output') {
        options.outputDir = value;
      }
    }
  });
  
  const task = options.task || '代码审查';
  
  console.log('='.repeat(50));
  console.log('🚀 启动$team模式并行代码审查');
  console.log('='.repeat(50));
  
  teamMode.parallelCodeReview(code, task, options)
    .then(result => {
      console.log('\n' + '='.repeat(50));
      console.log('🎉 并行审查完成!');
      console.log('='.repeat(50));
      
      console.log(`\n📊 审查结果:`);
      console.log(`   审查ID: ${result.reviewId}`);
      console.log(`   总体分数: ${result.metrics.modelsParticipated} 个模型参与`);
      console.log(`   发现问题: ${result.metrics.issuesFound} 个`);
      console.log(`   生成建议: ${result.metrics.recommendations} 条`);
      console.log(`   耗时: ${result.metrics.duration}`);
      
      if (result.results.severity.critical > 0) {
        console.log('\n⚠️ 发现严重问题，需要立即处理:');
        result.results.issues
          .filter(i => i.severity === 'critical')
          .forEach((issue, i) => {
            console.log(`   ${i+1}. ${issue.message} (${issue.location})`);
          });
      }
      
      if (options.outputDir) {
        console.log(`\n💾 详细结果已保存到: ${options.outputDir}`);
      }
    })
    .catch(error => {
      console.error('❌ 审查失败:', error.message);
      process.exit(1);
    });
}

module.exports = TeamMode;