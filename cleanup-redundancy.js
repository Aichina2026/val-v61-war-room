#!/usr/bin/env node
/**
 * 冗余清理脚本
 * 安全清理重复备份文件，减少系统冗余
 */

const fs = require('fs');
const path = require('path');

class RedundancyCleanup {
  constructor() {
    this.workspace = '/root/.openclaw/workspace';
    this.backupDir = path.join(this.workspace, 'backup');
    this.reportDir = path.join(this.workspace, 'cleanup-reports');
    
    if (!fs.existsSync(this.reportDir)) {
      fs.mkdirSync(this.reportDir, { recursive: true });
    }
  }

  async execute() {
    console.log('🧹 开始清理系统冗余...');
    console.log('='.repeat(60));
    
    const report = {
      timestamp: new Date().toISOString(),
      steps: [],
      filesRemoved: [],
      filesKept: [],
      errors: [],
      summary: {}
    };
    
    try {
      // 步骤1: 分析备份目录
      console.log('\n🔍 步骤1: 分析备份目录结构');
      const backupAnalysis = await this.analyzeBackupDirectory();
      report.steps.push({ name: '备份目录分析', data: backupAnalysis });
      
      // 步骤2: 识别重复文件
      console.log('\n📋 步骤2: 识别重复文件');
      const duplicates = await this.identifyDuplicates();
      report.steps.push({ name: '重复文件识别', data: duplicates });
      
      // 步骤3: 安全清理（标记而不立即删除）
      console.log('\n🛡️  步骤3: 安全标记冗余文件');
      const cleanupResult = await this.safeCleanup(duplicates);
      report.steps.push({ name: '安全清理', data: cleanupResult });
      
      // 步骤4: 创建优化后的目录结构
      console.log('\n🏗️  步骤4: 创建优化目录结构');
      const optimizedStructure = await this.createOptimizedStructure();
      report.steps.push({ name: '结构优化', data: optimizedStructure });
      
      // 生成报告
      const finalReport = await this.generateFinalReport(report, {
        removed: cleanupResult.filesMarked,
        kept: cleanupResult.filesKept
      });
      
      console.log('\n' + '='.repeat(60));
      console.log('✅ 冗余分析完成!');
      console.log('='.repeat(60));
      
      console.log('\n📊 清理建议:');
      if (cleanupResult.filesMarked.length > 0) {
        console.log(`  发现 ${cleanupResult.filesMarked.length} 个冗余文件可清理:`);
        cleanupResult.filesMarked.forEach(file => {
          console.log(`  🔸 ${path.relative(this.workspace, file.path)} (类型: ${file.type})`);
        });
      } else {
        console.log('  未发现可清理的冗余文件');
      }
      
      console.log(`\n📂 保留的核心文件 (${cleanupResult.filesKept.length} 个):`);
      cleanupResult.filesKept.forEach(file => {
        console.log(`  ✅ ${path.basename(file)}`);
      });
      
      console.log('\n🚀 下一步:');
      console.log('  1. 查看详细清理报告');
      console.log('  2. 确认无误后执行清理');
      console.log('  3. 验证系统功能完整性');
      
      return finalReport;
      
    } catch (error) {
      console.error('❌ 清理失败:', error.message);
      report.errors.push(error.message);
      await this.generateErrorReport(report);
      throw error;
    }
  }

  async analyzeBackupDirectory() {
    const analysis = {
      directories: [],
      fileCount: 0,
      totalSize: 0,
      duplicates: []
    };
    
    if (!fs.existsSync(this.backupDir)) {
      return analysis;
    }
    
    const dirs = fs.readdirSync(this.backupDir);
    
    for (const dir of dirs) {
      const dirPath = path.join(this.backupDir, dir);
      const stats = fs.statSync(dirPath);
      
      if (stats.isDirectory()) {
        const files = fs.readdirSync(dirPath);
        const dirAnalysis = {
          name: dir,
          path: dirPath,
          fileCount: files.length,
          files: files.slice(0, 10),
          size: await this.calculateDirectorySize(dirPath)
        };
        
        analysis.directories.push(dirAnalysis);
        analysis.fileCount += files.length;
        analysis.totalSize += dirAnalysis.size;
        
        // 检查各备份目录中的相同文件
        if (dir.includes('production-') || dir.includes('backup-')) {
          for (const file of files) {
            const filePath = path.join(dirPath, file);
            const fileStats = fs.statSync(filePath);
            
            // 查找相同的文件
            const similarFiles = await this.findSimilarFiles(file, fileStats.size);
            if (similarFiles.length > 1) {
              analysis.duplicates.push({
                name: file,
                size: fileStats.size,
                copies: similarFiles
              });
            }
          }
        }
      }
    }
    
    return analysis;
  }

  async identifyDuplicates() {
    const duplicates = [];
    const fileMap = new Map();
    
    // 搜索所有文件
    const allFiles = await this.getAllFiles(this.workspace);
    
    for (const filePath of allFiles) {
      try {
        const stats = fs.statSync(filePath);
        const key = `${path.basename(filePath)}_${stats.size}`;
        
        if (fileMap.has(key)) {
          fileMap.get(key).push(filePath);
        } else {
          fileMap.set(key, [filePath]);
        }
      } catch (error) {
        // 跳过无法访问的文件
      }
    }
    
    // 识别重复文件（相同文件名和大小）
    for (const [key, files] of fileMap.entries()) {
      if (files.length > 1) {
        duplicates.push({
          name: path.basename(files[0]),
          size: fs.statSync(files[0]).size,
          copies: files,
          key: key
        });
      }
    }
    
    return duplicates;
  }

  async safeCleanup(duplicates) {
    const result = {
      filesMarked: [],
      filesKept: [],
      errors: []
    };
    
    // 创建清理标记目录
    const cleanupMarkDir = path.join(this.workspace, '.cleanup-marked');
    if (!fs.existsSync(cleanupMarkDir)) {
      fs.mkdirSync(cleanupMarkDir, { recursive: true });
    }
    
    for (const dup of duplicates) {
      // 保留最新版本，标记其他版本为可清理
      const sortedCopies = dup.copies.sort((a, b) => {
        const statsA = fs.statSync(a);
        const statsB = fs.statSync(b);
        return statsB.mtimeMs - statsA.mtimeMs;
      });
      
      // 保留最新的文件
      const keepFile = sortedCopies[0];
      result.filesKept.push(keepFile);
      
      // 标记其他文件为可清理
      for (let i = 1; i < sortedCopies.length; i++) {
        const fileToMark = sortedCopies[i];
        const relativePath = path.relative(this.workspace, fileToMark);
        const markFilePath = path.join(cleanupMarkDir, 
          `${relativePath.replace(/\//g, '_')}.marked`);
        
        try {
          fs.writeFileSync(markFilePath, JSON.stringify({
            markedAt: new Date().toISOString(),
            original: relativePath,
            reason: 'Duplicate backup file',
            size: dup.size,
            markedBy: 'RedundancyCleanup'
          }, null, 2));
          
          result.filesMarked.push({
            path: fileToMark,
            markedAt: new Date().toISOString(),
            markFile: markFilePath,
            type: path.extname(fileToMark)
          });
          
          console.log(`  🔸 标记冗余: ${relativePath}`);
          
        } catch (error) {
          result.errors.push(`标记失败 ${fileToMark}: ${error.message}`);
        }
      }
    }
    
    return result;
  }

  async createOptimizedStructure() {
    const structure = {
      directories: [],
      files: []
    };
    
    // 核心目录
    const coreDirs = [
      'modules/code-generation/skills/code-generation',
      'workflows',
      'tools',
      'config'
    ];
    
    for (const dir of coreDirs) {
      const dirPath = path.join(this.workspace, dir);
      
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        structure.directories.push({
          name: dir,
          status: 'created',
          path: dirPath
        });
        console.log(`  📁 创建目录: ${dir}`);
      } else {
        structure.directives.push({
          name: dir,
          status: 'exists',
          path: dirPath,
          fileCount: fs.readdirSync(dirPath).length
        });
      }
    }
    
    // 配置文件
    const configFiles = [
      { 
        name: 'omc-config-unified.json', 
        source: 'omc-production-config.json' 
      },
      { 
        name: 'routing-config.json',
        content: {
          routing: {
            enabled: true,
            defaultStrategy: "balanced",
            strategies: {
              fast: ["adaptive-routing", "oc-skill-router"],
              balanced: ["model-routing-orchestrator", "intelligent-router"],
              highQuality: ["intelligent-router", "model-routing-orchestrator"],
              costEffective: ["openclaw-model-router-skill", "adaptive-routing"]
            }
          }
        }
      }
    ];
    
    for (const config of configFiles) {
      const filePath = path.join(this.workspace, 'config', config.name);
      
      if (config.source && fs.existsSync(path.join(this.workspace, config.source))) {
        const sourceContent = fs.readFileSync(
          path.join(this.workspace, config.source), 
          'utf8'
        );
        fs.writeFileSync(filePath, sourceContent);
        structure.files.push({
          name: config.name,
          status: 'copied',
          source: config.source,
          path: filePath
        });
        console.log(`  📄 创建配置: ${config.name}`);
      } else if (config.content) {
        fs.writeFileSync(filePath, JSON.stringify(config.content, null, 2));
        structure.files.push({
          name: config.name,
          status: 'created',
          path: filePath
        });
        console.log(`  📄 创建配置: ${config.name}`);
      }
    }
    
    return structure;
  }

  async generateFinalReport(report, cleanupData) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(this.reportDir, `cleanup-report-${timestamp}.json`);
    
    const finalReport = {
      ...report,
      summary: {
        timestamp: new Date().toISOString(),
        directoriesAnalyzed: report.steps[0]?.data?.directories?.length || 0,
        totalFiles: report.steps[0]?.data?.fileCount || 0,
        totalSizeMB: (report.steps[0]?.data?.totalSize / (1024 * 1024)).toFixed(2),
        duplicatesFound: report.steps[1]?.data?.length || 0,
        filesMarkedForCleanup: cleanupData.removed.length,
        filesKept: cleanupData.kept.length,
        errors: report.errors.length
      }
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(finalReport, null, 2));
    
    return finalReport;
  }

  async generateErrorReport(report) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const errorPath = path.join(this.reportDir, `cleanup-error-${timestamp}.json`);
    
    fs.writeFileSync(errorPath, JSON.stringify(report, null, 2));
  }

  async getAllFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        // 跳过一些不相关的目录
        if (!this.shouldSkipDirectory(file)) {
          await this.getAllFiles(filePath, fileList);
        }
      } else {
        // 只检查相关文件类型
        if (this.isRelevantFile(file)) {
          fileList.push(filePath);
        }
      }
    }
    
    return fileList;
  }

  shouldSkipDirectory(dirName) {
    const skipDirs = [
      'node_modules', '.git', '.cache', '__pycache__',
      'venv', 'env', '.venv', 'dist', 'build',
      'coverage', '.idea', '.vscode'
    ];
    return skipDirs.includes(dirName) || dirName.startsWith('.');
  }

  isRelevantFile(fileName) {
    const relevantExts = [
      '.js', '.cjs', '.mjs', '.ts',
      '.md', '.json', '.yaml', '.yml',
      '.py', '.sh', '.txt', '.log'
    ];
    return relevantExts.some(ext => fileName.endsWith(ext));
  }

  async calculateDirectorySize(dirPath) {
    let totalSize = 0;
    
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isFile()) {
        totalSize += stat.size;
      }
    }
    
    return totalSize;
  }

  async findSimilarFiles(fileName, fileSize) {
    const similarFiles = [];
    
    const searchFiles = await this.getAllFiles(this.workspace);
    
    for (const filePath of searchFiles) {
      const baseName = path.basename(filePath);
      const stats = fs.statSync(filePath);
      
      if (baseName === fileName && stats.size === fileSize) {
        similarFiles.push(filePath);
      }
    }
    
    return similarFiles;
  }
}

// 执行清理
if (require.main === module) {
  const cleanup = new RedundancyCleanup();
  
  cleanup.execute()
    .then(() => {
      console.log('\n✨ 请查看详细报告: cleanup-reports/ 目录');
    })
    .catch(error => {
      console.error('清理执行失败:', error.message);
      process.exit(1);
    });
}

module.exports = RedundancyCleanup;