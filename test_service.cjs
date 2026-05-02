#!/usr/bin/env node

const http = require('http');
const os = require('os');

const server = http.createServer((req, res) => {
  console.log(`📥 ${new Date().toISOString()} ${req.method} ${req.url}`);
  
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      timestamp: Date.now(),
      uptime: process.uptime(),
      version: '1.0.0'
    }));
  } else if (req.url === '/metrics') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      cpu: os.loadavg(),
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: process.memoryUsage()
      },
      uptime: os.uptime()
    }));
  } else if (req.url === '/api/codegen') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      service: '代码生成API',
      status: 'ready',
      endpoints: ['/generate', '/review', '/optimize']
    }));
  } else if (req.url === '/ui') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>OpenClaw 集成系统</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          h1 { color: #333; }
          .status { padding: 10px; background: #f0f0f0; border-radius: 5px; margin: 10px 0; }
          .success { color: green; }
          .warning { color: orange; }
        </style>
      </head>
      <body>
        <h1>🚀 OpenClaw 集成系统控制面板</h1>
        <div class="status">
          <p><strong>状态:</strong> <span class="success">✅ 运行中</span></p>
          <p><strong>版本:</strong> 2.0.0-integrated</p>
          <p><strong>启动时间:</strong> ${new Date().toISOString()}</p>
        </div>
        <h2>🌐 可用服务:</h2>
        <ul>
          <li><a href="/health">健康检查</a></li>
          <li><a href="/metrics">系统指标</a></li>
          <li><a href="/api/codegen">代码生成API</a></li>
        </ul>
      </body>
      </html>
    `);
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Not Found',
      message: '服务端点不存在',
      available: ['/health', '/metrics', '/api/codegen', '/ui']
    }));
  }
});

const PORT = 3000;
const HOST = 'localhost';

server.listen(PORT, HOST, () => {
  console.log(`✅ 服务已启动: http://${HOST}:${PORT}`);
  console.log('📡 可用端点:');
  console.log('  • /health    - 健康检查');
  console.log('  • /metrics   - 系统指标');
  console.log('  • /api/codegen - 代码生成API');
  console.log('  • /ui        - 控制面板');
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n🛑 收到停止信号');
  server.close(() => {
    console.log('✅ 服务已停止');
    process.exit(0);
  });
});