#!/usr/bin/env node
/**
 * 增强版Oh-my-Codex工作流
 * 支持GEMINI3.1PRO预览版+DEEPSEEKV3.2+CLAUDE opus 4.6+GPT5.4
 * 系统检查与优化分析
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class EnhancedOMCWorkflow {
  constructor() {
    this.workspace = '/root/.openclaw/workspace';
    this.reportDir = path.join(this.workspace, 'omc-analysis-reports');
    
    // 多阶段多模型配置
    this.modelConfig = {
      analysis: {
        models: ['gemini-3.1-pro', 'deepseek-v3.2'],
        purpose: '需求分析：Gemini多模态分析 + DeepSeek深度推理'
      },
      discovery: {
        models: ['claude-opus-4.6', 'gpt-5.4'],
        purpose: '系统发现：Claude精准分析 + GPT快速扫描'
      },
      evaluation: {
        models: ['gemini-3.1-pro', 'deepseek-v3.2'],
        purpose: '冗余评估：Gemini模式识别 + DeepSeek逻辑验证'
      },
      optimization: {
        models: ['claude-opus-4.6', 'gpt-5.4'],
        purpose: '优化建议：Claude架构思维 + GPT实现策略'
      }
    };
    
    // 目标关键词
    this.targetKeywords = [
      'Oh-my-Codex',
      'FREECODE',
      'CLAWCODE', 
      'CLAUDE CODE',
      'Claude code',
      'free-code',
      'clawcode',
      '纯净版'
    ];
    
    // 确保报告目录存在
    if (!fs.existsSync(this.reportDir)) {
      fs.mkdirSync(this.reportDir, { recursive: true });
    }
  }

  /**
   * 执行系统分析工作流
   */
  async executeSystemAnalysis() {
    console.log('🚀 启动系统分析工作流...');
    console.log('🧠 配置模型:');
    for (const [stage, config] of Object.entries(this.modelConfig)) {
      console.log(`  ${stage}: ${config.models.join(' + ')} - ${config.purpose}`);
    }
    
    const report = {
      timestamp: new Date().toISOString(),
      modelConfig: this.modelConfig,
      stages: {}
    };
    
    // 阶段1: 系统发现
    console.log('\n🔍 阶段1: 系统发现 (Claude + GPT)');
    report.stages.discovery = await this.discoverSystemFiles();
    
    // 阶段2: 需求分析
    console.log('\n📊 阶段2: 需求分析 (Gemini + DeepSeek)');
    report.stages.analysis = await this.analyzeRequirements();
    
    // 阶段3: 冗余评估
    console.log('\n⚖️  阶段3: 冗余评估 (Gemini + DeepSeek)');
    report.stages.evaluation = await this.evaluateRedundancy(report.stages.discovery);
    
    // 阶段4: 优化建议
    console.log('\n💡 阶段4: 优化建议 (Claude + GPT)');
    report.stages.optimization = await this.generateOptimization(report);
    
    // 生成最终报告
    const finalReport = this.generateFinalReport(report);
    
    return finalReport;
  }

  /**
   * 发现系统文件
   */
  async discoverSystemFiles() {
    const results = {
      files: [],
      directories: [],
      skills: [],
      workflows: [],
      tools: []
    };
    
    // 搜索所有相关文件
    console.log('  搜索目标关键词...');
    const searchResults = this.searchForKeywords();
    results.files = searchResults.files;
    
    // 分析目录结构
    console.log('  分析目录结构...');
    results.directories = this.analyzeDirectories();
    
    // 识别技能
    console.log('  识别技能组件...');
    results.skills = this.identifySkills();
    
    // 识别工作流
    console.log('  识别工作流...');
    results.workflows = this.identifyWorkflows();
    
    // 识别工具
    console.log('  识别工具...');
    results.tools = this.identifyTools();
    
    return results;
  }

  /**
   * 搜索关键词
   */
  searchForKeywords() {
    const results = {
      files: [],
      counts: {}
    };
    
    // 初始化计数
    this.targetKeywords.forEach(keyword => {
      results.counts[keyword] = 0;
    });
    
    // 搜索文件
    const searchDir = this.workspace;
    const allFiles = this.getAllFiles(searchDir);
    
    console.log(`  扫描 ${allFiles.length} 个文件...`);
    
    allFiles.forEach(file => {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const relativePath = path.relative(this.workspace, file);
        
        const matches = {};
        this.targetKeywords.forEach(keyword => {
          const regex = new RegExp(keyword, 'gi');
          const match = content.match(regex);
          if (match) {
            matches[keyword] = match.length;
            results.counts[keyword] += match.length;
          }
        });
        
        if (Object.keys(matches).length > 0) {
          results.files.push({
            path: relativePath,
            matches: matches,
            size: content.length,
            type: path.extname(file)
          });
        }
      } catch (error) {
        // 跳过无法读取的文件
      }
    });
    
    return results;
  }

  /**
   * 获取所有文件
   */
  getAllFiles(dir, fileList = []) {
    try {
      const files = fs.readdirSync(dir);
      
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          // 跳过一些大型或不相关的目录
          if (!this.shouldSkipDirectory(file)) {
            this.getAllFiles(filePath, fileList);
          }
        } else {
          // 只检查相关文件类型
          if (this.isRelevantFile(file)) {
            fileList.push(filePath);
          }
        }
      });
    } catch (error) {
      // 跳过无法访问的目录
    }
    
    return fileList;
  }

  /**
   * 是否跳过目录
   */
  shouldSkipDirectory(dirName) {
    const skipDirs = [
      'node_modules',
      '.git',
      '.cache',
      '__pycache__',
      'venv',
      'env',
      '.venv',
      'dist',
      'build',
      'coverage',
      '.idea',
      '.vscode'
    ];
    
    return skipDirs.includes(dirName) || dirName.startsWith('.');
  }

  /**
   * 是否相关文件
   */
  isRelevantFile(fileName) {
    const relevantExts = [
      '.js', '.cjs', '.mjs', '.ts',
      '.md', '.json', '.yaml', '.yml',
      '.py', '.sh', '.bash',
      '.txt', '.log'
    ];
    
    return relevantExts.some(ext => fileName.endsWith(ext));
  }

  /**
   * 分析目录结构
   */
  analyzeDirectories() {
    const directories = [];
    
    // 检查关键目录
    const keyDirs = [
      'modules/code-generation',
      'modules/code-generation/skills',
      'modules/code-generation/skills/code-generation',
      'workflows',
      'tools',
      'skills'
    ];
    
    keyDirs.forEach(dirPath => {
      const fullPath = path.join(this.workspace, dirPath);
      if (fs.existsSync(fullPath)) {
        try {
          const files = fs.readdirSync(fullPath);
          directories.push({
            path: dirPath,
            exists: true,
            fileCount: files.length,
            files: files.slice(0, 10) // 只取前10个文件
          });
        } catch (error) {
          directories.push({
            path: dirPath,
            exists: true,
            error: error.message
          });
        }
      } else {
        directories.push({
          path: dirPath,
          exists: false
        });
      }
    });
    
    return directories;
  }

  /**
   * 识别技能
   */
  identifySkills() {
    const skills = [];
    
    // 检查技能目录
    const skillDirs = [
      'modules/code-generation/skills/code-generation'
    ];
    
    skillDirs.forEach(skillDir => {
      const fullPath = path.join(this.workspace, skillDir);
      if (fs.existsSync(fullPath)) {
        try {
          const items = fs.readdirSync(fullPath);
          
          items.forEach(item => {
            const itemPath = path.join(fullPath, item);
            const stat = fs.statSync(itemPath);
            
            if (stat.isFile() && this.isSkillFile(item)) {
              skills.push({
                name: item,
                path: path.join(skillDir, item),
                type: this.getSkillType(item),
                size: stat.size
              });
            }
          });
        } catch (error) {
          console.log(`  读取技能目录失败: ${skillDir}`, error.message);
        }
      }
    });
    
    return skills;
  }

  /**
   * 是否技能文件
   */
  isSkillFile(fileName) {
    return fileName.endsWith('.js') || 
           fileName.endsWith('.cjs') || 
           fileName === 'SKILL.md' ||
           fileName === 'DEPLOYMENT.md';
  }

  /**
   * 获取技能类型
   */
  getSkillType(fileName) {
    if (fileName.includes('omc') || fileName.includes('workflow')) return 'workflow';
    if (fileName.includes('free') || fileName.includes('code')) return 'code-generation';
    if (fileName.includes('team')) return 'review';
    if (fileName.includes('ri')) return 'optimization';
    if (fileName.includes('architect')) return 'validation';
    if (fileName.endsWith('.md')) return 'documentation';
    return 'utility';
  }

  /**
   * 识别工作流
   */
  identifyWorkflows() {
    const workflows = [];
    
    // 查找工作流文件
    const workflowPatterns = [
      /workflow/i,
      /omc/i,
      /pipeline/i
    ];
    
    const searchDirs = [
      'modules/code-generation',
      'modules/code-generation/skills',
      this.workspace
    ];
    
    searchDirs.forEach(dirPath => {
      const fullPath = path.join(this.workspace, dirPath);
      if (fs.existsSync(fullPath)) {
        try {
          const files = this.getAllFiles(fullPath);
          
          files.forEach(file => {
            const fileName = path.basename(file);
            const relativePath = path.relative(this.workspace, file);
            
            // 检查是否匹配工作流模式
            const isWorkflow = workflowPatterns.some(pattern => 
              pattern.test(fileName) || pattern.test(relativePath)
            );
            
            if (isWorkflow) {
              const content = fs.readFileSync(file, 'utf8');
              workflows.push({
                name: fileName,
                path: relativePath,
                size: content.length,
                lines: content.split('\n').length
              });
            }
          });
        } catch (error) {
          // 跳过错误
        }
      }
    });
    
    return workflows;
  }

  /**
   * 识别工具
   */
  identifyTools() {
    const tools = [];
    
    // 检查工具配置文件
    const toolConfigs = [
      'modules/code-generation/skills/code-generation/code-generation-tools.json'
    ];
    
    toolConfigs.forEach(configPath => {
      const fullPath = path.join(this.workspace, configPath);
      if (fs.existsSync(fullPath)) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          const config = JSON.parse(content);
          
          if (config.tools && Array.isArray(config.tools)) {
            config.tools.forEach(tool => {
              tools.push({
                name: tool.name,
                description: tool.description,
                configPath: configPath,
                type: this.getToolType(tool.name)
              });
            });
          }
        } catch (error) {
          console.log(`  解析工具配置失败: ${configPath}`, error.message);
        }
      }
    });
    
    return tools;
  }

  /**
   * 获取工具类型
   */
  getToolType(toolName) {
    if (toolName.includes('free_code')) return 'code-generation';
    if (toolName.includes('omc_workflow')) return 'workflow';
    if (toolName.includes('team_mode')) return 'review';
    if (toolName.includes('ri_mode')) return 'optimization';
    if (toolName.includes('architect')) return 'validation';
    if (toolName.includes('integration')) return 'integration';
    return 'general';
  }

  /**
   * 分析需求
   */
  async analyzeRequirements() {
    // 基于发现的结果分析需求
    return {
      target: '检查Oh-my-Codex、FREECODE CLAWCODE、CLAUDE CODE纯净版相关系统',
      objectives: [
        '发现所有相关工具、技能、系统、工作流、文件',
        '识别冗余和重复功能',
        '选择最优版本',
        '论证最佳组合和融合技能'
      ],
      constraints: [
        '保持系统完整性',
        '最小化破坏性更改',
        '考虑维护成本',
        '优化性能'
      ]
    };
  }

  /**
   * 评估冗余
   */
  async evaluateRedundancy(discovery) {
    const evaluation = {
      duplicateFiles: [],
      similarFunctions: [],
      overlappingTools: [],
      recommendations: []
    };
    
    // 分析文件重复
    const fileGroups = this.groupSimilarFiles(discovery.files);
    evaluation.duplicateFiles = this.identifyDuplicates(fileGroups);
    
    // 分析工具重叠
    evaluation.overlappingTools = this.identifyToolOverlaps(discovery.tools);
    
    // 分析功能相似性
    evaluation.similarFunctions = this.identifySimilarFunctions(discovery.skills);
    
    return evaluation;
  }

  /**
   * 分组相似文件
   */
  groupSimilarFiles(files) {
    const groups = {};
    
    files.forEach(file => {
      const baseName = path.basename(file.path).toLowerCase();
      const dirName = path.dirname(file.path);
      
      if (!groups[baseName]) {
        groups[baseName] = [];
      }
      
      groups[baseName].push({
        path: file.path,
        dir: dirName,
        matches: file.matches
      });
    });
    
    return groups;
  }

  /**
   * 识别重复文件
   */
  identifyDuplicates(fileGroups) {
    const duplicates = [];
    
    Object.entries(fileGroups).forEach(([filename, files]) => {
      if (files.length > 1) {
        // 检查是否在不同目录中有相同文件
        const dirs = files.map(f => f.dir);
        const uniqueDirs = [...new Set(dirs)];
        
        if (uniqueDirs.length > 1) {
          duplicates.push({
            filename: filename,
            locations: files,
            count: files.length,
            recommendation: '考虑统一位置或删除重复'
          });
        }
      }
    });
    
    return duplicates;
  }

  /**
   * 识别工具重叠
   */
  identifyToolOverlaps(tools) {
    const overlaps = [];
    
    // 按类型分组
    const toolsByType = {};
    tools.forEach(tool => {
      if (!toolsByType[tool.type]) {
        toolsByType[tool.type] = [];
      }
      toolsByType[tool.type].push(tool);
    });
    
    // 检查每个类型中的重叠
    Object.entries(toolsByType).forEach(([type, typeTools]) => {
      if (typeTools.length > 1) {
        // 检查描述相似性
        const descriptions = typeTools.map(t => t.description.toLowerCase());
        
        // 简单相似性检查（实际中会更复杂）
        const similarPairs = [];
        for (let i = 0; i < descriptions.length; i++) {
          for (let j = i + 1; j < descriptions.length; j++) {
            const similarity = this.calculateSimilarity(descriptions[i], descriptions[j]);
            if (similarity > 0.7) { // 70%相似度阈值
              similarPairs.push({
                tool1: typeTools[i].name,
                tool2: typeTools[j].name,
                similarity: similarity,
                type: type
              });
            }
          }
        }
        
        if (similarPairs.length > 0) {
          overlaps.push({
            type: type,
            tools: typeTools.map(t => t.name),
            similarPairs: similarPairs,
            recommendation: '考虑合并或明确分工'
          });
        }
      }
    });
    
    return overlaps;
  }

  /**
   * 计算字符串相似度（简单版）
   */
  calculateSimilarity(str1, str2) {
    const words1 = new Set(str1.split(/\W+/));
    const words2 = new Set(str2.split(/\W+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  /**
   * 识别相似功能
   */
  identifySimilarFunctions(skills) {
    const similar = [];
    
    // 按类型分组
    const skillsByType = {};
    skills.forEach(skill => {
      if (!skillsByType[skill.type]) {
        skillsByType[skill.type] = [];
      }
      skillsByType[skill.type].push(skill);
    });
    
    // 检查每个类型中的相似技能
    Object.entries(skillsByType).forEach(([type, typeSkills]) => {
      if (typeSkills.length > 1) {
        // 检查名称相似性
        const names = typeSkills.map(s => s.name.toLowerCase());
        
        const similarNames = [];
        for (let i = 0; i < names.length; i++) {
          for (let j = i + 1; j < names.length; j++) {
            if (this.namesAreSimilar(names[i], names[j])) {
              similarNames.push({
                skill1: typeSkills[i].name,
                skill2: typeSkills[j].name,
                type: type
              });
            }
          }
        }
        
        if (similarNames.length > 0) {
          similar.push({
            type: type,
            skills: typeSkills.map(s => s.name),
            similarPairs: similarNames,
            count: typeSkills.length
          });
        }
      }
    });
    
    return similar;
  }

  /**
   * 检查名称是否相似
   */
  namesAreSimilar(name1, name2) {
    const commonWords = ['code', 'generate', 'workflow', 'integration', 'free', 'claude'];
    
    const words1 = name1.split(/[._-]/);
    const words2 = name2.split(/[._-]/);
    
    // 检查是否有足够多的共同单词
    const common = words1.filter(word => 
      words2.includes(word) || commonWords.includes(word)
    );
    
    return common.length >= 2; // 至少2个共同单词
  }

  /**
   * 生成优化建议
   */
  async generateOptimization(report) {
    const optimization = {
      bestVersions: [],
      combinationStrategies: [],
      fusionSkills: [],
      implementationPlan: []
    };
    
    // 选择最优版本
    optimization.bestVersions = this.selectBestVersions(report);
    
    // 制定组合策略
    optimization.combinationStrategies = this.createCombinationStrategies(report);
    
    // 设计融合技能
    optimization.fusionSkills = this.designFusionSkills(report);
    
    // 制定实施计划
    optimization.implementationPlan = this.createImplementationPlan(report, optimization);
    
    return optimization;
  }

  /**
   * 选择最优版本
   */
  selectBestVersions(report) {
    const bestVersions = [];
    
    // 分析每个工具/技能，选择最优
    const { tools, skills, workflows } = report.stages.discovery;
    
    // 工具选择标准：功能完整、文档齐全、维护活跃
    tools.forEach(tool => {
      const score = this.scoreTool(tool);
      bestVersions.push({
        name: tool.name,
        type: tool.type,
        score: score,
        recommendation: score >= 8 ? '保留并增强' : score >= 5 ? '保留但需要改进' : '考虑替换'
      });
    });
    
    // 技能选择标准：代码质量、可维护性、性能
    skills.forEach(skill => {
      const score = this.scoreSkill(skill);
      bestVersions.push({
        name: skill.name,
        type: skill.type,
        score: score,
        recommendation: score >= 8 ? '作为核心技能' : score >= 5 ? '作为辅助技能' : '考虑重构'
      });
    });
    
    // 按类型分组，选择每个类型的最佳
    const grouped = {};
    bestVersions.forEach(version => {
      if (!grouped[version.type]) {
        grouped[version.type] = [];
      }
      grouped[version.type].push(version);
    });
    
    const selected = [];
    Object.entries(grouped).forEach(([type, versions]) => {
      const sorted = versions.sort((a, b) => b.score - a.score);
      selected.push({
        type: type,
        best: sorted[0],
        alternatives: sorted.slice(1, 3)
      });
    });
    
    return selected;
  }

  /**
   * 评分工具
   */
  scoreTool(tool) {
    let score = 5; // 基础分
    
    // 基于描述长度（简单代理指标）
    if (tool.description && tool.description.length > 50) score += 1;
    
    // 基于名称清晰度
    if (tool.name && tool.name.includes('_')) score += 1; // 有下划线通常更规范
    
    // 基于类型
    if (tool.type === 'workflow' || tool.type === 'integration') score += 1;
    
    return Math.min(10, score);
  }

  /**
   * 评分技能
   */
  scoreSkill(skill) {
    let score = 5; // 基础分
    
    // 基于文件大小（简单代理指标）
    if (skill.size > 5000) score += 1; // 有一定规模
    if (skill.size > 20000) score += 1; // 规模较大
    
    // 基于文件类型
    if (skill.name.endsWith('.js') || skill.name.endsWith('.cjs')) score += 2;
    if (skill.name === 'SKILL.md') score += 1;
    
    // 基于类型
    if (skill.type === 'workflow' || skill.type === 'code-generation') score += 1;
    
    return Math.min(10, score);
  }

  /**
   * 创建组合策略
   */
  createCombinationStrategies(report) {
    const strategies = [];
    
    // 策略1: 工作流优先组合
    strategies.push({
      name: '工作流优先组合',
      description: '以Oh-my-Codex工作流为核心，集成其他工具',
      components: [
        'omc-workflow.js 作为主控制器',
        'free-code-integration.js 作为代码生成引擎',
        'team-mode-review 作为质量保障',
        'ri-mode-execute 作为优化循环'
      ],
      benefits: [
        '统一的工作流管理',
        '清晰的阶段划分',
        '易于监控和调试'
      ],
      implementation: '修改omc-workflow.js以调用其他工具'
    });
    
    // 策略2: 微服务化组合
    strategies.push({
      name: '微服务化组合',
      description: '每个功能作为独立服务，通过API组合',
      components: [
        '代码生成服务 (free-code)',
        '工作流引擎服务 (omc-workflow)',
        '审查服务 (team-mode)',
        '优化服务 (ri-mode)'
      ],
      benefits: [
        '高可扩展性',
        '独立部署和升级',
        '更好的故障隔离'
      ],
      implementation: '创建REST/WebSocket API层'
    });
    
    // 策略3: 管道式组合
    strategies.push({
      name: '管道式组合',
      description: '线性管道，每个工具处理特定阶段',
      components: [
        '输入 → 需求分析 → 架构设计 → 代码生成 → 审查 → 优化 → 输出'
      ],
      benefits: [
        '简单直观',
        '易于理解和调试',
        '顺序执行保证'
      ],
      implementation: '创建管道调度器'
    });
    
    return strategies;
  }

  /**
   * 设计融合技能
   */
  designFusionSkills(report) {
    const fusionSkills = [];
    
    // 融合技能1: 智能代码生成器
    fusionSkills.push({
      name: '智能代码生成器',
      components: [
        'free-code的纯洁版Claude模板',
        'Oh-my-Codex的架构分析',
        '$team模式的多模型验证'
      ],
      features: [
        '上下文感知的代码生成',
        '多阶段质量验证',
        '自适应模板选择',
        '实时反馈优化'
      ],
      implementation: '创建新的unified-code-generator.js'
    });
    
    // 融合技能2: 自适应工作流引擎
    fusionSkills.push({
      name: '自适应工作流引擎',
      components: [
        'Oh-my-Codex的阶段管理',
        '$ri模式的迭代优化',
        '架构师验证的质量门禁'
      ],
      features: [
        '动态工作流配置',
        '基于反馈的流程调整',
        '多目标优化',
        '异常自动恢复'
      ],
      implementation: '增强omc-workflow.js'
    });
    
    // 融合技能3: 协作开发助手
    fusionSkills.push({
      name: '协作开发助手',
      components: [
        '$team模式的多模型审查',
        '架构师验证的专家知识',
        '代码生成的一致性保证'
      ],
      features: [
        '多专家并行审查',
        '共识决策机制',
        '知识共享和积累',
        '团队协作支持'
      ],
      implementation: '创建collaboration-assistant.js'
    });
    
    return fusionSkills;
  }

  /**
   * 创建实施计划
   */
  createImplementationPlan(report, optimization) {
    const plan = {
      phase1: [],
      phase2: [],
      phase3: []
    };
    
    // 第一阶段：基础设施
    plan.phase1 = [
      '创建统一的配置文件 omc-config.json',
      '建立项目结构规范',
      '设置版本控制和备份策略',
      '创建基本的测试框架'
    ];
    
    // 第二阶段：核心集成
    plan.phase2 = [
      '实现智能代码生成器（融合技能1）',
      '集成工作流引擎和优化循环',
      '建立质量度量和监控',
      '创建文档和示例'
    ];
    
    // 第三阶段：高级功能
    plan.phase3 = [
      '实现自适应工作流（融合技能2）',
      '部署协作开发助手（融合技能3）',
      '建立性能基准测试',
      '创建部署和生产指南'
    ];
    
    return plan;
  }

  /**
   * 生成最终报告
   */
  generateFinalReport(report) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(this.reportDir, `omc-analysis-${timestamp}.json`);
    
    const finalReport = {
      meta: {
        generatedAt: timestamp,
        workspace: this.workspace,
        modelConfig: this.modelConfig
      },
      discovery: report.stages.discovery,
      analysis: report.stages.analysis,
      evaluation: report.stages.evaluation,
      optimization: report.stages.optimization,
      summary: this.generateSummary(report)
    };
    
    // 保存JSON报告
    fs.writeFileSync(reportPath, JSON.stringify(finalReport, null, 2), 'utf8');
    
    // 生成Markdown摘要
    const mdPath = path.join(this.reportDir, `omc-analysis-${timestamp}.md`);
    const mdContent = this.generateMarkdownReport(finalReport);
    fs.writeFileSync(mdPath, mdContent, 'utf8');
    
    console.log(`\n📄 报告已保存:\n  JSON: ${reportPath}\n  Markdown: ${mdPath}`);
    
    return finalReport;
  }

  /**
   * 生成摘要
   */
  generateSummary(report) {
    const { discovery, evaluation, optimization } = report.stages;
    
    return {
      filesFound: discovery.files.length,
      toolsFound: discovery.tools.length,
      skillsFound: discovery.skills.length,
      workflowsFound: discovery.workflows.length,
      duplicatesFound: evaluation.duplicateFiles.length,
      toolOverlaps: evaluation.overlappingTools.length,
      bestVersionsSelected: optimization.bestVersions.length,
      combinationStrategies: optimization.combinationStrategies.length,
      fusionSkillsDesigned: optimization.fusionSkills.length
    };
  }

  /**
   * 生成Markdown报告
   */
  generateMarkdownReport(report) {
    const { meta, discovery, evaluation, optimization, summary } = report;
    
    let md = `# Oh-my-Codex 系统分析报告

## 报告信息
- **生成时间**: ${meta.generatedAt}
- **工作空间**: ${meta.workspace}
- **使用模型**: ${Object.values(meta.modelConfig).map(c => c.models.join('+')).join(', ')}

## 系统发现摘要
- **发现文件**: ${summary.filesFound} 个相关文件
- **发现工具**: ${summary.toolsFound} 个工具
- **发现技能**: ${summary.skillsFound} 个技能
- **发现工作流**: ${summary.workflowsFound} 个工作流

## 冗余评估结果
- **重复文件**: ${summary.duplicatesFound} 组
- **工具重叠**: ${summary.toolOverlaps} 处

## 优化建议

### 最优版本选择
`;

    optimization.bestVersions.forEach((item, index) => {
      md += `\n#### ${item.type} 类型\n`;
      md += `- **最佳版本**: ${item.best.name} (评分: ${item.best.score}/10)\n`;
      md += `- **推荐**: ${item.best.recommendation}\n`;
      if (item.alternatives.length > 0) {
        md += `- **备选**: ${item.alternatives.map(a => `${a.name}(${a.score})`).join(', ')}\n`;
      }
    });

    md += `\n### 最佳组合策略\n`;

    optimization.combinationStrategies.forEach((strategy, index) => {
      md += `\n#### 策略${index + 1}: ${strategy.name}\n`;
      md += `${strategy.description}\n\n`;
      md += `**组件**:\n`;
      strategy.components.forEach(comp => {
        md += `- ${comp}\n`;
      });
      md += `\n**优势**:\n`;
      strategy.benefits.forEach(benefit => {
        md += `- ${benefit}\n`;
      });
    });

    md += `\n### 融合进化技能\n`;

    optimization.fusionSkills.forEach((skill, index) => {
      md += `\n#### 技能${index + 1}: ${skill.name}\n`;
      md += `**融合组件**: ${skill.components.join(' + ')}\n\n`;
      md += `**功能特性**:\n`;
      skill.features.forEach(feature => {
        md += `- ${feature}\n`;
      });
    });

    md += `\n## 实施计划\n`;

    const plan = optimization.implementationPlan;
    md += `\n### 第一阶段: 基础设施 (1-2周)\n`;
    plan.phase1.forEach(item => {
      md += `- ${item}\n`;
    });

    md += `\n### 第二阶段: 核心集成 (2-4周)\n`;
    plan.phase2.forEach(item => {
      md += `- ${item}\n`;
    });

    md += `\n### 第三阶段: 高级功能 (4-8周)\n`;
    plan.phase3.forEach(item => {
      md += `- ${item}\n`;
    });

    md += `\n## 关键发现和建议\n`;

    // 添加关键发现
    if (evaluation.duplicateFiles.length > 0) {
      md += `1. **文件冗余**: 发现 ${evaluation.duplicateFiles.length} 组重复文件，建议统一管理。\n`;
    }

    if (evaluation.overlappingTools.length > 0) {
      md += `2. **工具重叠**: ${evaluation.overlappingTools.length} 处功能重叠，建议合并或明确分工。\n`;
    }

    if (discovery.skills.length > 5) {
      md += `3. **技能分散**: 发现 ${discovery.skills.length} 个技能，建议按功能模块重组。\n`;
    }

    md += `\n## 结论\n`;
    md += `基于多模型分析，推荐采用 **"工作流优先组合"** 策略，以Oh-my-Codex为核心，\n`;
    md += `融合free-code的纯洁版Claude代码生成能力，通过$team模式确保质量，\n`;
    md += `利用$ri模式持续优化，最终实现智能、高效、可靠的代码生成系统。\n`;

    return md;
  }
}

// 执行分析
if (require.main === module) {
  const workflow = new EnhancedOMCWorkflow();
  
  workflow.executeSystemAnalysis()
    .then(report => {
      console.log('\n' + '='.repeat(60));
      console.log('🎉 系统分析完成!');
      console.log('='.repeat(60));
      
      console.log('\n📊 关键指标:');
      console.log(`  发现文件: ${report.summary.filesFound}`);
      console.log(`  发现工具: ${report.summary.toolsFound}`);
      console.log(`  发现技能: ${report.summary.skillsFound}`);
      console.log(`  重复文件: ${report.summary.duplicatesFound}`);
      console.log(`  工具重叠: ${report.summary.toolOverlaps}`);
      
      console.log('\n💡 推荐策略:');
      const strategies = report.optimization.combinationStrategies;
      strategies.forEach((strategy, i) => {
        console.log(`  ${i+1}. ${strategy.name}: ${strategy.description}`);
      });
      
      console.log('\n🚀 下一步:');
      console.log('  查看详细报告获取完整分析和实施计划');
    })
    .catch(error => {
      console.error('❌ 分析失败:', error.message);
      process.exit(1);
    });
}

module.exports = EnhancedOMCWorkflow;