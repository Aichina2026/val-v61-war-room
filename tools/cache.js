/**
 * 紧急重构版缓存系统
 */

class EmergencyCache {
  constructor() {
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      size: 0
    };
  }

  set(key, value, ttl = 300000) { // 5分钟默认TTL
    const item = {
      value,
      expiry: Date.now() + ttl,
      size: this.calculateSize(value)
    };
    
    this.cache.set(key, item);
    this.stats.size += item.size;
    
    // 简单的LRU清理
    if (this.stats.size > 100 * 1024 * 1024) { // 100MB限制
      this.cleanup();
    }
    
    return true;
  }

  get(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      this.stats.misses++;
      return null;
    }
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      this.stats.size -= item.size;
      this.stats.misses++;
      return null;
    }
    
    this.stats.hits++;
    return item.value;
  }

  delete(key) {
    const item = this.cache.get(key);
    if (item) {
      this.stats.size -= item.size;
    }
    return this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
    this.stats.size = 0;
    this.stats.hits = 0;
    this.stats.misses = 0;
  }

  calculateSize(value) {
    if (typeof value === 'string') {
      return Buffer.byteLength(value, 'utf8');
    } else if (Buffer.isBuffer(value)) {
      return value.length;
    } else {
      return Buffer.byteLength(JSON.stringify(value), 'utf8');
    }
  }

  cleanup() {
    // 删除过期的
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.delete(key);
      }
    }
    
    // 如果还是太大，删除最旧的
    if (this.stats.size > 100 * 1024 * 1024) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].expiry - b[1].expiry);
      
      const toRemove = Math.floor(entries.length * 0.1); // 删除10%
      for (let i = 0; i < toRemove; i++) {
        this.delete(entries[i][0]);
      }
    }
  }

  getStats() {
    return {
      ...this.stats,
      entries: this.cache.size,
      hitRate: this.stats.hits + this.stats.misses > 0 
        ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
        : 0
    };
  }
}

module.exports = EmergencyCache;
