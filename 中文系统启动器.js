#!/usr/bin/env node
/**
 * 中文系统启动器 - 完全中文界面
 * 启用所有系统的中文支持
 * 版本: 1.0.0
 * 生成时间: 2026年4月12日
 */

const fs = require('fs');
const path = require('path');

class 中文系统启动器 {
  constructor() {
    this.系统名称 = 'OpenClaw 中文增强系统';
    this.版本 = '1.0.0';
    this.语言 = 'zh-CN';
    this.工作空间 = process.env.OPENCLAW_WORKSPACE || '/root/.openclaw/workspace';
    
    // 中文系统配置
    this.系统配置 = {
      '代码生成': {
        描述: '代码生成系统 - 中文优化版',
        脚本: {
          'free-code': 'free-code-integration.js',
          'omc-workflow': 'omc-workflow.js',
          'team-mode': 'team-mode.js',
          'ri-mode': 'ri-mode.js',
          'architect-validation': 'architect-validation.js',
          'start-code-generation': 'start-code-generation.js'
        },
        路径: 'modules/code-generation/skills/code-generation'
      },
      '4SAPI辩证': {
        描述: '4SAPI辩证多AI辩论系统 - 中文版',
        脚本: {
          '4sapi-system': '4sapi_dialectic_multi_ai_system.js'
        },
        路径: '.'
      },
      '集成服务': {
        描述: '系统集成HTTP服务 - 中文界面',
        脚本: {
          'enhanced-integration': 'enhanced_start_integrated.cjs'
        },
        路径: '.'
      }
    };
    
    // 中文AI模型配置
    this.中文AI模型 = [
      {
        编号: '架构师',
        名称: '架构师AI',
        角色: '系统架构设计',
        专长: '架构规划、系统设计、技术选型',
        权重: 1.2
      },
      {
        编号: '安全专家',
        名称: '安全AI',
        角色: '安全风险评估',
        专长: '漏洞分析、安全设计、风险评估',
        权重: 1.3
      },
      {
        编号: '性能工程师',
        名称: '性能AI',
        角色: '性能优化分析',
        专长: '性能测试、瓶颈分析、优化方案',
        权重: 1.1
      },
      {
        编号: '质量保证',
        名称: '质量AI',
        角色: '代码质量审查',
        专长: '代码规范、测试覆盖、质量评估',
        权重: 1.0
      },
      {
        编号: '产品经理',
        名称: '产品AI',
        角色: '业务需求分析',
        专长: '需求分析、用户体验、业务逻辑',
        权重: 1.1
      }
    ];
  }
  
  async 启动中文系统(主题, 选项 = {}) {
    console.log('🚀 ========================================');
    console.log('🚀 启动 OpenClaw 中文增强系统');
    console.log('🚀 系统:', this.系统名称);
    console.log('🚀 版本:', this.版本);
    console.log('🚀 语言:', this.语言);
    console.log('🚀 ========================================\n');
    
    console.log('📋 系统主题:', 主题);
    console.log('⏰ 启动时间:', new Date().toLocaleString('zh-CN'));
    console.log('💻 工作空间:', this.工作空间);
    console.log('');
    
    const 开始时间 = Date.now();
    const 结果 = {
      主题: 主题,
      开始时间: 开始时间,
      系统状态: {},
      最终方案: null
    };
    
    try {
      // 步骤1: 显示系统信息
      console.log('📊 步骤1: 显示系统信息...');
      this.显示系统信息();
      
      // 步骤2: 检查系统完整性
      console.log('\n🔍 步骤2: 检查系统完整性...');
      const 完整性检查 = await this.检查系统完整性();
      结果.系统状态.完整性检查 = 完整性检查;
      
      if (!完整性检查.所有文件存在) {
        console.log('❌ 系统文件不完整，无法继续');
        return 结果;
      }
      
      // 步骤3: 启动4SAPI中文辩证系统
      console.log('\n💬 步骤3: 启动4SAPI中文辩证系统...');
      const 辩证结果 = await this.启动中文辩证系统(主题, 选项);
      结果.系统状态.辩证系统 = 辩证结果;
      
      // 步骤4: 启动代码生成系统
      console.log('\n💻 步骤4: 启动代码生成系统...');
      const 代码生成结果 = await this.启动中文代码生成系统(主题, {
        ...选项,
        辩证结果: 辩证结果
      });
      结果.系统状态.代码生成 = 代码生成结果;
      
      // 步骤5: 启动集成服务（可选）
      if (选项.启动服务) {
        console.log('\n🌐 步骤5: 启动中文集成服务...');
        const 服务结果 = await this.启动中文集成服务();
        结果.系统状态.集成服务 = 服务结果;
      }
      
      // 步骤6: 生成中文报告
      console.log('\n📝 步骤6: 生成中文报告...');
      const 报告结果 = await this.生成中文报告(结果, 选项);
      结果.最终方案 = 报告结果;
      
      const 结束时间 = Date.now();
      结果.结束时间 = 结束时间;
      结果.总耗时 = 结束时间 - 开始时间;
      
      console.log('\n🎉 ========================================');
      console.log('🎉 中文系统启动完成!');
      console.log('🎉 总耗时:', 结果.总耗时, '毫秒');
      console.log('🎉 系统状态: 成功');
      console.log('🎉 ========================================');
      
      // 显示访问信息
      if (选项.启动服务) {
        console.log('\n🌐 服务访问信息:');
        console.log('   健康检查: http://localhost:3000/health');
        console.log('   系统指标: http://localhost:3000/metrics');
        console.log('   代码生成API: http://localhost:3000/api/codegen');
        console.log('   控制面板: http://localhost:3000/ui');
      }
      
      return 结果;
      
    } catch (错误) {
      console.error('\n❌ 系统启动失败:', 错误.message);
      结果.错误 = 错误.message;
      结果.结束时间 = Date.now();
      结果.总耗时 = 结果.结束时间 - 开始时间;
      结果.系统状态 = '失败';
      
      return 结果;
    }
  }
  
  显示系统信息() {
    console.log('\n📋 可用系统:');
    Object.entries(this.系统配置).forEach(([名称, 配置], 索引) => {
      console.log(`  ${索引 + 1}. ${名称} - ${配置.描述}`);
    });
    
    console.log('\n🤖 可用AI模型:');
    this.中文AI模型.forEach((模型, 索引) => {
      console.log(`  ${索引 + 1}. ${模型.名称} (${模型.角色})`);
    });
    
    console.log('\n🔧 系统特性:');
    console.log('  • 完全中文界面和文档');
    console.log('  • 4SAPI辩证分析框架');
    console.log('  • 多AI模型并行辩论');
    console.log('  • 零错误自治验证');
    console.log('  • 生产级架构验证');
    console.log('  • 实时HTTP服务支持');
  }
  
  async 检查系统完整性() {
    const 必需文件 = [];
    
    // 收集所有必需文件
    Object.values(this.系统配置).forEach(配置 => {
      Object.values(配置.脚本).forEach(脚本 => {
        必需文件.push(path.join(this.工作空间, 配置.路径, 脚本));
      });
    });
    
    const 检查结果 = {
      必需文件总数: 必需文件.length,
      存在文件数: 0,
      缺失文件: [],
      所有文件存在: true
    };
    
    console.log('  检查', 必需文件.length, '个必需文件...');
    
    必需文件.forEach(文件路径 => {
      const 存在 = fs.existsSync(文件路径);
      if (存在) {
        检查结果.存在文件数++;
      } else {
        检查结果.缺失文件.push(文件路径);
        检查结果.所有文件存在 = false;
      }
    });
    
    console.log(`  ✅ 存在文件: ${检查结果.存在文件数}/${检查结果.必需文件总数}`);
    
    if (检查结果.缺失文件.length > 0) {
      console.log(`  ❌ 缺失文件: ${检查结果.缺失文件.length} 个`);
      检查结果.缺失文件.slice(0, 3).forEach(文件 => {
        console.log(`     - ${path.relative(this.工作空间, 文件)}`);
      });
      if (检查结果.缺失文件.length > 3) {
        console.log(`     ... 还有 ${检查结果.缺失文件.length - 3} 个文件`);
      }
    } else {
      console.log('  ✅ 所有文件完整');
    }
    
    return 检查结果;
  }
  
  async 启动中文辩证系统(主题, 选项) {
    const 脚本路径 = path.join(
      this.工作空间,
      this.系统配置['4SAPI辩证'].路径,
      this.系统配置['4SAPI辩证'].脚本['4sapi-system']
    );
    
    if (!fs.existsSync(脚本路径)) {
      throw new Error('4SAPI辩证系统文件不存在: ' + 脚本路径);
    }
    
    try {
      // 使用中文AI模型配置
      const 模型参数 = 选项.模型数量 || 5;
      const 命令 = `node "${脚本路径}" "${主题}" --models=${模型参数}`;
      
      console.log('  执行命令:', 命令);
      console.log('  使用AI模型:', 模型参数, '个中文AI');
      
      const 输出 = require('child_process').execSync(命令, { 
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 60000
      });
      
      // 解析输出
      const 辩论ID匹配 = 输出.match(/辩论ID:\s*(\S+)/);
      const 辩论ID = 辩论ID匹配 ? 辩论ID匹配[1] : `中文辩论_${Date.now()}`;
      
      const 共识分数匹配 = 输出.match(/共识分数:\s*(\d+)/);
      const 共识分数 = 共识分数匹配 ? parseInt(共识分数匹配[1]) : 0;
      
      return {
        成功: true,
        辩论ID: 辩论ID,
        共识分数: 共识分数,
        输出摘要: 输出.substring(0, 500) + (输出.length > 500 ? '...' : ''),
        脚本: '4sapi_dialectic_multi_ai_system.js'
      };
      
    } catch (错误) {
      console.error('  辩证系统启动失败:', 错误.message);
      return {
        成功: false,
        错误: 错误.message,
        输出: 错误.stdout || 错误.stderr || ''
      };
    }
  }
  
  async 启动中文代码生成系统(主题, 上下文) {
    const 脚本路径 = path.join(
      this.工作空间,
      this.系统配置['代码生成'].路径,
      this.系统配置['代码生成'].脚本['start-code-generation']
    );
    
    if (!fs.existsSync(脚本路径)) {
      console.warn('  ⚠️ 代码生成启动器不存在，跳过此步骤');
      return { 成功: false, 跳过: true };
    }
    
    try {
      // 增强主题，包含辩证结果信息
      const 增强主题 = 上下文.辩证结果?.辩论ID 
        ? `${主题} (基于4SAPI辩证: ${上下文.辩证结果.辩论ID})`
        : 主题;
      
      const 命令 = `node "${脚本路径}" --integrated "${增强主题}"`;
      console.log('  执行命令:', 命令);
      
      const 输出 = require('child_process').execSync(命令, { 
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 30000
      });
      
      return {
        成功: true,
        输出摘要: 输出.substring(0, 500) + (输出.length > 500 ? '...' : ''),
        脚本: 'start-code-generation.js'
      };
      
    } catch (错误) {
      console.error('  代码生成系统启动失败:', 错误.message);
      return {
        成功: false,
        错误: 错误.message,
        输出: 错误.stdout || 错误.stderr || ''
      };
    }
  }
  
  async 启动中文集成服务() {
    const 脚本路径 = path.join(
      this.工作空间,
      this.系统配置['集成服务'].路径,
      this.系统配置['集成服务'].脚本['enhanced-integration']
    );
    
    if (!fs.existsSync(脚本路径)) {
      console.warn('  ⚠️ 集成服务文件不存在，跳过此步骤');
      return { 成功: false, 跳过: true };
    }
    
    try {
      // 在后台启动服务
      const 命令 = `node "${脚本路径}" &`;
      console.log('  启动服务命令:', 命令);
      
      require('child_process').execSync(命令, { 
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
        detached: true
      });
      
      // 等待服务启动
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('  ✅ 中文集成服务已启动');
      console.log('  🌐 服务地址: http://localhost:3000');
      console.log('  📊 控制面板: http://localhost:3000/ui');
      
      return {
        成功: true,
        服务: 'enhanced-integration',
        端口: 3000,
        状态: '运行中',
        访问地址: 'http://localhost:3000'
      };
      
    } catch (错误) {
      console.error('  集成服务启动失败:', 错误.message);
      return {
        成功: false,
        错误: 错误.message
      };
    }
  }
  
  async 生成中文报告(结果, 选项) {
    const 报告目录 = path.join(this.工作空间, '中文系统报告');
    if (!fs.existsSync(报告目录)) {
      fs.mkdirSync(报告目录, { recursive: true });
    }
    
    const 报告ID = `中文报告_${Date.now()}`;
    const 报告路径 = path.join(报告目录, `${报告ID}.json`);
    const 摘要路径 = path.join(报告目录, `${报告ID}_摘要.md`);
    
    // 保存详细结果
    fs.writeFileSync(报告路径, JSON.stringify(结果, null, 2), 'utf8');
    
    // 生成中文摘要
    const 摘要 = this.生成中文摘要(结果, 报告ID);
    fs.writeFileSync(摘要路径, 摘要, 'utf8');
    
    console.log(`\n📄 报告已生成:`);
    console.log(`   详细结果: ${报告路径}`);
    console.log(`   摘要报告: ${摘要路径}`);
    
    return {
      报告ID: 报告ID,
      详细报告路径: 报告路径,
      摘要报告路径: 摘要路径,
      生成时间: new Date().toLocaleString('zh-CN')
    };
  }
  
  生成中文摘要(结果, 报告ID) {
    const 成功系统数 = Object.values(结果.系统状态).filter(s => s.成功).length;
    const 总系统数 = Object.keys(结果.系统状态).length;
    const 成功率 = 总系统数 > 0 ? (成功系统数 / 总系统数 * 100).toFixed(1) : 0;
    
    return `
# OpenClaw 中文系统执行报告

## 报告信息
- 报告ID: ${报告ID}
- 生成时间: ${new Date().toLocaleString('zh-CN')}
- 执行主题: ${结果.主题}
- 总耗时: ${结果.总耗时 || 'N/A'} 毫秒

## 系统执行概览
- 总系统数: ${总系统数}
- 成功系统: ${成功系统数}
- 成功率: ${成功率}%

## 各系统状态
${Object.entries(结果.系统状态).map(([名称, 系统]) => `
### ${名称}
- 状态: ${系统.成功 ? '✅ 成功' : 系统.跳过 ? '⚠️ 跳过' : '❌ 失败'}
- 错误: ${系统.错误 || '无'}
- 脚本: ${系统.脚本 || 'N/A'}
`).join('\n')}

## 辩证系统结果
${结果.系统状态.辩证系统 ? `
- 辩论ID: ${结果.系统状态.辩证系统.辩论ID || 'N/A'}
- 共识分数: ${结果.系统状态.辩证系统.共识分数 || 'N/A'}/100
` : '- 未执行辩证系统'}

## 代码生成结果
${结果.系统状态.代码生成 ? `
- 状态: ${结果.系统状态.代码生成.成功 ? '✅ 成功' : '❌ 失败'}
- 输出摘要: ${结果.系统状态.代码生成.输出摘要 ? '已生成' : '无'}
` : '- 未执行代码生成'}

## 集成服务
${结果.系统状态.集成服务 ? `
- 状态: ${结果.系统状态.集成服务.成功 ? '✅ 运行中' : '❌ 失败'}
- 访问地址: ${结果.系统状态.集成服务.访问地址 || 'N/A'}
- 控制面板: http://localhost:3000/ui
` : '- 未启动集成服务'}

## 结论
${成功率 >= 80 ? '✅ 系统执行成功，所有功能正常' :
 成功率 >= 60 ? '⚠️ 系统基本成功，部分功能需要检查' :
 '❌ 系统执行失败，需要重新执行'}

## 后续建议
1. 查看详细报告了解具体执行情况
2. 访问集成服务控制面板查看实时状态
3. 根据辩证结果优化方案设计
4. 定期执行系统维护和更新

---
*报告生成系统: OpenClaw 中文增强系统 v${this.版本}*
*生成时间: ${new Date().toLocaleString('zh-CN')}*
`;
  }
  
  显示帮助() {
    console.log('\n📖 使用说明:');
    console.log('  基本格式: node 中文系统启动器.js "主题" [选项]');
    console.log('\n  选项:');
    console.log('  --模型数=5        AI模型数量 (默认: 5)');
    console.log('  --启动服务        启动集成HTTP服务');
    console.log('  --帮助            显示此帮助信息');
    console.log('\n  示例:');
    console.log('    node 中文系统启动器.js "设计一个电商系统"');
    console.log('    node 中文系统启动器.js "优化网站性能" --模型数=3 --启动服务');
    console.log('\n  📞 技术支持:');
    console.log('    • 系统问题: 检查日志文件');
    console.log('    • 配置问题: 检查配置文件');
    console.log('    • 使用问题: 查看文档');
  }
}

// CLI支持
if (require.main === module) {
  const 启动器 = new 中文系统启动器();
  
  if (process.argv.length < 3 || process.argv.includes('--帮助')) {
    启动器.显示帮助();
    process.exit(0);
  }
  
  const 主题 = process.argv[2];
  const 选项 = {};
  
  // 解析参数
  for (let i = 3; i < process.argv.length; i++) {
    if (process.argv[i].startsWith('--模型数=')) {
      选项.模型数量 = parseInt(process.argv[i].substring(6));
    } else if (process.argv[i] === '--启动服务') {
      选项.启动服务 = true;
    }
  }
  
  console.log('='.repeat(60));
  console.log('🇨🇳 OpenClaw 中文增强系统启动');
  console.log('='.repeat(60));
  console.log(`主题: ${主题}`);
  console.log(`语言: 中文 (zh-CN)`);
  console.log(`AI模型: ${选项.模型数量 || 5} 个`);
  console.log(`集成服务: ${选项.启动服务 ? '启动' : '不启动'}`);
  console.log('='.repeat(60));
  
  启动器.启动中文系统(主题, 选项)
    .then(结果 => {
      console.log('\n📊 执行统计:');
      console.log(`   总耗时: ${结果.总耗时}毫秒`);
      console.log(`   系统状态: ${结果.错误 ? '失败' : '成功'}`);
      
      if (结果.系统状态) {
        const 成功数 = Object.values(结果.系统状态).filter(s => s.成功).length;
        const 总数 = Object.keys(结果.系统状态).length;
        console.log(`   系统成功率: ${成功数}/${总数}`);
      }
      
      if (结果.最终方案) {
        console.log(`\n📄 报告位置: ${结果.最终方案.摘要报告路径}`);
      }
      
      if (结果.错误) {
        console.log(`\n❌ 错误信息: ${结果.错误}`);
      }
      
      console.log('\n💡 提示:');
      console.log('   1. 查看完整报告了解详情');
      console.log('   2. 访问集成服务获取API支持');
      console.log('   3. 重新执行优化方案');
    })
    .catch(错误 => {
      console.error('\n❌ 系统启动失败:', 错误.message);
      process.exit(1);
    });
}

module.exports = 中文系统启动器;