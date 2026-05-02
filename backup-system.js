#!/usr/bin/env node
/**
 * 4AI系统备份脚本
 * 用于定时维护任务中的系统备份
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { createHash } = require('crypto');

class SystemBackup {
  constructor(options = {}) {
    this.options = {
      backupDir: '/root/.openclaw/backups',
      retentionDays: 30,
      compress: true,
      fullBackup: false,
      ...options
    };
    
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.backupName = `backup-${this.timestamp}`;
    this.backupPath = path.join(this.options.backupDir, this.backupName);
    
    // 确保备份目录存在
    if (!fs.existsSync(this.options.backupDir)) {
      fs.mkdirSync(this.options.backupDir, { recursive: true });
    }
    
    this.report = {
      timestamp: new Date().toISOString(),
      backup_name: this.backupName,
      options: this.options,
      items: [],
      stats: {},
      errors: [],
      summary: 'pending'
    };
  }

  async runBackup() {
    console.log('💾 开始4AI系统备份');
    console.log('='.repeat(60));
    
    try {
      // 1. 备份关键配置
      await this.backupConfigurations();
      
      // 2. 备份工作空间
      await this.backupWorkspace();
      
      // 3. 备份数据库/状态
      await this.backupData();
      
      // 4. 如果是完整备份，备份系统文件
      if (this.options.fullBackup) {
        await this.backupSystemFiles();
      }
      
      // 5. 压缩备份
      if (this.options.compress) {
        await this.compressBackup();
      }
      
      // 6. 清理旧备份
      await this.cleanupOldBackups();
      
      // 7. 生成报告
      await this.generateReport();
      
      console.log('✅ 备份完成');
      console.log(`📦 备份位置: ${this.backupPath}${this.options.compress ? '.tar.gz' : ''}`);
      
    } catch (error) {
      console.error('❌ 备份失败:', error.message);
      this.report.summary = 'failed';
      this.report.error = error.message;
      await this.saveReport();
    }
  }

  async backupConfigurations() {
    console.log('📋 备份配置文件...');
    
    const configFiles = [
      { source: '/root/.openclaw/openclaw.json', category: 'config' },
      { source: '/root/.openclaw/.env', category: 'config' },
      { source: '/root/.openclaw/config/', category: 'config', isDir: true },
      { source: '/root/.openclaw/cron/', category: 'cron', isDir: true },
      { source: '/root/.openclaw/plugins/', category: 'plugins', isDir: true }
    ];
    
    for (const file of configFiles) {
      try {
        const targetDir = path.join(this.backupPath, 'configurations');
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        
        if (file.isDir) {
          if (fs.existsSync(file.source)) {
            const dirName = path.basename(file.source);
            const targetPath = path.join(targetDir, dirName);
            execSync(`cp -r "${file.source}" "${targetPath}"`);
            
            const stats = fs.statSync(file.source);
            this.report.items.push({
              type: 'directory',
              source: file.source,
              target: targetPath,
              size: this.getDirectorySize(file.source),
              category: file.category,
              status: 'success'
            });
            
            console.log(`   ✅ ${file.source}`);
          }
        } else {
          if (fs.existsSync(file.source)) {
            const fileName = path.basename(file.source);
            const targetPath = path.join(targetDir, fileName);
            fs.copyFileSync(file.source, targetPath);
            
            const stats = fs.statSync(file.source);
            this.report.items.push({
              type: 'file',
              source: file.source,
              target: targetPath,
              size: stats.size,
              category: file.category,
              status: 'success'
            });
            
            console.log(`   ✅ ${file.source}`);
          }
        }
      } catch (error) {
        this.report.errors.push(`配置备份失败 ${file.source}: ${error.message}`);
        console.log(`   ❌ ${file.source}: ${error.message}`);
      }
    }
  }

  async backupWorkspace() {
    console.log('📁 备份工作空间...');
    
    const workspaceDirs = [
      { source: '/root/.openclaw/workspace', category: 'workspace' },
      { source: '/root/.openclaw/workspace_refactored', category: 'workspace' },
      { source: '/root/workspace', category: 'user_workspace' }
    ];
    
    for (const dir of workspaceDirs) {
      try {
        if (fs.existsSync(dir.source)) {
          const targetDir = path.join(this.backupPath, 'workspaces', path.basename(dir.source));
          
          // 排除不需要备份的目录
          const excludePatterns = [
            'node_modules',
            '.git',
            '.cache',
            '*.log',
            '*.tmp',
            'temp_*'
          ];
          
          const excludeArgs = excludePatterns.map(pattern => `--exclude="${pattern}"`).join(' ');
          execSync(`rsync -av ${excludeArgs} "${dir.source}/" "${targetDir}/"`);
          
          const size = this.getDirectorySize(dir.source);
          this.report.items.push({
            type: 'workspace',
            source: dir.source,
            target: targetDir,
            size: size,
            category: dir.category,
            status: 'success'
          });
          
          console.log(`   ✅ ${dir.source} (${this.formatSize(size)})`);
        }
      } catch (error) {
        this.report.errors.push(`工作空间备份失败 ${dir.source}: ${error.message}`);
        console.log(`   ❌ ${dir.source}: ${error.message}`);
      }
    }
  }

  async backupData() {
    console.log('🗄️  备份数据文件...');
    
    const dataFiles = [
      { source: '/root/.openclaw/agents/', category: 'agents', isDir: true },
      { source: '/root/.openclaw/logs/', category: 'logs', isDir: true },
      { source: '/root/.openclaw/workspace/memory/', category: 'memory', isDir: true }
    ];
    
    for (const file of dataFiles) {
      try {
        if (fs.existsSync(file.source)) {
          const targetDir = path.join(this.backupPath, 'data', path.basename(file.source));
          
          if (file.isDir) {
            execSync(`cp -r "${file.source}" "${targetDir}"`);
            const size = this.getDirectorySize(file.source);
            
            this.report.items.push({
              type: 'data',
              source: file.source,
              target: targetDir,
              size: size,
              category: file.category,
              status: 'success'
            });
            
            console.log(`   ✅ ${file.source} (${this.formatSize(size)})`);
          }
        }
      } catch (error) {
        this.report.errors.push(`数据备份失败 ${file.source}: ${error.message}`);
        console.log(`   ❌ ${file.source}: ${error.message}`);
      }
    }
  }

  async backupSystemFiles() {
    console.log('🔧 备份系统文件...');
    
    const systemFiles = [
      { source: '/etc/hosts', category: 'system' },
      { source: '/etc/crontab', category: 'system' },
      { source: '/root/.bashrc', category: 'system' },
      { source: '/root/.profile', category: 'system' },
      { source: '/root/.ssh/', category: 'ssh', isDir: true }
    ];
    
    for (const file of systemFiles) {
      try {
        if (fs.existsSync(file.source)) {
          const targetDir = path.join(this.backupPath, 'system');
          if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
          }
          
          if (file.isDir) {
            const dirName = path.basename(file.source);
            const targetPath = path.join(targetDir, dirName);
            execSync(`cp -r "${file.source}" "${targetPath}"`);
            
            const size = this.getDirectorySize(file.source);
            this.report.items.push({
              type: 'system',
              source: file.source,
              target: targetPath,
              size: size,
              category: file.category,
              status: 'success'
            });
          } else {
            const fileName = path.basename(file.source);
            const targetPath = path.join(targetDir, fileName);
            fs.copyFileSync(file.source, targetPath);
            
            const stats = fs.statSync(file.source);
            this.report.items.push({
              type: 'system',
              source: file.source,
              target: targetPath,
              size: stats.size,
              category: file.category,
              status: 'success'
            });
          }
          
          console.log(`   ✅ ${file.source}`);
        }
      } catch (error) {
        this.report.errors.push(`系统文件备份失败 ${file.source}: ${error.message}`);
        console.log(`   ❌ ${file.source}: ${error.message}`);
      }
    }
  }

  async compressBackup() {
    console.log('🗜️  压缩备份文件...');
    
    try {
      const backupDir = path.dirname(this.backupPath);
      const backupName = path.basename(this.backupPath);
      const tarPath = `${this.backupPath}.tar.gz`;
      
      execSync(`cd "${backupDir}" && tar -czf "${tarPath}" "${backupName}"`);
      
      // 删除原始目录
      execSync(`rm -rf "${this.backupPath}"`);
      
      // 更新备份路径
      this.backupPath = tarPath;
      
      const stats = fs.statSync(tarPath);
      this.report.compression = {
        enabled: true,
        format: 'tar.gz',
        size: stats.size,
        ratio: 'N/A'
      };
      
      console.log(`   ✅ 压缩完成: ${this.formatSize(stats.size)}`);
      
    } catch (error) {
      this.report.errors.push(`压缩失败: ${error.message}`);
      console.log(`   ❌ 压缩失败: ${error.message}`);
    }
  }

  async cleanupOldBackups() {
    console.log('🧹 清理旧备份...');
    
    try {
      const files = fs.readdirSync(this.options.backupDir);
      const now = new Date();
      let deletedCount = 0;
      
      for (const file of files) {
        if (file.startsWith('backup-')) {
          const filePath = path.join(this.options.backupDir, file);
          const stats = fs.statSync(filePath);
          const daysDiff = (now - stats.mtime) / (1000 * 60 * 60 * 24);
          
          if (daysDiff > this.options.retentionDays) {
            fs.unlinkSync(filePath);
            deletedCount++;
            console.log(`   🗑️  删除旧备份: ${file}`);
          }
        }
      }
      
      this.report.cleanup = {
        retention_days: this.options.retentionDays,
        deleted_count: deletedCount
      };
      
      console.log(`   ✅ 清理完成，删除了 ${deletedCount} 个旧备份`);
      
    } catch (error) {
      this.report.errors.push(`清理失败: ${error.message}`);
      console.log(`   ⚠️  清理失败: ${error.message}`);
    }
  }

  async generateReport() {
    // 计算统计信息
    const totalItems = this.report.items.length;
    const successfulItems = this.report.items.filter(item => item.status === 'success').length;
    const totalSize = this.report.items.reduce((sum, item) => sum + (item.size || 0), 0);
    const errorCount = this.report.errors.length;
    
    this.report.stats = {
      total_items: totalItems,
      successful_items: successfulItems,
      failed_items: totalItems - successfulItems,
      total_size: totalSize,
      total_size_formatted: this.formatSize(totalSize),
      error_count: errorCount
    };
    
    // 确定备份状态
    if (errorCount === 0 && successfulItems > 0) {
      this.report.summary = 'success';
      this.report.status = '✅ 备份成功';
    } else if (successfulItems > 0) {
      this.report.summary = 'partial';
      this.report.status = '⚠️  备份部分成功';
    } else {
      this.report.summary = 'failed';
      this.report.status = '❌ 备份失败';
    }
    
    // 保存报告
    const reportPath = path.join(this.options.backupDir, `${this.backupName}-report.json`);
    fs.writeFileSync(reportPath, JSON.stringify(this.report, null, 2));
    
    // 更新最新备份链接
    const latestLink = path.join(this.options.backupDir, 'latest-backup-report.json');
    if (fs.existsSync(latestLink)) {
      fs.unlinkSync(latestLink);
    }
    fs.symlinkSync(reportPath, latestLink);
    
    this.report.report_path = reportPath;
  }

  async saveReport() {
    const reportPath = path.join(this.options.backupDir, `${this.backupName}-report.json`);
    try {
      fs.writeFileSync(reportPath, JSON.stringify(this.report, null, 2));
    } catch (error) {
      console.error('保存报告失败:', error.message);
    }
  }

  getDirectorySize(dirPath) {
    try {
      const result = execSync(`du -sb "${dirPath}" 2>/dev/null | cut -f1`).toString().trim();
      return parseInt(result) || 0;
    } catch (error) {
      return 0;
    }
  }

  formatSize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }
}

// 命令行接口
if (require.main === module) {
  const args = process.argv.slice(2);
  
  const options = {
    fullBackup: args.includes('--full'),
    compress: !args.includes('--no-compress'),
    retentionDays: 30
  };
  
  const backup = new SystemBackup(options);
  
  if (args.includes('--help')) {
    console.log(`
4AI系统备份工具

用法:
  node backup-system.js [选项]

选项:
  --full          完整系统备份（包括系统文件）
  --no-compress   不压缩备份文件
  --help          显示帮助信息

示例:
  node backup-system.js --full
  node backup-system.js --no-compress
    `);
  } else {
    backup.runBackup();
  }
}

module.exports = SystemBackup;