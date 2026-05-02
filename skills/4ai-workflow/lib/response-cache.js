/**
 * Response Cache for 4AI Workflow
 * Improves performance by caching similar requests
 */

class ResponseCache {
  constructor(options = {}) {
    this.maxSize = options.maxSize || 100;
    this.ttlMs = options.ttlMs || 3600000; // 1 hour
    this.cache = new Map();
    this.hits = 0;
    this.misses = 0;
  }

  generateKey(model, messages, options = {}) {
    // Hash based on model + message content + temperature
    const msgStr = messages.map(m => `${m.role}:${m.content}`).join('|');
    const optStr = `${options.temperature || 0.2}:${options.maxTokens || 4000}`;
    return `${model}:${this.hashCode(msgStr)}:${optStr}`;
  }

  hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  get(model, messages, options) {
    const key = this.generateKey(model, messages, options);
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.misses++;
      return null;
    }
    
    // Check TTL
    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }
    
    this.hits++;
    console.log(`[Cache] Hit for ${model} (saved ${entry.timing}ms)`);
    return entry.data;
  }

  set(model, messages, options, data, timing) {
    const key = this.generateKey(model, messages, options);
    
    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const oldest = this.cache.keys().next().value;
      this.cache.delete(oldest);
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      timing
    });
  }

  getStats() {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? (this.hits / total * 100).toFixed(1) + '%' : 'N/A',
      size: this.cache.size,
      maxSize: this.maxSize
    };
  }

  clear() {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }
}

module.exports = { ResponseCache };
