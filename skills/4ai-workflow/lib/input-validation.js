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
    throw new Error(`Model '${model}' is not in the allowed list`);
  }
  
  return model;
}

module.exports = { validateTask, validateModelName };
