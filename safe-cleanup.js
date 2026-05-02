#!/usr/bin/env node
/**
 * 安全冗余清理脚本
 */

const fs = require('fs');
const path = require('path');

class SafeCleanup {
  constructor() {
    this.workspace = '/root/.openclaw/workspace';
    this.reportPath = path.join(this.workspace, 'cleanup-reports', `cleanup-${new Date().toISOString().split('T')[0]}.json`);
    
    // 确保报告目录存在
    const reportDir = path.dirname(this.reportPath);
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
  }

  async analyzeDirectory(dirPath) {
    try {
      const files = fs.readdirSync(dirPath, { withFileTypes: true });
      const result = {
        path: dirPath,
        totalFiles: 0,
        totalSize: 0,
        fileTypes: {},
        candidates: []
      };

      for (const file of files) {
        const fullPath = path.join(dirPath, file.name);
        
        if (file.isDirectory()) {
          const subResult = await this.analyzeDirectory(fullPath);
          result.totalFiles += subResult.totalFiles;
          result.totalSize += subResult.totalSize;
        } else {
          const stats = fs.statSync(fullPath);
          const ext = path.extname(file.name).toLowerCase();
          
          result.totalFiles++;
          result.totalSize += stats.size;
          
          // 统计文件类型
          const type = ext || 'no-extension';
          result.fileTypes[type] = (result.fileTypes[type] || 0) + 1;
          
          // 识别可能的冗余文件
          if (this.isRedundantCandidate(file.name, stats, fullPath)) {
            result.candidates.push({
              path: fullPath,
              name: file.name,
              size: stats.size,
              modified: stats.mtime,
              reason: this.getRedundancyReason(file.name)
            });
          }
        }
      }
      
      return result;
    } catch (error) {
      console.error(`分析目录失败: ${dirPath}`, error.message);
      return null;
    }
  }

  isRedundantCandidate(filename, stats, fullPath) {
    const lowerName = filename.toLowerCase();
    
    // 常见冗余文件模式
    const redundantPatterns = [
      /^~/,                     // 临时文件
      /\.tmp$/i,                // 临时文件
      /\.bak$/i,                // 备份文件
      /-old$/,                  // 旧版本
      /\.old$/i,                // 旧版本
      /\.backup$/i,             // 备份文件
      /\.log$/,                 // 日志文件（特定的）
      /\.zip$/,                 // 压缩备份
      /\.tar$/,                 // 压缩备份
      /\.gz$/,                  // 压缩备份
      /backup_/,               // 备份文件
      /duplicate/,            // 重复
      /copy\s+of/,            // 副本
      /副本/,                   // 中文副本
      /_copy/,                 // 副本
      /_dup/,                  // 重复
      /temp_/,                // 临时
      /tmp_/,                 // 临时
    ];
    
    // 特殊目录检查
    const relativePath = path.relative(this.workspace, fullPath);
    if (relativePath.includes('backup') || relativePath.includes('old') || relativePath.includes('temp')) {
      return true;
    }
    
    // 匹配模式
    for (const pattern of redundantPatterns) {
      if (pattern.test(lowerName)) {
        return true;
      }
    }
    
    // 过小的文件（可能不完整）
    if (stats.size < 100 && filename.includes('.')) {
      return true;
    }
    
    // 过大的重复文件
    if (stats.size > 10000000) { // 10MB以上
      const mainFile = this.findMainVersion(fullPath);
      if (mainFile && mainFile !== fullPath) {
        return true;
      }
    }
    
    return false;
  }

  getRedundancyReason(filename) {
    const lowerName = filename.toLowerCase();
    
    if (/^~/.test(lowerName)) return '临时文件';
    if (/\.tmp$/i.test(lowerName)) return '临时文件';
    if (/\.bak$/i.test(lowerName)) return '备份文件';
    if (/\.old$/i.test(lowerName)) return '旧版本';
    if (/backup_/.test(lowerName)) return '备份文件';
    if (/副本/.test(lowerName)) return '中文副本';
    if (/copy\s+of/.test(lowerName)) return '英文副本';
    if (/\.log$/i.test(lowerName)) return '日志文件';
    if (/\.zip$/i.test(lowerName)) return '压缩备份';
    
    return '其他冗余';
  }

  findMainVersion(filePath) {
    const dir = path.dirname(filePath);
    const ext = path.extname(filePath);
    const baseName = path.basename(filePath, ext);
    
    // 尝试找到主版本（无后缀版本）
    const mainCandidate = path.join(dir, baseName + ext);
    if (fs.existsSync(mainCandidate) && mainCandidate !== filePath) {
      return mainCandidate;
    }
    
    return null;
  }

  async generateReport(analysis) {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        workspace: this.workspace,
        totalFiles: analysis.totalFiles,
        totalSize: this.formatSize(analysis.totalSize),
        fileTypes: analysis.fileTypes,
        candidatesCount: analysis.candidates.length
      },
      candidates: analysis.candidates.map(candidate => ({
        path: path.relative(this.workspace, candidate.path),
        name: candidate.name,
        size: this.formatSize(candidate.size),
        modified: candidate.modified.toISOString(),
        reason: candidate.reason
      })),
      recommendations: this.generateRecommendations(analysis),
      timestamp: new Date().toISOString()
    };

    // 保存报告
    fs.writeFileSync(this.reportPath, JSON.stringify(report, null, 2));
    
    return report;
  }

  generateRecommendations(analysis) {
    const recommendations = [];
    
    if (analysis.candidates.length > 0) {
      recommendations.push({
        priority: '高',
        action: '清理冗余文件',
        details: `发现 ${analysis.candidates.length} 个冗余文件，可安全清理`
      });
    }
    
    if (analysis.totalSize > 1000000000) { // 超过1GB
      recommendations.push({
        priority: '中',
        action: '归档大文件',
        details: '工作区占用空间较大，建议归档非核心文件'
      });
    }
    
    return recommendations;
  }

  formatSize(bytes) {
    if (bytes === 0) return '0 B';
    
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
  }

  async run() {
    console.log('🧹 开始安全冗余分析...');
    console.log('='.repeat(60));
    
    try {
      // 分析工作区
      console.log('\n🔍 分析工作区目录...');
      const analysis = await this.analyzeDirectory(this.workspace);
      
      if (!analysis) {
        console.error('❌ 分析失败');
        return;
      }
      
      // 生成报告
      console.log('\n📊 生成分析报告...');
      const report = await this.generateReport(analysis);
      
      // 显示结果
      console.log('\n' + '='.repeat(60));
      console.log('✅ 冗余分析完成!');
      console.log('='.repeat(60));
      
      console.log(`\n📂 工作区概览:`);
      console.log(`   总文件数: ${analysis.totalFiles}`);
      console.log(`   总大小: ${this.formatSize(analysis.totalSize)}`);
      
      console.log(`\n📋 文件类型分布:`);
      for (const [type, count] of Object.entries(analysis.fileTypes)) {
        console.log(`   ${type}: ${count} 个文件`);
      }
      
      if (analysis.candidates.length > 0) {
        console.log(`\n⚠️  发现冗余候选文件 (${analysis.candidates.length} 个):`);
        analysis.candidates.slice(0, 10).forEach((candidate, i) => {
          console.log(`   ${i+1}. ${path.relative(this.workspace, candidate.path)}`);
          console.log(`      原因: ${candidate.reason}, 大小: ${this.formatSize(candidate.size)}`);
        });
        
        if (analysis.candidates.length > 10) {
          console.log(`   ... 还有 ${analysis.candidates.length - 10} 个文件未显示`);
        }
      } else {
        console.log(`\n✅ 未发现显著的冗余文件`);
      }
      
      console.log(`\n📄 详细报告已保存至: ${this.reportPath}`);
      
    } catch (error) {
      console.error('❌ 清理任务失败:', error.message);
    }
  }
}

// 执行
const cleanup = new SafeCleanup();
cleanup.run().catch(console.error);