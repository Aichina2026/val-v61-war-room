#!/usr/bin/env node

/**
 * OMC工作流详细任务分析
 * 深入分析已论证但未完成的具体任务
 */

const fs = require('fs');
const path = require('path');

const workspace = '/root/.openclaw/workspace';

console.log('🔍 OMC工作流详细任务分析');
console.log('='.repeat(70));
console.log('目标: 深入分析已论证的具体未完成任务');
console.log('='.repeat(70));

// 加载统一任务数据
function loadUnifiedTaskData() {
  const taskFile = path.join(workspace, 'modules/ai-engine/unified_task_data.json');
  
  if (!fs.existsSync(taskFile)) {
    console.log('⚠️  统一任务数据文件不存在');
    return null;
  }
  
  try {
    const data = JSON.parse(fs.readFileSync(taskFile, 'utf8'));
    console.log(`✅ 加载统一任务数据: ${data.project} (${data.version})`);
    return data;
  } catch (error) {
    console.log(`❌ 加载任务数据失败: ${error.message}`);
    return null;
  }
}

// 分析OMC迭代论证中的未完成任务
function analyzeOMCIterations() {
  console.log('\n📋 分析OMC迭代论证...');
  
  const iterationDir = path.join(workspace, 'OPCN智能管理系统/迭代论证');
  const finalDesignFile = path.join(workspace, 'OPCN智能管理系统/OPCN智能管理系统-最终设计.md');
  
  if (!fs.existsSync(iterationDir)) {
    console.log('⚠️  OMC迭代论证目录不存在');
    return [];
  }
  
  // 检查最终设计文件
  let finalDesignContent = '';
  if (fs.existsSync(finalDesignFile)) {
    finalDesignContent = fs.readFileSync(finalDesignFile, 'utf8');
  }
  
  const iterationFiles = fs.readdirSync(iterationDir)
    .filter(f => f.endsWith('.md'))
    .map(f => path.join(iterationDir, f));
  
  console.log(`📊 分析 ${iterationFiles.length} 个迭代论证文件`);
  
  const incompleteItems = [];
  
  for (const file of iterationFiles.slice(0, 15)) {
    const filename = path.basename(file);
    const iterationMatch = filename.match(/迭代-(\d+)-(.+)\.md/);
    
    if (!iterationMatch) continue;
    
    const iterationNumber = parseInt(iterationMatch[1]);
    const topic = iterationMatch[2];
    
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      // 查找建议、下一步、待办等内容
      const lines = content.split('\n');
      let inActionSection = false;
      let actionItems = [];
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // 检测行动部分
        if (line.includes('下一步') || line.includes('建议') || line.includes('行动') || 
            line.includes('实施') || line.includes('TODO') || line.includes('待办')) {
          inActionSection = true;
        }
        
        // 在行动部分中收集具体项
        if (inActionSection && (line.startsWith('- ') || line.startsWith('* ') || line.startsWith('1.') || line.startsWith('2.'))) {
          // 检查是否已经完成
          const is