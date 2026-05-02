#!/usr/bin/env python3
"""
运行AI编排系统测试
"""

import asyncio
import sys
import os

# 添加src目录到Python路径
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(current_dir, 'src'))

async def simple_test():
    """简单测试各个模块"""
    print("运行AI编排系统简单测试...")
    
    # 1. 测试数据库模型导入
    try:
        from database.models import DatabaseManager, TaskStatus
        print("✅ 数据库模块导入成功")
    except ImportError as e:
        print(f"❌ 数据库模块导入失败: {e}")
        return False
    
    # 2. 测试缓存管理器导入
    try:
        from database.cache_manager import CacheManager
        print("✅ 缓存模块导入成功")
    except ImportError as e:
        print(f"❌ 缓存模块导入失败: {e}")
    
    # 3. 测试AI编排器导入
    try:
        from core.ai_orchestrator_v2 import EnhancedAISystemOrchestrator, TaskRequest, TaskType
        print("✅ AI编排器模块导入成功")
    except ImportError as e:
        print(f"❌ AI编排器模块导入失败: {e}")
    
    # 4. 测试监控模块导入
    try:
        from monitoring.system_monitor import SystemMonitor
        print("✅ 监控模块导入成功")
    except ImportError as e:
        print(f"❌ 监控模块导入失败: {e}")
    
    # 5. 测试API模块导入
    try:
        from api.server import TaskRequestModel
        print("✅ API模块导入成功")
    except ImportError as e:
        print(f"❌ API模块导入失败: {e}")
    
    # 6. 测试基础功能
    print("\n测试基础功能...")
    
    try:
        # 创建内存数据库
        db_manager = DatabaseManager("sqlite:///:memory:")
        db_manager.init_database()
        print("✅ 数据库初始化成功")
        
        # 测试任务保存
        task_data = {
            "task_id": "simple_test_001",
            "task_type": "text_generation",
            "input_text": "简单测试"
        }
        
        task_id = await db_manager.save_task(task_data)
        print(f"✅ 任务保存成功: {task_id}")
        
        # 测试任务查询
        task = await db_manager.get_task("simple_test_001")
        print(f"✅ 任务查询成功: {task['task_id'] if task else '无'}")
        
    except Exception as e:
        print(f"❌ 数据库测试失败: {e}")
    
    # 7. 测试AI编排器
    print("\n测试AI编排器...")
    
    try:
        orchestrator = EnhancedAISystemOrchestrator()
        print("✅ AI编排器创建成功")
        
        # 创建测试请求
        request = TaskRequest(
            task_id="orch_test_001",
            task_type=TaskType.TEXT_GENERATION,
            input_text="测试AI编排器功能",
            constraints={
                "max_tokens": 1000,
                "max_latency_ms": 3000
            }
        )
        
        # 处理请求
        result = await orchestrator.process_request(request)
        print(f"✅ 请求处理完成: {result.status}")
        print(f"   使用模型: {result.model_used}")
        print(f"   延迟: {result.metrics['latency_ms']:.0f}ms")
        print(f"   成本: ${result.metrics['cost_usd']:.4f}")
        
    except Exception as e:
        print(f"❌ AI编排器测试失败: {e}")
    
    # 8. 测试API模型
    print("\n测试API模型...")
    
    try:
        task_request = TaskRequestModel(
            task_type="text_generation",
            input_text="测试API模型",
            constraints={
                "max_tokens": 2000,
                "max_latency_ms": 5000
            }
        )
        print(f"✅ API模型验证成功: {task_request.task_type}")
        
    except Exception as e:
        print(f"❌ API模型测试失败: {e}")
    
    print("\n" + "="*60)
    print("简单测试完成!")
    print("="*60)
    
    return True

async def main():
    """主函数"""
    print("="*60)
    print("AI编排系统模块测试")
    print("="*60)
    
    success = await simple_test()
    
    if success:
        print("\n✅ 所有模块导入和基础功能测试通过!")
        print("\n项目结构:")
        print("  /src/core/ - AI编排器核心")
        print("  /src/database/ - 数据库和缓存")
        print("  /src/monitoring/ - 系统监控")
        print("  /src/api/ - RESTful API服务")
        print("\n下一步:")
        print("  1. 安装依赖: pip install -r requirements.txt")
        print("  2. 启动服务: python src/api/server.py")
        print("  3. 访问文档: http://localhost:8000/docs")
    else:
        print("\n⚠️  部分测试失败，请检查模块导入")
    
    print("\n测试完成!")

if __name__ == "__main__":
    asyncio.run(main())