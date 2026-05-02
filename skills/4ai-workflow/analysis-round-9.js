/**
 * Round 9: Cost Analysis
 */

console.log('=== Round 9: Cost Analysis ===\n');

const costAnalysis = {
  models: {
    'foursapi/gpt-5.5': {
      inputCost: 0.001,   // per 1K tokens
      outputCost: 0.002,
      avgTokens: { input: 2000, output: 1500 },
      callsPerTask: 2 // scout + builder
    },
    'foursapi/gemini-3.1-pro-preview': {
      inputCost: 0.0005,
      outputCost: 0.0015,
      avgTokens: { input: 3000, output: 2000 },
      callsPerTask: 2 // clarifier + arbiter
    },
    'foursapi/claude-opus-4-7': {
      inputCost: 0.003,
      outputCost: 0.015,
      avgTokens: { input: 4000, output: 2500 },
      callsPerTask: 1 // reviewer
    }
  },
  overhead: {
    storage: 0.001, // per task
    network: 0.0001,
    compute: 0.0005
  }
};

let totalCostPerTask = 0;

console.log('Cost Per Task:');
Object.entries(costAnalysis.models).forEach(([model, data]) => {
  const inputCost = (data.avgTokens.input / 1000) * data.inputCost * data.callsPerTask;
  const outputCost = (data.avgTokens.output / 1000) * data.outputCost * data.callsPerTask;
  const modelTotal = inputCost + outputCost;
  totalCostPerTask += modelTotal;
  
  console.log(`\n  ${model}`);
  console.log(`    Calls: ${data.callsPerTask}`);
  console.log(`    Input:  ${data.avgTokens.input} tokens × $${data.inputCost}/1K = $${inputCost.toFixed(4)}`);
  console.log(`    Output: ${data.avgTokens.output} tokens × $${data.outputCost}/1K = $${outputCost.toFixed(4)}`);
  console.log(`    Subtotal: $${modelTotal.toFixed(4)}`);
});

const overheadTotal = Object.values(costAnalysis.overhead).reduce((a, b) => a + b, 0);
totalCostPerTask += overheadTotal;

console.log(`\n  Overhead: $${overheadTotal.toFixed(4)}`);
console.log(`\n💰 Total Cost Per Task: $${totalCostPerTask.toFixed(4)}`);

// Monthly projection
const tasksPerDay = 100;
const daysPerMonth = 30;
const monthlyCost = totalCostPerTask * tasksPerDay * daysPerMonth;

console.log(`\n📊 Monthly Projection:`);
console.log(`  Tasks: ${tasksPerDay}/day × ${daysPerMonth} days = ${tasksPerDay * daysPerMonth} tasks`);
console.log(`  Cost: $${monthlyCost.toFixed(2)}/month`);

console.log('\n=== Cost Optimization ===');
console.log('1. Use cheaper models for non-critical roles');
console.log('2. Implement response caching');
console.log('3. Batch similar requests');
console.log('4. Optimize prompt length');
console.log('5. Use model-specific fine-tuning for frequent tasks');
