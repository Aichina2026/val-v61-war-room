/**
 * Full 4AI Workflow Test with Real BIFROST Models
 */

const { execute } = require('./index.js');

const context = {
  tools: {
    memory_search: async ({ query }) => {
      console.log('  [Scout] Memory search:', query.slice(0, 60));
      return {
        results: [
          { snippet: '4AI workflow analysis complete' },
          { snippet: 'Strategy library implemented' }
        ]
      };
    },
    sessions_send: async ({ message, model }) => {
      const role = message.includes('requirement') ? 'Clarifier' :
                   message.includes('architect') ? 'Builder' :
                   message.includes('security') ? 'Reviewer' :
                   message.includes('arbitrator') ? 'Arbiter' : 'Unknown';
      
      console.log(`  [${role}] Calling ${model}...`);
      
      const http = require('http');
      return new Promise((resolve) => {
        const data = JSON.stringify({
          model: model,
          messages: [{role: 'user', content: message}],
          max_tokens: 2000,
          temperature: 0.2
        });
        
        const req = http.request({
          hostname: '127.0.0.1',
          port: 18080,
          path: '/v1/chat/completions',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(data)
          }
        }, res => {
          let d = '';
          res.on('data', c => d += c);
          res.on('end', () => {
            try {
              const parsed = JSON.parse(d);
              if (parsed.choices && parsed.choices[0]) {
                const content = parsed.choices[0].message.content;
                console.log(`  [${role}] Response length: ${content.length} chars`);
                resolve({ message: content });
              } else {
                resolve({ message: `Error: ${parsed.error?.message || 'No response'}` });
              }
            } catch (e) {
              resolve({ message: 'Parse error' });
            }
          });
        });
        
        req.on('error', () => resolve({ message: 'BIFROST error' }));
        req.setTimeout(60000, () => {
          req.destroy();
          resolve({ message: 'Timeout' });
        });
        req.write(data);
        req.end();
      });
    }
  }
};

const task = `分析4AI工作流系统优化方案。

当前状态：
- 总体评分: 56.7%
- 安全评分: 22.2%（已修复输入验证、速率限制、审计日志）
- 准确率: 40%
- 性能: 45%

请提供：
1. 详细的安全加固方案
2. 架构优化建议
3. 性能提升策略
4. 实施优先级排序
5. 预期效果评估`;

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║  FULL 4AI WORKFLOW TEST - REAL BIFROST MODELS            ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

console.log('Task length:', task.length, 'chars\n');

execute(context, task).then(result => {
  console.log('\n════════════════════════════════════════════════════════════');
  console.log('RESULT');
  console.log('════════════════════════════════════════════════════════════');
  console.log('Confidence:', (result.confidence * 100).toFixed(1) + '%');
  console.log('Timing:', JSON.stringify(result.timing, null, 2));
  console.log('\nOutput length:', result.output.length, 'chars');
  console.log('\nOutput preview (first 1000 chars):');
  console.log(result.output.slice(0, 1000));
  
  if (result.output.length > 1000) {
    console.log('\n... (' + (result.output.length - 1000) + ' more chars)');
  }
}).catch(err => {
  console.error('❌ Error:', err.message);
});
