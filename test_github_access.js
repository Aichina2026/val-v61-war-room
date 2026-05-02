#!/usr/bin/env node
/**
 * GitHub访问测试脚本
 * 测试GitHub令牌和API访问
 */

const https = require('https');
const { execSync } = require('child_process');

class GitHubTester {
    constructor() {
        this.token = process.env.GITHUB_TOKEN;
        this.results = {
            tokenExists: false,
            tokenValid: false,
            apiAccess: false,
            userInfo: null,
            rateLimit: null,
            sshAccess: false,
            gitAccess: false,
            errors: []
        };
    }
    
    /**
     * 运行所有测试
     */
    async runAllTests() {
        console.log('🔍 GitHub访问测试');
        console.log('='.repeat(50));
        
        // 1. 检查令牌是否存在
        await this.checkTokenExists();
        
        // 2. 测试API访问
        if (this.results.tokenExists) {
            await this.testApiAccess();
            await this.testRateLimit();
        }
        
        // 3. 测试Git访问
        await this.testGitAccess();
        
        // 4. 测试SSH访问
        await this.testSSHAccess();
        
        // 5. 生成报告
        this.generateReport();
        
        return this.results;
    }
    
    /**
     * 检查令牌是否存在
     */
    async checkTokenExists() {
        console.log('1. 检查GitHub令牌...');
        
        if (this.token) {
            this.results.tokenExists = true;
            
            // 检查令牌格式
            if (this.token.startsWith('ghp_')) {
                console.log('   ✅ 找到GitHub Personal Access Token (PAT)');
                console.log(`     令牌前几位: ${this.token.substring(0, 8)}***`);
            } else if (this.token.startsWith('gho_')) {
                console.log('   ✅ 找到GitHub OAuth Access Token');
            } else if (this.token.startsWith('ghu_')) {
                console.log('   ✅ 找到GitHub User-to-Server Token');
            } else if (this.token.startsWith('ghs_')) {
                console.log('   ✅ 找到GitHub Server-to-Server Token');
            } else if (this.token.startsWith('github_pat_')) {
                console.log('   ✅ 找到GitHub Fine-grained Personal Access Token');
            } else {
                console.log('   ⚠️  找到未知格式的令牌');
            }
            
            console.log(`     令牌长度: ${this.token.length} 字符`);
            
        } else {
            console.log('   ❌ 未找到GITHUB_TOKEN环境变量');
            this.results.errors.push('未设置GITHUB_TOKEN环境变量');
        }
    }
    
    /**
     * 测试API访问
     */
    async testApiAccess() {
        console.log('2. 测试GitHub API访问...');
        
        try {
            const userData = await this.makeApiRequest('https://api.github.com/user');
            
            if (userData && userData.login) {
                this.results.tokenValid = true;
                this.results.apiAccess = true;
                this.results.userInfo = {
                    login: userData.login,
                    name: userData.name || '未设置',
                    email: userData.email || '未设置',
                    publicRepos: userData.public_repos || 0,
                    privateRepos: userData.total_private_repos || 0,
                    plan: userData.plan ? userData.plan.name : '免费版'
                };
                
                console.log(`   ✅ API访问成功`);
                console.log(`     用户名: ${userData.login}`);
                console.log(`     姓名: ${userData.name || '未设置'}`);
                console.log(`     邮箱: ${userData.email || '未设置'}`);
                console.log(`     公开仓库: ${userData.public_repos || 0}`);
                console.log(`     私有仓库: ${userData.total_private_repos || 0}`);
                
            } else {
                console.log('   ❌ API响应格式不正确');
                this.results.errors.push('API响应格式不正确');
            }
            
        } catch (error) {
            console.log(`   ❌ API访问失败: ${error.message}`);
            this.results.errors.push(`API访问失败: ${error.message}`);
        }
    }
    
    /**
     * 测试速率限制
     */
    async testRateLimit() {
        console.log('3. 检查速率限制...');
        
        try {
            const rateLimit = await this.makeApiRequest('https://api.github.com/rate_limit');
            
            if (rateLimit && rateLimit.resources) {
                const core = rateLimit.resources.core;
                const search = rateLimit.resources.search;
                
                this.results.rateLimit = {
                    core: {
                        limit: core.limit,
                        remaining: core.remaining,
                        reset: new Date(core.reset * 1000).toLocaleString()
                    },
                    search: {
                        limit: search.limit,
                        remaining: search.remaining,
                        reset: new Date(search.reset * 1000).toLocaleString()
                    }
                };
                
                console.log(`   ✅ 核心API限制: ${core.remaining}/${core.limit}`);
                console.log(`   ✅ 搜索API限制: ${search.remaining}/${search.limit}`);
                console.log(`   ✅ 限制重置时间: ${new Date(core.reset * 1000).toLocaleString()}`);
                
            } else {
                console.log('   ⚠️  无法获取速率限制信息');
            }
            
        } catch (error) {
            console.log(`   ⚠️  无法检查速率限制: ${error.message}`);
        }
    }
    
    /**
     * 测试Git访问
     */
    async testGitAccess() {
        console.log('4. 测试Git访问...');
        
        try {
            // 测试git命令可用性
            const gitVersion = execSync('git --version', { encoding: 'utf8' }).trim();
            console.log(`   ✅ ${gitVersion}`);
            
            // 测试git配置
            const gitUser = execSync('git config --global user.name 2>/dev/null || echo "未设置"', { 
                encoding: 'utf8' 
            }).trim();
            
            const gitEmail = execSync('git config --global user.email 2>/dev/null || echo "未设置"', { 
                encoding: 'utf8' 
            }).trim();
            
            console.log(`   Git用户: ${gitUser}`);
            console.log(`   Git邮箱: ${gitEmail}`);
            
            // 测试GitHub仓库访问（如果有令牌）
            if (this.token) {
                try {
                    const testUrl = `https://oauth2:${this.token}@api.github.com/user`;
                    const testResult = execSync(`curl -s -H "Accept: application/vnd.github.v3+json" "${testUrl}"`, {
                        encoding: 'utf8',
                        stdio: ['pipe', 'pipe', 'ignore']
                    });
                    
                    if (testResult.includes('login')) {
                        this.results.gitAccess = true;
                        console.log('   ✅ Git可通过令牌访问GitHub');
                    }
                } catch (error) {
                    console.log('   ⚠️  Git访问测试失败');
                }
            }
            
        } catch (error) {
            console.log(`   ❌ Git测试失败: ${error.message}`);
            this.results.errors.push(`Git测试失败: ${error.message}`);
        }
    }
    
    /**
     * 测试SSH访问
     */
    async testSSHAccess() {
        console.log('5. 测试SSH访问...');
        
        try {
            // 检查SSH目录
            const sshDir = `${process.env.HOME}/.ssh`;
            const sshFiles = execSync(`ls -la ${sshDir} 2>/dev/null || echo "SSH目录不存在"`, {
                encoding: 'utf8'
            });
            
            if (sshFiles.includes('id_')) {
                console.log('   ✅ SSH密钥存在');
                
                // 测试GitHub SSH连接
                try {
                    const sshTest = execSync('ssh -T git@github.com 2>&1', {
                        encoding: 'utf8',
                        timeout: 5000
                    });
                    
                    if (sshTest.includes('successfully authenticated')) {
                        this.results.sshAccess = true;
                        console.log('   ✅ SSH可访问GitHub');
                    } else {
                        console.log('   ⚠️  SSH连接未配置或未授权');
                    }
                    
                } catch (error) {
                    console.log('   ⚠️  SSH连接测试失败');
                }
                
            } else {
                console.log('   ℹ️  SSH密钥不存在');
            }
            
        } catch (error) {
            console.log(`   ⚠️  SSH测试失败: ${error.message}`);
        }
    }
    
    /**
     * 生成报告
     */
    generateReport() {
        console.log('\n📊 测试报告');
        console.log('='.repeat(50));
        
        const { results } = this;
        
        console.log('✅ 通过的项目:');
        if (results.tokenExists) console.log('   - GitHub令牌存在');
        if (results.tokenValid) console.log('   - GitHub令牌有效');
        if (results.apiAccess) console.log('   - GitHub API访问正常');
        if (results.gitAccess) console.log('   - Git访问正常');
        if (results.sshAccess) console.log('   - SSH访问正常');
        
        console.log('\n❌ 需要修复的项目:');
        if (!results.tokenExists) console.log('   - 需要设置GITHUB_TOKEN环境变量');
        if (!results.tokenValid && results.tokenExists) console.log('   - GitHub令牌无效或过期');
        if (!results.apiAccess && results.tokenExists) console.log('   - GitHub API访问失败');
        
        if (results.errors.length > 0) {
            console.log('\n🔴 错误详情:');
            results.errors.forEach((error, i) => {
                console.log(`   ${i + 1}. ${error}`);
            });
        }
        
        console.log('\n🚀 后续步骤:');
        if (!results.tokenExists) {
            console.log('   1. 生成GitHub Personal Access Token');
            console.log('      https://github.com/settings/tokens');
            console.log('   2. 设置环境变量:');
            console.log('      export GITHUB_TOKEN=你的令牌_这里');
            console.log('   3. 运行测试: node test_github_access.js');
        } else if (!results.tokenValid) {
            console.log('   1. 检查令牌是否有效且未过期');
            console.log('   2. 检查令牌权限是否正确');
            console.log('   3. 重新生成令牌并设置');
        }
        
        console.log('\n🔧 快速修复命令:');
        console.log('   # 设置GitHub令牌');
        console.log('   export GITHUB_TOKEN=你的令牌_这里');
        console.log('   echo "export GITHUB_TOKEN=你的令牌_这里" >> ~/.bashrc');
        console.log('   ');
        console.log('   # 生成SSH密钥');
        console.log('   ssh-keygen -t ed25519 -C "你的邮箱@example.com"');
        console.log('   cat ~/.ssh/id_ed25519.pub');
        console.log('   # 将输出复制到 https://github.com/settings/keys');
    }
    
    /**
     * 发送API请求
     */
    makeApiRequest(url) {
        return new Promise((resolve, reject) => {
            const options = {
                headers: {
                    'Authorization': `token ${this.token}`,
                    'User-Agent': 'OpenClaw-GitHub-Tester',
                    'Accept': 'application/vnd.github.v3+json'
                },
                timeout: 10000
            };
            
            const req = https.get(url, options, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    if (res.statusCode === 200) {
                        try {
                            resolve(JSON.parse(data));
                        } catch (error) {
                            reject(new Error('JSON解析失败'));
                        }
                    } else if (res.statusCode === 401) {
                        reject(new Error('令牌无效或过期'));
                    } else if (res.statusCode === 403) {
                        reject(new Error('权限不足或速率限制'));
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${data.substring(0, 100)}`));
                    }
                });
            });
            
            req.on('error', reject);
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('请求超时'));
            });
        });
    }
}

// 主程序
if (require.main === module) {
    const tester = new GitHubTester();
    
    tester.runAllTests()
        .then(() => {
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ 测试失败:', error.message);
            process.exit(1);
        });
}

module.exports = GitHubTester;