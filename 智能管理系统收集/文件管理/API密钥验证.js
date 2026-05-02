#!/usr/bin/env node
/**
 * API密钥验证脚本
 * 检查所有已配置的API密钥状态
 * 版本: 1.0.0
 */

const fs = require('fs');
const path = require('path');

class API密钥验证器 {
  constructor() {
    this.验证时间 = new Date().toLocaleString('zh-CN');
    this.验证结果 = {
      验证时间: this.验证时间,
      已配置密钥: [],
      缺失密钥: [],
      警告: [],
      建议: []
    };
  }
  
  async 执行验证() {
    console.log('🔐 ========================================');
    console.log('🔐 API密钥配置状态验证');
    console.log('🔐 验证时间:', this.验证时间);
    console.log('🔐 ========================================\n');
    
    // 检查所有可能的API密钥
    await this.检查所有API密钥();
    
    // 生成报告
    await this.生成验证报告();
    
    return this.验证结果;
  }
  
  async 检查所有API密钥() {
    console.log('📋 1. 检查核心API密钥配置:');
    console.log('   '.repeat(2) + '─'.repeat(50));
    
    const 密钥列表 = [
      // 当前已配置的密钥
      { 名称: 'ARK_API_KEY', 描述: 'Ark平台API密钥', 必需: true, 来源: '当前环境' },
      { 名称: 'SECURITY_API_KEY', 描述: '安全API密钥', 必需: true, 来源: '当前环境' },
      { 名称: 'FEISHU_APP_SECRET', 描述: '飞书应用密钥', 必需: false, 来源: '当前环境' },
      
      // 从.bash_history中看到的4SAPI密钥
      { 名称: 'CLARIFIER_API_KEY', 描述: '澄清器API密钥 (4SAPI)', 必需: false, 来源: '.bash_history' },
      { 名称: 'BUILDER_API_KEY', 描述: '构建器API密钥 (4SAPI)', 必需: false, 来源: '.bash_history' },
      { 名称: 'REVIEWER_API_KEY', 描述: '审查器API密钥 (4SAPI)', 必需: false, 来源: '.bash_history' },
      { 名称: 'ARBITER_API_KEY', 描述: '仲裁器API密钥 (4SAPI)', 必需: false, 来源: '.bash_history' },
      
      // 阿里百炼相关密钥
      { 名称: 'BAILIAN_KEYS', 描述: '阿里百炼API密钥', 必需: false, 来源: '文档' },
      { 名称: 'ALIYUN_API_KEY', 描述: '阿里云API密钥', 必需: false, 来源: '配置模板' },
      { 名称: 'QWEN_API_KEY', 描述: '通义千问API密钥', 必需: false, 来源: 'GLM5配置' },
      
      // 其他模型密钥
      { 名称: 'DEEPSEEK_API_KEY', 描述: 'DeepSeek API密钥', 必需: false, 来源: '配置模板' },
      { 名称: 'GLM_API_KEY', 描述: 'GLM API密钥', 必需: false, 来源: '配置模板' },
      { 名称: 'KIMI_API_KEY', 描述: 'Kimi API密钥', 必需: false, 来源: '配置模板' },
      
      // 国外模型密钥
      { 名称: 'OPENAI_API_KEY', 描述: 'OpenAI API密钥', 必需: false, 来源: '4SAPI配置' },
      { 名称: 'ANTHROPIC_API_KEY', 描述: 'Claude API密钥', 必需: false, 来源: '4SAPI配置' },
      { 名称: 'GEMINI_API_KEY', 描述: 'Gemini API密钥', 必需: false, 来源: '4SAPI配置' }
    ];
    
    for (const 密钥 of 密钥列表) {
      const 值 = process.env[密钥.名称];
      
      if (值 && 值.length > 10 && !值.includes('YOUR_') && !值.includes('your_')) {
        const 掩码值 = this.掩码API密钥(值);
        console.log(`   ✅ ${密钥.名称}: ${掩码值} (${密钥.描述})`);
        this.验证结果.已配置密钥.push({
          名称: 密钥.名称,
          描述: 密钥.描述,
          来源: 密钥.来源,
          掩码值: 掩码值,
          状态: '已配置'
        });
      } else {
        if (密钥.必需) {
          console.log(`   ❌ ${密钥.名称}: 缺失 (${密钥.描述} - 必需)`);
          this.验证结果.缺失密钥.push({
            名称: 密钥.名称,
            描述: 密钥.描述,
            来源: 密钥.来源,
            状态: '缺失'
          });
        } else {
          console.log(`   ⚠️  ${密钥.名称}: 未配置 (${密钥.描述} - 可选)`);
        }
      }
    }
  }
  
  掩码API密钥(原始值) {
    if (!原始值 || 原始值.length < 12) return '***';
    
    if (原始值.startsWith('sk-')) {
      return `sk-...${原始值.slice(-8)}`;
    }
    
    // 检查是否是UUID格式
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(原始值)) {
      return `${原始值.slice(0, 8)}...${原始值.slice(-4)}`;
    }
    
    // 通用掩码
    return `${原始值.slice(0, 6)}...${原始值.slice(-6)}`;
  }
  
  async 生成验证报告() {
    console.log('\n📊 2. 验证结果摘要:');
    console.log('   '.repeat(2) + '─'.repeat(50));
    
    console.log(`   ✅ 已配置密钥: ${this.验证结果.已配置密钥.length} 个`);
    console.log(`   ❌ 缺失必需密钥: ${this.验证结果.缺失密钥.length} 个`);
    console.log(`   📋 总检查密钥: ${this.验证结果.已配置密钥.length + this.验证结果.缺失密钥.length} 个`);
    
    // 检查配置来源
    const 来源统计 = {};
    this.验证结果.已配置密钥.forEach(密钥 => {
      来源统计[密钥.来源] = (来源统计[密钥.来源] || 0) + 1;
    });
    
    console.log('\n📁 3. 配置来源分析:');
    console.log('   '.repeat(2) + '─'.repeat(50));
    
    Object.entries(来源统计).forEach(([来源, 数量]) => {
      console.log(`   📂 ${来源}: ${数量} 个密钥`);
    });
    
    // 检查Ark平台配置
    console.log('\n🤖 4. Ark平台配置检查:');
    console.log('   '.repeat(2) + '─'.repeat(50));
    
    const arkKey = process.env.ARK_API_KEY;
    if (arkKey) {
      console.log(`   ✅ Ark API密钥: ${this.掩码API密钥(arkKey)}`);
      console.log(`   🤖 当前模型: ${process.env.ARK_MODEL_ID || 'deepseek-v3.2'}`);
      console.log(`   📊 编码计划: ${process.env.ARK_CODING_PLAN || '未设置'}`);
    } else {
      console.log('   ❌ Ark API密钥未配置');
    }
    
    // 检查4SAPI配置
    console.log('\n🔧 5. 4SAPI配置检查:');
    console.log('   '.repeat(2) + '─'.repeat(50));
    
    const sapi4密钥 = ['CLARIFIER_API_KEY', 'BUILDER_API_KEY', 'REVIEWER_API_KEY', 'ARBITER_API_KEY'];
    const 已配置sapi4 = sapi4密钥.filter(key => process.env[key] && process.env[key].length > 10);
    
    console.log(`   🔧 4SAPI节点: ${已配置sapi4.length}/4 个已配置`);
    
    if (已配置sapi4.length === 4) {
      console.log('   ✅ 4SAPI节点完整配置');
    } else if (已配置sapi4.length > 0) {
      console.log(`   ⚠️  4SAPI节点部分配置 (${已配置sapi4.length}/4)`);
    } else {
      console.log('   ❌ 4SAPI节点未配置');
    }
    
    // 检查阿里百炼配置
    console.log('\n☁️  6. 阿里百炼配置检查:');
    console.log('   '.repeat(2) + '─'.repeat(50));
    
    const 百炼密钥 = process.env.BAILIAN_KEYS || process.env.ALIYUN_API_KEY || process.env.QWEN_API_KEY;
    if (百炼密钥) {
      console.log(`   ✅ 阿里百炼API密钥: ${this.掩码API密钥(百炼密钥)}`);
      console.log(`   🌐 基础URL: ${process.env.BAILIAN_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1'}`);
    } else {
      console.log('   ❌ 阿里百炼API密钥未配置');
    }
    
    // 生成建议
    console.log('\n💡 7. 配置建议:');
    console.log('   '.repeat(2) + '─'.repeat(50));
    
    if (this.验证结果.缺失密钥.length > 0) {
      console.log('   🔧 需要配置的密钥:');
      this.验证结果.缺失密钥.forEach(密钥 => {
        console.log(`      • ${密钥.名称}: ${密钥.描述}`);
      });
    }
    
    if (已配置4sapi.length < 4) {
      console.log('   🔧 4SAPI节点不完整，建议配置全部4个密钥');
    }
    
    if (!百炼密钥) {
      console.log('   🔧 阿里百炼API密钥未配置，如需使用请配置');
    }
    
    // 保存验证结果
    await this.保存验证结果();
  }
  
  async 保存验证结果() {
    const 报告目录 = path.join(process.env.OPENCLAW_WORKSPACE || '/root/.openclaw/workspace', 'API密钥验证报告');
    
    if (!fs.existsSync(报告目录)) {
      fs.mkdirSync(报告目录, { recursive: true });
    }
    
    const 报告文件 = path.join(报告目录, `API密钥验证_${Date.now()}.json`);
    const 摘要文件 = path.join(报告目录, `API密钥摘要_${Date.now()}.md`);
    
    // 保存详细结果
    fs.writeFileSync(报告文件, JSON.stringify(this.验证结果, null, 2), 'utf8');
    
    // 生成摘要
    const 摘要 = this.生成摘要报告();
    fs.writeFileSync(摘要文件, 摘要, 'utf8');
    
    console.log(`\n📄 验证报告已保存:`);
    console.log(`   详细报告: ${报告文件}`);
    console.log(`   摘要报告: ${摘要文件}`);
  }
  
  生成摘要报告() {
    return `
# API密钥配置状态验证报告

## 验证信息
- 验证时间: ${this.验证时间}
- 已配置密钥: ${this.验证结果.已配置密钥.length} 个
- 缺失必需密钥: ${this.验证结果.缺失密钥.length} 个

## 已配置的API密钥
${this.验证结果.已配置密钥.map(密钥 => `
### ${密钥.名称}
- 描述: ${密钥.描述}
- 来源: ${密钥.来源}
- 状态: ${密钥.状态}
- 掩码值: ${密钥.掩码值}
`).join('\n')}

## 缺失的必需密钥
${this.验证结果.缺失密钥.length > 0 ? 
   this.验证结果.缺失密钥.map(密钥 => `- ${密钥.名称}: ${密钥.描述}`).join('\n') : 
   '✅ 无缺失必需密钥'}

## 配置状态总结
- ✅ Ark平台: ${process.env.ARK_API_KEY ? '已配置' : '未配置'}
- 🔧 4SAPI节点: ${['CLARIFIER', 'BUILDER', 'REVIEWER', 'ARBITER'].filter(k => process.env[`${k}_API_KEY`]).length}/4 个
- ☁️ 阿里百炼: ${process.env.BAILIAN_KEYS || process.env.ALIYUN_API_KEY ? '已配置' : '未配置'}

## 建议
${this.验证结果.建议.length > 0 ? this.验证结果.建议.join('\n') : '配置状态良好'}

---
*验证时间: ${this.验证时间}*
*OpenClaw API密钥验证工具 v1.0.0*
`;
  }
}

// CLI支持
if (require.main === module) {
  const 验证器 = new API密钥验证器();
  
  console.log('='.repeat(60));
  console.log('🔐 OpenClaw API密钥配置验证');
  console.log('='.repeat(60));
  
  验证器.执行验证()
    .then(() => {
      console.log('\n🎯 验证完成!');
      console.log('💡 提示: 查看生成的报告了解详细配置状态');
    })
    .catch(错误 => {
      console.error('❌ 验证失败:', 错误.message);
      process.exit(1);
    });
}

module.exports = API密钥验证器;