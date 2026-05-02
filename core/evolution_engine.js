/**
 * 轻量级自进化引擎
 * 适应2v4G环境的自优化系统
 */

class LightweightEvolutionEngine {
    constructor() {
        this.cycle = 0;
        this.population = [];
        this.fitnessHistory = [];
        this.mutationRate = 0.1;
        this.crossoverRate = 0.7;
        this.populationSize = 15; // 轻量级
        this.eliteCount = 2;
        
        console.log('🔄 轻量级自进化引擎初始化');
    }
    
    /**
     * 启动进化循环
     */
    startEvolution(intervalMs = 120000) { // 2分钟一次，轻量级
        console.log(`🚀 启动自进化循环，间隔: ${intervalMs}ms`);
        
        this.evolutionInterval = setInterval(() => {
            this.evolutionCycle();
        }, intervalMs);
        
        return this;
    }
    
    /**
     * 执行进化周期
     */
    evolutionCycle() {
        this.cycle++;
        console.log(`\n🔄 进化周期 #${this.cycle}`);
        
        // 初始化种群
        if (this.population.length === 0) {
            this.initializePopulation();
        }
        
        // 评估适应度
        this.evaluateFitness();
        
        // 选择、交叉、变异
        this.evolvePopulation();
        
        // 记录历史
        this.recordHistory();
        
        // 显示状态
        this.displayStatus();
    }
    
    /**
     * 初始化种群
     */
    initializePopulation() {
        this.population = Array.from({length: this.populationSize}, (_, i) => ({
            id: `ind_${i}_${Date.now()}`,
            genes: {
                learning_rate: 0.001 + Math.random() * 0.01,
                momentum: 0.1 + Math.random() * 0.8,
                batch_size: 8 + Math.floor(Math.random() * 24),
                layers: 1 + Math.floor(Math.random() * 3)
            },
            fitness: 0,
            age: 0
        }));
    }
    
    /**
     * 评估适应度
     */
    evaluateFitness() {
        this.population.forEach(ind => {
            // 模拟适应度计算（实际应基于预测准确率）
            ind.fitness = this.calculateFitness(ind.genes);
            ind.age++;
        });
        
        // 排序
        this.population.sort((a, b) => b.fitness - a.fitness);
    }
    
    /**
     * 计算适应度
     */
    calculateFitness(genes) {
        let fitness = 0.5;
        
        // 学习率优化
        if (genes.learning_rate > 0.005 && genes.learning_rate < 0.02) {
            fitness += 0.1;
        }
        
        // 动量优化
        if (genes.momentum > 0.3 && genes.momentum < 0.9) {
            fitness += 0.1;
        }
        
        // 批大小优化
        if (genes.batch_size >= 16 && genes.batch_size <= 32) {
            fitness += 0.1;
        }
        
        // 层数优化
        if (genes.layers >= 1 && genes.layers <= 3) {
            fitness += 0.05;
        }
        
        // 随机性
        fitness += (Math.random() - 0.5) * 0.05;
        
        return Math.min(fitness, 0.95);
    }
    
    /**
     * 进化种群
     */
    evolvePopulation() {
        const newPopulation = [];
        
        // 保留精英
        for (let i = 0; i < this.eliteCount; i++) {
            newPopulation.push(this.population[i]);
        }
        
        // 生成新个体
        while (newPopulation.length < this.populationSize) {
            const parent1 = this.selectParent();
            const parent2 = this.selectParent();
            
            const childGenes = this.crossover(parent1.genes, parent2.genes);
            this.mutate(childGenes);
            
            newPopulation.push({
                id: `child_${Date.now()}_${newPopulation.length}`,
                genes: childGenes,
                fitness: 0,
                age: 0
            });
        }
        
        this.population = newPopulation;
    }
    
    /**
     * 选择父代
     */
    selectParent() {
        // 轮盘赌选择
        const totalFitness = this.population.reduce((sum, ind) => sum + ind.fitness, 0);
        const random = Math.random() * totalFitness;
        
        let cumulative = 0;
        for (const individual of this.population) {
            cumulative += individual.fitness;
            if (cumulative >= random) {
                return individual;
            }
        }
        
        return this.population[0];
    }
    
    /**
     * 基因交叉
     */
    crossover(genes1, genes2) {
        if (Math.random() > this.crossoverRate) {
            return {...genes1};
        }
        
        const childGenes = {};
        const keys = Object.keys(genes1);
        const crossoverPoint = Math.floor(Math.random() * keys.length);
        
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            childGenes[key] = i < crossoverPoint ? genes1[key] : genes2[key];
        }
        
        return childGenes;
    }
    
    /**
     * 基因变异
     */
    mutate(genes) {
        if (Math.random() > this.mutationRate) return;
        
        const key = Object.keys(genes)[Math.floor(Math.random() * Object.keys(genes).length)];
        
        switch(key) {
            case 'learning_rate':
                genes[key] = Math.max(0.001, genes[key] * (0.9 + Math.random() * 0.2));
                break;
            case 'momentum':
                genes[key] = Math.max(0.1, Math.min(0.99, genes[key] * (0.9 + Math.random() * 0.2)));
                break;
            case 'batch_size':
                genes[key] = Math.max(8, Math.min(64, genes[key] + (Math.random() - 0.5) * 8));
                break;
            case 'layers':
                genes[key] = Math.max(1, Math.min(5, genes[key] + (Math.random() > 0.5 ? 1 : -1)));
                break;
        }
    }
    
    /**
     * 记录历史
     */
    recordHistory() {
        const bestFitness = this.population[0]?.fitness || 0;
        
        this.fitnessHistory.push({
            cycle: this.cycle,
            best_fitness: bestFitness,
            population_size: this.population.length,
            timestamp: new Date().toISOString()
        });
        
        // 保持历史记录
        if (this.fitnessHistory.length > 50) {
            this.fitnessHistory.shift();
        }
    }
    
    /**
     * 显示状态
     */
    displayStatus() {
        const bestFitness = this.population[0]?.fitness || 0;
        
        console.log(`   🏆 最佳适应度: ${(bestFitness * 100).toFixed(2)}%`);
        console.log(`   🧬 种群大小: ${this.population.length}`);
        
        // 显示趋势
        if (this.fitnessHistory.length >= 2) {
            const lastBest = this.fitnessHistory[this.fitnessHistory.length - 2].best_fitness;
            const improvement = ((bestFitness - lastBest) / lastBest * 100).toFixed(2);
            console.log(`   📈 趋势: ${improvement > 0 ? '+' : ''}${improvement}%`);
        }
    }
    
    /**
     * 获取最佳基因
     */
    getBestGenes() {
        return this.population[0]?.genes || {};
    }
    
    /**
     * 获取引擎状态
     */
    getEngineStatus() {
        return {
            engine: 'LightweightEvolutionEngine',
            version: '1.0.0',
            cycle: this.cycle,
            best_fitness: this.population[0]?.fitness || 0,
            population_size: this.population.length,
            history_size: this.fitnessHistory.length,
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = LightweightEvolutionEngine;