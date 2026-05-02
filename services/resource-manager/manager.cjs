/**
 * 智能系统资源管理器Agent 服务管理器
 */

const fs = require('fs').promises;
const path = require('path');

class ServiceManager {
  constructor() {
    this.service = null;
    this.status = 'stopped';
    this.metrics = {};
  }
  
  async start(config = {}) {
    console.log(`🚀 启动 ${config.name || '智能系统资源管理器Agent'} 服务...`);
    
    try {
      const servicePath = path.join(__dirname, '..', '..', 'modules/resource-manager/resource_manager.cjs');
      const Service = require(servicePath);
      
      this.service = new Service(config);
      this.status = 'running';
      this.startedAt = Date.now();
      
      console.log(`✅ ${config.name || '智能系统资源管理器Agent'} 服务启动成功`);
      return this.service;
    } catch (error) {
      console.error(`❌ 服务启动失败: ${error.message}`);
      this.status = 'failed';
      throw error;
    }
  }
  
  async stop() {
    if (this.service && typeof this.service.stop === 'function') {
      await this.service.stop();
    }
    
    this.status = 'stopped';
    this.stoppedAt = Date.now();
    console.log('🛑 服务已停止');
  }
  
  getStatus() {
    return {
      name: '智能系统资源管理器Agent',
      status: this.status,
      uptime: this.startedAt ? Date.now() - this.startedAt : 0,
      metrics: this.metrics
    };
  }
}

module.exports = ServiceManager;