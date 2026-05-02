/**
 * Key Rotation Manager
 * Manages multiple API keys with round-robin and failover
 */

class KeyRotationManager {
  constructor(config = {}) {
    this.keys = [];
    this.currentIndex = 0;
    this.failureCounts = new Map();
    this.maxFailures = config.maxFailures || 3;
    
    this.loadKeys(config);
  }

  loadKeys(config) {
    // Load from environment variables
    const envKeys = this.loadFromEnv();
    
    // Load from config
    const configKeys = config.keys || [];
    
    this.keys = [...envKeys, ...configKeys].map((key, index) => ({
      id: index,
      key: key,
      active: true,
      failures: 0,
      lastUsed: null
    }));

    console.log(`[KeyRotation] Loaded ${this.keys.length} keys`);
  }

  loadFromEnv() {
    const keys = [];
    
    // Try FOUR_S_API_KEY_1, FOUR_S_API_KEY_2, etc.
    for (let i = 1; i <= 10; i++) {
      const key = process.env[`FOUR_S_API_KEY_${i}`];
      if (key) keys.push(key);
    }
    
    // Try FOUR_S_API_KEYS (comma-separated)
    const keysStr = process.env.FOUR_S_API_KEYS;
    if (keysStr) {
      keys.push(...keysStr.split(',').map(k => k.trim()).filter(k => k));
    }
    
    return keys;
  }

  getNextKey() {
    const activeKeys = this.keys.filter(k => k.active);
    
    if (activeKeys.length === 0) {
      console.warn('[KeyRotation] No active keys available');
      return null;
    }

    // Round-robin selection
    const key = activeKeys[this.currentIndex % activeKeys.length];
    this.currentIndex = (this.currentIndex + 1) % activeKeys.length;
    
    key.lastUsed = Date.now();
    return key.key;
  }

  markFailed(keyValue) {
    const key = this.keys.find(k => k.key === keyValue);
    if (key) {
      key.failures++;
      if (key.failures >= this.maxFailures) {
        key.active = false;
        console.log(`[KeyRotation] Key ${key.id} deactivated (${key.failures} failures)`);
      }
    }
  }

  getStatus() {
    return {
      total: this.keys.length,
      active: this.keys.filter(k => k.active).length,
      failed: this.keys.filter(k => !k.active).length,
      currentIndex: this.currentIndex
    };
  }
}

module.exports = { KeyRotationManager };
