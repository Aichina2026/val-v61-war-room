#!/usr/bin/env python3
"""
AI编排器测试框架
"""

import asyncio
import pytest
import json
from datetime import datetime
from src.core.ai_orchestrator import (
    AISystemOrchestrator, TaskRequest, TaskType, 
    ModelRegistry, ModelRouter, EnhancedSearch
)

class TestModelRegistry:
    """测试模型注册表"""
    
    def test_registry_initialization(self):
        """测试注册表初始化"""
        registry = ModelRegistry()
        assert len(registry.models) > 0
        print(f"✓ 注册表初始化成功，加载了 {len(registry.models)} 个模型")
    
    def test_model_capabilities(self):
        """测试模型能力"""
        registry = ModelRegistry()
        
        # 测试代码生成模型
        code_models = registry.get_models_by_task_type(TaskType.CODE_GENERATION)
        assert len(code_models) > 0
        print(f"✓ 找到 {len(code_models)} 个代码生成模型")
        
        # 测试数学推理模型
        math_models = registry.get_models_by_task_type(TaskType.MATH_REASONING)
        assert len(math_models) > 0
        print(f"✓ 找到 {len(math_models)} 个数学推理模型")
        
        # 测试视觉模型
        vision_models = registry.get_models_by_task_type(TaskType.VISION_UNDERSTANDING)
        assert len(vision_models) > 0
        print(f"✓ 找到 {len(vision_models)} 个视觉理解模型")

class TestModelRouter:
    """测试模型路由器"""
    
    def setup_method(self):
        """测试设置"""
        self.registry = ModelRegistry()
        self.router = ModelRouter(self.registry)
    
    def test_model_selection(self):
        """测试模型选择"""
        # 测试代码生成任务
        code_request = TaskRequest(
            task_id="test_code",
            task_type=TaskType.CODE_GENERATION,
            input_text="写一个快速排序算法",
            constraints={"max_tokens": 2000, "max_latency_ms": 3000, "max_cost_usd": 0.05}
        )
        
        selected_model = self.router.select_model(code_request)
        assert selected_model is not None
        print(f"✓ 代码任务选择了模型: {selected_model.name}")
        
        # 测试低成本任务
        cheap_request = TaskRequest(
            task_id="test_cheap",
            task_type=TaskType.TEXT_GENERATION,
            input_text="简单问题",
            constraints={"max_tokens": 500, "max_latency_ms": 1000, "max_cost_usd": 0.005}
        )
        
        cheap_model = self.router.select_model(cheap_request)
        assert cheap_model is not None
        print(f"✓ 低成本任务选择了模型: {cheap_model.name} (成本: ${cheap_model.cost_per_1k_tokens}/1K tokens)")
        
        # 验证成本约束
        assert cheap_model.cost_per_1k_tokens < 0.01  # 应该是低成本模型

class TestEnhancedSearch:
    """测试增强搜索"""
    
    def setup_method(self):
        self.search = EnhancedSearch()
    
    @pytest.mark.asyncio
    async def test_search_functionality(self):
        """测试搜索功能"""
        query = "2026年AI发展趋势"
        context = {"language": "zh"}
        
        results = await self.search.search(query, context)
        
        assert "query" in results
        assert "sources" in results
        assert "combined_results" in results
        
        print(f"✓ 搜索查询: {results['query']}")
        print(f"✓ 搜索源数量: {len(results['sources'])}")
        print(f"✓ 合并结果数量: {len(results['combined_results'])}")
        
        # 验证结果排序
        if len(results["combined_results"]) > 1:
            scores = [r.get("score", 0) for r in results["combined_results"]]
            assert all(scores[i] >= scores[i+1] for i in range(len(scores)-1))
            print("✓ 搜索结果按评分正确排序")

class TestAISystemOrchestrator:
    """测试AI系统编排器"""
    
    def setup_method(self):
        self.orchestrator = AISystemOrchestrator()
    
    @pytest.mark.asyncio
    async def test_full_processing_pipeline(self):
        """测试完整处理流水线"""
        test_cases = [
            {
                "name": "代码生成",
                "input": "实现一个Python函数，计算两个数的最大公约数",
                "expected_type": TaskType.CODE_GENERATION
            },
            {
                "name": "数学问题",
                "input": "求解二次方程 x^2 - 5x + 6 = 0",
                "expected_type": TaskType.MATH_REASONING
            },
            {
                "name": "文本生成",
                "input": "写一篇关于人工智能未来发展的短文",
                "expected_type": TaskType.TEXT_GENERATION
            },
            {
                "name": "搜索查询",
                "input": "查找2026年最新的机器学习框架",
                "expected_type": TaskType.SEARCH_QUERY
            }
        ]
        
        for i, test_case in enumerate(test_cases):
            request = TaskRequest(
                task_id=f"test_{i:03d}",
                task_type=TaskType.TEXT_GENERATION,  # 初始类型，会被识别覆盖
                input_text=test_case["input"],
                constraints={
                    "max_tokens": 1500,
                    "max_latency_ms": 4000,
                    "max_cost_usd": 0.03,
                    "min_accuracy": 0.7
                }
            )
            
            print(f"\n测试: {test_case['name']}")
            print(f"输入: {test_case['input'][:50]}...")
            
            result = await self.orchestrator.process_request(request)
            
            # 验证结果
            assert result.task_id == request.task_id
            assert result.model_used != "none"
            assert result.status in ["success", "partial", "failed"]
            
            print(f"✓ 任务ID: {result.task_id}")
            print(f"✓ 使用模型: {result.model_used}")
            print(f"✓ 状态: {result.status}")
            print(f"✓ 延迟: {result.metrics['latency_ms']:.0f}ms")
            print(f"✓ 成本: ${result.metrics['cost_usd']:.4f}")
            print(f"✓ 质量: {result.metrics['quality_score']:.2f}")
            
            # 验证输出
            assert len(result.output_text) > 0
            print(f"✓ 输出长度: {len(result.output_text)} 字符")
    
    @pytest.mark.asyncio
    async def test_error_handling(self):
        """测试错误处理"""
        # 测试无模型可用的场景
        impossible_request = TaskRequest(
            task_id="error_test",
            task_type=TaskType.TEXT_GENERATION,
            input_text="正常请求",
            constraints={
                "max_tokens": 100,
                "max_latency_ms": 10,  # 不可能的条件
                "max_cost_usd": 0.0001,
                "min_accuracy": 0.99
            }
        )
        
        result = await self.orchestrator.process_request(impossible_request)
        
        # 即使约束苛刻，系统也应该返回结果（使用放宽约束的模型）
        assert result.status in ["success", "partial", "failed"]
        print(f"✓ 错误处理测试完成，状态: {result.status}")
    
    @pytest.mark.asyncio
    async def test_performance_benchmark(self):
        """测试性能基准"""
        import time
        
        # 创建批量请求
        requests = []
        for i in range(5):  # 测试5个并发请求
            request = TaskRequest(
                task_id=f"perf_{i:03d}",
                task_type=TaskType.TEXT_GENERATION,
                input_text=f"测试请求 {i}: 人工智能的基本概念",
                constraints={
                    "max_tokens": 1000,
                    "max_latency_ms": 5000,
                    "max_cost_usd": 0.02
                }
            )
            requests.append(request)
        
        # 并发处理
        start_time = time.time()
        tasks = [self.orchestrator.process_request(req) for req in requests]
        results = await asyncio.gather(*tasks)
        end_time = time.time()
        
        total_time = end_time - start_time
        avg_time = total_time / len(requests)
        
        print(f"\n性能基准测试:")
        print(f"✓ 总请求数: {len(requests)}")
        print(f"✓ 总处理时间: {total_time:.2f}秒")
        print(f"✓ 平均每个请求: {avg_time:.2f}秒")
        print(f"✓ 吞吐量: {len(requests)/total_time:.2f} 请求/秒")
        
        # 统计成功率
        success_count = sum(1 for r in results if r.status == "success")
        success_rate = success_count / len(results)
        
        print(f"✓ 成功率: {success_rate:.1%}")
        
        # 验证性能要求
        assert avg_time < 2.0  # 平均延迟应小于2秒
        assert success_rate > 0.8  # 成功率应大于80%

class TestSystemMonitor:
    """测试系统监控"""
    
    @pytest.mark.asyncio
    async def test_monitoring_integration(self):
        """测试监控集成"""
        orchestrator = AISystemOrchestrator()
        
        # 生成一些请求
        requests = []
        for i in range(3):
            request = TaskRequest(
                task_id=f"monitor_test_{i}",
                task_type=TaskType.TEXT_GENERATION,
                input_text=f"监控测试请求 {i}",
                constraints={"max_tokens": 500, "max_latency_ms": 2000}
            )
            requests.append(request)
        
        # 处理请求
        for request in requests:
            await orchestrator.process_request(request)
        
        # 获取监控报告
        report = orchestrator.monitor.get_report()
        
        print(f"\n监控报告:")
        print(f"✓ 总请求数: {report['total_requests']}")
        print(f"✓ 成功请求: {report['successful_requests']}")
        print(f"✓ 失败请求: {report['failed_requests']}")
        
        if report['total_requests'] > 0:
            print(f"✓ 成功率: {report.get('success_rate', 0):.1%}")
            print(f"✓ 平均延迟: {report.get('avg_latency_ms', 0):.0f}ms")
            print(f"✓ 平均成本: ${report.get('avg_cost_per_request', 0):.4f}")
        
        # 验证监控数据
        assert report['total_requests'] == len(requests)
        assert report['successful_requests'] + report['failed_requests'] == report['total_requests']
        
        # 验证模型使用统计
        assert len(report['models_usage']) > 0
        print(f"✓ 使用的模型数量: {len(report['models_usage'])}")

def run_comprehensive_tests():
    """运行综合测试套件"""
    print("=" * 70)
    print("AI编排系统综合测试")
    print("=" * 70)
    
    # 创建测试实例
    orchestrator = AISystemOrchestrator()
    
    # 测试序列
    test_sequence = [
        ("模型注册表", TestModelRegistry().test_registry_initialization),
        ("模型能力", TestModelRegistry().test_model_capabilities),
    ]
    
    # 运行同步测试
    for test_name, test_func in test_sequence:
        try:
            test_func()
            print(f"✅ {test_name} - 通过")
        except Exception as e:
            print(f"❌ {test_name} - 失败: {e}")
    
    # 运行异步测试
    async_tests = [
        ("完整流水线", TestAISystemOrchestrator().test_full_processing_pipeline),
        ("性能基准", TestAISystemOrchestrator().test_performance_benchmark),
        ("监控集成", TestSystemMonitor().test_monitoring_integration),
    ]
    
    async def run_async_tests():
        for test_name, test_func in async_tests:
            try:
                await test_func()
                print(f"✅ {test_name} - 通过")
            except Exception as e:
                print(f"❌ {test_name} - 失败: {e}")
    
    # 运行异步测试
    asyncio.run(run_async_tests())
    
    print("\n" + "=" * 70)
    print("测试完成!")
    print("=" * 70)

if __name__ == "__main__":
    # 运行综合测试
    run_comprehensive_tests()
    
    # 运行pytest（如果可用）
    try:
        import pytest
        print("\n运行pytest测试套件...")
        pytest.main([__file__, "-v"])
    except ImportError:
        print("pytest未安装，跳过pytest测试")