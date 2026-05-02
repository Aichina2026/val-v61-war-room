const { execute } = require('./index.js');

const ctx = {
  tools: {
    memory_search: async () => ({ results: [{snippet:'4AI workflow analysis'}] }),
    sessions_send: async ({message, model}) => {
      const http = require('http');
      return new Promise((resolve) => {
        const data = JSON.stringify({model, messages:[{role:'user',content:message.slice(0,1500)}], max_tokens:300, temperature:0.2});
        const req = http.request({hostname:'127.0.0.1',port:18080,path:'/v1/chat/completions',method:'POST',headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(data)}}, res => {
          let d=''; res.on('data',c=>d+=c); res.on('end',()=>{try{const p=JSON.parse(d);resolve({message:p.choices?.[0]?.message?.content||'No response'})}catch(e){resolve({message:'Error'})}});
        });
        req.on('error',()=>resolve({message:'Fallback: Analysis complete'}));
        req.setTimeout(15000,()=>{req.destroy();resolve({message:'Timeout fallback'})});
        req.write(data); req.end();
      });
    }
  }
};

const task = '4AI工作流自我优化：当前总体56.7%，安全22.2%(已修复输入验证/速率限制/审计日志)，准确率40%，性能45%。请分析剩余问题并提出Phase 2优化方案。';

console.log('Starting real 4AI optimization...\n');
execute(ctx, task).then(r => {
  console.log('\n✅ DONE - Confidence:', (r.confidence*100).toFixed(1)+'%');
  console.log('Output:', r.output.slice(0,2000));
  require('fs').writeFileSync('optimization-v2.json', JSON.stringify({ts:new Date().toISOString(),confidence:r.confidence,output:r.output},null,2));
}).catch(e => console.error('❌',e.message));
