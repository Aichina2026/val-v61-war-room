#!/usr/bin/env node
/**
 * GitHub密钥查找工具
 * 用于查找和管理GitHub相关的环境变量和配置
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class GitHubKeyFinder {
    constructor() {
        this.results = {
            environmentVariables: [],
            configFiles: [],
            sshKeys: [],
            gitConfig: [],
            foundKeys: []
        };
    }
    
    /**
     * 查找所有环境变量
     */
    findAllEnvVars() {
        console.log('🔍 查找环境变量...');
        
        const envVars = process.env;
        const githubVars = [];
        
        for (const [key, value] of Object.entries(envVars)) {
            const lowerKey = key.toLowerCase();
            const lowerValue = value.toLowerCase();
            
            // 检查是否与GitHub相关
            if (lowerKey.includes('github') || 
                lowerKey.includes('git') ||
                lowerKey.includes('token') ||
                lowerKey.includes('pat') ||
                lowerValue.includes('github.com') ||
                (value.length > 30 && !value.includes(' ') && value.includes('_'))) {
                
                const entry = {
                    key,
                    value: this.maskSensitiveValue(value),
                    length: value.length,
                    type: this.detectKeyType(value)
                };
                
                githubVars.push(entry);
                
                if (entry.type === 'likely_token') {
                    console.log(`   ✅ 发现可能的令牌: ${key}`);
                }
            }
        }
        
        this.results.environmentVariables = githubVars;
        return githubVars;
    }
    
    /**
     * 查找配置文件
     */
    findConfigFiles() {
        console.log('📁 查找配置文件...');
        
        const configs = [];
        const homeDir = process.env.HOME || process.env.USERPROFILE;
        
        const possibleFiles = [
            path.join(homeDir, '.gitconfig'),
            path.join(homeDir, '.git-credentials'),
            path.join(homeDir, '.ssh', 'config'),
            path.join(homeDir, '.config', 'gh', 'hosts.yml'),
            path.join(homeDir, '.config', 'hub'),
            '/etc/gitconfig',
            '/etc/git-credentials'
        ];
        
        for (const file of possibleFiles) {
            if (fs.existsSync(file)) {
                try {
                    const stats = fs.statSync(file);
                    const content = fs.readFileSync(file, 'utf8').substring(0, 500);
                    
                    configs.push({
                        path: file,
                        size: stats.size,
                        modified: stats.mtime,
                        containsGitHub: content.includes('github.com'),
                        preview: this.maskSensitiveContent(content)
                    });
                    
                    console.log(`   📄 找到配置文件: ${file}`);
                    
                } catch (error) {
                    console.log(`   ⚠️  无法读取: ${file} (${error.message})`);
                }
            }
        }
        
        this.results.configFiles = configs;
        return configs;
    }
    
    /**
     * 查找SSH密钥
     */
    findSSHKeys() {
        console.log('🔑 查找SSH密钥...');
        
        const sshDir = path.join(process.env.HOME, '.ssh');
        const keys = [];
        
        if (fs.existsSync(sshDir)) {
            try {
                const files = fs.readdirSync(sshDir);
                
                for (const file of files) {
                    const filePath = path.join(sshDir, file);
                    const stats = fs.statSync(filePath);
                    
                    // 检查是否为私钥文件
                    if (file.match(/^id_rsa|^id_dsa|^id_ecdsa|^id_ed25519/) && 
                        stats.isFile() && 
                        !file.endsWith('.pub')) {
                        
                        keys.push({
                            name: file,
                            path: filePath,
                            size: stats.size,
                            permissions: this.getFilePermissions(filePath),
                            modified: stats.mtime,
                            hasPublicKey: fs.existsSync(filePath + '.pub')
                        });
                        
                        console.log(`   🔑 找到SSH密钥: ${file}`);
                    }
                }
                
            } catch (error) {
                console.log(`   ❌ 无法读取SSH目录: ${error.message}`);
            }
        } else {
            console.log('   ℹ️  SSH目录不存在');
        }
        
        this.results.sshKeys = keys;
        return keys;
    }
    
    /**
     * 检查Git配置
     */
    checkGitConfig() {
        console.log('⚙️  检查Git配置...');
        
        const gitConfig = [];
        
        try {
            // 获取全局配置
            const globalConfig = execSync('git config --global --list', { encoding: 'utf8' });
            const lines = globalConfig.split('\n').filter(line => line.trim());
            
            for (const line of lines) {
                const [key, value] = line.split('=', 2);
                
                if (key && value) {
                    gitConfig.push({
                        scope: 'global',
                        key,
                        value: this.maskSensitiveValue(value),
                        isGitHubRelated: value.includes('github.com') || key.includes('github')
                    });
                }
            }
            
            // 获取系统配置
            const systemConfig = execSync('git config --system --list 2>/dev/null', { encoding: 'utf8' });
            const sysLines = systemConfig.split('\n').filter(line => line.trim());
            
            for (const line of sysLines) {
                const [key, value] = line.split('=', 2);
                
                if (key && value) {
                    gitConfig.push({
                        scope: 'system',
                        key,
                        value: this.maskSensitiveValue(value),
                        isGitHubRelated: value.includes('github.com') || key.includes('github')
                    });
                }
            }
            
            console.log(`   📊 找到 ${gitConfig.length} 个Git配置项`);
            
        } catch (error) {
            console.log(`   ⚠️  无法读取Git配置: ${error.message}`);
        }
        
        this.results.gitConfig = gitConfig;
        return gitConfig;
    }
    
    /**
     * 运行所有检查
     */
    runAllChecks() {
        console.log('🚀 开始GitHub密钥查找...');
        console.log('='.repeat(50));
        
        this.findAllEnvVars();
        this.findConfigFiles();
        this.findSSHKeys();
        this.checkGitConfig();
        
        this.analyzeResults();
        this.generateReport();
        
        console.log('='.repeat(50));
        console.log('✅ 查找完成！');
        
        return this.results;
    }
    
    /**
     * 分析结果
     */
    analyzeResults() {
        console.log('📊 分析结果...');
        
        const likelyTokens = [];
        
        // 分析环境变量
        for (const envVar of this.results.environmentVariables) {
            if (envVar.type === 'likely_token' && envVar.value.length > 20) {
                likelyTokens.push({
                    source: '环境变量',
                    key: envVar.key,
                    value: envVar.value,
                    confidence: '高'
                });
            }
        }
        
        // 分析配置文件
        for (const config of this.results.configFiles) {
            if (config.containsGitHub && config.size > 100) {
                const tokens = this.extractTokensFromContent(config.content);
                if (tokens.length > 0) {
                    likelyTokens.push({
                        source: `配置文件: ${config.path}`,
                        tokens,
                        confidence: '中'
                    });
                }
            }
        }
        
        this.results.foundKeys = likelyTokens;
        return likelyTokens;
    }
    
    /**
     * 生成报告
     */
    generateReport() {
        console.log('📋 生成报告...');
        
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalEnvVars: this.results.environmentVariables.length,
                totalConfigs: this.results.configFiles.length,
                totalSSHKeys: this.results.sshKeys.length,
                totalGitConfigs: this.results.gitConfig.length,
                likelyTokens: this.results.foundKeys.length
            },
            details: {
                environmentVariables: this.results.environmentVariables,
                configFiles: this.results.configFiles.map(c => ({
                    path: c.path,
                    size: c.size,
                    containsGitHub: c.containsGitHub
                })),
                sshKeys: this.results.sshKeys,
                gitConfig: this.results.gitConfig.filter(g => g.isGitHubRelated),
                foundKeys: this.results.foundKeys
            },
            recommendations: this.generateRecommendations()
        };
        
        // 保存报告
        const reportPath = path.join(__dirname, 'github_keys_report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        console.log(`   💾 报告已保存到: ${reportPath}`);
        
        // 显示摘要
        console.log('\n📈 查找摘要:');
        console.log(`   环境变量: ${report.summary.totalEnvVars} 个`);
        console.log(`   配置文件: ${report.summary.totalConfigs} 个`);
        console.log(`   SSH密钥: ${report.summary.totalSSHKeys} 个`);
        console.log(`   Git配置: ${report.summary.totalGitConfigs} 个`);
        console.log(`   可能的令牌: ${report.summary.likelyTokens} 个`);
        
        if (report.summary.likelyTokens > 0) {
            console.log('\n🔐 找到的令牌:');
            this.results.foundKeys.forEach((token, i) => {
                console.log(`   ${i + 1}. ${token.source}`);
                console.log(`      键名: ${token.key}`);
                console.log(`      值: ${token.value}`);
            });
        }
        
        return report;
    }
    
    /**
     * 生成建议
     */
    generateRecommendations() {
        const recommendations = [];
        
        // 检查是否有GitHub令牌
        const hasGitHubTokens = this.results.foundKeys.some(key => 
            key.source.includes('环境变量') && 
            (key.key.toLowerCase().includes('github') || key.key.toLowerCase().includes('token'))
        );
        
        if (!hasGitHubTokens) {
            recommendations.push({
                priority: '高',
                action: '设置GitHub访问令牌',
                reason: '未找到GitHub相关的环境变量',
                steps: [
                    '访问 https://github.com/settings/tokens',
                  '生成新的Personal Access Token (PAT)',
                  '设置环境变量: export GITHUB_TOKEN=your_token_here',
                  '或添加到配置文件: ~/.env 或 ~/.bashrc'
                ]
            });
        }
        
        // 检查SSH密钥
        if (this.results.sshKeys.length === 0) {
            recommendations.push({
                priority: '中',
                action: '生成SSH密钥',
                reason: '未找到SSH密钥',
                steps: [
                    '运行: ssh-keygen -t ed25519 -C "your_email@example.com"',
                  '将公钥添加到GitHub: https://github.com/settings/keys',
                  '测试连接: ssh -T git@github.com'
                ]
            });
        }
        
        // 检查Git配置
        const hasGitConfig = this.results.gitConfig.some(config => 
            config.key === 'user.name' || config.key === 'user.email'
        );
        
        if (!hasGitConfig) {
            recommendations.push({
                priority: '中',
                action: '配置Git用户信息',
                reason: 'Git用户信息未设置',
                steps: [
                    '设置用户名: git config --global user.name "Your Name"',
                    '设置邮箱: git config --global user.email "your_email@example.com"'
                ]
            });
        }
        
        return recommendations;
    }
    
    /**
     * 检测密钥类型
     */
    detectKeyType(value) {
        if (!value || typeof value !== 'string') {
            return 'unknown';
        }
        
        const val = value.toLowerCase();
        
        // GitHub令牌通常以 ghp_ 或 ghs_ 或 ghu_ 开头
        if (val.startsWith('ghp_') || val.startsWith('ghs_') || val.startsWith('ghu_')) {
            return 'likely_token';
        }
        
        // 长字符串可能是令牌
        if (val.length > 30 && val.length < 100 && 
            !val.includes(' ') && 
            (val.includes('_') || val.includes('.'))) {
            return 'likely_token';
        }
        
        return 'unknown';
    }
    
    /**
     * 屏蔽敏感信息
     */
    maskSensitiveValue(value) {
        if (!value || typeof value !== 'string') {
            return '';
        }
        
        if (value.length <= 8) {
            return value;
        }
        
        // 保留前4位和后4位，中间用*代替
        const firstPart = value.substring(0, 4);
        const lastPart = value.substring(value.length - 4);
        const maskedMiddle = '*'.repeat(Math.max(0, value.length - 8));
        
        return firstPart + maskedMiddle + lastPart;
    }
    
    /**
     * 屏蔽敏感内容
     */
    maskSensitiveContent(content) {
        if (!content) {
            return '';
        }
        
        // 屏蔽可能的令牌
        const lines = content.split('\n');
        const maskedLines = lines.map(line => {
            // 屏蔽包含token、key、secret等关键词的行
            if (line.toLowerCase().match(/(token|key|secret|password|passwd|credential)=/)) {
                const parts = line.split('=');
                if (parts.length >= 2) {
                    parts[1] = this.maskSensitiveValue(parts[1]);
                    return parts.join('=');
                }
            }
            return line;
        });
        
        return maskedLines.join('\n');
    }
    
    /**
     * 获取文件权限
     */
    getFilePermissions(filePath) {
        try {
            const stats = fs.statSync(filePath);
            return stats.mode.toString(8).slice(-3);
        } catch (error) {
            return '000';
        }
    }
    
    /**
     * 从内容中提取令牌
     */
    extractTokensFromContent(content) {
        const tokens = [];
        const lines = content.split('\n');
        
        for (const line of lines) {
            // 查找类似令牌的模式
            const patterns = [
                /ghp_[a-zA-Z0-9]{36}/,
                /ghs_[a-zA-Z0-9]{36}/,
                /ghu_[a-zA-Z0-9]{36}/,
                /[a-f0-9]{40}/, // SHA-1哈希
                /[a-f0-9]{64}/  // SHA-256哈希
            ];
            
            for (const pattern of patterns) {
                const matches = line.match(pattern);
                if (matches) {
                    tokens.push({
                        token: this.maskSensitiveValue(matches[0]),
                        line: line.substring(0, 100)
                    });
                }
            }
        }
        
        return tokens;
    }
}

// 主程序
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.includes('--help') || args.includes('-h')) {
        console.log('GitHub密钥查找工具');
        console.log('='.repeat(40));
        console.log('使用方法: node find_github_keys.js [选项]');
        console.log('');
        console.log('选项:');
        console.log('  --all              运行所有检查（默认）');
        console.log('  --env              仅检查环境变量');
        console.log('  --config           仅检查配置文件');
        console.log('  --ssh              仅检查SSH密钥');
        console.log('  --git              仅检查Git配置');
        console.log('  --verbose          详细输出模式');
        console.log('');
        console.log('示例:');
        console.log('  node find_github_keys.js --all');
        console.log('  node find_github_keys.js --env --verbose');
        console.log('');
        process.exit(0);
    }
    
    const finder = new GitHubKeyFinder();
    
    if (args.includes('--env')) {
        console.log('🔍 检查环境变量...');
        const envVars = finder.findAllEnvVars();
        console.log(`✅ 找到 ${envVars.length} 个可能的GitHub相关变量`);
        
    } else if (args.includes('--config')) {
        console.log('📁 检查配置文件...');
        const configs = finder.findConfigFiles();
        console.log(`✅ 找到 ${configs.length} 个配置文件`);
        
    } else if (args.includes('--ssh')) {
        console.log('🔑 检查SSH密钥...');
        const sshKeys = finder.findSSHKeys();
        console.log(`✅ 找到 ${sshKeys.length} 个SSH密钥`);
        
    } else if (args.includes('--git')) {
        console.log('⚙️  检查Git配置...');
        const gitConfigs = finder.checkGitConfig();
        console.log(`✅ 找到 ${gitConfigs.length} 个Git配置项`);
        
    } else {
        // 默认运行所有检查
        finder.runAllChecks();
    }
}

module.exports = GitHubKeyFinder;