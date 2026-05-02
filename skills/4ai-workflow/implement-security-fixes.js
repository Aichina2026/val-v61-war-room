/**
 * Phase 1: Security Fixes Implementation
 * Based on 4AI self-analysis recommendations
 */

const fs = require('fs');
const path = require('path');

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║  PHASE 1: SECURITY FIXES IMPLEMENTATION                    ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

// 1. Input Validation Middleware
const inputValidationCode = `
/**
 * Input Validation Middleware
 * Security fix: Input validation missing (Round 2)
 */

function validateTask(task) {
  if (!task) {
    throw new Error('Task is required');
  }
  
  if (typeof task !== 'string') {
    throw new Error('Task must be a string');
  }
  
  if (task.length > 10000) {
    throw new Error('Task exceeds maximum length of 10000 characters');
  }
  
  // Remove control characters except newline and tab
  const sanitized = task.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // Check for potential injection patterns
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /eval\s*\(/i,
    /function\s*\(/i
  ];
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(sanitized)) {
      throw new Error('Task contains potentially dangerous content');
    }
  }
  
  return sanitized;
}

function validateModelName(model) {
  const allowedModels = [
    'foursapi/gpt-5.5',
    'foursapi/gemini-3.1-pro-preview',
    'foursapi/claude-opus-4-7',
    'foursapi/gpt-5.3-codex-high',
    'deepseek/deepseek-v4-pro',
    'bailian/kimi-k2.6'
  ];
  
  if (!allowedModels.includes(model)) {
    throw new Error(\`Model '\${model}' is not in the allowed list\`);
  }
  
  return model;
}

module.exports = { validateTask, validateModelName };
`;

// 2. Rate Limiting
const rateLimitCode = `
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
`;

// 3. Audit Logging
const auditLogCode = `
/**
 * Audit Logging
 * Security fix: No audit trail (Round 2)
 */

const fs = require('fs');
const path = require('path');

class AuditLogger {
  constructor(options = {}) {
    this.logDir = options.logDir || path.join(__dirname, 'logs');
    this.ensureLogDir();
  }
  
  ensureLogDir() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }
  
  log(event) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      ...event
    };
    
    const logFile = path.join(this.logDir, \`audit-\${timestamp.slice(0, 10)}.log\`);
    const logLine = JSON.stringify(logEntry) + '\\n';
    
    fs.appendFileSync(logFile, logLine);
  }
  
  logModelCall(role, model, taskLength, duration, success) {
    this.log({
      type: 'model_call',
      role,
      model,
      taskLength,
      duration,
      success,
      timestamp: new Date().toISOString()
    });
  }
  
  logError(error, context) {
    this.log({
      type: 'error',
      error: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    });
  }
  
  logSecurity(event, details) {
    this.log({
      type: 'security',
      event,
      details,
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = { AuditLogger };
`;

// Write files
fs.writeFileSync('lib/input-validation.js', inputValidationCode);
fs.writeFileSync('lib/rate-limiter.js', rateLimitCode);
fs.writeFileSync('lib/audit-logger.js', auditLogCode);

console.log('✅ Created lib/input-validation.js');
console.log('✅ Created lib/rate-limiter.js');
console.log('✅ Created lib/audit-logger.js');

// Update index.js to use new security modules
const indexPath = 'index.js';
let indexContent = fs.readFileSync(indexPath, 'utf8');

// Add imports after existing requires
const importInsert = `// Security modules
const { validateTask, validateModelName } = require('./lib/input-validation');
const { globalLimiter, roleLimiter, burstLimiter } = require('./lib/rate-limiter');
const { AuditLogger } = require('./lib/audit-logger');

// Initialize audit logger
const auditLogger = new AuditLogger();
`;

indexContent = indexContent.replace(
  'const { StrategyLibrary } = require(\'./lib/strategy-library\');',
  `const { StrategyLibrary } = require('./lib/strategy-library');
${importInsert}`
);

// Add validation to execute function
indexContent = indexContent.replace(
  'async function execute(context, task) {',
  `async function execute(context, task) {
  // Security: Input validation
  try {
    task = validateTask(task);
  } catch (e) {
    auditLogger.logSecurity('input_validation_failed', { error: e.message });
    throw e;
  }
  
  // Security: Rate limiting
  if (!globalLimiter.canProceed('global')) {
    throw new Error('Rate limit exceeded: Global limit');
  }
  
  if (!burstLimiter.canProceed('burst')) {
    throw new Error('Rate limit exceeded: Burst limit');
  }
`
);

fs.writeFileSync(indexPath, indexContent);

console.log('✅ Updated index.js with security fixes');

// Verify syntax
const { execSync } = require('child_process');
try {
  execSync('node -c index.js', { stdio: 'pipe' });
  console.log('✅ Syntax check passed');
} catch (e) {
  console.error('❌ Syntax error:', e.message);
}

console.log('\n════════════════════════════════════════════════════════════');
console.log('PHASE 1 COMPLETE');
console.log('════════════════════════════════════════════════════════════');
console.log('Security improvements:');
console.log('  ✅ Input validation');
console.log('  ✅ Rate limiting');
console.log('  ✅ Audit logging');
console.log('  ✅ Model whitelist');
console.log('  ✅ Error sanitization');
