#!/usr/bin/env node

/**
 * OMC工作流 - 全盘任务扫描器
 * 扫描已论证但未完成的任务
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const workspace = '/root/.openclaw/workspace';

console.log('🔍 OMC工作流全盘任务扫描');
console.log('='.repeat(70));
console.log('目标: 扫描已论证但未完成的任务');
console.log('='.repeat(70));

// 1. 扫描论证文件
function scanArgumentationFiles() {
  console.log('\n📋 1. 扫描论证文件...');
  
  const argumentationFiles = execSync(
    `find ${workspace} -type f -name "*论证*" -o -name "*argument*" -o -name "*plan*" -o -name "*设计*" -o -name "*design*" | grep -v node_modules | head -30`,
    { encoding: 'utf8' }
  ).split('\n').filter(f => f.trim());
  
  console.log(`📊 找到 ${argumentationFiles.length} 个论证文件`);
  
  const argumentationResults = [];
  
  for (const file of argumentationFiles.slice(0, 10)) {
    const relativePath = path.relative(workspace, file);
    const stats = fs.statSync(file);
    
    try {
      const content = fs.readFileSync(file, 'utf8').substring(0, 5000);
      const lines = content.split('\n').length;
      
      // 分析内容特征
      const hasTodo = content.includes('TODO') || content.includes('待办') || content.includes('需要') || content.includes('下一步');
      const hasCompleted = content.includes('完成') || content.includes('已完成') || content.includes('finished') || content.includes('completed');
      const hasActionItems = content.includes('行动') || content.includes('实施') || content.includes('执行') || content.includes('action');
      
      argumentationResults.push({
        file: relativePath,
        size: stats.size,
        lines,
        modified: stats.mtime,
        hasTodo,
        hasCompleted,
        hasActionItems,
        status: hasCompleted ? '部分完成' : '待处理'
      });
      
    } catch (error) {
      // 跳过无法读取的文件
    }
  }
  
  return argumentationResults;
}

// 2. 扫描任务管理文件
function scanTaskManagementFiles() {
  console.log('\n📋 2. 扫描任务管理文件...');
  
  const taskFiles = execSync(
    `find ${workspace} -type f \\( -name "*task*" -o -name "*待办*" -o -name "*TODO*" -o -name "*计划*" \\) -name "*.json" -o -name "*.md" -o -name "*.js" -o -name "*.cjs" | grep -v node_modules | head -20`,
    { encoding: 'utf8' }
  ).split('\n').filter(f => f.trim());
  
  console.log(`📊 找到 ${taskFiles.length} 个任务文件`);
  
  const taskResults = [];
  
  for (const file of taskFiles) {
    const relativePath = path.relative(workspace, file);
    const stats = fs.statSync(file);
    
    try {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n').length;
      
      // 分析任务状态
      const hasIncomplete = content.includes('"status": "pending"') || 
                           content.includes('"status": "in-progress"') ||
                           content.includes('未完成') ||
                           content.includes('待处理');
      
      const hasComplete = content.includes('"status": "completed"') || 
                         content.includes('已完成') ||
                         content.includes('完成');
      
      let taskCount = 0;
      let incompleteCount = 0;
      
      // 尝试解析JSON任务数据
      if (file.endsWith('.json')) {
        try {
          const jsonData = JSON.parse(content);
          
          // 统计任务数量 (基于常见结构)
          if (jsonData.tasks && Array.isArray(jsonData.tasks)) {
            taskCount = jsonData.tasks.length;
            incompleteCount = jsonData.tasks.filter(t => 
              t.status === 'pending' || t.status === 'in-progress' || !t.status
            ).length;
          } else if (jsonData.phases && Array.isArray(jsonData.phases)) {
            for (const phase of jsonData.phases) {
              if (phase.tasks && Array.isArray(phase.tasks)) {
                taskCount += phase.tasks.length;
                incompleteCount += phase.tasks.filter(t => 
                  t.status === 'pending' || t.status === 'in-progress' || !t.status
                ).length;
              }
            }
          }
        } catch (e) {
          // 不是有效JSON，跳过
        }
      }
      
      taskResults.push({
        file: relativePath,
        size: stats.size,
        lines,
        modified: stats.mtime,
        hasIncomplete,
        hasComplete,
        taskCount,
        incompleteCount,
        status: incompleteCount > 0 ? '有待办任务' : '全部完成'
      });
      
    } catch (error) {
      // 跳过无法读取的文件
    }
  }
  
  return taskResults;
}

// 3. 扫描OMC迭代论证目录
function scanOMCIterations() {
  console.log('\n📋 3. 扫描OMC迭代论证...');
  
  const iterationDir = path.join(workspace, 'OPCN智能管理系统/迭代论证');
  
  if (!fs.existsSync(iterationDir)) {
    console.log('⚠️  OMC迭代论证目录不存在');
    return [];
  }
  
  const iterationFiles = fs.readdirSync(iterationDir)
    .filter(f => f.endsWith('.md'))
    .map(f => path.join(iterationDir, f));
  
  console.log(`📊 找到 ${iterationFiles.length} 个迭代论证文件`);
  
  const iterationResults = [];
  
  for (const file of iterationFiles.slice(0, 10)) {
    const filename = path.basename(file);
    const stats = fs.statSync(file);
    
    try {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n').length;
      
      // 分析迭代内容
      const hasRecommendations = content.includes('建议') || content.includes('推荐') || content.includes('下一步');
      const hasActionItems = content.includes('行动') || content.includes('实施') || content.includes('执行');
      const hasConclusions = content.includes('结论') || content.includes('总结') || content.includes('完成');
      
      // 提取迭代编号
      const iterationMatch = filename.match(/迭代-(\d+)/);
      const iterationNumber = iterationMatch ? parseInt(iterationMatch[1]) : 0;
      
      iterationResults.push({
        file: `OPCN智能管理系统/迭代论证/${filename}`,
        iteration: iterationNumber,
        size: stats.size,
        lines,
        modified: stats.mtime,
        hasRecommendations,
        hasActionItems,
        hasConclusions,
        status: hasConclusions ? '已完成论证' : '论证中'
      });
      
    } catch (error) {
      // 跳过无法读取的文件
    }
  }
  
  // 按迭代编号排序
  iterationResults.sort((a, b) => a.iteration - b.iteration);
  
  return iterationResults;
}

// 4. 分析已论证但未完成的任务
function analyzeIncompleteTasks(argumentationResults, taskResults, iterationResults) {
  console.log('\n📋 4. 分析已论证但未完成的任务...');
  
  const incompleteTasks = [];
  
  // 从论证文件中提取未完成项
  for (const arg of argumentationResults) {
    if (arg.hasTodo && !arg.hasCompleted) {
      incompleteTasks.push({
        type: '论证文件',
        source: arg.file,
        description: '论证文件中发现待办事项',
        priority: '中',
        evidence: `文件包含TODO/待办标记，大小: ${arg.size}字节`
      });
    }
  }
  
  // 从任务文件中提取未完成任务
  for (const task of taskResults) {
    if (task.incompleteCount > 0) {
      incompleteTasks.push({
        type: '任务文件',
        source: task.file,
        description: `${task.incompleteCount}个未完成任务`,
        priority: '高',
        evidence: `共${task.taskCount}个任务，${task.incompleteCount}个未完成`
      });
    }
  }
  
  // 从迭代论证中提取建议项
  for (const iter of iterationResults) {
    if (iter.hasRecommendations && !iter.hasConclusions) {
      incompleteTasks.push({
        type: '迭代论证',
        source: iter.file,
        description: `迭代${iter.iteration}的建议待实施`,
        priority: '中',
        evidence: `迭代论证包含建议但未形成结论`
      });
    }
  }
  
  return incompleteTasks;
}

// 5. 生成任务报告
function generateTaskReport(incompleteTasks, argumentationResults, taskResults, iterationResults) {
  console.log('\n' + '='.repeat(70));
  console.log('📊 OMC工作流任务扫描报告');
  console.log('='.repeat(70));
  
  // 统计信息
  const totalArgumentation = argumentationResults.length;
  const totalTasks = taskResults.length;
  const totalIterations = iterationResults.length;
  const totalIncomplete = incompleteTasks.length;
  
  console.log('\n📈 扫描统计:');
  console.log(`   论证文件: ${totalArgumentation} 个`);
  console.log(`   任务文件: ${totalTasks} 个`);
  console.log(`   迭代论证: ${totalIterations} 个`);
  console.log(`   未完成任务: ${totalIncomplete} 个`);
  
  if (totalIncomplete === 0) {
    console.log('\n🎉 恭喜！所有已论证的任务都已完成！');
    return;
  }
  
  // 按优先级分组
  const highPriority = incompleteTasks.filter(t => t.priority === '高');
  const mediumPriority = incompleteTasks.filter(t => t.priority === '中');
  const lowPriority = incompleteTasks.filter(t => t.priority === '低');
  
  console.log('\n🔴 高优先级任务:');
  if (highPriority.length === 0) {
    console.log('   ✅ 无高优先级任务');
  } else {
    for (const task of highPriority) {
      console.log(`   🔥 ${task.type}: ${task.description}`);
      console.log(`       来源: ${task.source}`);
      console.log(`       证据: ${task.evidence}`);
    }
  }
  
  console.log('\n🟡 中优先级任务:');
  if (mediumPriority.length === 0) {
    console.log('   ✅ 无中优先级任务');
  } else {
    for (const task of mediumPriority) {
      console.log(`   ⚠️  ${task.type}: ${task.description}`);
      console.log(`       来源: ${task.source}`);
      console.log(`       证据: ${task.evidence}`);
    }
  }
  
  console.log('\n🟢 低优先级任务:');
  if (lowPriority.length === 0) {
    console.log('   ✅ 无低优先级任务');
  } else {
    for (const task of lowPriority) {
      console.log(`   📋 ${task.type}: ${task.description}`);
      console.log(`       来源: ${task.source}`);
      console.log(`       证据: ${task.evidence}`);
    }
  }
  
  // 按类型分组统计
  const byType = incompleteTasks.reduce((acc, task) => {
    acc[task.type] = (acc[task.type] || 0) + 1;
    return acc;
  }, {});
  
  console.log('\n📊 任务类型分布:');
  for (const [type, count] of Object.entries(byType)) {
    console.log(`   ${type}: ${count} 个`);
  }
  
  // 推荐下一步行动
  console.log('\n💡 推荐下一步行动:');
  
  if (highPriority.length > 0) {
    console.log('   1. 🚨 立即处理高优先级任务');
    console.log('      - 检查任务文件中的未完成项');
    console.log('      - 分配资源开始实施');
  }
  
  if (mediumPriority.length > 0) {
    console.log('   2. ⚠️  规划中优先级任务');
    console.log('      - 制定实施计划');
    console.log('      - 安排时间窗口');
  }
  
  if (incompleteTasks.length > 10) {
    console.log('   3. 📋 建立任务管理系统');
    console.log('      - 统一任务跟踪');
    console.log('      - 定期进度检查');
  }
  
  // 创建任务清单文件
  const taskListFile = path.join(workspace, '未完成任务清单.md');
  const taskListContent = generateTaskListContent(incompleteTasks);
  fs.writeFileSync(taskListFile, taskListContent, 'utf8');
  
  console.log(`\n📝 任务清单已生成: ${taskListFile}`);
}

// 6. 生成任务清单内容
function generateTaskListContent(incompleteTasks) {
  let content = `# 未完成任务清单
## 生成时间: ${new Date().toISOString()}
## 扫描范围: ${workspace}

## 摘要
- 总任务数: ${incompleteTasks.length}
- 高优先级: ${incompleteTasks.filter(t => t.priority === '高').length}
- 中优先级: ${incompleteTasks.filter(t => t.priority === '中').length}
- 低优先级: ${incompleteTasks.filter(t => t.priority === '低').length}

## 任务详情
`;

  // 按优先级分组
  const byPriority = {
    '高': incompleteTasks.filter(t => t.priority === '高'),
    '中': incompleteTasks.filter(t => t.priority === '中'),
    '低': incompleteTasks.filter(t => t.priority === '低')
  };
  
  for (const [priority, tasks] of Object.entries(byPriority)) {
    if (tasks.length === 0) continue;
    
    content += `\n### ${priority}优先级任务 (${tasks.length}个)\n`;
    
    for (const task of tasks) {
      content += `\n#### ${task.type}: ${task.description}\n`;
      content += `- **来源**: ${task.source}\n`;
      content += `- **证据**: ${task.evidence}\n`;
      content += `- **状态**: 待处理\n`;
      content += `- **建议行动**: 需要具体实施\n\n`;
    }
  }
  
  content += `## 建议
  
### 立即行动
1. 审查高优先级任务，制定实施计划
2. 分配资源开始关键任务
3. 建立定期进度检查机制

### 短期计划
1. 完成中优先级任务规划
2. 统一任务跟踪系统
3. 建立任务完成标准

### 长期优化
1. 实现自动化任务跟踪
2. 集成进度监控系统
3. 建立任务完成评估体系

---
*扫描完成时间: ${new Date().toISOString()}*
*OMC工作流版本: 4.1*`;

  return content;
}

// 主函数
async function main() {
  console.log('🚀 开始OMC工作流全盘任务扫描\n');
  
  // 1. 扫描论证文件
  const argumentationResults = scanArgumentationFiles();
  
  // 2. 扫描任务管理文件
  const taskResults = scanTaskManagementFiles();
  
  // 3. 扫描OMC迭代论证
  const iterationResults = scanOMCIterations();
  
  // 4. 分析未完成任务
  const incompleteTasks = analyzeIncompleteTasks(argumentationResults, taskResults, iterationResults);
  
  // 5. 生成报告
  generateTaskReport(incompleteTasks, argumentationResults, taskResults, iterationResults);
  
  console.log('\n' + '='.repeat(70));
  console.log('🔚 OMC工作流任务扫描完成');
  console.log('='.repeat(70));
}

// 执行扫描
main().catch(error => {
  console.error('❌ 扫描执行失败:', error);
  process.exit(1);
});