
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
    
    const logFile = path.join(this.logDir, `audit-${timestamp.slice(0, 10)}.log`);
    const logLine = JSON.stringify(logEntry) + '\n';
    
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
