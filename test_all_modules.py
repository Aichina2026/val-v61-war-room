#!/usr/bin/env python3
"""
AI编排系统完整测试脚本
测试所有模块的功能
"""

import asyncio
import sys
import os
from datetime import datetime

# 添加src目录到Python路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

class TestRunner:
    """测试运行器"""
    
    def __init__(self):
        self.tests_passed = 0
        self.tests_failed = 0
        self.start_time = datetime.now()
    
    def print_header(self, title):
        """打印测试标题"""
        print("\n" + "="*70)
        print(f"测试: {title}")
        print("="*70)
    
    def print_result(self, test_name, success, message=None):
        """打印测试结果"""
        if success:
            print(f"✅ {test_name} - 通过")
            self.tests_passed += 1
        else:
            print(f"❌ {test_name} - 失败")
            if message:
                print(f"   错误: {message}")
            self.tests_failed += 1
    
    async def test_database_models(self):
        """测试数据库模型"""
        self.print_header("数据库模型")
        
        try:
            from database.models import DatabaseManager, TaskStatus
            print("✅ 数据库模块导入成功")
            
            # 创建内存数据库测试
            db_manager = DatabaseManager("sqlite:///:memory:")
            
            # 初始化数据库
            db_manager.init_database()
            print("✅ 数据库初始化成功")
            
            # 测试任务保存
            task_data = {
                "task_id": "test_db_001",
                "task_type": "text_generation",
                "input_text": "测试数据库功能",
                "user_id": "test_user"
            }
            
            task_id = await db_manager.save_task(task_data)
            self.print_result("任务保存", task_id is not None)
            
            # 测试任务查询
            task = await db_manager.get_task("test_db_001")
            self.print_result("任务查询", task is not None)
            
            # 测试状态更新
            await db_manager.update_task_status(
                task_id="test_db_001",
                status=TaskStatus.COMPLETED,
                progress=1.0,
                output_text="测试完成"
            )
            self.print_result("任务状态更新", True)
            
            # 测试模型性能更新
            metrics = {
                "total_tokens": 1000,
                "cost_usd": 0.012,
                "latency_ms": 1234
            }
            await db_manager.update_model_performance("test-model-1", metrics)
            self.print_result("模型性能更新", True)
            
            # 测试模型统计查询
            stats = await db_manager.get_model_stats("test-model-1")
            self.print_result("模型统计查询", stats is not None)
            
        except Exception as e:
            self.print_result("数据库测试", False, str(e))
            import traceback
            traceback.print_exc()
    
    async def test_cache_manager(self):
        """测试缓存管理器"""
        self.print_header("缓存管理器")
        
        try:
            from database.cache_manager import CacheManager, ModelResponseCache, SearchResultCache
            
            # 创建缓存管理器
            cache = CacheManager()
            print("✅ 缓存管理器创建成功")
            
            # 测试基本缓存操作
            test_key = "test:cache"
            test_value = {"message": "缓存测试", "timestamp": datetime.now().isoformat()}
            
            # 设置缓存
            success = await cache.set(test_key, test_value, ttl=60)
            self.print_result("缓存设置", success)
            
            # 获取缓存
            cached_value = await cache.get(test_key)
            self.print_result("缓存获取", cached_value == test_value)
            
            # 检查存在性
            exists = await cache.exists(test_key)
            self.print_result("缓存存在检查", exists)
            
            # 测试模型响应缓存
            model_cache = ModelResponseCache(cache)
            model_id = "test-model-1"
            input_text = "什么是人工智能？"
            response = {"answer": "测试回答", "confidence": 0.95}
            
            # 缓存响应
            await model_cache.cache_response(model_id, input_text, response, ttl=30)
            self.print_result("模型响应缓存", True)
            
            # 获取缓存响应
            cached_response = await model_cache.get_response(model_id, input_text)
            self.print_result("模型响应获取", cached_response is not None)
            
            # 测试搜索结果缓存
            search_cache = SearchResultCache(cache)
            query = "测试搜索"
            results = {"total": 10, "results": [{"title": "结果1"}]}
            
            # 缓存搜索结果
            await search_cache.cache_results(query, results, ttl=30)
            self.print_result("搜索结果缓存", True)
            
            # 获取缓存结果
            cached_results = await search_cache.get_results(query)
            self.print_result("搜索结果获取", cached_results is not None)
            
        except Exception as e:
            self.print_result("缓存测试", False, str(e))
            import traceback
            traceback.print_exc()
    
    async def test_ai_orchestrator(self):
        """测试AI编排器"""
        self.print_header("AI编排器")
        
        try:
            from core.ai_orchestrator_v2 import EnhancedAISystemOrchestrator, TaskRequest, TaskType
            
            # 创建编排器（内存模式）
            orchestrator = EnhancedAISystemOrchestrator()
            print("✅ AI编排器创建成功")
            
            # 创建测试请求
            requests = [
                TaskRequest(
                    task_id=f"test_orch_{i:03d}",
                    task_type=TaskType.TEXT_GENERATION,
                    input_text=f"测试编排器功能 {i}",
                    user_id="test_user",
                    constraints={
                        "max_tokens": 2000,
                        "max_latency_ms": 5000,
                        "max_cost_usd": 0.1
                    }
                )
                for i in range(2)
            ]
            
            # 处理请求
            results = []
            for request in requests:
                print(f"\n处理请求: {request.task_id}")
                result = await orchestrator.process_request(request)
                results.append(result)
                
                self.print_result(
                    f"请求处理 {request.task_id}",
                    result.status in ["success", "partial"],
                    f"状态: {result.status}, 模型: {result.model_used}"
                )
                
                print(f"   延迟: {result.metrics['latency_ms']:.0f}ms")
                print(f"   成本: ${result.metrics['cost_usd']:.4f}")
                print(f"   质量: {result.metrics['quality_score']:.2f}")
            
            # 测试系统统计
            stats = await orchestrator.get_system_stats()
            self.print_result("系统统计获取", stats is not None)
            
            if stats:
                print(f"   总请求数: {stats.get('performance', {}).get('total_requests', 0)}")
                print(f"   缓存命中数: {stats.get('performance', {}).get('cache_hits', 0)}")
            
        except Exception as e:
            self.print_result("编排器测试", False, str(e))
            import traceback
            traceback.print_exc()
    
    async def test_system_monitor(self):
        """测试系统监控器"""
        self.print_header("系统监控器")
        
        try:
            from monitoring.system_monitor import SystemMonitor
            
            # 创建监控器
            monitor = SystemMonitor()
            print("✅ 系统监控器创建成功")
            
            # 收集系统指标
            system_metrics = await monitor.collect_system_metrics()
            self.print_result("系统指标收集", len(system_metrics) > 0)
            
            # 模拟请求指标收集
            request_data = {
                "task_type": "text_generation",
                "input_text": "测试监控"
            }
            
            result_data = {
                "status": "success",
                "latency_ms": 1234,
                "total_tokens": 1500,
                "cost_usd": 0.018,
                "quality_score": 0.92
            }
            
            model_data = {
                "model_id": "test-model-1"
            }
            
            request_metrics = await monitor.collect_request_metrics(
                request_data, result_data, model_data
            )
            self.print_result("请求指标收集", len(request_metrics) > 0)
            
            # 检查健康状态
            health = await monitor.check_health()
            self.print_result("健康检查", health["status"] in ["healthy", "degraded"])
            
            print(f"   健康状态: {health['status']}")
            
            # 获取指标摘要
            summary = monitor.get_metrics_summary("1h")
            self.print_result("指标摘要获取", summary is not None)
            
        except Exception as e:
            self.print_result("监控测试", False, str(e))
            import traceback
            traceback.print_exc()
    
    async def test_api_models(self):
        """测试API模型"""
        self.print_header("API模型")
        
        try:
            from api.server import (
                TaskRequestModel, TaskResponseModel, 
                TaskResultModel, HealthResponseModel
            )
            
            # 测试任务请求模型
            task_request = TaskRequestModel(
                task_type="text_generation",
                input_text="测试API模型",
                constraints={
                    "max_tokens": 2000,
                    "max_latency_ms": 5000
                }
            )
            self.print_result("任务请求模型验证", True)
            
            # 测试任务响应模型
            task_response = TaskResponseModel(
                task_id="test_api_001",
                status="processing",
                created_at=datetime.now().isoformat()
            )
            self.print_result("任务响应模型验证", True)
            
            # 测试任务结果模型
            task_result = TaskResultModel(
                task_id="test_api_001",
                status="completed",
                created_at=datetime.now().isoformat(),
                completed_at=datetime.now().isoformat(),
                model_used="test-model-1",
                output_text="测试输出",
                metrics={"latency_ms": 1234, "cost_usd": 0.018}
            )
            self.print_result("任务结果模型验证", True)
            
            # 测试健康响应模型
            health_response = HealthResponseModel(
                status="healthy",
                timestamp=datetime.now().isoformat(),
                version="1.0.0",
                uptime="1h30m",
                services={"database": "healthy", "cache": "healthy"}
            )
            self.print_result("健康响应模型验证", True)
            
            print("✅ 所有API模型验证通过")
            
        except Exception as e:
            self.print_result("API模型测试", False, str(e))
            import traceback
            traceback.print_exc()
    
    async def run_all_tests(self):
        """运行所有测试"""
        print("\n" + "="*70)
        print("AI编排系统完整测试")
        print("="*70)
        print(f"开始时间: {self.start_time.strftime('%Y-%m-%d %H:%M:%S')}")
        
        # 运行各个测试
        await self.test_database_models()
        await self.test_cache_manager()
        await self.test_ai_orchestrator()
        await self.test_system_monitor()
        await self.test_api_models()
        
        # 计算测试结果
        end_time = datetime.now()
        duration = (end_time - self.start_time).total_seconds()
        
        total_tests = self.tests_passed + self.tests_failed
        
        print("\n" + "="*70)
        print("测试结果汇总")
        print("="*70)
        print(f"总测试数: {total_tests}")
        print(f"通过: {self.tests_passed}")
        print(f"失败: {self.tests_failed}")
        print(f"成功率: {self.tests_passed/total_tests*100:.1f}%" if total_tests > 0 else "0.0%")
        print(f"总耗时: {duration:.2f}秒")
        print(f"结束时间: {end_time.strftime('%Y-%m-%d %H:%M:%S')}")
        
        if self.tests_failed == 0:
            print("\n🎉 所有测试通过!")
        else:
            print(f"\n⚠️  有 {self.tests_failed} 个测试失败")
        
        return self.tests_failed == 0

async def main():
    """主函数"""
    test_runner = TestRunner()
    success = await test_runner.run_all_tests()
    
    # 返回退出码
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    asyncio.run(main())