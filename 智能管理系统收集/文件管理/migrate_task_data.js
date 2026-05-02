#!/usr/bin/env node
/**
 * 任务数据迁移脚本
 * 将现有任务数据迁移到统一系统
 * 版本: 1.0.0 (2026-04-09)
 */

const fs = require('fs');
const path = require('path');

class TaskDataMigrator {
  constructor() {
    this.workspacePath = __dirname;
    this.migrationLog = [];
    this.init();
  }
  
  init() {
    console.log('🚚 初始化任务数据迁移工具...');
    this.migrationLog.push({
      timestamp: new Date().toISOString(),
      action: 'init',
      message: '迁移工具初始化'
    });
  }
  
  // 备份源数据
  async backupSourceData() {
    console.log('💾 备份源数据...');
    
    const backupDir = path.join(this.workspacePath, 'backup', 'task_migration');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const backupFiles = [
      '国产代码生成系统任务计划.json',
      'task_progress.json',
      'memory/task_progress.json',
      'task_report_*.json'
    ];
    
    let backupCount = 0;
    
    for (const filePattern of backupFiles) {
      try {
        if (filePattern.includes('*')) {
          // 处理通配符
          const dir = path.dirname(filePattern);
          const pattern = path.basename(filePattern);
          const dirPath = path.join(this.workspacePath, dir);
          
          if (fs.existsSync(dirPath)) {
            const files = fs.readdirSync(dirPath);
            const matchingFiles = files.filter(f => f.includes(pattern.replace('*', '')));
            
            for (const file of matchingFiles) {
              const sourcePath = path.join(dirPath, file);
              const backupPath = path.join(backupDir, `${Date.now()}_${file}`);
              fs.copyFileSync(sourcePath, backupPath);
              backupCount++;
              console.log(`  ✅ 备份: ${file}`);
            }
          }
        } else {
          const sourcePath = path.join(this.workspacePath, filePattern);
          if (fs.existsSync(sourcePath)) {
            const backupPath = path.join(backupDir, `${Date.now()}_${path.basename(filePattern)}`);
            fs.copyFileSync(sourcePath, backupPath);
            backupCount++;
            console.log(`  ✅ 备份: ${path.basename(filePattern)}`);
          }
        }
      } catch (error) {
        console.log(`  ⚠️  备份失败: ${filePattern} - ${error.message}`);
      }
    }
    
    this.migrationLog.push({
      timestamp: new Date().toISOString(),
      action: 'backup',
      files: backupCount,
      message: `备份了 ${backupCount} 个文件`
    });
    
    console.log(`✅ 数据备份完成: ${backupCount} 个文件`);
    return backupCount;
  }
  
  // 分析现有任务数据
  analyzeTaskData() {
    console.log('🔍 分析现有任务数据...');
    
    const analysis = {
      sourceSystems: [],
      totalTasks: 0,
      totalPhases: 0,
      dataFormat: {}
    };
    
    // 分析主任务文件
    const mainTaskFile = path.join(this.workspacePath, '国产代码生成系统任务计划.json');
    if (fs.existsSync(mainTaskFile)) {
      try {
        const data = JSON.parse(fs.readFileSync(mainTaskFile, 'utf8'));
        analysis.sourceSystems.push({
          name: '国产代码生成系统任务计划.json',
          type: 'professional',
          tasks: data.phases?.reduce((sum, phase) => sum + (phase.tasks?.length || 0), 0) || 0,
          phases: data.phases?.length || 0,
          format: 'detailed'
        });
      } catch (error) {
        console.log(`  ⚠️  分析失败: ${mainTaskFile} - ${error.message}`);
      }
    }
    
    // 分析简单任务文件
    const simpleTaskFile = path.join(this.workspacePath, 'task_progress.json');
    if (fs.existsSync(simpleTaskFile)) {
      try {
        const data = JSON.parse(fs.readFileSync(simpleTaskFile, 'utf8'));
        analysis.sourceSystems.push({
          name: 'task_progress.json',
          type: 'simple',
          tasks: data.tasks?.length || 0,
          phases: 0,
          format: 'basic'
        });
      } catch (error) {
        console.log(`  ⚠️  分析失败: ${simpleTaskFile} - ${error.message}`);
      }
    }
    
    // 计算总数
    analysis.totalTasks = analysis.sourceSystems.reduce((sum, sys) => sum + sys.tasks, 0);
    analysis.totalPhases = analysis.sourceSystems.reduce((sum, sys) => sum + sys.phases, 0);
    
    console.log(`📊 分析结果:`);
    console.log(`  发现 ${analysis.sourceSystems.length} 个任务系统`);
    console.log(`  总任务数: ${analysis.totalTasks}`);
    console.log(`  总阶段数: ${analysis.totalPhases}`);
    
    analysis.sourceSystems.forEach(sys => {
      console.log(`  - ${sys.name}: ${sys.tasks} 个任务, ${sys.phases} 个阶段`);
    });
    
    this.migrationLog.push({
      timestamp: new Date().toISOString(),
      action: 'analysis',
      ...analysis
    });
    
    return analysis;
  }
  
  // 转换数据格式到统一系统
  convertToUnifiedFormat() {
    console.log('🔄 转换数据格式到统一系统...');
    
    const unifiedData = {
      project: '统一任务管理系统',
      version: '1.0.0',
      created: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      status: 'active',
      source: 'migration',
      migrationTimestamp: new Date().toISOString(),
      phases: [],
      tasks: [],
      cleanupEnabled: true,
      integrations: {
        enableAiAcceleration: true,
        enableAutoCleanup: true,
        enableMemoryCompaction: true,
        enableHealthMonitoring: true
      }
    };
    
    // 1. 从专业任务系统迁移
    const mainTaskFile = path.join(this.workspacePath, '国产代码生成系统任务计划.json');
    if (fs.existsSync(mainTaskFile)) {
      try {
        const data = JSON.parse(fs.readFileSync(mainTaskFile, 'utf8'));
        
        // 迁移项目信息
        if (data.project) unifiedData.project = data.project;
        if (data.status) unifiedData.status = data.status;
        if (data.created) unifiedData.originalCreated = data.created;
        
        // 迁移阶段信息
        if (data.phases && Array.isArray(data.phases)) {
          unifiedData.phases = data.phases.map(phase => ({
            id: phase.id || `phase-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: phase.name,
            duration: phase.duration,
            startDate: phase.startDate,
            endDate: phase.endDate,
            status: phase.status,
            progress: phase.progress || 0,
            tasks: phase.tasks || []
          }));
          
          // 提取所有任务
          data.phases.forEach(phase => {
            if (phase.tasks && Array.isArray(phase.tasks)) {
              phase.tasks.forEach(task => {
                unifiedData.tasks.push({
                  id: task.id || `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  name: task.name,
                  description: task.description,
                  status: task.status,
                  progress: task.progress || (task.status === 'completed' ? 100 : 0),
                  priority: task.priority || 'medium',
                  createdAt: task.createdAt || new Date().toISOString(),
                  updatedAt: task.updatedAt || new Date().toISOString(),
                  completionDate: task.completionDate,
                  phaseId: phase.id,
                  source: 'professional_system',
                  originalData: task
                });
              });
            }
          });
        }
        
        console.log(`  ✅ 从专业系统迁移: ${unifiedData.phases.length} 个阶段, ${unifiedData.tasks.length} 个任务`);
      } catch (error) {
        console.log(`  ⚠️  专业系统迁移失败: ${error.message}`);
      }
    }
    
    // 2. 从简单任务系统迁移
    const simpleTaskFile = path.join(this.workspacePath, 'task_progress.json');
    if (fs.existsSync(simpleTaskFile)) {
      try {
        const data = JSON.parse(fs.readFileSync(simpleTaskFile, 'utf8'));
        
        if (data.tasks && Array.isArray(data.tasks)) {
          data.tasks.forEach(task => {
            // 检查是否已存在相同任务
            const existingTask = unifiedData.tasks.find(t => t.name === task.name);
            if (!existingTask) {
              unifiedData.tasks.push({
                id: task.id || `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: task.name,
                description: task.description,
                status: task.status,
                progress: task.progress || (task.status === 'completed' ? 100 : 0),
                priority: task.priority || 'medium',
                createdAt: task.createdAt || new Date().toISOString(),
                updatedAt: task.updatedAt || new Date().toISOString(),
                completionDate: task.completedAt,
                phaseId: 'general',
                source: 'simple_system',
                notes: task.notes,
                originalData: task
              });
            }
          });
        }
        
        console.log(`  ✅ 从简单系统迁移: ${data.tasks?.length || 0} 个任务`);
      } catch (error) {
        console.log(`  ⚠️  简单系统迁移失败: ${error.message}`);
      }
    }
    
    // 3. 去重和整理
    this.deduplicateTasks(unifiedData);
    
    // 4. 计算统计信息
    unifiedData.stats = {
      totalTasks: unifiedData.tasks.length,
      totalPhases: unifiedData.phases.length,
      activeTasks: unifiedData.tasks.filter(t => t.status === 'active').length,
      completedTasks: unifiedData.tasks.filter(t => t.status === 'completed').length,
      migrationSource: unifiedData.tasks.reduce((sources, task) => {
        sources[task.source] = (sources[task.source] || 0) + 1;
        return sources;
      }, {})
    };
    
    console.log(`📊 转换完成:`);
    console.log(`  总任务数: ${unifiedData.stats.totalTasks}`);
    console.log(`  活跃任务: ${unifiedData.stats.activeTasks}`);
    console.log(`  已完成任务: ${unifiedData.stats.completedTasks}`);
    console.log(`  来源统计: ${JSON.stringify(unifiedData.stats.migrationSource)}`);
    
    this.migrationLog.push({
      timestamp: new Date().toISOString(),
      action: 'conversion',
      stats: unifiedData.stats
    });
    
    return unifiedData;
  }
  
  // 去重任务
  deduplicateTasks(unifiedData) {
    const uniqueTasks = [];
    const seenTasks = new Set();
    
    unifiedData.tasks.forEach(task => {
      const taskKey = `${task.name}-${task.description}`;
      if (!seenTasks.has(taskKey)) {
        seenTasks.add(taskKey);
        uniqueTasks.push(task);
      } else {
        console.log(`  🔄 去重任务: ${task.name}`);
      }
    });
    
    unifiedData.tasks = uniqueTasks;
  }
  
  // 保存统一数据
  async saveUnifiedData(unifiedData) {
    console.log('💾 保存统一数据...');
    
    const unifiedFilePath = path.join(this.workspacePath, 'unified_task_data.json');
    
    try {
      fs.writeFileSync(unifiedFilePath, JSON.stringify(unifiedData, null, 2));
      console.log(`✅ 统一数据已保存: ${unifiedFilePath} (${fs.statSync(unifiedFilePath).size} 字节)`);
      
      this.migrationLog.push({
        timestamp: new Date().toISOString(),
        action: 'save_unified_data',
        file: unifiedFilePath,
        size: fs.statSync(unifiedFilePath).size
      });
      
      return unifiedFilePath;
    } catch (error) {
      console.log(`❌ 保存统一数据失败: ${error.message}`);
      throw error;
    }
  }
  
  // 验证迁移结果
  async verifyMigration() {
    console.log('🔍 验证迁移结果...');
    
    const verification = {
      timestamp: new Date().toISOString(),
      checks: [],
      passed: true
    };
    
    // 检查统一数据文件
    const unifiedFilePath = path.join(this.workspacePath, 'unified_task_data.json');
    if (fs.existsSync(unifiedFilePath)) {
      try {
        const data = JSON.parse(fs.readFileSync(unifiedFilePath, 'utf8'));
        verification.checks.push({
          check: 'unified_data_file',
          status: 'passed',
          details: `文件存在，${data.tasks?.length || 0} 个任务`
        });
      } catch (error) {
        verification.checks.push({
          check: 'unified_data_file',
          status: 'failed',
          details: error.message
        });
        verification.passed = false;
      }
    } else {
      verification.checks.push({
        check: 'unified_data_file',
        status: 'failed',
        details: '文件不存在'
      });
      verification.passed = false;
    }
    
    // 检查备份文件
    const backupDir = path.join(this.workspacePath, 'backup', 'task_migration');
    if (fs.existsSync(backupDir)) {
      const backupFiles = fs.readdirSync(backupDir);
      verification.checks.push({
        check: 'backup_files',
        status: 'passed',
        details: `备份了 ${backupFiles.length} 个文件`
      });
    } else {
      verification.checks.push({
        check: 'backup_files',
        status: 'warning',
        details: '备份目录不存在'
      });
    }
    
    // 检查迁移日志
    if (this.migrationLog.length > 0) {
      verification.checks.push({
        check: 'migration_log',
        status: 'passed',
        details: `记录了 ${this.migrationLog.length} 个迁移步骤`
      });
    }
    
    // 显示验证结果
    console.log('📊 验证结果:');
    verification.checks.forEach(check => {
      const icon = check.status === 'passed' ? '✅' : check.status === 'warning' ? '⚠️' : '❌';
      console.log(`  ${icon} ${check.check}: ${check.details}`);
    });
    
    // 保存验证报告
    const verificationPath = path.join(this.workspacePath, 'migration_verification.json');
    fs.writeFileSync(verificationPath, JSON.stringify(verification, null, 2));
    
    console.log(`📄 验证报告已保存: ${verificationPath}`);
    
    this.migrationLog.push({
      timestamp: new Date().toISOString(),
      action: 'verification',
      ...verification
    });
    
    return verification;
  }
  
  // 保存迁移日志
  saveMigrationLog() {
    const logPath = path.join(this.workspacePath, 'task_migration_log.json');
    fs.writeFileSync(logPath, JSON.stringify(this.migrationLog, null, 2));
    console.log(`📝 迁移日志已保存: ${logPath}`);
    return logPath;
  }
  
  // 执行完整迁移流程
  async migrate() {
    console.log('🚀 开始任务数据迁移流程');
    console.log('='.repeat(60));
    
    try {
      // 1. 备份源数据
      await this.backupSourceData();
      
      // 2. 分析现有数据
      const analysis = this.analyzeTaskData();
      
      if (analysis.totalTasks === 0) {
        console.log('⚠️  没有发现任务数据，跳过迁移');
        return { success: true, skipped: true };
      }
      
      // 3. 转换数据格式
      const unifiedData = this.convertToUnifiedFormat();
      
      // 4. 保存统一数据
      const unifiedFilePath = await this.saveUnifiedData(unifiedData);
      
      // 5. 验证迁移结果
      const verification = await this.verifyMigration();
      
      // 6. 保存迁移日志
      const logPath = this.saveMigrationLog();
      
      console.log('\n🎉 迁移完成总结:');
      console.log('='.repeat(60));
      console.log(`✅ 备份了源数据`);
      console.log(`✅ 分析了 ${analysis.totalTasks} 个任务`);
      console.log(`✅ 转换并保存了统一数据`);
      console.log(`✅ 验证结果: ${verification.passed ? '通过' : '失败'}`);
      console.log(`✅ 迁移日志: ${logPath}`);
      
      if (!verification.passed) {
        console.log('\n⚠️  迁移验证失败，请检查错误');
      }
      
      return {
        success: verification.passed,
        analysis,
        unifiedFilePath,
        verification,
        logPath
      };
      
    } catch (error) {
      console.error('❌ 迁移过程中出错:', error);
      
      this.migrationLog.push({
        timestamp: new Date().toISOString(),
        action: 'error',
        error: error.message,
        stack: error.stack
      });
      
      this.saveMigrationLog();
      
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// 命令行接口
async function main() {
  const migrator = new TaskDataMigrator();
  
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'analyze':
      migrator.analyzeTaskData();
      break;
      
    case 'backup':
      await migrator.backupSourceData();
      break;
      
    case 'migrate':
      const result = await migrator.migrate();
      console.log('\n迁移结果:', JSON.stringify(result, null, 2));
      break;
      
    case 'verify':
      await migrator.verifyMigration();
      break;
      
    default:
      console.log('可用命令:');
      console.log('  analyze - 分析现有任务数据');
      console.log('  backup  - 备份源数据');
      console.log('  migrate - 执行完整迁移');
      console.log('  verify  - 验证迁移结果');
      break;
  }
}

// 如果直接运行
if (require.main === module) {
  main().catch(console.error);
}

module.exports = TaskDataMigrator;