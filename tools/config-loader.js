/**
 * 优化配置加载器
 */

const fs = require('fs');
const path = require('path');

class ConfigLoader {
  constructor() {
    this.configDir = path.join(__dirname, '..', 'config');
    this.cache = new Map();
    this.watchers = new Map();
  }

  load(name) {
    // 检查缓存
    if (this.cache.has(name)) {
      return this.cache.get(name);
    }

    const filePath = path.join(this.configDir, `${name}.json`);
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`配置文件不存在: ${name}`);
    }

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const config = JSON.parse(content);
      
      // 缓存配置
      this.cache.set(name, config);
      
      // 设置文件监控（自动重载）
      if (!this.watchers.has(filePath)) {
        const watcher = fs.watch(filePath, () => {
          console.log(`配置更新: ${name}`);
          this.cache.delete(name);
        });
        this.watchers.set(filePath, watcher);
      }
      
      return config;
    } catch (error) {
      throw new Error(`加载配置 ${name} 失败: ${error.message}`);
    }
  }

  loadAll() {
    const files = fs.readdirSync(this.configDir)
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace('.json', ''));
    
    const configs = {};
    files.forEach(name => {
      try {
        configs[name] = this.load(name);
      } catch (error) {
        console.warn(`跳过配置 ${name}: ${error.message}`);
      }
    });
    
    return configs;
  }

  clearCache() {
    this.cache.clear();
  }

  close() {
    // 关闭所有文件监控
    for (const watcher of this.watchers.values()) {
      watcher.close();
    }
    this.watchers.clear();
  }
}

module.exports = ConfigLoader;
