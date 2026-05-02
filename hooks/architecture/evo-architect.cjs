/**
 * Evo-Architect 架构钩子
 * 在OPENCLAW启动时集成自进化架构
 */

module.exports = {
  name: 'evo-architect-hook',
  
  onStartup: async function(openclaw) {
    console.log('🏗️  初始化Evo-Architect自进化架构...');
    
    try {
      const EvoArchitect = require('../../modules/evo-architect/evo_core.cjs');
      const evo = new EvoArchitect();
      
      // 注册到OPENCLAW
      openclaw.architecture = openclaw.architecture || {};
      openclaw.architecture.evo = evo;
      
      console.log('✅ Evo-Architect架构集成完成');
      return evo;
    } catch (error) {
      console.error('❌ Evo-Architect初始化失败:', error.message);
      return null;
    }
  },
  
  onOptimization: async function(openclaw, metrics) {
    if (openclaw.architecture && openclaw.architecture.evo) {
      return await openclaw.architecture.evo.evolve();
    }
    return null;
  }
};