/**
 * OPENCLAW 核心扩展: omx_minimal_integration.cjs
 * 无缝集成 omx_minimal_integration.cjs
 */

const omx = require('../../omx_minimal_integration.cjs');

module.exports = {
  name: 'omx_minimal_integration.cjs',
  version: '1.0.0',
  
  initialize: function(config = {}) {
    this.instance = new omx(config);
    return this.instance;
  },
  
  getInstance: function() {
    return this.instance || this.initialize();
  },
  
  // 核心扩展方法
  loadModule: function(modulePath) {
    return this.getInstance().loadModule(modulePath);
  },
  
  benchmark: function(iterations = 100) {
    return this.getInstance().benchmark(iterations);
  },
  
  healthCheck: function() {
    const instance = this.getInstance();
    return {
      ready: true,
      metrics: instance.getPerformanceMetrics ? instance.getPerformanceMetrics() : {},
      version: '1.0.0'
    };
  }
};