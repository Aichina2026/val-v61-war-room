const EvoArchitect = require('./evo_core.cjs');

async function test() {
  console.log('🧪 测试 Evo-Architect...');
  
  const evo = new EvoArchitect();
  
  // 测试模块注册
  evo.registerModule('test-module', { process: () => 'ok' });
  
  // 测试进化
  const result = await evo.evolve();
  
  // 测试生产指标
  const metrics = evo.getProductionMetrics();
  
  console.log('✅ 所有测试通过');
  console.log('生产指标:', metrics);
  
  return result.success;
}

if (require.main === module) {
  test().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { test };