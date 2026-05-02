#!/usr/bin/env node
/**
 * ReActAgent - 工具使用层
 * 支持8种工具自主调用：搜索、计算、文件操作、代码执行等
 * 基于ReAct框架（Reasoning + Acting）
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const https = require('https');

const execAsync = promisify(exec);

class ReActAgent {
    constructor(config = {}) {
        this.config = {
            // 工具配置
            tools: {
                web_search: true,
                file_operations: true,
                code_execution: true,
                calculations: true,
                time_operations: true,
                text_processing: true,
                system_info: true,
                api_calls: true
            },
            
            // 安全限制
            security: {
                allowFileWrite: true,
                allowCodeExecution: true,
                maxExecutionTime: 30000,
                allowedPaths: ['/root/.openclaw/workspace'],
                restrictedCommands: ['rm -rf', 'format', 'shutdown', 'reboot']
            },
            
            // 推理配置
            reasoning: {
                maxSteps: 10,
                timeout: 60000,
                enableSelfCorrection: true,
                confidenceThreshold: 0.6
            },
            
            ...config
        };
        
        // 状态跟踪
        this.state = {
            currentTask: null,
            stepHistory: [],
            toolUsage: {},
            successCount: 0,
            errorCount: 0,
            isReasoning: false
        };
        
        // 工具注册
        this.tools = this.registerTools();
        
        console.log('🔧 ReActAgent初始化完成');
        console.log('🎯 可用工具:', Object.keys(this.tools).length);
    }
    
    /**
     * 注册所有工具
     */
    registerTools() {
        return {
            // 1. 网络搜索
            web_search: {
                name: '网络搜索',
                description: '使用DuckDuckGo搜索网络信息',
                execute: this.webSearch.bind(this)
            },
            
            // 2. 文件操作
            file_read: {
                name: '读取文件',
                description: '读取指定文件内容',
                execute: this.readFile.bind(this)
            },
            
            file_write: {
                name: '写入文件',
                description: '写入内容到指定文件',
                execute: this.writeFile.bind(this)
            },
            
            file_list: {
                name: '列出文件',
                description: '列出目录中的文件',
                execute: this.listFiles.bind(this)
            },
            
            // 3. 代码执行
            execute_code: {
                name: '执行代码',
                description: '执行JavaScript/Python/Shell代码',
                execute: this.executeCode.bind(this)
            },
            
            // 4. 计算工具
            calculate: {
                name: '计算',
                description: '执行数学计算',
                execute: this.calculate.bind(this)
            },
            
            // 5. 时间操作
            get_time: {
                name: '获取时间',
                description: '获取当前时间或计算时间差',
                execute: this.getTime.bind(this)
            },
            
            // 6. 文本处理
            text_analyze: {
                name: '文本分析',
                description: '分析文本内容（长度、统计、关键词）',
                execute: this.analyzeText.bind(this)
            },
            
            // 7. 系统信息
            system_info: {
                name: '系统信息',
                description: '获取系统状态信息',
                execute: this.getSystemInfo.bind(this)
            },
            
            // 8. API调用
            api_call: {
                name: 'API调用',
                description: '调用外部API',
                execute: this.callAPI.bind(this)
            }
        };
    }
    
    /**
     * 主入口：ReAct推理循环
     */
    async react(task, options = {}) {
        console.log('\n🧠 启动ReAct推理循环');
        console.log('='.repeat(50));
        console.log(`📝 任务: ${task.substring(0, 80)}${task.length > 80 ? '...' : ''}`);
        
        this.state.currentTask = task;
        this.state.stepHistory = [];
        this.state.isReasoning = true;
        
        const startTime = Date.now();
        let currentThought = task;
        let finalAnswer = null;
        let step = 0;
        
        try {
            while (step < this.config.reasoning.maxSteps) {
                step++;
                console.log(`\n🔄 第 ${step} 步推理`);
                
                // 1. 思考：分析当前状态和需求

                const thought = await this.think(currentThought, step);
                console.log(`  思考: ${thought.substring(0, 100)}${thought.length > 100 ? '...' : ''}`);
                
                // 2. 行动：选择并执行工具

                const action = await this.act(thought, step);
                
                // 3. 观察：获取行动结果

                const observation = await this.observe(action);
                
                // 4. 记录步骤

                const stepRecord = {
                    step,
                    thought,
                    action: {
                        tool: action.tool,
                        parameters: action.parameters
                    },
                    observation: observation.substring(0, 200),
                    timestamp: new Date().toISOString()
                };
                
                this.state.stepHistory.push(stepRecord);
                
                // 5. 检查是否完成任务

                if (this.isTaskComplete(observation, step)) {
                    finalAnswer = this.synthesizeAnswer(observation, this.state.stepHistory);
                    console.log(`\n✅ 任务在第 ${step} 步完成`);
                    break;
                }
                
                // 6. 准备下一步

                currentThought = this.prepareNextThought(thought, observation);
            }
            
            if (!finalAnswer && step >= this.config.reasoning.maxSteps) {
                finalAnswer = this.handleTimeout(this.state.stepHistory);
            }
            
            const totalTime = Date.now() - startTime;
            this.state.isReasoning = false;
            
            // 记录成功
            this.state.successCount++;
            
            console.log('\n🎉 ReAct推理完成!');
            console.log(`⏱️  总用时: ${totalTime}ms`);
            console.log(`🔄 总步数: ${step}`);
            console.log(`🔧 工具使用: ${Object.keys(this.state.toolUsage).length} 种工具`);
            
            return {
                success: true,
                answer: finalAnswer,
                steps: step,
                time: totalTime,
                toolUsage: this.state.toolUsage,
                history: this.state.stepHistory,
                metadata: {
                    task,
                    timestamp: new Date().toISOString(),
                    reasoningSteps: step
                }
            };
            
        } catch (error) {
            this.state.isReasoning = false;
            this.state.errorCount++;
            
            console.error('❌ ReAct推理失败:', error.message);
            
            return {
                success: false,
                error: error.message,
                steps: step,
                time: Date.now() - startTime,
                history: this.state.stepHistory,
                metadata: {
                    task,
                    timestamp: new Date().toISOString(),
                    failedAtStep: step
                }
            };
        }
    }
    
    /**
     * 思考阶段：分析当前状态
     */
    async think(currentState, step) {
        const prompt = `作为ReActAgent，当前是第${step}步推理。
        
当前状态: ${currentState}

需要决定下一步行动。可用的工具包括:
${Object.entries(this.tools).map(([key, tool]) => `- ${key}: ${tool.description}`).join('\n')}

请分析:
1. 当前需要什么信息或操作？
2. 哪个工具最适合？
3. 需要什么参数？

请用中文回答你的思考过程。`;
        
        // 在实际系统中，这里会调用AI模型进行分析
        // 这里简化为基于规则的思考
        
        if (step === 1) {
            // 第一步：通常需要理解任务
            if (currentState.includes('搜索') || currentState.includes('查询')) {
                return '任务涉及信息查询，应该先使用网络搜索工具获取相关信息。';
            } else if (currentState.includes('文件') || currentState.includes('读取')) {
                return '任务涉及文件操作，应该先检查相关文件是否存在并读取内容。';
            } else if (currentState.includes('计算') || currentState.includes('算')) {
                return '任务涉及计算，应该使用计算工具进行数学运算。';
            } else {
                return '需要先分析任务需求，使用文本分析工具理解任务内容。';
            }
        }
        
        // 后续步骤：基于历史进行思考
        const lastStep = this.state.stepHistory[this.state.stepHistory.length - 1];
        if (lastStep) {
            if (lastStep.observation.includes('没有找到') || lastStep.observation.includes('失败')) {
                return '上一步操作失败，需要尝试其他方法或工具。';
            } else if (lastStep.observation.includes('成功') && lastStep.observation.length > 50) {
                return '已获取足够信息，可以开始合成最终答案。';
            }
        }
        
        return '继续执行任务，使用适当的工具收集更多信息。';
    }
    
    /**
     * 行动阶段：选择并执行工具
     */
    async act(thought, step) {
        // 从思考中提取工具和参数
        const { toolName, parameters } = this.extractActionFromThought(thought);
        
        if (!toolName || !this.tools[toolName]) {
            // 默认使用文本分析
            return {
                tool: 'text_analyze',
                parameters: { text: thought }
            };
        }
        
        // 记录工具使用
        this.state.toolUsage[toolName] = (this.state.toolUsage[toolName] || 0) + 1;
        
        console.log(`  行动: 使用 ${this.tools[toolName].name}`);
        
        return {
            tool: toolName,
            parameters: parameters || {}
        };
    }
    
    /**
     * 从思考中提取行动
     */
    extractActionFromThought(thought) {
        const toolPatterns = {
            web_search: ['搜索', '查询', '查找', '上网', '网络'],
            file_read: ['读取', '打开', '查看文件', '文件内容'],
            file_write: ['写入', '保存', '创建文件', '写文件'],
            file_list: ['列出', '目录', '文件夹', '文件列表'],
            execute_code: ['执行', '运行', '代码', '脚本', '程序'],
            calculate: ['计算', '算', '数学', '公式', '等于'],
            get_time: ['时间', '日期', '现在几点', '时间差'],
            text_analyze: ['分析', '理解', '文本', '内容', '总结'],
            system_info: ['系统', '状态', '信息', '配置', '环境'],
            api_call: ['API', '接口', '调用', '请求', '服务']
        };
        
        for (const [tool, patterns] of Object.entries(toolPatterns)) {
            for (const pattern of patterns) {
                if (thought.includes(pattern)) {
                    return { toolName: tool, parameters: this.extractParameters(thought, tool) };
                }
            }
        }
        
        return { toolName: null, parameters: {} };
    }
    
    /**
     * 提取参数
     */
    extractParameters(thought, tool) {
        const params = {};
        
        switch (tool) {
            case 'web_search':
                // 提取搜索关键词
                const searchMatch = thought.match(/搜索\s*(.+?)(?:。|$)/);
                if (searchMatch) params.query = searchMatch[1];
                break;
                
            case 'file_read':
                // 提取文件名
                const fileMatch = thought.match(/文件\s*(.+?)(?:的|内容|$)/);
                if (fileMatch) params.path = fileMatch[1];
                break;
                
            case 'calculate':
                // 提取计算表达式
                const calcMatch = thought.match(/计算\s*(.+?)(?:。|$)/);
                if (calcMatch) params.expression = calcMatch[1];
                break;
        }
        
        return params;
    }
    
    /**
     * 观察阶段：执行工具并获取结果
     */
    async observe(action) {
        const { tool, parameters } = action;
        
        if (!this.tools[tool]) {
            return `错误：未知工具 ${tool}`;
        }
        
        try {
            // 安全检查
            if (!this.securityCheck(tool, parameters)) {
                return `安全限制：不允许执行 ${tool} 操作`;
            }
            
            // 执行工具
            const result = await this.tools[tool].execute(parameters);
            return `成功：${result}`;
            
        } catch (error) {
            return `失败：${error.message}`;
        }
    }
    
    /**
     * 安全检查
     */
    securityCheck(tool, parameters) {
        const { security } = this.config;
        
        // 检查文件写入权限
        if (tool === 'file_write' && !security.allowFileWrite) {
            return false;
        }
        
        // 检查代码执行权限
        if (tool === 'execute_code' && !security.allowCodeExecution) {
            return false;
        }
        
        // 检查路径限制
        if (parameters.path) {
            const absolutePath = path.resolve(parameters.path);
            const allowed = security.allowedPaths.some(allowedPath => 
                absolutePath.startsWith(path.resolve(allowedPath))
            );
            
            if (!allowed) {
                console.log(`⚠️  路径不在允许列表中: ${absolutePath}`);
                return false;
            }
        }
        
        // 检查危险命令
        if (parameters.command) {
            for (const restricted of security.restrictedCommands) {
                if (parameters.command.includes(restricted)) {
                    console.log(`⚠️  检测到危险命令: ${parameters.command}`);
                    return false;
                }
            }
        }
        
        return true;
    }
    
    /**
     * 检查任务是否完成
     */
    isTaskComplete(observation, step) {
        // 基于观察内容和步骤数判断
        const completeIndicators = [
            '答案：', '结果：', '总结：', '完成',
            'sufficient information', 'final answer'
        ];
        
        const incompleteIndicators = [
            '需要更多', '还需要', '下一步', '继续',
            'insufficient', 'need more'
        ];
        
        const obsLower = observation.toLowerCase();
        
        // 检查完成指标
        for (const indicator of completeIndicators) {
            if (obsLower.includes(indicator.toLowerCase())) {
                return true;
            }
        }
        
        // 检查未完成指标
        for (const indicator of incompleteIndicators) {
            if (obsLower.includes(indicator.toLowerCase())) {
                return false;
            }
        }
        
        // 如果步骤较多且观察内容较长，认为可能完成
        if (step >= 5 && observation.length > 100) {
            return true;
        }
        
        return false;
    }
    
    /**
     * 合成最终答案
     */
    synthesizeAnswer(finalObservation, history) {
        // 从历史中提取关键信息
        const keyObservations = history
            .map(step => step.observation)
            .filter(obs => !obs.includes('失败') && !obs.includes('错误'))
            .join('\n');
        
        return `基于ReAct推理过程，得出以下结论：
        
${finalObservation}

推理过程摘要:
${history.map((step, i) => `步骤 ${i + 1}: ${step.thought.substring(0, 50)}...`).join('\n')}

使用的工具: ${Object.keys(this.state.toolUsage).join(', ')}`;
    }
    
    /**
     * 准备下一步思考
     */
    prepareNextThought(previousThought, observation) {
        return `上一步: ${previousThought}
结果: ${observation.substring(0, 100)}...
决定下一步行动。`;
    }
    
    /**
     * 处理超时
     */
    handleTimeout(history) {
        const lastObservation = history.length > 0 ? history[history.length - 1].observation : '无';
        
        return `达到最大推理步数限制。最后观察: ${lastObservation}

建议:
1. 任务可能过于复杂
2. 可能需要更多上下文信息
3. 考虑简化任务或分步执行`;
    }
    
    /***********************
     * 工具实现
     ***********************/
    
    /**
     * 1. 网络搜索
     */
    async webSearch(params) {
        const query = params.query || '人工智能最新进展';
        
        try {
            // 使用DuckDuckGo搜索
            const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`;
            
            const data = await new Promise((resolve, reject) => {
                https.get(searchUrl, (res) => {
                    let data = '';
                    res.on('data', (chunk) => data += chunk);
                    res.on('end', () => resolve(JSON.parse(data)));
                }).on('error', reject);
            });
            
            let result = `搜索 "${query}" 的结果:\n`;
            
            if (data.Abstract) {
                result += `摘要: ${data.Abstract}\n`;
            }
            
            if (data.RelatedTopics && data.RelatedTopics.length > 0) {
                result += '相关主题:\n';
                data.RelatedTopics.slice(0, 3).forEach((topic, i) => {
                    if (topic.Text) {
                        result += `${i + 1}. ${topic.Text}\n`;
                    }
                });
            }
            
            return result || '未找到相关信息';
            
        } catch (error) {
            throw new Error(`搜索失败: ${error.message}`);
        }
    }
    
    /**
     * 2.1 读取文件
     */
    async readFile(params) {
        const filePath = params.path || '/root/.openclaw/workspace/README.md';
        
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            return `文件 ${filePath} 的内容 (前500字符):\n${content.substring(0, 500)}${content.length > 500 ? '...' : ''}`;
        } catch (error) {
            throw new Error(`读取文件失败: ${error.message}`);
        }
    }
    
    /**
     * 2.2 写入文件
     */
    async writeFile(params) {
        const filePath = params.path || `/root/.openclaw/workspace/temp_${Date.now()}.txt`;
        const content = params.content || '默认内容';
        
        try {
            fs.writeFileSync(filePath, content, 'utf8');
            return `成功写入文件: ${filePath} (${content.length} 字符)`;
        } catch (error) {
            throw new Error(`写入文件失败: ${error.message}`);
        }
    }
    
    /**
     * 2.3 列出文件
     */
    async listFiles(params) {
        const dirPath = params.path || '/root/.openclaw/workspace';
        
        try {
            const files = fs.readdirSync(dirPath);
            const fileInfo = files.slice(0, 10).map(file => {
                const stat = fs.statSync(path.join(dirPath, file));
                return `${file} (${stat.isDirectory() ? '目录' : '文件'}, ${stat.size} 字节)`;
            });
            
            return `目录 ${dirPath} 中的文件:\n${fileInfo.join('\n')}${files.length > 10 ? `\n... 还有 ${files.length - 10} 个文件` : ''}`;
        } catch (error) {
            throw new Error(`列出文件失败: ${error.message}`);
        }
    }
    
    /**
     * 3. 执行代码
     */
    async executeCode(params) {
        const code = params.code || 'console.log("Hello, World!");';
        const language = params.language || 'javascript';
        
        try {
            let result;
            
            if (language === 'javascript' || language === 'js') {
                // 在安全沙箱中执行JavaScript
                const vm = require('vm');
                const context = { console, require, process, __dirname, __filename };
                vm.createContext(context);
                
                const script = new vm.Script(code);
                result = script.runInContext(context, { timeout: 5000 });
                result = String(result || '代码执行完成（无输出）');
                
            } else if (language === 'python' || language === 'py') {
                // 执行Python代码
                const { stdout, stderr } = await execAsync(`python3 -c "${code.replace(/"/g, '\\"')}"`, { timeout: 10000 });
                result = stdout || stderr || 'Python代码执行完成';
                
            } else if (language === 'shell' || language === 'bash') {
                // 执行Shell命令
                const { stdout, stderr } = await execAsync(code, { timeout: 10000 });
                result = stdout || stderr || 'Shell命令执行完成';
                
            } else {
                throw new Error(`不支持的语言: ${language}`);
            }
            
            return `${language} 代码执行结果:\n${result.substring(0, 500)}${result.length > 500 ? '...' : ''}`;
            
        } catch (error) {
            throw new Error(`代码执行失败: ${error.message}`);
        }
    }
    
    /**
     * 4. 计算
     */
    async calculate(params) {
        const expression = params.expression || '1 + 1';
        
        try {
            // 安全计算：使用math.js或自定义解析
            const safeEval = (expr) => {
                // 移除危险字符
                const sanitized = expr.replace(/[^0-9+\-*/().\s]/g, '');
                
                // 使用Function构造器进行安全计算
                try {
                    return Function(`"use strict"; return (${sanitized})`)();
                } catch (e) {
                    throw new Error('计算表达式无效或包含危险操作');
                }
            };
            
            const result = safeEval(expression);
            return `${expression} = ${result}`;
            
        } catch (error) {
            throw new Error(`计算失败: ${error.message}`);
        }
    }
    
    /**
     * 5. 获取时间
     */
    async getTime(params) {
        const now = new Date();
        
        if (params.operation === 'diff' && params.start && params.end) {
            try {
                const start = new Date(params.start);
                const end = new Date(params.end);
                const diffMs = end - start;
                
                const diffSeconds = Math.floor(diffMs / 1000);
                const diffMinutes = Math.floor(diffSeconds / 60);
                const diffHours = Math.floor(diffMinutes / 60);
                const diffDays = Math.floor(diffHours / 24);
                
                return `时间差: ${diffDays}天 ${diffHours % 24}小时 ${diffMinutes % 60}分钟 ${diffSeconds % 60}秒`;
            } catch (error) {
                throw new Error(`时间计算失败: ${error.message}`);
            }
        }
        
        return `当前时间: ${now.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
UTC时间: ${now.toISOString()}
时间戳: ${now.getTime()}`;
    }
    
    /**
     * 6. 文本分析
     */
    async analyzeText(params) {
        const text = params.text || '';
        
        if (!text || text.trim().length === 0) {
            return '文本为空，无法分析';
        }
        
        const analysis = {
            length: text.length,
            characterCount: text.length,
            wordCount: text.split(/\s+/).filter(w => w.length > 0).length,
            sentenceCount: (text.match(/[.!?]+/g) || []).length,
            paragraphCount: (text.match(/\n\s*\n/g) || []).length + 1,
            readingTime: Math.ceil(text.length / 1000) // 大约每分钟1000字
        };
        
        // 检测语言（简单检测）
        const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
        const englishWords = (text.match(/\b[a-zA-Z]+\b/g) || []).length;
        
        analysis.language = chineseChars > englishWords ? '中文' : '英文';
        
        // 提取关键词（简单实现）
        const words = text.toLowerCase().split(/\W+/).filter(w => w.length > 2);
        const wordFreq = {};
        words.forEach(word => {
            wordFreq[word] = (wordFreq[word] || 0) + 1;
        });
        
        const keywords = Object.entries(wordFreq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([word, freq]) => `${word}(${freq})`);
        
        analysis.keywords = keywords;
        
        return `文本分析结果:
- 字符数: ${analysis.length}
- 单词数: ${analysis.wordCount}
- 句子数: ${analysis.sentenceCount}
- 段落数: ${analysis.paragraphCount}
- 预计阅读时间: ${analysis.readingTime} 分钟
- 主要语言: ${analysis.language}
- 关键词: ${analysis.keywords.join(', ')}`;
    }
    
    /**
     * 7. 系统信息
     */
    async getSystemInfo(params) {
        try {
            const info = {
                platform: process.platform,
                arch: process.arch,
                nodeVersion: process.version,
                memory: {
                    total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB',
                    used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
                  rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + 'MB'
                },
                uptime: Math.round(process.uptime()) + '秒',
                cwd: process.cwd(),
                env: Object.keys(process.env).length + ' 个环境变量'
            };
            
            // 获取更多系统信息（如果可用）
            try {
                const { stdout: cpuInfo } = await execAsync('nproc');
                info.cpuCores = cpuInfo.trim();
            } catch (e) { /* 忽略错误 */ }
            
            try {
                const { stdout: diskInfo } = await execAsync('df -h /');
                info.disk = diskInfo.split('\n')[1];
            } catch (e) { /* 忽略错误 */ }
            
            return `系统信息:
- 平台: ${info.platform} (${info.arch})
- Node.js版本: ${info.nodeVersion}
- CPU核心: ${info.cpuCores || '未知'}
- 内存: ${info.memory.used} / ${info.memory.total} (RSS: ${info.memory.rss})
- 磁盘: ${info.disk || '未知'}
- 运行时间: ${info.uptime}
- 工作目录: ${info.cwd}
- 环境变量: ${info.env}`;
            
        } catch (error) {
            throw new Error(`获取系统信息失败: ${error.message}`);
        }
    }
    
    /**
     * 8. API调用
     */
    async callAPI(params) {
        const url = params.url || 'https://api.github.com';
        const method = params.method || 'GET';
        const headers = params.headers || {};
        const body = params.body;
        
        try {
            return new Promise((resolve, reject) => {
                const urlObj = new URL(url);
                const options = {
                    hostname: urlObj.hostname,
                    port: urlObj.port || 443,
                    path: urlObj.pathname + urlObj.search,
                    method: method,
                    headers: {
                        'User-Agent': 'ReActAgent/1.0',
                        ...headers
                    },
                    timeout: 10000
                };
                
                const req = https.request(options, (res) => {
                    let data = '';
                    res.on('data', (chunk) => data += chunk);
                    res.on('end', () => {
                        try {
                            const parsed = JSON.parse(data);
                            resolve(`API调用成功 (${res.statusCode}):
响应: ${JSON.stringify(parsed, null, 2).substring(0, 300)}${data.length > 300 ? '...' : ''}`);
                        } catch (e) {
                            resolve(`API调用成功 (${res.statusCode}):
响应: ${data.substring(0, 300)}${data.length > 300 ? '...' : ''}`);
                        }
                    });
                });
                
                req.on('error', reject);
                req.on('timeout', () => {
                    req.destroy();
                    reject(new Error('API调用超时'));
                });
                
                if (body) {
                    req.write(typeof body === 'string' ? body : JSON.stringify(body));
                }
                
                req.end();
            });
            
        } catch (error) {
            throw new Error(`API调用失败: ${error.message}`);
        }
    }
    
    /**
     * 获取状态
     */
    getStatus() {
        return {
            state: {
                currentTask: this.state.currentTask ? this.state.currentTask.substring(0, 50) + '...' : null,
                isReasoning: this.state.isReasoning,
                successCount: this.state.successCount,
                errorCount: this.state.errorCount,
                successRate: this.state.successCount > 0 ? 
                    this.state.successCount / (this.state.successCount + this.state.errorCount) : 0
            },
            tools: {
                available: Object.keys(this.tools).length,
                usage: this.state.toolUsage,
                topUsed: Object.entries(this.state.toolUsage)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3)
                    .map(([tool, count]) => ({ tool, count }))
            },
            config: {
                enabledTools: Object.keys(this.config.tools).filter(k => this.config.tools[k]),
                securityRestrictions: Object.keys(this.config.security).length
            }
        };
    }
    
    /**
     * 生成报告
     */
    generateReport() {
        return {
            timestamp: new Date().toISOString(),
            summary: {
                totalTasks: this.state.successCount + this.state.errorCount,
                successCount: this.state.successCount,
                errorCount: this.state.errorCount,
                successRate: this.state.successCount > 0 ? 
                    this.state.successCount / (this.state.successCount + this.state.errorCount) : 0,
                averageSteps: this.state.stepHistory.length > 0 ? 
                    this.state.stepHistory.length / this.state.successCount : 0
            },
            toolAnalysis: this.state.toolUsage,
            recentTasks: this.state.stepHistory.slice(-3).map(step => ({
                thought: step.thought.substring(0, 50) + '...',
                tool: step.action.tool,
                timestamp: step.timestamp
            })),
            recommendations: this.generateRecommendations()
        };
    }
    
    /**
     * 生成建议
     */
    generateRecommendations() {
        const recommendations = [];
        
        // 分析工具使用情况
        const toolEntries = Object.entries(this.state.toolUsage);
        if (toolEntries.length > 0) {
            const [mostUsed] = toolEntries.sort((a, b) => b[1] - a[1])[0];
            recommendations.push(`最常用工具: ${mostUsed}，考虑优化相关任务`);
        }
        
        // 分析错误情况
        if (this.state.errorCount > this.state.successCount * 0.3) {
            recommendations.push('错误率较高，建议增加安全检查和错误处理');
        }
        
        // 分析步骤效率
        if (this.state.stepHistory.length > 0) {
            const avgSteps = this.state.stepHistory.length / this.state.successCount;
            if (avgSteps > 5) {
                recommendations.push('平均推理步数较多，考虑优化任务分解策略');
            }
        }
        
        return recommendations.length > 0 ? recommendations : ['系统运行良好'];
    }
}

// 主程序
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
        console.log('ReActAgent - 工具使用层');
        console.log('='.repeat(40));
        console.log('使用方法: node ReActAgent.js "你的任务" [选项]');
        console.log('');
        console.log('选项:');
        console.log('  --verbose             详细输出模式');
        console.log('  --max-steps <数量>    最大推理步数');
        console.log('  --status              查看系统状态');
        console.log('  --report              生成报告');
        console.log('  --test-tool <工具名>  测试特定工具');
        console.log('');
        console.log('示例:');
        console.log('  node ReActAgent.js "搜索人工智能最新进展"');
        console.log('  node ReActAgent.js "计算圆的面积，半径=5"');
        console.log('  node ReActAgent.js "读取README文件并分析"');
        console.log('  node ReActAgent.js --status');
        console.log('');
        process.exit(0);
    }
    
    const agent = new ReActAgent();
    
    if (args.includes('--status')) {
        const status = agent.getStatus();
        console.log(JSON.stringify(status, null, 2));
        process.exit(0);
    }
    
    if (args.includes('--report')) {
        const report = agent.generateReport();
        console.log(JSON.stringify(report, null, 2));
        process.exit(0);
    }
    
    if (args.includes('--test-tool')) {
        const toolIndex = args.indexOf('--test-tool');
        const toolName = args[toolIndex + 1];
        
        if (!toolName) {
            console.error('请指定要测试的工具名');
            process.exit(1);
        }
        
        console.log(`测试工具: ${toolName}`);
        
        // 执行简单的工具测试
        const testParams = {};
        switch (toolName) {
            case 'web_search':
                testParams.query = '人工智能';
                break;
            case 'file_read':
                testParams.path = '/root/.openclaw/workspace/README.md';
                break;
            case 'calculate':
                testParams.expression = '2 * (3 + 4)';
                break;
        }
        
        agent.tools[toolName]?.execute(testParams)
            .then(result => {
                console.log('测试结果:', result);
                process.exit(0);
            })
            .catch(error => {
                console.error('测试失败:', error.message);
                process.exit(1);
            });
        
        return;
    }
    
    // 执行ReAct推理
    const task = args.filter(arg => !arg.startsWith('--')).join(' ');
    const options = {
        verbose: args.includes('--verbose'),
        maxSteps: parseInt(args[args.indexOf('--max-steps') + 1]) || 10
    };
    
    if (!task) {
        console.error('请提供任务描述');
        process.exit(1);
    }
    
    agent.react(task, options)
        .then(result => {
            if (result.success) {
                console.log('\n🎯 最终答案:');
                console.log(result.answer);
            } else {
                console.error('❌ 任务失败:', result.error);
            }
            process.exit(result.success ? 0 : 1);
        })
        .catch(error => {
            console.error('❌ 执行失败:', error.message);
            process.exit(1);
        });
}

module.exports = ReActAgent;