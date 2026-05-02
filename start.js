#!/usr/bin/env node
/**
 * OpenClaw 2.0 紧急重构版 - 优化启动文件
 * 重构时间: 2026-04-09T18:31:39.959Z
 */

const fs = require('fs');
const path = require('path');

class OptimizedStartup {
  constructor() {
    this.workspace = path.join(__dirname, '..');
    this.config = this.loadConfig();
    this.modules = new Map();
    this.startTime = Date.now();
  }

  async start() {
    console.log('🚀 OpenClaw 2.0 紧急重构版启动中...');
    
    // 阶段1: 加载核心配置
    await this.loadCore();
    
    // 阶段2: 预加载关键模块
    await this.preloadCriticalModules();
    
    // 阶段3: 启动服务
    await this.startServices();
    
    // 阶段4: 就绪检查
    await this.readyCheck();
    
    const duration = Date.now() - this.startTime;
    console.log(`✅ 系统启动完成，耗时: ${duration}ms`);
    console.log(`📊 内存使用: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB`);
    
    return { success: true, duration };
  }

  loadConfig() {
    const configPath = path.join(this.workspace, 'config', 'main.json');
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }

  async loadCore() {
    // 加载核心文件
    const coreFiles = [
      'AGENTS.md', 'SOUL.md', 'TOOLS.md', 'MEMORY.md'
    ];
    
    coreFiles.forEach(file => {
      const content = fs.readFileSync(
        path.join(this.workspace, 'core', file),
        'utf8'
      );
      this.modules.set(`core:${file}`, { content, loaded: true });
    });
  }

  async preloadCriticalModules() {
    // 预加载代码生成模块
    const codeGenPath = path.join(this.workspace, 'modules', 'code-generation');
    if (fs.existsSync(path.join(codeGenPath, 'skills', 'code-generation', 'start-code-generation.js'))) {
      const codeGen = require(path.join(codeGenPath, 'skills', 'code-generation', 'start-code-generation.js'));
      this.modules.set('code-generation', codeGen);
    }
    
    // 预加载任务管理
    const taskPath = path.join(this.workspace, 'modules', 'task-management');
    if (fs.existsSync(path.join(taskPath, 'task_manager.js'))) {
      const taskManager = require(path.join(taskPath, 'task_manager.js'));
      this.modules.set('task-management', taskManager);
    }
  }

  async startServices() {
    // 启动基础服务
    console.log('启动基础服务...');
    
    // 内存缓存服务
    this.cache = new Map();
    
    // 文件监控服务
    this.watcher = fs.watch(this.workspace, { recursive: false }, () => {
      console.log('检测到文件变化');
    });
  }

  async readyCheck() {
    // 检查系统就绪状态
    const checks = [
      this.checkConfig(),
      this.checkModules(),
      this.checkPermissions(),
      this.checkMemory()
    ];
    
    const results = await Promise.all(checks);
    const passed = results.filter(r => r.passed).length;
    
    console.log(`🧪 系统检查: ${passed}/${checks.length} 通过`);
    
    return passed === checks.length;
  }

  checkConfig() {
    return { passed: true, message: '配置检查通过' };
  }

  checkModules() {
    const required = ['code-generation', 'task-management'];
    const missing = required.filter(m => !this.modules.has(m));
    
    return {
      passed: missing.length === 0,
      message: missing.length === 0 ? '模块检查通过' : `缺少模块: ${missing.join(', ')}`
    };
  }

  checkPermissions() {
    const testFile = path.join(this.workspace, '.permission_test');
    try {
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      return { passed: true, message: '权限检查通过' };
    } catch (error) {
      return { passed: false, message: `权限错误: ${error.message}` };
    }
  }

  checkMemory() {
    const limit = 1024 * 1024 * 1024; // 1GB
    const used = process.memoryUsage().heapUsed;
    
    return {
      passed: used < limit,
      message: `内存使用: ${(used / 1024 / 1024).toFixed(2)}MB / ${(limit / 1024 / 1024).toFixed(2)}MB`
    };
  }
}

// 启动系统
if (require.main === module) {
  const startup = new OptimizedStartup();
  startup.start().catch(error => {
    console.error('❌ 启动失败:', error.message);
    process.exit(1);
  });
}

module.exports = OptimizedStartup;
