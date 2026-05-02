
/**
 * Rate Limiting
 * Security fix: No rate limiting (Round 2)
 */

class RateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 60000; // 1 minute
    this.maxRequests = options.maxRequests || 100;
    this.requests = new Map();
    this.cleanupInterval = setInterval(() => this.cleanup(), this.windowMs);
  }
  
  canProceed(key) {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    if (!this.requests.has(key)) {
      this.requests.set(key, []);
    }
    
    const timestamps = this.requests.get(key);
    
    // Remove old requests
    while (timestamps.length > 0 && timestamps[0] < windowStart) {
      timestamps.shift();
    }
    
    if (timestamps.length >= this.maxRequests) {
      return false;
    }
    
    timestamps.push(now);
    return true;
  }
  
  cleanup() {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    for (const [key, timestamps] of this.requests) {
      while (timestamps.length > 0 && timestamps[0] < windowStart) {
        timestamps.shift();
      }
      if (timestamps.length === 0) {
        this.requests.delete(key);
      }
    }
  }
  
  destroy() {
    clearInterval(this.cleanupInterval);
  }
}

// Global rate limiters
const globalLimiter = new RateLimiter({ windowMs: 60000, maxRequests: 100 });
const roleLimiter = new RateLimiter({ windowMs: 60000, maxRequests: 20 });
const burstLimiter = new RateLimiter({ windowMs: 1000, maxRequests: 10 });

module.exports = { RateLimiter, globalLimiter, roleLimiter, burstLimiter };
