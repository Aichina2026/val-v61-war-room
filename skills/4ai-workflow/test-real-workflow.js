const { execute } = require('./index.js');

// 模拟真实的OpenClaw上下文
const mockContext = {
  tools: {
    memory_search: async ({ query }) => {
      console.log('  [Scout] Searching memory:', query.slice(0, 50));
      return {
        results: [
          { snippet: '4AI workflow implements multi-agent orchestration' },
          { snippet: 'Strategy library persists evolution data' }
        ]
      };
    },
    web_fetch: async ({ url }) => {
      console.log('  [Scout] Fetching:', url);
      return { content: 'OpenClaw documentation: Skills are native plugins' };
    },
    sessions_send: async ({ message, model }) => {
      const role = message.includes('requirement') ? 'Clarifier' :
                   message.includes('architect') ? 'Builder' :
                   message.includes('security') ? 'Reviewer' :
                   message.includes('arbitrator') ? 'Arbiter' : 'Unknown';
      
      console.log(`  [${role}] Using model: ${model}`);
      
      // 模拟真实响应延迟
      await new Promise(r => setTimeout(r, 100));
      
      if (role === 'Clarifier') {
        return {
          message: `## 需求分析结果

### 核心需求
1. 审查4AI工作流代码质量
2. 检查安全性和错误处理
3. 评估架构可扩展性
4. 提出优化建议

### 边界条件
- 使用BIFROST模型路由
- 支持5角色并行执行
- 策略库持久化存储

### 成功标准
- 代码无语法错误
- 所有角色正常执行
- 策略库正确记录结果`
        };
      }
      
      if (role === 'Builder') {
        return {
          message: `## 架构评估报告

### 当前架构
- **模式**: 多Agent并行编排
- **通信**: 基于Promise.all的并行执行
- **持久化**: 文件系统JSON存储

### 优势
1. 角色解耦，独立扩展
2. 并行执行，效率较高
3. 策略库支持进化学习

### 改进建议
1. 添加WebSocket实时通信
2. 实现分布式状态管理
3. 增加可视化监控面板

### 代码质量评分: 8.5/10`
        };
      }
      
      if (role === 'Reviewer') {
        return {
          message: `## 安全审查报告

### 发现的问题
| 级别 | 问题 | 位置 |
|------|------|------|
| 🟡 中 | 缺少输入验证 | index.js:execute |
| 🟢 低 | 敏感信息日志 | 无硬编码密钥 ✅ |

### 建议修复
1. 添加task参数校验
2. 实现请求速率限制
3. 增加审计日志

### 安全评分: 9.2/10`
        };
      }
      
      if (role === 'Arbiter') {
        return {
          message: `## 最终裁决

### 综合评估
- **代码质量**: 8.5/10
- **安全性**: 9.2/10
- **可扩展性**: 8.0/10

### 决策
✅ **建议部署到生产环境**

### 行动计划
1. 修复中等优先级安全问题
2. 添加监控告警
3. 定期执行进化分析

### 置信度: 92%`
        };
      }
      
      return { message: 'Generic response' };
    }
  }
};

const task = '审查4AI工作流代码质量，检查安全漏洞，评估架构可扩展性，提出优化建议';

console.log('══════════════════════════════════════════════════');
console.log('  4AI WORKFLOW - REAL TEST');
console.log('══════════════════════════════════════════════════\n');

execute(mockContext, task)
  .then(result => {
    console.log('\n══════════════════════════════════════════════════');
    console.log('  RESULT');
    console.log('══════════════════════════════════════════════════');
    console.log('Confidence:', (result.confidence * 100).toFixed(1) + '%');
    console.log('Output preview:', result.output.slice(0, 200) + '...');
    console.log('\nPhases completed:', Object.keys(result.phases).filter(k => result.phases[k]).join(' → '));
    console.log('Timing:', JSON.stringify(result.timing, null, 2));
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    console.error(err.stack);
  });
