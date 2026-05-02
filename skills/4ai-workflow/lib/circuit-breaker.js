/**
 * Circuit Breaker - Resilience Pattern
 * Prevents cascade failures in multi-agent systems
 */

class CircuitBreaker {
  constructor(name, options = {}) {
    this.name = name;
    this.failureThreshold = options.failureThreshold || 3;
    this.resetTimeout = options.resetTimeout || 30000;
    this.halfOpenMaxCalls = options.halfOpenMaxCalls || 2;
    
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = null;
    this.latencyHistory = [];
  }

  canExecute() {
    if (this.state === 'CLOSED') return true;
    
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime >= this.resetTimeout) {
        this.state = 'HALF_OPEN';
        this.successes = 0;
        console.log(`[CircuitBreaker] ${this.name} entering HALF_OPEN`);
        return true;
      }
      return false;
    }
    
    if (this.state === 'HALF_OPEN') {
      return this.successes < this.halfOpenMaxCalls;
    }
    
    return true;
  }

  recordSuccess(latency) {
    this.latencyHistory.push(latency);
    if (this.latencyHistory.length > 20) {
      this.latencyHistory.shift();
    }

    if (this.state === 'HALF_OPEN') {
      this.successes++;
      if (this.successes >= this.halfOpenMaxCalls) {
        this.state = 'CLOSED';
        this.failures = 0;
        console.log(`[CircuitBreaker] ${this.name} CLOSED (recovered)`);
      }
    } else {
      this.failures = Math.max(0, this.failures - 1);
    }
  }

  recordFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
      console.log(`[CircuitBreaker] ${this.name} OPENED (${this.failures} failures)`);
    }
  }

  getStatus() {
    const avgLatency = this.latencyHistory.length > 0
      ? this.latencyHistory.reduce((a, b) => a + b, 0) / this.latencyHistory.length
      : 0;
    
    return {
      name: this.name,
      state: this.state,
      failures: this.failures,
      avgLatency: Math.round(avgLatency),
      successRate: this.calculateSuccessRate()
    };
  }

  calculateSuccessRate() {
    const total = this.latencyHistory.length;
    if (total === 0) return 100;
    // Approximate success rate based on state
    if (this.state === 'CLOSED') return 100;
    if (this.state === 'HALF_OPEN') return 50;
    return 0;
  }
}

module.exports = { CircuitBreaker };
