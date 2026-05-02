/**
 * 代码生成系统集成 模块启动器
 */

module.exports = {
  start: async function(config = {}) {
    console.log(`🚀 启动 ${config.name || '代码生成系统集成'}...`);
    
    try {
      // 动态加载模块
      const modulePath = require.resolve('../../modules/code-generation');
      const module = require(modulePath);
      
      if (typeof module === 'function') {
        return await module(config);
      } else if (module && typeof module.start === 'function') {
        return await module.start(config);
      } else {
        return module;
      }
    } catch (error) {
      console.error(`❌ 启动失败: ${error.message}`);
      throw error;
    }
  }
};