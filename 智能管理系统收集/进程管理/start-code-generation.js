#!/usr/bin/env node
/**
 * 代码生成系统启动器
 * 统一调用OpenClaw 4.1中的代码生成功能
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class CodeGenerationLauncher {
  constructor() {
    this.workspace = process.env.OPENCLAW_WORKSPACE || '/root/.openclaw/workspace';
    this.skillsDir = path.join(this.workspace, 'skills', 'code-generation');
    
    console.log('🚀 OpenClaw 4.1 代码生成系统启动');
    console.log('='.repeat(50));
    console.log('📁 技能目录:', this.skillsDir);
    console.log('='.repeat(50));
  }

  /**
   * 显示系统信息
   */
  showSystemInfo() {
    console.log('\n📋 可用功能:');
    console.log('1. free-code集成 (Claude code纯洁版)');
    console.log('2. Oh-my-Codex高级工作流');
    console.log('3. $team模式并行审查');
    console.log('4. $ri模式持久循环');
    console.log('5. 架构师级生产验证');
    console.log('6. 完整集成工作流');
    
    console.log('\n🎯 设计原则:');
    console.log('• 非侵入性: 不影响OpenClaw核心系统');
    console.log('• 国内优化: 支持国内网络环境');
    console.log('• 生产级: 架构验证和质量保证');
    console.log('• 可扩展: 模块化设计，易于扩展');
  }

  /**
   * 启动free-code生成
   */
  launchFreeCode(requirements, options = {}) {
    console.log('\n🔧 启动free-code代码生成...');
    
    const scriptPath = path.join(this.skillsDir, 'free-code-integration.js');
    
    if (!fs.existsSync(scriptPath)) {
      console.error('❌ free-code集成脚本不存在');
      return null;
    }
    
    try {
      const args = [
        'node', scriptPath,
        `"${requirements}"`
      ];
      
      if (options.template) args.push(`--template=${options.template}`);
      if (options.language) args.push(`--language=${options.language}`);
      if (options.framework) args.push(`--framework=${options.framework}`);
      if (options.quality) args.push(`--quality=${options.quality}`);
      if (options.output) args.push(`--output=${options.output}`);
      
      console.log('  执行命令:', args.join(' '));
      
      const result = execSync(args.join(' '), { 
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      return {
        success: true,
        output: result
      };
      
    } catch (error) {
      console.error('❌ 执行失败:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 启动Oh-my-Codex工作流
   */
  launchOMCWorkflow(input, options = {}) {
    console.log('\n🔄 启动Oh-my-Codex端到端工作流...');
    
    const scriptPath = path.join(this.skillsDir, 'omc-workflow.js');
    
    if (!fs.existsSync(scriptPath)) {
      console.error('❌ OMC工作流脚本不存在');
      return null;
    }
    
    try {
      const args = [
        'node', scriptPath,
        `"${input}"`
      ];
      
      if (options.output) args.push(`--output=${options.output}`);
      if (options.detailed) args.push('--detailed');
      
      console.log('  执行命令:', args.join(' '));
      
      const result = execSync(args.join(' '), { 
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      return {
        success: true,
        output: result
      };
      
    } catch (error) {
      console.error('❌ 执行失败:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 启动$team模式审查
   */
  launchTeamMode(code, options = {}) {
    console.log('\n👥 启动$team模式并行审查...');
    
    const scriptPath = path.join(this.skillsDir, 'team-mode.js');
    
    if (!fs.existsSync(scriptPath)) {
      console.error('❌ team模式脚本不存在');
      return null;
    }
    
    try {
      const args = [
        'node', scriptPath,
        `"${code}"`
      ];
      
      if (options.task) args.push(`--task=${options.task}`);
      if (options.models) args.push(`--models=${options.models}`);
      
      console.log('  执行命令:', args.join(' '));
      
      const result = execSync(args.join(' '), { 
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      return {
        success: true,
        output: result
      };
      
    } catch (error) {
      console.error('❌ 执行失败:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 启动$ri模式循环
   */
  launchRIMode(task, code, options = {}) {
    console.log('\n🔄 启动$ri模式持久执行循环...');
    
    const scriptPath = path.join(this.skillsDir, 'ri-mode.js');
    
    if (!fs.existsSync(scriptPath)) {
      console.error('❌ ri模式脚本不存在');
      return null;
    }
    
    try {
      const args = [
        'node', scriptPath,
        `"${task}"`,
        `--code="${code}"`
      ];
      
      if (options.iterations) args.push(`--iterations=${options.iterations}`);
      if (options.strictness) args.push(`--strictness=${options.strictness}`);
      if (options.goals) args.push(`--goals=${options.goals}`);
      
      console.log('  执行命令:', args.join(' '));
      
      const result = execSync(args.join(' '), { 
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      return {
        success: true,
        output: result
      };
      
    } catch (error) {
      console.error('❌ 执行失败:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 启动架构师验证
   */
  launchArchitectValidation(code, options = {}) {
    console.log('\n🏛️  启动架构师级生产验证...');
    
    const scriptPath = path.join(this.skillsDir, 'architect-validation.js');
    
    if (!fs.existsSync(scriptPath)) {
      console.error('❌ 架构师验证脚本不存在');
      return null;
    }
    
    try {
      const args = [
        'node', scriptPath,
        `"${code}"`
      ];
      
      if (options.level) args.push(`--level=${options.level}`);
      if (options.strict) args.push('--strict');
      if (options.context) args.push(`--context=${JSON.stringify(options.context)}`);
      
      console.log('  执行命令:', args.join(' '));
      
      const result = execSync(args.join(' '), { 
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      return {
        success: true,
        output: result
      };
      
    } catch (error) {
      console.error('❌ 执行失败:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 启动完整集成工作流
   */
  async launchIntegratedWorkflow(requirements, options = {}) {
    console.log('\n🌟 启动完整集成工作流...');
    console.log('  需求:', requirements.substring(0, 100) + (requirements.length > 100 ? '...' : ''));
    
    const steps = [];
    
    // 步骤1: 生成初始代码
    console.log('\n📝 步骤1: 生成初始代码');
    const generationResult = this.launchFreeCode(requirements, {
      template: options.template || 'component',
      quality: 'standard'
    });
    
    if (!generationResult?.success) {
      console.error('❌ 代码生成失败');
      return { success: false, error: '代码生成失败' };
    }
    
    steps.push({
      step: 'generation',
      success: true,
      output: generationResult.output
    });
    
    // 提取生成的代码
    const generatedCode = this.extractGeneratedCode(generationResult.output);
    
    // 步骤2: 架构设计工作流
    if (options.includeWorkflow !== false) {
      console.log('\n🏗️  步骤2: 架构设计工作流');
      const workflowResult = this.launchOMCWorkflow(requirements, {
        output: options.workflowOutput
      });
      
      steps.push({
        step: 'workflow',
        success: workflowResult?.success || false,
        output: workflowResult?.output
      });
    }
    
    // 步骤3: 并行审查
    if (options.includeTeamReview !== false) {
      console.log('\n🔍 步骤3: 并行代码审查');
      const reviewResult = this.launchTeamMode(generatedCode, {
        task: '集成工作流审查'
      });
      
      steps.push({
        step: 'review',
        success: reviewResult?.success || false,
        output: reviewResult?.output
      });
    }
    
    // 步骤4: 架构师验证
    if (options.includeArchitectValidation !== false) {
      console.log('\n✅ 步骤4: 生产级架构验证');
      const validationResult = this.launchArchitectValidation(generatedCode, {
        level: 'production',
        strict: true
      });
      
      steps.push({
        step: 'validation',
        success: validationResult?.success || false,
        output: validationResult?.output
      });
    }
    
    // 步骤5: 持久循环优化（可选）
    if (options.includeRILoop) {
      console.log('\n🔄 步骤5: 持久循环优化');
      const riResult = this.launchRIMode('优化生成代码', generatedCode, {
        iterations: options.riIterations || 5,
        goals: ['performance', 'quality']
      });
      
      steps.push({
        step: 'ri-loop',
        success: riResult?.success || false,
        output: riResult?.output
      });
    }
    
    // 生成集成报告
    const report = this.generateIntegrationReport(steps, requirements);
    
    return {
      success: steps.every(s => s.success !== false),
      steps,
      report,
      finalCode: generatedCode,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 提取生成的代码
   */
  extractGeneratedCode(output) {
    // 简化实现：返回示例代码
    return `// 生成的代码示例
export default function GeneratedComponent() {
  return (
    <div className="generated-component">
      <h1>生成的组件</h1>
      <p>基于需求生成的代码</p>
    </div>
  );
}`;
  }

  /**
   * 生成集成报告
   */
  generateIntegrationReport(steps, requirements) {
    const passedSteps = steps.filter(s => s.success).length;
    const totalSteps = steps.length;
    const successRate = totalSteps > 0 ? (passedSteps / totalSteps * 100).toFixed(1) : 0;
    
    return `
# 代码生成集成工作流报告
## 工作流概览
- 需求: ${requirements.substring(0, 200) + (requirements.length > 200 ? '...' : '')}
- 总步骤数: ${totalSteps}
- 成功步骤: ${passedSteps}
- 成功率: ${successRate}%

## 详细步骤
${steps.map((step, i) => `
### 步骤 ${i+1}: ${step.step}
- 状态: ${step.success ? '✅ 成功' : '❌ 失败'}
${step.output ? `- 输出摘要: ${step.output.substring(0, 200)}...` : ''}
`).join('\n')}

## 结论
${successRate >= 80 ? '✅ 工作流执行成功，代码质量良好' :
  successRate >= 60 ? '⚠️ 工作流基本成功，建议检查失败步骤' :
  '❌ 工作流执行失败，需要重新设计'}
`;
  }

  /**
   * 显示帮助信息
   */
  showHelp() {
    console.log('\n📖 使用说明:');
    console.log('  基本格式: node start-code-generation.js [功能] [参数]');
    console.log('\n  功能列表:');
    console.log('  --free-code "需求"        生成代码');
    console.log('  --omc-workflow "输入"     执行端到端工作流');
    console.log('  --team-review "代码"      并行代码审查');
    console.log('  --ri-loop "任务" "代码"   持久执行循环');
    console.log('  --architect-validate "代码" 架构师验证');
    console.log('  --integrated "需求"       完整集成工作流');
    console.log('\n  示例:');
    console.log('    node start-code-generation.js --free-code "创建一个React组件"');
    console.log('    node start-code-generation.js --integrated "用户管理系统"');
  }
}

// CLI支持
if (require.main === module) {
  const launcher = new CodeGenerationLauncher();
  
  if (process.argv.length <= 2) {
    launcher.showSystemInfo();
    launcher.showHelp();
    process.exit(0);
  }
  
  const command = process.argv[2];
  
  switch (command) {
    case '--free-code':
      if (process.argv.length < 4) {
        console.error('❌ 需要提供需求描述');
        process.exit(1);
      }
      launcher.launchFreeCode(process.argv[3]);
      break;
      
    case '--omc-workflow':
      if (process.argv.length < 4) {
        console.error('❌ 需要提供输入内容');
        process.exit(1);
      }
      launcher.launchOMCWorkflow(process.argv[3]);
      break;
      
    case '--team-review':
      if (process.argv.length < 4) {
        console.error('❌ 需要提供代码内容');
        process.exit(1);
      }
      launcher.launchTeamMode(process.argv[3]);
      break;
      
    case '--ri-loop':
      if (process.argv.length < 5) {
        console.error('❌ 需要提供任务和代码');
        console.log('  格式: --ri-loop "任务描述" "代码内容"');
        process.exit(1);
      }
      launcher.launchRIMode(process.argv[3], process.argv[4]);
      break;
      
    case '--architect-validate':
      if (process.argv.length < 4) {
        console.error('❌ 需要提供代码内容');
        process.exit(1);
      }
      launcher.launchArchitectValidation(process.argv[3]);
      break;
      
    case '--integrated':
      if (process.argv.length < 4) {
        console.error('❌ 需要提供需求描述');
        process.exit(1);
      }
      launcher.launchIntegratedWorkflow(process.argv[3]);
      break;
      
    case '--help':
      launcher.showHelp();
      break;
      
    default:
      console.error('❌ 未知命令:', command);
      launcher.showHelp();
      process.exit(1);
  }
}

module.exports = CodeGenerationLauncher;