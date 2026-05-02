#!/usr/bin/env node

/**
 * OPENCLAW 集成回滚脚本
 * 将系统恢复到集成前的状态
 */

const fs = require('fs').promises;
const path = require('path');

async function rollback() {
  console.log('🔄 开始回滚OPENCLAW集成...');
  
  const workspaceRoot = path.dirname(__dirname);
  const backupDir = path.join(workspaceRoot, 'backup', 'pre-integration');
  
  try {
    // 检查备份是否存在
    await fs.access(backupDir);
    
    console.log('📂 恢复备份文件...');
    
    // 恢复关键配置文件
    const filesToRestore = [
      'config/main.json',
      'config/startup.json',
      'start.js',
      'AGENTS.md',
      'SOUL.md'
    ];
    
    for (const file of filesToRestore) {
      const backupFile = path.join(backupDir, file);
      const targetFile = path.join(workspaceRoot, file);
      
      try {
        await fs.access(backupFile);
        await fs.copyFile(backupFile, targetFile);
        console.log(`  恢复: ${file}`);
      } catch (error) {
        console.log(`  ⚠️  跳过: ${file} (备份不存在)`);
      }
    }
    
    // 删除集成相关文件
    const filesToRemove = [
      'config/integration.json',
      'start_integrated.cjs',
      'plugins/evo-architect',
      'core/extensions/omx-integration.cjs',
      'services/'
    ];
    
    for (const file of filesToRemove) {
      const targetPath = path.join(workspaceRoot, file);
      try {
        await fs.rm(targetPath, { recursive: true, force: true });
        console.log(`  删除: ${file}`);
      } catch (error) {
        // 文件可能不存在，忽略错误
      }
    }
    
    console.log('\n✅ 回滚完成！');
    console.log('🚀 OPENCLAW已恢复到集成前的状态');
    console.log('🔧 使用原启动文件: node start.js');
    
  } catch (error) {
    console.error('❌ 回滚失败:', error.message);
    console.log('💡 请手动恢复备份文件');
    process.exit(1);
  }
}

// 执行回滚
rollback().catch(console.error);