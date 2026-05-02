/**
 * Round 1: Model Assignment Rationality Analysis
 */

const modelCapabilities = {
  'foursapi/gpt-5.5': {
    strengths: ['general_knowledge', 'coding', 'reasoning', 'speed'],
    weaknesses: ['long_context', 'multimodal'],
    latency: 'low',
    reliability: 0.95
  },
  'foursapi/gemini-3.1-pro-preview': {
    strengths: ['long_context', 'multimodal', 'synthesis', 'analysis'],
    weaknesses: ['coding_precision'],
    latency: 'medium',
    reliability: 0.92
  },
  'foursapi/claude-opus-4-7': {
    strengths: ['security_analysis', 'adversarial_testing', 'deep_reasoning', 'safety'],
    weaknesses: ['speed'],
    latency: 'high',
    reliability: 0.94
  }
};

const roleRequirements = {
  scout: ['speed', 'general_knowledge', 'web_search'],
  clarifier: ['long_context', 'analysis', 'synthesis'],
  builder: ['coding', 'reasoning', 'architecture'],
  reviewer: ['security_analysis', 'adversarial_testing', 'deep_reasoning'],
  arbiter: ['synthesis', 'decision_making', 'long_context']
};

function calculateRoleModelFit(role, model) {
  const reqs = roleRequirements[role];
  const caps = modelCapabilities[model];
  
  if (!reqs || !caps) return 0;
  
  let matchScore = 0;
  let totalWeight = 0;
  
  reqs.forEach(req => {
    const weight = 1;
    totalWeight += weight;
    if (caps.strengths.includes(req)) {
      matchScore += weight;
    } else if (caps.weaknesses.includes(req)) {
      matchScore -= weight * 0.5;
    }
  });
  
  return Math.max(0, matchScore / totalWeight);
}

// Current assignment analysis
const currentAssignment = {
  scout: 'foursapi/gpt-5.5',
  clarifier: 'foursapi/gemini-3.1-pro-preview',
  builder: 'foursapi/gpt-5.5',
  reviewer: 'foursapi/claude-opus-4-7',
  arbiter: 'foursapi/gemini-3.1-pro-preview'
};

console.log('=== Round 1: Model Assignment Analysis ===\n');

let totalFit = 0;
Object.entries(currentAssignment).forEach(([role, model]) => {
  const fit = calculateRoleModelFit(role, model);
  totalFit += fit;
  const status = fit > 0.7 ? '✅' : fit > 0.4 ? '⚠️' : '❌';
  console.log(`${status} ${role.padEnd(12)} → ${model.padEnd(35)} Fit: ${(fit * 100).toFixed(1)}%`);
});

const avgFit = totalFit / 5;
console.log(`\nAverage Fit Score: ${(avgFit * 100).toFixed(1)}%`);

// Identify issues
console.log('\n=== Issues Identified ===');
console.log('1. Scout using GPT-5.5 - OK but lacks web_search capability in model');
console.log('2. Builder using GPT-5.5 - Good for coding but may lack architecture depth');
console.log('3. Arbiter using Gemini - Good synthesis but may lack decisiveness');
console.log('4. No backup model diversity - all backups are same 3 models');
