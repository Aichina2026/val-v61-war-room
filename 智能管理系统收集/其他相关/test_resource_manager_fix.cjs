#!/usr/bin/env node

const path = require('path');

console.log('🔧 测试资源管理器路径修复...\n');

// 测试1：检查文件是否存在
const fs = require('fs').promises;

async function testPaths() {
  console.log('1. 检查文件路径:');
  
  const paths = [
    './modules/resource-manager/resource_manager.cjs',
    'modules/resource-manager/resource_manager.cjs',
    path.join(__dirname, 'modules/resource-manager/resource_manager.cjs'),
    path.join(__dirname, 'services/resource-manager/manager.cjs')
  ];
  
  for (const p of paths) {
    try {
      await fs.access(p);
      console.log(`   ✅ ${p} - 存在`);
    } catch (error) {
      console.log(`   ❌ ${p} - 不存在: ${error.message}`);
    }
  }
  
  console.log('\n2. 测试require路径:');
  
  // 测试相对路径
  try {
    const rm1 = require('./modules/resource-manager/resource_manager.cjs');
    console.log(`   ✅ ./modules/resource-manager/resource_manager.cjs - 加载成功: ${rm1.name}`);
  } catch (error) {
    console.log(`   ❌ ./modules/resource-manager/resource_manager.cjs - 加载失败: ${error.message}`);
  }
  
  // 测试绝对路径
  try {
    const absPath = path.join(__dirname, 'modules/resource-manager/resource_manager.cjs');
    const rm2 = require(absPath);
    console.log(`   ✅ ${absPath} - 加载成功: ${rm2.name}`);
  } catch (error) {
    console.log(`   ❌ 绝对路径 - 加载失败: ${error.message}`);
  }
  
  // 测试服务管理器
  console.log('\n3. 测试服务管理器:');
  try {
    const servicePath = path.join(__dirname, 'services/resource-manager/manager.cjs');
    const ServiceManager = require(servicePath);
    console.log(`   ✅ ${servicePath} - 加载成功`);
    
    const manager = new ServiceManager();
    console.log(`   ✅ ServiceManager实例化成功`);
  } catch (error) {
    console.log(`   ❌ 服务管理器加载失败: ${error.message}`);
  }
}

testPaths().catch(console.error);