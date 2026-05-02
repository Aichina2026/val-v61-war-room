#!/usr/bin/env node
/**
 * 自主决策层 - AutonomousPlanner
 * 自动判断复杂度，智能选择工作流，自主决策
 */

const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

class AutonomousPlanner extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            // 复杂度判断配置
            complexity: {
                simpleThreshold: 50,      // 简单任务token阈值
                mediumThreshold: 200,     // 中等任务token阈值
                complexThreshold: 500,    // 复杂任务token阈值
                criteria: {
                    technicalDepth: true,
                    scopeSize: true,
                    dependencyCount: true,
                    riskLevel: true
                }
            },
            
            // 工作流选择配置
            workflows: {
                simple: 'direct-execution',      // 直接执行
                medium: 'single-stage',          // 单阶段分析
                complex: 'parallel-4ai',         // 4AI并行推演
                expert: 'multi-round-review'     // 多轮评审
            },
            
            // 决策参数
            decision: {
                confidenceThreshold: 0.7,        // 置信度阈值
                timeout: 30000,                  // 决策超时
                maxRetries: 3                    // 最大重试
            },
            
            // 资源限制
            resources: {
                maxConcurrent: 3,
                memoryLimit: '1GB',
                timeoutProtection: true
            },
            
            ...config
        };
        
        // 状态跟踪
        this.state = {
            currentTask: null,
            complexity: null,
            selectedWorkflow: null,
            decisionHistory: [],
            successRate: 0,
            totalDecisions: 0,
            correctDecisions: 0
        };
        
        // 经验学习
        this.experience = {
            patterns: new Map(),
            outcomes: new Map(),
            preferences: {}
        };
        
        // 初始化
        this.init();
    }
    
    init() {
        console.log('🧠 自主决策层初始化完成');
        console.log('🎯 能力: 复杂度判断 + 工作流选择 + 智能决策');
        
        // 加载历史经验
        this.loadExperience();
    }
    
    /**
     * 主入口：自主规划
     */
    async plan(task, options = {}) {
        console.log('\n🚀 启动自主规划流程');
        console.log('='.repeat(50));
        console.log(`📝 任务: ${task.substring(0, 80)}${task.length > 80 ? '...' : ''}`);
        
        const startTime = Date.now();
        this.state.currentTask = task;
        
        try {
            // 1. 分析任务复杂度

            console.log('\n🔍 步骤1: 分析任务复杂度...');
            const complexity = await this.analyzeComplexity(task, options);
            console.log(`  复杂度评估: ${complexity.level} (得分: ${complexity.score}/100)`);
            
            // 2. 选择最佳工作流

            console.log('\n🎯 步骤2: 选择工作流...');
            const workflow = this.selectWorkflow(complexity, options);
            console.log(`  选择工作流: ${workflow.name} (${workflow.type})`);
            
            // 3. 制定执行计划

            console.log('\n📋 步骤3: 制定执行计划...');
            const executionPlan = this.createExecutionPlan(task, complexity, workflow, options);
            
            // 4. 评估风险与资源

            console.log('\n⚖️  步骤4: 风险评估...');
            const riskAssessment = this.assessRisks(executionPlan);
            console.log(`  风险评估: ${riskAssessment.level} (${riskAssessment.confidence}% 置信度)`);
            
            // 5. 生成最终决策

            console.log('\n🤖 步骤5: 生成最终决策...');
            const finalDecision = this.makeFinalDecision({
                task,
                complexity,
                workflow,
                executionPlan,
                riskAssessment
            });
            
            // 6. 记录决策

            const decisionTime = Date.now() - startTime;
            this.recordDecision({
                task,
                complexity,
                workflow,
                decision: finalDecision,
                time: decisionTime,
                success: null // 执行后更新
            });
            
            console.log('\n🎉 自主规划完成!');
            console.log(`⏱️  规划用时: ${decisionTime}ms`);
            console.log(`📊 决策: ${finalDecision.action}`);
            console.log(`🎯 置信度: ${finalDecision.confidence}%`);
            
            return {
                success: true,
                decision: finalDecision,
                metadata: {
                    complexity,
                    workflow,
                    executionPlan,
                    riskAssessment,
                    planningTime: decisionTime,
                    timestamp: new Date().toISOString()
                }
            };
            
        } catch (error) {
            console.error('❌ 自主规划失败:', error.message);
            
            return {
                success: false,
                error: error.message,
                metadata: {
                    planningTime: Date.now() - startTime,
                    timestamp: new Date().toISOString()
                }
            };
        }
    }
    
    /**
     * 分析任务复杂度
     */
    async analyzeComplexity(task, options = {}) {
        const analysis = {
            level: 'unknown',
            score: 0,
            factors: {},
            confidence: 0
        };
        
        // 1. 文本复杂度分析

        const textComplexity = this.analyzeTextComplexity(task);
        analysis.factors.text = textComplexity;
        analysis.score += textComplexity.score * 0.3;
        
        // 2. 技术深度分析

        const technicalDepth = await this.analyzeTechnicalDepth(task);
        analysis.factors.technical = technicalDepth;
        analysis.score += technicalDepth.score * 0.4;
        
        // 3. 范围大小分析

        const scopeSize = this.analyzeScopeSize(task);
        analysis.factors.scope = scopeSize;
        analysis.score += scopeSize.score * 0.2;
        
        // 4. 依赖关系分析

        const dependencies = this.analyzeDependencies(task);
        analysis.factors.dependencies = dependencies;
        analysis.score += dependencies.score * 0.1;
        
        // 确定复杂度级别

        analysis.score = Math.min(100, Math.max(0, analysis.score));
        analysis.confidence = this.calculateConfidence(analysis.factors);
        
        // 分配级别

        if (analysis.score < this.config.complexity.simpleThreshold) {
            analysis.level = 'simple';
        } else if (analysis.score < this.config.complexity.mediumThreshold) {
            analysis.level = 'medium';
        } else if (analysis.score < this.config.complexity.complexThreshold) {
            analysis.level = 'complex';
        } else {
            analysis.level = 'expert';
        }
        
        return analysis;
    }
    
    /**
     * 分析文本复杂度
     */
    analyzeTextComplexity(text) {
        const factors = {
            length: text.length,
            sentenceCount: (text.match(/[.!?]+/g) || []).length,
            wordCount: text.split(/\s+/).length,
            technicalTerms: this.countTechnicalTerms(text),
            uniqueWords: new Set(text.toLowerCase().split(/\W+/)).size
        };
        
        // 计算分数 (0-100)
        let score = 0;
        score += Math.min(factors.length / 10, 20);           // 长度贡献最大20分
        score += Math.min(factors.sentenceCount * 2, 10);    // 句子数量贡献最大10分
        score += Math.min(factors.technicalTerms * 5, 30);   // 技术术语贡献最大30分
        score += Math.min(factors.uniqueWords / 2, 40);      // 独特词汇贡献最大40分
        
        return {
            factors,
            score: Math.min(100, score),
            description: this.getTextComplexityDescription(score)
        };
    }
    
    /**
     * 分析技术深度
     */
    async analyzeTechnicalDepth(task) {
        // 检测技术关键词
        const techKeywords = [
            '设计', '架构', '实现', '开发', '编程', '代码',
            '算法', '数据结构', '系统', '网络', '数据库',
            'API', '接口', '协议', '安全', '性能', '测试',
            '部署', '运维', '监控', '优化'
        ];
        
        const depthKeywords = [
            '复杂', '高级', '大规模', '分布式', '高并发',
            '实时', '高可用', '容错', '扩展', '微服务',
            '人工智能', '机器学习', '深度学习', '自然语言处理'
        ];
        
        let score = 0;
        const detected = [];
        
        // 检查技术关键词
        for (const keyword of techKeywords) {
            if (task.includes(keyword)) {
                score += 2;
                detected.push(keyword);
            }
        }
        
        // 检查深度关键词
        for (const keyword of depthKeywords) {
            if (task.includes(keyword)) {
                score += 5;
                detected.push(`[深度]${keyword}`);
            }
        }
        
        // 检查具体技术栈
        const techStacks = {
            'Node.js': 3, 'Python': 3, 'Java': 3, 'Go': 3,
            'React': 2, 'Vue': 2, 'Angular': 2,
            'MySQL': 2, 'PostgreSQL': 2, 'MongoDB': 2, 'Redis': 2,
            'Docker': 3, 'Kubernetes': 4, 'AWS': 3, 'Azure': 3, 'GCP': 3,
            'TensorFlow': 5, 'PyTorch': 5, 'OpenAI': 4, 'GPT': 4
        };
        
        for (const [tech, value] of Object.entries(techStacks)) {
            if (task.includes(tech)) {
                score += value;
                detected.push(`[技术]${tech}`);
            }
        }
        
        return {
            score: Math.min(100, score * 2),
            detectedKeywords: detected,
            level: score < 10 ? '基础' : score < 20 ? '中等' : score < 30 ? '高级' : '专家'
        };
    }
    
    /**
     * 分析范围大小
     */
    analyzeScopeSize(task) {
        const scopeIndicators = {
            small: ['简单', '快速', '小', '基础', '原型'],
            medium: ['系统', '应用', '工具', '服务', '模块'],
            large: ['平台', '框架', '架构', '企业级', '大规模'],
            enterprise: ['生态系统', '解决方案', '战略', '转型', '数字化']
        };
        
        let score = 0;
        let scopeLevel = 'small';
        
        for (const [level, keywords] of Object.entries(scopeIndicators)) {
            for (const keyword of keywords) {
                if (task.includes(keyword)) {
                    switch (level) {
                        case 'small': score += 10; break;
                        case 'medium': score += 30; break;
                        case 'large': score += 60; break;
                        case 'enterprise': score += 90; break;
                    }
                    scopeLevel = level;
                }
            }
        }
        
        // 基于句子数量调整
        const sentenceCount = (task.match(/[.!?]+/g) || []).length;
        score += Math.min(sentenceCount * 5, 20);
        
        return {
            score: Math.min(100, score),
            level: scopeLevel,
            description: this.getScopeDescription(scopeLevel)
        };
    }
    
    /**
     * 分析依赖关系
     */
    analyzeDependencies(task) {
        const dependencyIndicators = [
            '依赖', '集成', '连接', '接口', '调用',
            '合作', '协同', '交互', '通信', '共享',
            '导入', '导出', '同步', '异步', '回调'
        ];
        
        let dependencyCount = 0;
        for (const indicator of dependencyIndicators) {
            if (task.includes(indicator)) {
                dependencyCount++;
            }
        }
        
        const score = Math.min(100, dependencyCount * 15);
        
        return {
            score,
            count: dependencyCount,
            level: dependencyCount === 0 ? '独立' : 
                   dependencyCount < 3 ? '低依赖' : 
                   dependencyCount < 5 ? '中依赖' : '高依赖'
        };
    }
    
    /**
     * 计算置信度
     */
    calculateConfidence(factors) {
        let confidence = 0;
        let factorCount = 0;
        
        for (const [key, factor] of Object.entries(factors)) {
            if (factor.score > 0) {
                confidence += factor.score;
                factorCount++;
            }
        }
        
        if (factorCount === 0) return 0;
        
        const avgConfidence = confidence / factorCount;
        const consistency = this.checkConsistency(factors);
        
        return Math.min(100, avgConfidence * consistency);
    }
    
    /**
     * 检查一致性
     */
    checkConsistency(factors) {
        const scores = Object.values(factors).map(f => f.score);
        if (scores.length === 0) return 0.5;
        
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        const variance = scores.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / scores.length;
        
        // 方差越小，一致性越高
        return Math.max(0.3, 1 - (variance / 2500));
    }
    
    /**
     * 选择工作流
     */
    selectWorkflow(complexity, options = {}) {
        const workflowType = this.config.workflows[complexity.level] || 'direct-execution';
        
        const workflows = {
            'direct-execution': {
                name: '直接执行',
                type: 'simple',
                description: '适用于简单任务，直接调用API执行',
                model: 'gpt-5.4',
                steps: 1,
                estimatedTime: '5-10秒',
                resources: '低'
            },
            'single-stage': {
                name: '单阶段分析',
                type: 'medium',
                description: '适用于中等复杂度任务，包含需求分析和方案制定',
                model: 'gemini-3.1-pro-preview',
                steps: 2,
                estimatedTime: '15-30秒',
                resources: '中'
            },
            'parallel-4ai': {
                name: '4AI并行推演',
                type: 'complex',
                description: '适用于复杂任务，四阶段并行推演 (Clarifier→Builder→Reviewer→Arbiter)',
                model: 'multiple',
                steps: 4,
                estimatedTime: '30-60秒',
                resources: '高'
            },
            'multi-round-review': {
                name: '多轮专家评审',
                type: 'expert',
                description: '适用于专家级任务，多轮评审和迭代优化',
                model: 'multiple-expert',
                steps: 3,
                estimatedTime: '1-2分钟',
                resources: '非常高'
            }
        };
        
        const selected = workflows[workflowType];
        
        // 应用经验调整
        const adjusted = this.applyExperienceAdjustment(selected, complexity);
        
        return {
            ...adjusted,
            selectionReason: this.getSelectionReason(complexity, adjusted)
        };
    }
    
    /**
     * 应用经验调整
     */
    applyExperienceAdjustment(workflow, complexity) {
        // 检查历史成功率
        const historyKey = `${complexity.level}_${workflow.type}`;
        const history = this.experience.outcomes.get(historyKey) || { success: 0, total: 0 };
        
        if (history.total > 0) {
            const successRate = history.success / history.total;
            
            // 如果成功率低，考虑调整
            if (successRate < 0.6 && complexity.level !== 'expert') {
                // 升级到更复杂的工作流
                const upgradeMap = {
                    'simple': 'single-stage',
                    'medium': 'parallel-4ai',
                    'complex': 'multi-round-review'
                };
                
                if (upgradeMap[complexity.level]) {
                    const upgradedType = upgradeMap[complexity.level];
                    const upgradedWorkflow = {
                        name: `${workflow.name} (升级版)`,
                        type: upgradedType,
                        description: `${workflow.description} - 基于历史成功率(${(successRate * 100).toFixed(1)}%)自动升级`,
                        model: workflow.model,
                        steps: workflow.steps + 1,
                        estimatedTime: '增加30%',
                        resources: '增加'
                    };
                    
                    console.log(`  经验调整: ${workflow.name} → ${upgradedWorkflow.name} (成功率: ${(successRate * 100).toFixed(1)}%)`);
                    return upgradedWorkflow;
                }
            }
        }
        
        return workflow;
    }
    
    /**
     * 获取选择理由
     */
    getSelectionReason(complexity, workflow) {
        const reasons = {
            simple: '任务简单，适合快速直接执行',
            medium: '任务中等复杂度，需要基本分析和规划',
            complex: '任务复杂，需要多角度并行分析和评审',
            expert: '任务专家级，需要多轮深入评审和迭代'
        };
        
        return reasons[complexity.level] || '基于复杂度分析自动选择';
    }
    
    /**
     * 创建执行计划
     */
    createExecutionPlan(task, complexity, workflow, options = {}) {
        const plan = {
            id: `plan_${Date.now()}`,
            task: task.substring(0, 100),
            complexity: complexity.level,
            workflow: workflow.type,
            steps: [],
            resources: {},
            constraints: [],
            successCriteria: []
        };
        
        // 根据工作流类型创建步骤

        switch (workflow.type) {
            case 'simple':
                plan.steps = [
                    { name: '直接执行', action: 'execute_direct', model: 'gpt-5.4', timeout: 10000 }
                ];
                plan.resources = { models: 1, estimatedTime: '10秒', tokens: 500 };
                break;
                
            case 'medium':
                plan.steps = [
                    { name: '需求分析', action: 'analyze_requirements', model: 'gpt-5.4', timeout: 15000 },
                    { name: '方案制定', action: 'create_solution', model: 'gemini-3.1-pro-preview', timeout: 15000 }
                ];
                plan.resources = { models: 2, estimatedTime: '30秒', tokens: 1000 };
                break;
                
            case 'complex':
                plan.steps = [
                    { name: 'Clarifier需求澄清', action: 'clarify', model: 'claude-opus-4.6', timeout: 20000 },
                    { name: 'Builder方案构建', action: 'build', model: 'gpt-5.4', timeout: 20000 },
                    { name: 'Reviewer方案评审', action: 'review', model: 'gemini-3.1-pro-preview', timeout: 20000 },
                    { name: 'Arbiter最终裁决', action: 'arbitrate', model: 'gpt-5.4', timeout: 20000 }
                ];
                plan.resources = { models: 4, estimatedTime: '60秒', tokens: 2000 };
                break;
                
            case 'expert':
                plan.steps = [
                    { name: '专家初审', action: 'expert_review_1', model: 'claude-opus-4.6', timeout: 30000 },
                    { name: '深度分析', action: 'deep_analysis', model: 'gpt-5.4', timeout: 30000 },
                    { name: '迭代优化', action: 'iterate_optimize', model: 'gemini-3.1-pro-preview', timeout: 30000 },
                    { name: '最终批准', action: 'final_approval', model: 'gpt-5.4', timeout: 30000 }
                ];
                plan.resources = { models: 4, estimatedTime: '120秒', tokens: 4000 };
                break;
        }
        
        // 添加约束条件

        plan.constraints = this.identifyConstraints(task, complexity);
        
        // 定义成功标准

        plan.successCriteria = this.defineSuccessCriteria(complexity, workflow);
        
        // 估计资源需求

        plan.resourceEstimate = this.estimateResourceRequirements(plan);
        
        return plan;
    }
    
    /**
     * 识别约束条件
     */
    identifyConstraints(task, complexity) {
        const constraints = [];
        
        // 技术约束
        if (task.includes('限制') || task.includes('约束') || task.includes('要求')) {
            constraints.push('技术要求');
        }
        
        // 时间约束
        if (task.includes('快速') || task.includes('紧急') || task.includes('尽快')) {
            constraints.push('时间限制');
        }
        
        // 资源约束
        if (task.includes('低成本') || task.includes('简单') || task.includes('轻量')) {
            constraints.push('资源限制');
        }
        
        // 质量约束
        if (task.includes('高质量') || task.includes('可靠') || task.includes('稳定')) {
            constraints.push('质量要求');
        }
        
        // 基于复杂度的约束
        if (complexity.level === 'expert') {
            constraints.push('专家级要求');
        }
        
        return constraints.length > 0 ? constraints : ['无明确约束'];
    }
    
    /**
     * 定义成功标准
     */
    defineSuccessCriteria(complexity, workflow) {
        const criteria = [];
        
        criteria.push('任务理解准确');
        criteria.push('方案完整可行');
        
        if (complexity.level === 'medium' || complexity.level === 'complex') {
            criteria.push('技术方案合理');
            criteria.push('风险识别充分');
        }
        
        if (complexity.level === 'complex' || complexity.level === 'expert') {
            criteria.push('多角度评审通过');
            criteria.push('最终决策可靠');
        }
        
        if (workflow.type === 'expert') {
            criteria.push('专家共识达成');
            criteria.push('迭代优化完成');
        }
        
        return criteria;
    }
    
    /**
     * 估计资源需求
     */
    estimateResourceRequirements(plan) {
        const estimate = {
            models: plan.steps.length,
            estimatedTokens: plan.steps.length * 500,
            estimatedTime: plan.steps.length * 15, // 秒
            parallelCapacity: Math.min(2, plan.steps.length)
        };
        
        return estimate;
    }
    
    /**
     * 风险评估
     */
    assessRisks(executionPlan) {
        const risks = [];
        let riskScore = 0;
        
        // 复杂度风险
        if (executionPlan.complexity === 'complex' || executionPlan.complexity === 'expert') {
            risks.push({ type: '复杂度风险', level: '中', impact: '可能超出预期时间' });
            riskScore += 30;
        }
        
        // 资源风险
        if (executionPlan.resourceEstimate.models > 3) {
            risks.push({ type: '资源风险', level: '中', impact: '可能需要更多计算资源' });
            riskScore += 20;
        }
        
        // 时间风险
        if (executionPlan.resourceEstimate.estimatedTime > 60) {
            risks.push({ type: '时间风险', level: '低', impact: '执行时间可能较长' });
            riskScore += 10;
        }
        
        // 技术风险
        if (executionPlan.constraints.includes('技术要求')) {
            risks.push({ type: '技术风险', level: '中', impact: '技术实现可能有挑战' });
            riskScore += 25;
        }
        
        // 确定风险级别

        let riskLevel = '低';
        if (riskScore >= 60) riskLevel = '高';
        else if (riskScore >= 30) riskLevel = '中';
        
        const confidence = Math.max(0.5, 1 - (riskScore / 100));
        
        return {
            level: riskLevel,
            score: riskScore,
            risks,
            confidence: Math.round(confidence * 100),
            mitigation: this.suggestRiskMitigation(risks)
        };
    }
    
    /**
     * 建议风险缓解措施
     */
    suggestRiskMitigation(risks) {
        const mitigations = [];
        
        for (const risk of risks) {
            switch (risk.type) {
                case '复杂度风险':
                    mitigations.push('分阶段实施，优先完成核心功能');
                    break;
                case '资源风险':
                    mitigations.push('优化资源配置，考虑分批执行');
                    break;
                case '时间风险':
                    mitigations.push('设置时间监控，超时自动降级');
                    break;
                case '技术风险':
                    mitigations.push('技术验证先行，准备备用方案');
                    break;
            }
        }
        
        return mitigations.length > 0 ? mitigations : ['风险较低，正常执行即可'];
    }
    
    /**
     * 生成最终决策
     */
    makeFinalDecision(analysis) {
        const { complexity, workflow, riskAssessment } = analysis;
        
        // 计算决策置信度

        const baseConfidence = complexity.confidence;
        const riskFactor = riskAssessment.confidence / 100;
        const workflowSuitability = this.assessWorkflowSuitability(complexity, workflow);
        
        const finalConfidence = Math.min(95, 
            (baseConfidence * 0.4 + riskFactor * 0.3 + workflowSuitability * 0.3) * 100
        );
        
        // 确定行动方案

        let action = '执行';
        let priority = '中';
        
        if (riskAssessment.level === '高' && finalConfidence < 60) {
            action = '重新评估';
            priority = '高';
        } else if (complexity.level === 'expert' && finalConfidence < 70) {
            action = '专家咨询';
            priority = '高';
        } else if (finalConfidence < 50) {
            action = '简化任务';
            priority = '中';
        }
        
        return {
            action,
            priority,
            confidence: Math.round(finalConfidence),
            workflow: workflow.name,
            complexity: complexity.level,
            riskLevel: riskAssessment.level,
            estimatedResources: analysis.executionPlan.resourceEstimate,
            nextSteps: this.generateNextSteps(action, complexity, workflow),
            timestamp: new Date().toISOString()
        };
    }
    
    /**
     * 评估工作流适用性
     */
    assessWorkflowSuitability(complexity, workflow) {
        const suitabilityMap = {
            'simple': { 'simple': 0.9, 'medium': 0.6, 'complex': 0.3, 'expert': 0.1 },
            'medium': { 'simple': 0.4, 'medium': 0.8, 'complex': 0.5, 'expert': 0.2 },
            'complex': { 'simple': 0.1, 'medium': 0.4, 'complex': 0.9, 'expert': 0.6 },
            'expert': { 'simple': 0.1, 'medium': 0.2, 'complex': 0.5, 'expert': 0.95 }
        };
        
        return suitabilityMap[complexity.level]?.[workflow.type] || 0.5;
    }
    
    /**
     * 生成下一步行动
     */
    generateNextSteps(action, complexity, workflow) {
        const steps = [];
        
        switch (action) {
            case '执行':
                steps.push(`启动 ${workflow.name} 工作流`);
                steps.push('监控执行过程');
                steps.push('收集结果并评估');
                break;
                
            case '重新评估':
                steps.push('重新分析任务需求');
                steps.push('调整复杂度评估');
                steps.push('重新选择工作流');
                break;
                
            case '专家咨询':
                steps.push('准备详细问题描述');
                steps.push('联系专家系统');
                steps.push('等待专家反馈');
                break;
                
            case '简化任务':
                steps.push('识别可以简化的部分');
                steps.push('重新定义任务范围');
                steps.push('重新评估复杂度');
                break;
        }
        
        // 添加通用步骤

        steps.push('记录决策和学习');
        steps.push('更新经验库');
        
        return steps;
    }
    
    /**
     * 记录决策
     */
    recordDecision(decision) {
        decision.id = `decision_${Date.now()}`;
        this.state.decisionHistory.push(decision);
        this.state.totalDecisions++;
        
        // 更新经验
        const key = `${decision.complexity}_${decision.workflow.type}`;
        const history = this.experience.outcomes.get(key) || { success: 0, total: 0 };
        history.total++;
        
        // 注意：成功字段将在执行后更新
        this.experience.outcomes.set(key, history);
        
        // 保存到文件
        this.saveExperience();
    }
    
    /**
     * 更新决策结果
     */
    updateDecisionResult(decisionId, success, feedback = {}) {
        const decision = this.state.decisionHistory.find(d => d.id === decisionId);
        if (!decision) return false;
        
        decision.success = success;
        decision.feedback = feedback;
        decision.completedAt = new Date().toISOString();
        
        // 更新统计
        if (success) {
            this.state.correctDecisions++;
            this.state.successRate = this.state.correctDecisions / this.state.totalDecisions;
            
            // 更新经验
            const key = `${decision.complexity}_${decision.workflow.type}`;
            const history = this.experience.outcomes.get(key) || { success: 0, total: 0 };
            history.success++;
            this.experience.outcomes.set(key, history);
        }
        
        // 保存经验
        this.saveExperience();
        
        return true;
    }
    
    /**
     * 加载经验
     */
    loadExperience() {
        const experienceFile = '/root/.openclaw/workspace/autonomous_planner_experience.json';
        
        try {
            if (fs.existsSync(experienceFile)) {
                const data = JSON.parse(fs.readFileSync(experienceFile, 'utf8'));
                this.experience.outcomes = new Map(Object.entries(data.outcomes || {}));
                this.state.successRate = data.successRate || 0;
                this.state.totalDecisions = data.totalDecisions || 0;
                this.state.correctDecisions = data.correctDecisions || 0;
                
                console.log(`📊 加载历史经验: ${this.state.totalDecisions} 次决策，成功率 ${(this.state.successRate * 100).toFixed(1)}%`);
            }
        } catch (error) {
            console.log('⚠️  无法加载经验文件，使用默认经验');
        }
    }
    
    /**
     * 保存经验
     */
    saveExperience() {
        const experienceFile = '/root/.openclaw/workspace/autonomous_planner_experience.json';
        const data = {
            outcomes: Object.fromEntries(this.experience.outcomes),
            successRate: this.state.successRate,
            totalDecisions: this.state.totalDecisions,
            correctDecisions: this.state.correctDecisions,
            lastUpdated: new Date().toISOString()
        };
        
        try {
            fs.writeFileSync(experienceFile, JSON.stringify(data, null, 2), 'utf8');
        } catch (error) {
            console.error('❌ 保存经验失败:', error.message);
        }
    }
    
    /**
     * 获取系统状态
     */
    getStatus() {
        return {
            state: {
                currentTask: this.state.currentTask ? this.state.currentTask.substring(0, 50) + '...' : null,
                decisionCount: this.state.totalDecisions,
                successRate: this.state.successRate,
                recentDecisions: this.state.decisionHistory.slice(-5).map(d => ({
                    complexity: d.complexity,
                    workflow: d.workflow?.name,
                    action: d.decision?.action,
                    confidence: d.decision?.confidence,
                    success: d.success
                }))
            },
            experience: {
                patternCount: this.experience.patterns.size,
                outcomeCount: this.experience.outcomes.size,
                topPatterns: Array.from(this.experience.outcomes.entries())
                    .sort((a, b) => b[1].success - a[1].success)
                    .slice(0, 3)
            },
            config: {
                complexityThresholds: this.config.complexity,
                workflows: Object.keys(this.config.workflows).length,
                decisionConfidenceThreshold: this.config.decision.confidenceThreshold
            }
        };
    }
    
    /**
     * 生成报告
     */
    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalDecisions: this.state.totalDecisions,
                correctDecisions: this.state.correctDecisions,
                successRate: this.state.successRate,
                averageConfidence: this.calculateAverageConfidence()
            },
            complexityDistribution: this.calculateComplexityDistribution(),
            workflowPerformance: this.calculateWorkflowPerformance(),
            recommendations: this.generateRecommendations()
        };
        
        return report;
    }
    
    /**
     * 计算平均置信度
     */
    calculateAverageConfidence() {
        if (this.state.decisionHistory.length === 0) return 0;
        
        const totalConfidence = this.state.decisionHistory.reduce((sum, d) => {
            return sum + (d.decision?.confidence || 0);
        }, 0);
        
        return totalConfidence / this.state.decisionHistory.length;
    }
    
    /**
     * 计算复杂度分布
     */
    calculateComplexityDistribution() {
        const distribution = {};
        
        for (const decision of this.state.decisionHistory) {
            const level = decision.complexity || 'unknown';
            distribution[level] = (distribution[level] || 0) + 1;
        }
        
        return distribution;
    }
    
    /**
     * 计算工作流性能
     */
    calculateWorkflowPerformance() {
        const performance = {};
        
        for (const [key, outcome] of this.experience.outcomes.entries()) {
            if (outcome.total > 0) {
                performance[key] = {
                    success: outcome.success,
                    total: outcome.total,
                    successRate: outcome.success / outcome.total
                };
            }
        }
        
        return performance;
    }
    
    /**
     * 生成建议
     */
    generateRecommendations() {
        const recommendations = [];
        
        // 基于成功率建议
        for (const [key, outcome] of this.experience.outcomes.entries()) {
            if (outcome.total >= 5 && outcome.success / outcome.total < 0.5) {
                recommendations.push({
                    type: '工作流调整',
                    issue: `工作流 ${key} 成功率低 (${(outcome.success / outcome.total * 100).toFixed(1)}%)`,
                    suggestion: '考虑升级到更复杂的工作流或增加验证步骤'
                });
            }
        }
        
        // 基于决策质量建议
        if (this.state.totalDecisions > 10 && this.state.successRate < 0.7) {
            recommendations.push({
                type: '决策质量',
                issue: `整体决策成功率偏低 (${(this.state.successRate * 100).toFixed(1)}%)`,
                suggestion: '调整复杂度判断阈值或增加人工验证环节'
            });
        }
        
        return recommendations.length > 0 ? recommendations : [{
            type: '系统状态',
            issue: '无',
            suggestion: '系统运行良好，继续保持'
        }];
    }
    
    // 辅助方法
    countTechnicalTerms(text) {
        const techTerms = ['API', 'JSON', 'HTTP', 'HTTPS', 'REST', 'SQL', 'NoSQL', 
                          '缓存', '队列', '微服务', '容器', '虚拟化', '负载均衡'];
        
        let count = 0;
        for (const term of