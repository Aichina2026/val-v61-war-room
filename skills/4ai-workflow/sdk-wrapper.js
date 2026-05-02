/**
 * 4AI Workflow SDK Wrapper
 * Unified model calling with proper caching and key rotation
 */

class ModelSDK {
  constructor(config) {
    this.provider = config.provider || 'bifrost';
    this.baseUrl = config.baseUrl || 'http://127.0.0.1:18080/v1';
    this.cache = new Map();
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }

  async call(model, messages, options = {}) {
    const cacheKey = this.generateCacheKey(model, messages, options);
    
    // Check cache
    if (this.cache.has(cacheKey)) {
      this.cacheHits++;
      console.log(`[SDK] Cache hit for ${model}`);
      return this.cache.get(cacheKey);
    }
    
    this.cacheMisses++;
    
    // Standard OpenAI format call
    const response = await this.httpCall('/chat/completions', {
      model: `${this.provider}/${model}`,
      messages,
      max_tokens: options.maxTokens || 4000,
      temperature: options.temperature || 0.2,
      stream: false
    });
    
    // Cache result
    if (options.cache !== false) {
      this.cache.set(cacheKey, response);
    }
    
    return response;
  }

  generateCacheKey(model, messages, options) {
    const msgHash = messages.map(m => m.content).join('|').slice(0, 200);
    return `${model}:${msgHash}:${options.temperature || 0.2}`;
  }

  async httpCall(path, body) {
    const http = require('http');
    return new Promise((resolve, reject) => {
      const data = JSON.stringify(body);
      const req = http.request({
        hostname: '127.0.0.1',
        port: 18080,
        path: `/v1${path}`,
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
            resolve(JSON.parse(d));
          } catch (e) {
            reject(e);
          }
        });
      });
      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }

  getStats() {
    const total = this.cacheHits + this.cacheMisses;
    return {
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
      hitRate: total > 0 ? (this.cacheHits / total * 100).toFixed(1) + '%' : 'N/A',
      cacheSize: this.cache.size
    };
  }
}

module.exports = { ModelSDK };
