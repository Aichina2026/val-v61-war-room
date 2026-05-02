#!/usr/bin/env node

/**
 * 智能管理系统文件收集脚本
 * 收集包括但不限于：
 * 1. 智能管理系统
 * 2. 技能、工具
 * 3. 系统文件管理
 * 4. 记忆管理
 * 5. 知识库管理
 * 6. 进程管理
 * 7. 迭代管理
 * 8. 策略管理
 * 9. 数据库管理
 * 10. 向量库管理
 * 11. 特征库管理
 * 12. 文件清理
 * 13. 流量管理
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const workspace = '/root/.openclaw/workspace';
const outputDir = path.join(workspace, '智能管理系统收集');
const reportFile = path.join(outputDir, '系统收集报告.md');

// 关键词列表
const keywords = [
  '智能', '管理', '系统', '技能', '工具',
  '记忆', '知识库', '进程', '迭代', '策略',
  '数据库', '向量', '特征', '清理', '流量',
  'intelligent', 'management', 'system', 'skill', 'tool',
  'memory', 'knowledge', 'process', 'iteration', 'strategy',
  'database', 'vector', 'feature', 'cleanup', 'traffic',
  'agent', 'workflow', 'automation', 'monitor', 'optimize',
  'config', 'resource', 'scheduler', 'router', 'api'
];

// 创建输出目录
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('🔍 开始收集智能管理系统相关文件...');
console.log('='.repeat(60));

// 收集结果
const collection = {
  智能管理系统: [],
  技能工具: [],
  文件管理: [],
  记忆管理: [],
  知识库管理: [],
  进程管理: [],
  迭代管理: [],
  策略管理: [],
  数据库管理: [],
  向量库管理: [],
  特征库管理: [],
  文件清理: [],
  流量管理: [],
  其他相关: []
};

// 文件分类函数
function categorizeFile(filePath, content) {
  const filename = path.basename(filePath).toLowerCase();
  const contentLower = content.toLowerCase();
  
  // 智能管理系统
  if (filename.includes('智能') || filename.includes('intelligent') || 
      filename.includes('管理') || filename.includes('management') ||
      filename.includes('系统') || filename.includes('system')) {
    if (contentLower.includes('agent') || contentLower.includes('workflow') ||
        contentLower.includes('automation') || contentLower.includes('monitor')) {
      return '智能管理系统';
    }
  }
  
  // 技能工具
  if (filename.includes('技能') || filename.includes('skill') ||
      filename.includes('工具') || filename.includes('tool')) {
    return '技能工具';
  }
  
  // 文件管理
  if (filename.includes('文件') || filename.includes('file') ||
      contentLower.includes('file') || contentLower.includes('directory')) {
    return '文件管理';
  }
  
  // 记忆管理
  if (filename.includes('记忆') || filename.includes('memory') ||
      contentLower.includes('memory') || contentLower.includes('recall')) {
    return '记忆管理';
  }
  
  // 知识库管理
  if (filename.includes('知识') || filename.includes('knowledge') ||
      contentLower.includes('knowledge') || contentLower.includes('kb')) {
    return '知识库管理';
  }
  
  // 进程管理
  if (filename.includes('进程') || filename.includes('process') ||
      contentLower.includes('process') || contentLower.includes('pid')) {
    return '进程管理';
  }
  
  // 迭代管理
  if (filename.includes('迭代') || filename.includes('iteration') ||
      contentLower.includes('iteration') || contentLower.includes('cycle')) {
    return '迭代管理';
  }
  
  // 策略管理
  if (filename.includes('策略') || filename.includes('strategy') ||
      contentLower.includes('strategy') || contentLower.includes('policy')) {
    return '策略管理';
  }
  
  // 数据库管理
  if (filename.includes('数据') || filename.includes('database') ||
      contentLower.includes('database') || contentLower.includes('db')) {
    return '数据库管理';
  }
  
  // 向量库管理
  if (filename.includes('向量') || filename.includes('vector') ||
      contentLower.includes('vector') || contentLower.includes('embedding')) {
    return '向量库管理';
  }
  
  // 特征库管理
  if (filename.includes('特征') || filename.includes('feature') ||
      contentLower.includes('feature') || contentLower.includes('characteristic')) {
    return '特征库管理';
  }
  
  // 文件清理
  if (filename.includes('清理') || filename.includes('cleanup') ||
      contentLower.includes('cleanup') || contentLower.includes('clean')) {
    return '文件清理';
  }
  
  // 流量管理
  if (filename.includes('流量') || filename.includes('traffic') ||
      contentLower.includes('traffic') || contentLower.includes('flow')) {
    return '流量管理';
  }
  
  return '其他相关';
}

// 搜索文件
function searchFiles() {
  console.log('📁 搜索工作空间文件...');
  
  // 使用find命令搜索文件
  const findCmd = `find ${workspace} -type f \\( -name "*.md" -o -name "*.js" -o -name "*.json" -o -name "*.cjs" -o -name "*.py" -o -name "*.sh" -o -name "*.yaml" -o -name "*.yml" \\) | head -200`;
  
  try {
    const files = execSync(findCmd, { encoding: 'utf8' }).split('\n').filter(f => f.trim());
    console.log(`📊 找到 ${files.length} 个文件`);
    
    let processed = 0;
    
    for (const filePath of files) {
      if (!fs.existsSync(filePath)) continue;
      
      try {
        const stat = fs.statSync(filePath);
        if (stat.size > 10 * 1024 * 1024) {
          // 跳过大于10MB的文件
          continue;
        }
        
        const content = fs.readFileSync(filePath, 'utf8').substring(0, 10000); // 只读取前10KB
        const category = categorizeFile(filePath, content);
        
        // 检查是否包含关键词
        let hasKeyword = false;
        for (const keyword of keywords) {
          if (content.toLowerCase().includes(keyword.toLowerCase()) || 
              path.basename(filePath).toLowerCase().includes(keyword.toLowerCase())) {
            hasKeyword = true;
            break;
          }
        }
        
        if (hasKeyword) {
          const relativePath = path.relative(workspace, filePath);
          collection[category].push({
            path: relativePath,
            size: stat.size,
            modified: stat.mtime,
            lines: content.split('\n').length
          });
          
          // 复制文件到收集目录
          const targetDir = path.join(outputDir, category);
          if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
          }
          
          const targetPath = path.join(targetDir, path.basename(filePath));
          fs.copyFileSync(filePath, targetPath);
        }
        
        processed++;
        if (processed % 20 === 0) {
          process.stdout.write('.');
        }
        
      } catch (err) {
        // 跳过无法读取的文件
        continue;
      }
    }
    
    console.log('\n✅ 文件搜索完成');
    
  } catch (error) {
    console.error('❌ 搜索文件时出错:', error.message);
  }
}

// 生成报告
function generateReport() {
  console.log('\n📝 生成收集报告...');
  
  let reportContent = `# 智能管理系统文件收集报告
## 生成时间: ${new Date().toISOString()}
## 工作空间: ${workspace}

## 收集概览
`;

  // 统计信息
  let totalFiles = 0;
  for (const [category, files] of Object.entries(collection)) {
    totalFiles += files.length;
    reportContent += `\n### ${category} (${files.length} 个文件)\n`;
    
    if (files.length > 0) {
      reportContent += '| 文件路径 | 大小 | 修改时间 | 行数 |\n';
      reportContent += '|----------|------|----------|------|\n';
      
      for (const file of files.slice(0, 20)) { // 只显示前20个
        const sizeKB = (file.size / 1024).toFixed(1);
        const modified = new Date(file.modified).toLocaleString('zh-CN');
        reportContent += `| ${file.path} | ${sizeKB}KB | ${modified} | ${file.lines} |\n`;
      }
      
      if (files.length > 20) {
        reportContent += `| ... 还有 ${files.length - 20} 个文件 ... | | | |\n`;
      }
    } else {
      reportContent += '*暂无相关文件*\n';
    }
  }
  
  reportContent += `
## 系统分析

### 1. 现有系统架构
基于收集的文件，系统已具备以下能力：

### 2. 缺失功能识别
需要增强的领域：

### 3. 2026年趋势技术
2026年4月1日至4月12日热度上升最快的技术：

### 4. OPCN智能管理系统设计建议
基于现有系统和最新趋势，建议的OPCN系统架构：
`;

  // 写入报告
  fs.writeFileSync(reportFile, reportContent, 'utf8');
  console.log(`✅ 报告已生成: ${reportFile}`);
  
  // 生成统计摘要
  const statsFile = path.join(outputDir, '收集统计.json');
  const stats = {
    收集时间: new Date().toISOString(),
    工作空间: workspace,
    总文件数: totalFiles,
    分类统计: {},
    文件列表: collection
  };
  
  for (const [category, files] of Object.entries(collection)) {
    stats.分类统计[category] = files.length;
  }
  
  fs.writeFileSync(statsFile, JSON.stringify(stats, null, 2), 'utf8');
  console.log(`📊 统计信息: ${statsFile}`);
  
  return { totalFiles, stats };
}

// 主函数
async function main() {
  console.log('🚀 智能管理系统收集开始');
  console.log('='.repeat(60));
  
  // 1. 搜索文件
  searchFiles();
  
  // 2. 生成报告
  const result = generateReport();
  
  // 3. 显示结果
  console.log('\n' + '='.repeat(60));
  console.log('🎉 收集完成');
  console.log(`📊 总收集文件数: ${result.totalFiles}`);
  
  for (const [category, count] of Object.entries(result.stats.分类统计)) {
    if (count > 0) {
      console.log(`  ${category}: ${count} 个文件`);
    }
  }
  
  console.log('\n💡 下一步:');
  console.log('1. 分析收集的报告文件');
  console.log('2. 搜索2026年最新开源项目');
  console.log('3. 启动OMC工作流L3级论证迭代');
  
  console.log('\n🔚 脚本执行完成');
}

// 执行主函数
main().catch(error => {
  console.error('❌ 脚本执行失败:', error);
  process.exit(1);
});