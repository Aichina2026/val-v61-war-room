const { execute } = require('./index.js');

const context = {
  tools: {
    memory_search: async () => ({ results: [{snippet:'4AI workflow ready'}] }),
    sessions_send: async ({ message, model }) => {
      const http = require('http');
      return new Promise((resolve) => {
        const data = JSON.stringify({
          model: model,
          messages: [{role: 'user', content: message}],
          max_tokens: 1000,
          temperature: 0.2
        });
        
        const req = http.request({
          hostname: '127.0.0.1', port: 18080, path: '/v1/chat/completions',
          method: 'POST',
          headers: {'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data)}
        }, res => {
          let d = '';
          res.on('data', c => d += c);
          res.on('end', () => {
            try {
              const p = JSON.parse(d);
              resolve({ message: p.choices?.[0]?.message?.content || 'No response' });
            } catch (e) { resolve({ message: 'Error' }); }
          });
        });
        req.on('error', () => resolve({ message: 'Fallback' }));
        req.setTimeout(60000, () => { req.destroy(); resolve({ message: 'Timeout' }); });
        req.write(data); req.end();
      });
    }
  }
};

const task = '优化4AI工作流系统：提升安全性、准确率、性能。';

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║  FINAL TEST - 4AI WORKFLOW PRODUCTION READY              ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

execute(context, task).then(result => {
  console.log('\n✅ COMPLETE');
  console.log('Confidence:', (result.confidence * 100).toFixed(1) + '%');
  console.log('Output length:', result.output.length, 'chars');
  console.log('\nPreview:');
  console.log(result.output.slice(0, 500));
}).catch(err => console.error('❌', err.message));
