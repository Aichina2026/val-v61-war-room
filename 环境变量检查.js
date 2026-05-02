#!/usr/bin/env node
/**
 * 环境变量检查脚本
 * 检查当前配置的节点、模型API密钥和资源
 * 版本: 1.0.0
 */

const fs = require('fs');
const path = require('path');

class 环境变量检查器 {
  constructor() {
    this.检查时间 = new Date().toLocaleString('zh-CN');
    this.必需环境变量 = {
      // 国内模型
      'DEEPSEEK_API_KEY': { 描述: 'DeepSeek V3.2 API密钥', 必需: true, 类型: '国内模型' },
      'GLM_API_KEY': { 描述: 'GLM-4.7 API密钥', 必需: true, 类型: '国内模型' },
      'KIMI_API_KEY': { 描述: 'Kimi-2.5 API密钥', 必需: true, 类型: '国内模型' },
      'ALIYUN_API_KEY': { 描述: '阿里百炼API密钥', 必需: true, 类型: '国内模型' },
      
      // 国外顶级模型 (4SAPI)
      'OPENAI_API_KEY': { 描述: 'OpenAI GPT-4 API密钥', 必需: false, 类型: '国外模型' },
      'ANTHROPIC_API_KEY': { 描述: 'Claude API密钥', 必需: false, 类型: '国外模型' },
      'GEMINI_API_KEY': { 描述: 'Gemini API密钥', 必需: false, 类型: '国外模型' },
      
      // 系统配置
      'OPENCLAW_WORKSPACE': { 描述: '工作空间路径', 必需: true, 类型: '系统配置' },
      'ARK_API_KEY': { 描述: 'Ark平台API密钥', 必需: true, 类型: '平台密钥' },
      
      // 功能开关
      'TEAM_MODE_ENABLED': { 描述: '$team模式开关', 必需: false, 类型: '功能开关' },
      'RI_MODE_ENABLED': { 描述: '$ri模式开关', 必需: false, 类型: '功能开关' },
      'DIALECTIC_MODE': { 描述: '辩证模式设置', 必需: false, 类型: '功能开关' },
      
      // 安全配置
      'SECURITY_API_KEY': { 描述: '安全API密钥', 必需: true, 类型: '安全配置' },
      
      // 渠道配置
      'FEISHU_APP_SECRET': { 描述: '飞书应用密钥', 必需: false, 类型: '渠道配置' },
      'TELEGRAM_BOT_TOKEN': { 描述: 'Telegram机器人令牌', 必需: false, 类型: '渠道配置' }
    };
  }
  
  async 执行检查() {
    console.log('🔍 ========================================');
    console.log('🔍 OpenClaw 环境变量配置检查');
    console.log('🔍 检查时间:', this.检查时间);
    console.log('🔍 ========================================\n');
    
    const 检查结果 = {
      检查时间: this.检查时间,
      环境变量总数: 0,
      已配置变量: {},
      缺失变量: [],
      警告: [],
      建议: []
    };
    
    // 检查必需环境变量
    console.log('📋 1. 检查必需环境变量配置:');
    console.log('   '.repeat(2) + '─'.repeat(50));
    
    for (const [变量名, 配置] of Object.entries(this.必需环境变量)) {
      const 变量值 = process.env[变量名];
      检查结果.环境变量总数++;
      
      if (变量值) {
        检查结果.已配置变量[变量名] = {
          值: this.掩码敏感信息(变量名, 变量值),
          描述: 配置.描述,
          类型: 配置.类型
        };
        
        console.log(`   ✅ ${变量名}: ${配置.描述} (已配置)`);
      } else {
        if (配置.必需) {
          检查结果.缺失变量.push({
            变量名: 变量名,
            描述: 配置.描述,
            类型: 配置.类型
          });
          console.log(`   ❌ ${变量名}: ${配置.描述} (缺失 - 必需)`);
        } else {
          console.log(`   ⚠️  ${变量名}: ${配置.描述} (缺失 - 可选)`);
        }
      }
    }
    
    // 检查所有环境变量
    console.log('\n📊 2. 检查所有环境变量:');
    console.log('   '.repeat(2) + '─'.repeat(50));
    
    const 所有变量 = process.env;
    let 模型相关变量 = 0;
    let 密钥相关变量 = 0;
    
    for (const [变量名, 变量值] of Object.entries(所有变量)) {
      if (变量名.includes('API') || 变量名.includes('KEY') || 变量名.includes('TOKEN') || 变量名.includes('SECRET')) {
        密钥相关变量++;
        
        if (变量名.includes('MODEL') || 变量名.includes('DEEPSEEK') || 变量名.includes('GLM') || 
            变量名.includes('KIMI') || 变量名.includes('ALI') || 变量名.includes('OPENAI') || 
            变量名.includes('CLAUDE') || 变量名.includes('GEMINI')) {
          模型相关变量++;
        }
      }
    }
    
    console.log(`   📈 总环境变量: ${Object.keys(所有变量).length} 个`);
    console.log(`   🔑 密钥相关变量: ${密钥相关变量} 个`);
    console.log(`   🤖 模型相关变量: ${模型相关变量} 个`);
    
    // 检查OpenClaw配置文件
    console.log('\n📁 3. 检查OpenClaw配置文件:');
    console.log('   '.repeat(2) + '─'.repeat(50));
    
    const 配置文件路径 = '/root/.openclaw/openclaw.json';
    if (fs.existsSync(配置文件路径)) {
      try {
        const 配置内容 = fs.readFileSync(配置文件路径, 'utf8');
        const 配置 = JSON.parse(配置内容);
        
        console.log(`   ✅ OpenClaw配置文件: ${配置文件路径}`);
        
        // 检查模型提供商
        if (配置.models && 配置.models.providers) {
          const 提供商列表 = Object.keys(配置.models.providers);
          console.log(`   🤖 配置的模型提供商: ${提供商列表.join(', ')}`);
          
          提供商列表.forEach(提供商 => {
            const 提供商配置 = 配置.models.providers[提供商];
            console.log(`   📊 ${提供商}: ${提供商配置.models?.length || 0} 个模型`);
          });
        }
        
        // 检查当前使用的模型
        if (配置.agents && 配置.agents.defaults && 配置.agents.defaults.model) {
          console.log(`   🎯 主模型: ${配置.agents.defaults.model.primary}`);
        }
        
      } catch (错误) {
        console.log(`   ❌ 配置文件解析失败: ${错误.message}`);
      }
    } else {
      console.log(`   ❌ OpenClaw配置文件不存在: ${配置文件路径}`);
    }
    
    // 检查系统资源
    console.log('\n💻 4. 检查系统资源:');
    console.log('   '.repeat(2) + '─'.repeat(50));
    
    try {
      const os = require('os');
      const 总内存 = os.totalmem() / 1024 / 1024 / 1024; // GB
      const 空闲内存 = os.freemem() / 1024 / 1024 / 1024; // GB
      const CPU核心 = os.cpus().length;
      
      console.log(`   🖥️  CPU核心: ${CPU核心} 核`);
      console.log(`   💾 总内存: ${总内存.toFixed(2)} GB`);
      console.log(`   📊 空闲内存: ${空闲内存.toFixed(2)} GB`);
      console.log(`   📈 内存使用率: ${((总内存 - 空闲内存) / 总内存 * 100).toFixed(1)}%`);
      
      // 检查磁盘空间
      const { execSync } = require('child_process');
      const 磁盘信息 = execSync('df -h /').toString().split('\n')[1];
      console.log(`   💿 磁盘空间: ${磁盘信息}`);
      
    } catch (错误) {
      console.log(`   ⚠️  资源检查失败: ${错误.message}`);
    }
    
    // 生成总结
    console.log('\n📈 5. 检查总结:');
    console.log('   '.repeat(2) + '─'.repeat(50));
    
    const 必需变量总数 = Object.values(this.必需环境变量).filter(v => v.必需).length;
    const 已配置必需变量 = Object.keys(检查结果.已配置变量).filter(key => 
      this.必需环境变量[key]?.必需
    ).length;
    
    console.log(`   ✅ 必需变量: ${已配置必需变量}/${必需变量总数} 已配置`);
    console.log(`   📊 总检查变量: ${检查结果.环境变量总数} 个`);
    console.log(`   ⚠️  缺失变量: ${检查结果.缺失变量.length} 个`);
    
    if (检查结果.缺失变量.length > 0) {
      console.log('\n❌ 缺失的必需变量:');
      检查结果.缺失变量.forEach(变量 => {
        console.log(`   • ${变量.变量名}: ${变量.描述}`);
      });
      
      检查结果.建议.push('请配置缺失的必需环境变量');
    }
    
    // 生成建议
    console.log('\n💡 6. 配置建议:');
    console.log('   '.repeat(2) + '─'.repeat(50));
    
    // 检查模型API密钥配置
    const 已配置模型密钥 = Object.keys(检查结果.已配置变量).filter(key => 
      this.必需环境变量[key]?.类型 === '国内模型' || 
      this.必需环境变量[key]?.类型 === '国外模型'
    ).length;
    
    if (已配置模型密钥 < 4) {
      console.log(`   ⚠️  模型API密钥不足: ${已配置模型密钥} 个 (建议至少4个)`);
      检查结果.建议.push('请配置更多模型API密钥以支持多模型监管');
    } else {
      console.log(`   ✅ 模型API密钥充足: ${已配置模型密钥} 个`);
    }
    
    // 检查4SAPI国外模型配置
    const 国外模型配置 = Object.keys(检查结果.已配置变量).filter(key => 
      this.必需环境变量[key]?.类型 === '国外模型'
    ).length;
    
    if (国外模型配置 === 0) {
      console.log('   ⚠️  未配置4SAPI国外顶级模型');
      检查结果.建议.push('如需使用4SAPI国外模型，请配置OPENAI_API_KEY等');
    } else {
      console.log(`   ✅ 已配置${国外模型配置}个国外模型`);
    }
    
    // 功能启用检查
    if (!process.env.TEAM_MODE_ENABLED) {
      console.log('   ⚠️  $team模式未启用 (建议设置TEAM_MODE_ENABLED=true)');
    }
    
    if (!process.env.RI_MODE_ENABLED) {
      console.log('   ⚠️  $ri模式未启用 (建议设置RI_MODE_ENABLED=true)');
    }
    
    // 生成最终报告
    console.log('\n📋 7. 最终报告:');
    console.log('   '.repeat(2) + '─'.repeat(50));
    
    const 配置完整度 = Math.round((已配置必需变量 / 必需变量总数) * 100);
    console.log(`   📊 配置完整度: ${配置完整度}%`);
    
    if (配置完整度 >= 90) {
      console.log('   ✅ 环境变量配置良好，系统可以正常运行');
    } else if (配置完整度 >= 70) {
      console.log('   ⚠️  环境变量配置基本完整，建议完善缺失配置');
    } else {
      console.log('   ❌ 环境变量配置不足，需要补充必需配置');
    }
    
    // 保存检查结果
    await this.保存检查结果(检查结果);
    
    return 检查结果;
  }
  
  掩码敏感信息(变量名, 值) {
    if (!值 || 值.length < 8) return '***';
    
    if (变量名.includes('KEY') || 变量名.includes('TOKEN') || 变量名.includes('SECRET')) {
      if (值.startsWith('sk-') || 值.startsWith('pk-')) {
        return `sk-...${值.slice(-4)}`;
      }
      return `${值.slice(0, 4)}...${值.slice(-4)}`;
    }
    
    return 值;
  }
  
  async 保存检查结果(检查结果) {
    const 报告目录 = path.join(process.env.OPENCLAW_WORKSPACE || '/root/.openclaw/workspace', '环境变量检查报告');
    
    if (!fs.existsSync(报告目录)) {
      fs.mkdirSync(报告目录, { recursive: true });
    }
    
    const 报告文件 = path.join(报告目录, `检查报告_${Date.now()}.json`);
    const 摘要文件 = path.join(报告目录, `检查摘要_${Date.now()}.md`);
    
    // 保存详细结果
    fs.writeFileSync(报告文件, JSON.stringify(检查结果, null, 2), 'utf8');
    
    // 生成摘要
    const 摘要 = this.生成摘要报告(检查结果);
    fs.writeFileSync(摘要文件, 摘要, 'utf8');
    
    console.log(`\n📄 检查报告已保存:`);
    console.log(`   详细报告: ${报告文件}`);
    console.log(`   摘要报告: ${摘要文件}`);
    
    return { 报告文件, 摘要文件 };
  }
  
  生成摘要报告(检查结果) {
    const 必需变量总数 = Object.values(this.必需环境变量).filter(v => v.必需).length;
    const 已配置必需变量 = Object.keys(检查结果.已配置变量).filter(key => 
      this.必需环境变量[key]?.必需
    ).length;
    const 配置完整度 = Math.round((已配置必需变量 / 必需变量总数) * 100);
    
    return `
# OpenClaw 环境变量配置检查报告

## 基本信息
- 检查时间: ${检查结果.检查时间}
- 配置完整度: ${配置完整度}%
- 检查变量总数: ${检查结果.环境变量总数} 个

## 配置状态
- ✅ 已配置必需变量: ${已配置必需变量}/${必需变量总数}
- ❌ 缺失必需变量: ${检查结果.缺失变量.length} 个
- 📊 总环境变量: ${Object.keys(process.env).length} 个

## 缺失的必需变量
${检查结果.缺失变量.length > 0 ? 
  检查结果.缺失变量.map(变量 => `- ${变量.变量名}: ${变量.描述}`).join('\n') : 
  '✅ 无缺失必需变量'}

## 已配置的关键变量
${Object.entries(检查结果.已配置变量)
  .filter(([key, _]) => this.必需环境变量[key]?.类型 === '国内模型' || this.必需环境变量[key]?.类型 === '国外模型')
  .map(([key, 配置]) => `- ${key}: ${配置.描述} (已配置)`)
  .join('\n')}

## 系统资源
${(() => {
  try {
    const os = require('os');
    const 总内存 = os.totalmem() / 1024 / 1024 / 1024;
    const 空闲内存 = os.freemem() / 1024 / 1024 / 1024;
    const CPU核心 = os.cpus().length;
    
    return `- CPU核心: ${CPU核心} 核
- 总内存: ${总内存.toFixed(2)} GB
- 空闲内存: ${空闲内存.toFixed(2)} GB
- 内存使用率: ${((总内存 - 空闲内存) / 总内存 * 100).toFixed(1)}%`;
  } catch {
    return '- 资源信息: 无法获取';
  }
})()}

## 建议
${检查结果.建议.length > 0 ? 
  检查结果.建议.map((建议, 索引) => `${索引 + 1}. ${建议}`).join('\n') : 
  '✅ 配置良好，无需额外建议'}

## 结论
${配置完整度 >= 90 ? '✅ 环境变量配置完整，系统可以正常运行' :
  配置完整度 >= 70 ? '⚠️ 环境变量配置基本完整，建议完善缺失配置' :
  '❌ 环境变量配置不足，需要补充必需配置'}

---
*生成时间: ${new Date().toLocaleString('zh-CN')}*
*OpenClaw 环境变量检查工具 v1.0.0*
`;
  }
}

// CLI支持
if (require.main === module) {
  const 检查器 = new 环境变量检查器();
  
  检查器.执行检查()
    .then(检查结果 => {
      console.log('\n🎯 检查完成!');
      
      if (检查结果.缺失变量.length > 0) {
        console.log('\n⚠️  需要配置缺失的环境变量:');
        console.log('   参考模板: cat 环境变量配置模板.sh');
        console.log('   配置命令: export 变量名="变量值"');
        process.exit(1);
      }
    })
    .catch(错误 => {
      console.error('❌ 检查失败:', 错误.message);
      process.exit(1);
    });
}

module.exports = 环境变量检查器;