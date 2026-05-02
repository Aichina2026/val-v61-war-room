/**
 * Strategy Library - 策略库与错误库管理
 * 4AI工作流进化的核心知识库
 */

const fs = require('fs');
const path = require('path');

class StrategyLibrary {
  constructor(options = {}) {
    this.basePath = options.basePath || path.join(__dirname, '..', 'evolution');
    this.strategiesPath = path.join(this.basePath, 'strategies');
    this.errorsPath = path.join(this.basePath, 'errors');
    this.metaPath = path.join(this.basePath, 'meta.json');
    
    this.strategies = new Map();
    this.errors = new Map();
    this.meta = {
      version: '1.0.0',
      totalStrategies: 0,
      totalErrors: 0,
      lastUpdated: null,
      evolutionHistory: []
    };
    
    this.init();
  }

  init() {
    [this.strategiesPath, this.errorsPath].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
    this.load();
  }

  // ═══════════════════════════════════════════════════════════════
  // 持久化方法
  // ═══════════════════════════════════════════════════════════════

  saveStrategy(id, strategy) {
    const filePath = path.join(this.strategiesPath, `${id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(strategy, null, 2));
  }

  saveError(id, error) {
    const filePath = path.join(this.errorsPath, `${id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(error, null, 2));
  }

  saveMeta() {
    fs.writeFileSync(this.metaPath, JSON.stringify(this.meta, null, 2));
  }

  load() {
    if (!fs.existsSync(this.metaPath)) return;
    
    try {
      this.meta = JSON.parse(fs.readFileSync(this.metaPath, 'utf8'));
      
      // Load strategies
      if (fs.existsSync(this.strategiesPath)) {
        const strategyFiles = fs.readdirSync(this.strategiesPath).filter(f => f.endsWith('.json'));
        for (const file of strategyFiles) {
          const data = JSON.parse(fs.readFileSync(path.join(this.strategiesPath, file), 'utf8'));
          this.strategies.set(data.id, data);
        }
      }
      
      // Load errors
      if (fs.existsSync(this.errorsPath)) {
        const errorFiles = fs.readdirSync(this.errorsPath).filter(f => f.endsWith('.json'));
        for (const file of errorFiles) {
          const data = JSON.parse(fs.readFileSync(path.join(this.errorsPath, file), 'utf8'));
          this.errors.set(data.id, data);
        }
      }
    } catch (e) {
      console.error('[StrategyLibrary] Load failed:', e.message);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 策略库管理
  // ═══════════════════════════════════════════════════════════════

  addStrategy(strategy) {
    const enriched = {
      ...strategy,
      timestamp: new Date().toISOString(),
      version: this.meta.version,
      usageCount: 0,
      successCount: 0
    };
    
    this.strategies.set(strategy.id, enriched);
    this.meta.totalStrategies++;
    this.meta.lastUpdated = new Date().toISOString();
    
    this.saveStrategy(strategy.id, enriched);
    this.saveMeta();
    
    console.log(`[StrategyLibrary] Added strategy: ${strategy.id}`);
    return enriched;
  }

  findStrategies(category, patterns = [], minConfidence = 0.7) {
    const results = [];
    
    for (const [id, strategy] of this.strategies) {
      if (category && strategy.category !== category) continue;
      if (strategy.confidence < minConfidence) continue;
      
      if (patterns.length > 0) {
        const hasMatch = patterns.some(p => strategy.patterns && strategy.patterns.includes(p));
        if (!hasMatch) continue;
      }
      
      results.push(strategy);
    }
    
    return results.sort((a, b) => {
      const scoreA = a.confidence * (1 + (a.successCount || 0) * 0.1);
      const scoreB = b.confidence * (1 + (b.successCount || 0) * 0.1);
      return scoreB - scoreA;
    });
  }

  updateStrategyUsage(id, success) {
    const strategy = this.strategies.get(id);
    if (!strategy) return;
    
    strategy.usageCount = (strategy.usageCount || 0) + 1;
    if (success) strategy.successCount = (strategy.successCount || 0) + 1;
    
    const successRate = (strategy.successCount || 0) / strategy.usageCount;
    strategy.confidence = (strategy.confidence || 0.5) * 0.9 + successRate * 0.1;
    
    this.saveStrategy(id, strategy);
  }

  // ═══════════════════════════════════════════════════════════════
  // 错误库管理
  // ═══════════════════════════════════════════════════════════════

  addError(error) {
    const enriched = {
      ...error,
      timestamp: new Date().toISOString(),
      version: this.meta.version,
      occurrenceCount: 1,
      resolved: false,
      resolution: null
    };
    
    this.errors.set(error.id, enriched);
    this.meta.totalErrors++;
    this.meta.lastUpdated = new Date().toISOString();
    
    this.saveError(error.id, enriched);
    this.saveMeta();
    
    console.log(`[StrategyLibrary] Added error: ${error.id}`);
    return enriched;
  }

  findSimilarErrors(type, category) {
    const results = [];
    
    for (const [id, error] of this.errors) {
      if (category && error.category !== category) continue;
      if (type && error.type && !error.type.includes(type)) continue;
      
      results.push(error);
    }
    
    return results.sort((a, b) => (b.occurrenceCount || 0) - (a.occurrenceCount || 0));
  }

  resolveError(id, resolution) {
    const error = this.errors.get(id);
    if (!error) return;
    
    error.resolved = true;
    error.resolution = resolution;
    error.resolvedAt = new Date().toISOString();
    
    if (resolution && resolution.strategy) {
      this.addStrategy({
        id: `derived-from-error-${id}`,
        category: 'error-recovery',
        name: `Recovery: ${error.type}`,
        description: `Solution for ${error.description}`,
        patterns: [error.category, error.type].filter(Boolean),
        result: { source: 'error-recovery', originalError: id },
        confidence: 0.8
      });
    }
    
    this.saveError(id, error);
  }

  incrementError(id) {
    const error = this.errors.get(id);
    if (error) {
      error.occurrenceCount = (error.occurrenceCount || 0) + 1;
      this.saveError(id, error);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 进化分析
  // ═══════════════════════════════════════════════════════════════

  generateEvolutionReport() {
    return {
      timestamp: new Date().toISOString(),
      summary: {
        totalStrategies: this.meta.totalStrategies,
        totalErrors: this.meta.totalErrors,
        activeErrors: Array.from(this.errors.values()).filter(e => !e.resolved).length,
        avgStrategyConfidence: this.calculateAvgConfidence()
      },
      topStrategies: this.findTopStrategies(10),
      recentErrors: this.findRecentErrors(10),
      recommendations: this.generateRecommendations()
    };
  }

  calculateAvgConfidence() {
    if (this.strategies.size === 0) return 0;
    const sum = Array.from(this.strategies.values())
      .reduce((acc, s) => acc + (s.confidence || 0), 0);
    return sum / this.strategies.size;
  }

  findTopStrategies(limit = 10) {
    return Array.from(this.strategies.values())
      .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
      .slice(0, limit);
  }

  findRecentErrors(limit = 10) {
    return Array.from(this.errors.values())
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  }

  generateRecommendations() {
    const recommendations = [];
    
    const frequentErrors = Array.from(this.errors.values())
      .filter(e => (e.occurrenceCount || 0) > 3 && !e.resolved);
    
    if (frequentErrors.length > 0) {
      recommendations.push({
        type: 'urgent',
        message: `${frequentErrors.length} frequent errors need attention`,
        errors: frequentErrors.map(e => e.id)
      });
    }

    // Check low confidence strategies
    const lowConfidence = Array.from(this.strategies.values())
      .filter(s => (s.confidence || 0) < 0.5);

    if (lowConfidence.length > 0) {
      recommendations.push({
        type: 'warning',
        message: `${lowConfidence.length} strategies have low confidence`,
        strategies: lowConfidence.map(s => s.id)
      });
    }

    return recommendations;
  }
}

module.exports = { StrategyLibrary };