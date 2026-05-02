/**
 * 4AI Workflow Skill - OpenClaw Native Integration
 * Multi-Agent Orchestration: Scout → Clarifier → Builder → Reviewer → Arbiter
 * 
 * @version 1.0.0
 * @author AI001
 */

const fs = require('fs');
const path = require('path');

// Load configuration
const CONFIG = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8')
);

/**
 * Main entry point for OpenClaw Skill
 * @param {Object} context - OpenClaw context
 * @param {string} task - User task description
 * @returns {Promise<Object>} - Workflow result
 */
async function execute(context, task) {
  console.log(`🚀 [4AI Workflow] Starting: ${task.slice(0, 80)}...`);
  
  const startTime = Date.now();
  const results = {
    scout: null,
    clarifier: null,
    builder: null,
    reviewer: null,
    arbiter: null,
    timing: {},
    confidence: 0
  };

  try {
    // Phase 1: Scout - Information Collection
    console.log('[Phase 1/5] Scout collecting information...');
    const scoutStart = Date.now();
    results.scout = await runScout(context, task);
    results.timing.scout = Date.now() - scoutStart;
    console.log(`✅ Scout complete (${results.timing.scout}ms)`);

    // Phase 2: Parallel - Clarifier, Builder, Reviewer
    console.log('[Phase 2/5] Parallel execution: Clarifier + Builder + Reviewer...');
    const parallelStart = Date.now();
    
    const [clarifierResult, builderResult, reviewerResult] = await Promise.all([
      runClarifier(context, task, results.scout),
      runBuilder(context, task, results.scout),
      runReviewer(context, task, results.scout)
    ]);
    
    results.clarifier = clarifierResult;
    results.builder = builderResult;
    results.reviewer = reviewerResult;
    results.timing.parallel = Date.now() - parallelStart;
    console.log(`✅ Parallel complete (${results.timing.parallel}ms)`);

    // Phase 3: Arbiter - Final Arbitration
    console.log('[Phase 3/5] Arbiter final arbitration...');
    const arbiterStart = Date.now();
    results.arbiter = await runArbiter(context, task, results);
    results.timing.arbiter = Date.now() - arbiterStart;
    console.log(`✅ Arbiter complete (${results.timing.arbiter}ms)`);

    // Calculate overall confidence
    results.confidence = calculateConfidence(results);
    results.timing.total = Date.now() - startTime;

    console.log(`\n✅ [4AI Workflow] Complete in ${(results.timing.total/1000).toFixed(1)}s`);
    console.log(`📊 Confidence: ${(results.confidence * 100).toFixed(1)}%`);

    return formatOutput(results);

  } catch (error) {
    console.error(`❌ [4AI Workflow] Error: ${error.message}`);
    throw error;
  }
}

/**
 * Scout - Information Collection Agent
 */
async function runScout(context, task) {
  const config = CONFIG.roles.scout;
  
  // Collect from multiple sources
  const collected = {
    memory: [],
    web: [],
    database: [],
    timestamp: new Date().toISOString()
  };

  // 1. Memory search
  try {
    const memoryResults = await context.tools.memory_search({
      query: task,
      maxResults: config.collection.maxResults,
      corpus: 'memory'
    });
    collected.memory = memoryResults.results || [];
  } catch (e) {
    console.log(`[Scout] Memory search skipped: ${e.message}`);
  }

  // 2. Web search for latest info
  try {
    const webResults = await context.tools.web_search({
      query: task,
      count: 5
    });
    collected.web = webResults.results || [];
  } catch (e) {
    console.log(`[Scout] Web search skipped: ${e.message}`);
  }

  // 3. Query recent messages
  try {
    const recentMessages = await context.tools.sessions_list({
      activeMinutes: 60,
      limit: 10
    });
    collected.messages = recentMessages.sessions || [];
  } catch (e) {
    console.log(`[Scout] Session list skipped: ${e.message}`);
  }

  return {
    summary: `Collected ${collected.memory.length} memory items, ${collected.web.length} web results`,
    data: collected,
    relevance: calculateRelevance(collected, task)
  };
}

/**
 * Clarifier - Requirement Analysis Agent
 */
async function runClarifier(context, task, scoutData) {
  const config = CONFIG.roles.clarifier;
  
  const prompt = buildPrompt('clarifier', task, scoutData);
  
  const response = await context.tools.sessions_send({
    message: prompt,
    model: config.model,
    timeoutSeconds: config.timeout / 1000
  });

  return {
    role: 'clarifier',
    content: response.message || response,
    model: config.model
  };
}

/**
 * Builder - Architecture Design Agent
 */
async function runBuilder(context, task, scoutData) {
  const config = CONFIG.roles.builder;
  
  const prompt = buildPrompt('builder', task, scoutData);
  
  const response = await context.tools.sessions_send({
    message: prompt,
    model: config.model,
    timeoutSeconds: config.timeout / 1000
  });

  return {
    role: 'builder',
    content: response.message || response,
    model: config.model
  };
}

/**
 * Reviewer - Security Audit Agent
 */
async function runReviewer(context, task, scoutData) {
  const config = CONFIG.roles.reviewer;
  
  const prompt = buildPrompt('reviewer', task, scoutData);
  
  const response = await context.tools.sessions_send({
    message: prompt,
    model: config.model,
    timeoutSeconds: config.timeout / 1000
  });

  return {
    role: 'reviewer',
    content: response.message || response,
    model: config.model
  };
}

/**
 * Arbiter - Final Arbitration Agent
 */
async function runArbiter(context, task, results) {
  const config = CONFIG.roles.arbiter;
  
  const prompt = buildArbiterPrompt(task, results);
  
  const response = await context.tools.sessions_send({
    message: prompt,
    model: config.model,
    timeoutSeconds: config.timeout / 1000
  });

  return {
    role: 'arbiter',
    content: response.message || response,
    model: config.model
  };
}

/**
 * Build role-specific prompts
 */
function buildPrompt(role, task, scoutData) {
  const prompts = {
    clarifier: `You are a requirement analysis expert. Analyze the following task and provide clear, structured requirements.

Task: ${task}

Context from information collection:
${scoutData.summary}

Provide:
1. Core requirements
2. Boundary conditions
3. Constraints and assumptions
4. Success criteria`,

    builder: `You are a top-tier system architect. Design a comprehensive solution for the following task.

Task: ${task}

Context from information collection:
${scoutData.summary}

Provide:
1. System architecture
2. Key components and interfaces
3. Implementation approach
4. Code examples where relevant`,

    reviewer: `You are a security audit expert. Review the following task for potential issues.

Task: ${task}

Context from information collection:
${scoutData.summary}

Provide:
1. Security risks
2. Edge cases and failure modes
3. Performance considerations
4. Compliance requirements`
  };

  return prompts[role] || `Task: ${task}`;
}

/**
 * Build Arbiter prompt
 */
function buildArbiterPrompt(task, results) {
  return `You are the ultimate arbitrator. Synthesize the following analyses into a final, actionable recommendation.

Task: ${task}

Clarifier Analysis:
${results.clarifier.content}

Builder Design:
${results.builder.content}

Reviewer Assessment:
${results.reviewer.content}

Provide:
1. Final recommendation
2. Key decisions and rationale
3. Implementation steps
4. Risk mitigation
5. Confidence score (0-100%)`;
}

/**
 * Calculate confidence score
 */
function calculateConfidence(results) {
  let score = 0.7; // Base confidence
  
  // Adjust based on results quality
  if (results.clarifier?.content) score += 0.05;
  if (results.builder?.content) score += 0.05;
  if (results.reviewer?.content) score += 0.05;
  if (results.arbiter?.content) score += 0.05;
  
  //