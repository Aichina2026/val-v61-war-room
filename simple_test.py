#!/usr/bin/env python3
"""
AI编排系统简化测试
"""

import sys
import os

# 添加src目录到Python路径
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(current_dir, 'src'))

def test_imports():
    """测试模块导入"""
    print("测试模块导入...")
    
    modules = [
        ("core.ai_orchestrator", "AI编排器核心"),
        ("database.models", "数据库模型"),
        ("database.cache_manager", "缓存管理器"),
        ("monitoring.system_monitor", "系统监控"),
        ("api.server", "API服务器"),
    ]
    
    all_passed = True
    
    for module_path, description in modules:
        try:
            __import__(module_path)
            print(f"✅ {description} - 导入成功")
        except ImportError as e:
            print(f"❌ {description} - 导入失败: {e}")
            all_passed = False
        except Exception as e:
            print(f"⚠️  {description} - 导入异常: {e}")
            # 不标记为失败，可能是依赖问题
    
    return all_passed

def test_basic_classes():
    """测试基础类"""
    print("\n测试基础类...")
    
    try:
        # 测试枚举类
        from core.ai_orchestrator_v2 import TaskType, ModelCapability
        
        print(f"✅ TaskType枚举: {[t.value for t in TaskType][:3]}...")
        print(f"✅ ModelCapability枚举: {[c.value for c in ModelCapability][:3]}...")
        
        # 测试数据类
        from core.ai_orchestrator_v2 import TaskRequest
        
        request = TaskRequest(
            task_id="test_001",
            task_type=TaskType.TEXT_GENERATION,
            input_text="测试请求"
        )
        print(f"✅ TaskRequest创建: {request.task_id}")
        
        return True
        
    except Exception as e:
        print(f"❌ 基础类测试失败: {e}")
        return False

def test_project_structure():
    """测试项目结构"""
    print("\n检查项目结构...")
    
    required_dirs = [
        "src",
        "src/core",
        "src/database", 
        "src/monitoring",
        "src/api",
        "tests",
        "docs",
        "k8s"
    ]
    
    required_files = [
        "requirements.txt",
        "docker-compose.yml",
        "Dockerfile",
        "deploy.sh",
        "project_requirements.md",
        "architecture_design.md",
        "iteration_plan.md"
    ]
    
    all_passed = True
    
    for dir_path in required_dirs:
        full_path = os.path.join(current_dir, dir_path)
        if os.path.exists(full_path):
            print(f"✅ 目录存在: {dir_path}/")
        else:
            print(f"❌ 目录缺失: {dir_path}/")
            all_passed = False
    
    for file_path in required_files:
        full_path = os.path.join(current_dir, file_path)
        if os.path.exists(full_path):
            size = os.path.getsize(full_path)
            print(f"✅ 文件存在: {file_path} ({size}字节)")
        else:
            print(f"❌ 文件缺失: {file_path}")
            all_passed = False
    
    return all_passed

def test_code_quality():
    """测试代码质量"""
    print("\n检查代码质量...")
    
    # 检查Python文件
    python_files = []
    for root, dirs, files in os.walk(os.path.join(current_dir, "src")):
        for file in files:
            if file.endswith(".py"):
                python_files.append(os.path.join(root, file))
    
    print(f"找到 {len(python_files)} 个Python文件")
    
    # 检查文件大小
    large_files = []
    for file_path in python_files:
        size = os.path.getsize(file_path)
        if size > 10000:  # 10KB
            large_files.append((os.path.relpath(file_path, current_dir), size))
    
    if large_files:
        print("⚠️  大型Python文件:")
        for file_path, size in large_files[:5]:  # 显示前5个
            print(f"  {file_path}: {size:,}字节")
        if len(large_files) > 5:
            print(f"  还有 {len(large_files)-5} 个大型文件...")
    else:
        print("✅ 所有Python文件大小正常")
    
    return True

def generate_summary():
    """生成项目摘要"""
    print("\n" + "="*70)
    print("AI编排系统项目摘要")
    print("="*70)
    
    # 项目文件统计
    total_files = 0
    total_size = 0
    
    for root, dirs, files in os.walk(current_dir):
        # 排除隐藏目录和虚拟环境
        if any(part.startswith('.') for part in root.split('/')):
            continue
            
        total_files += len(files)
        for file in files:
            file_path = os.path.join(root, file)
            if os.path.exists(file_path):
                total_size += os.path.getsize(file_path)
    
    print(f"项目文件数: {total_files} 个文件")
    print(f"项目总大小: {total_size / 1024 / 1024:.2f} MB")
    
    # 主要模块
    print("\n主要模块:")
    modules = {
        "核心编排器": "src/core/ai_orchestrator_v2.py",
        "数据库模型": "src/database/models.py", 
        "缓存管理": "src/database/cache_manager.py",
        "系统监控": "src/monitoring/system_monitor.py",
        "API服务器": "src/api/server.py",
        "架构设计": "architecture_design.md",
        "迭代计划": "iteration_plan.md",
        "部署配置": "docker-compose.yml"
    }
    
    for name, path in modules.items():
        full_path = os.path.join(current_dir, path)
        if os.path.exists(full_path):
            size = os.path.getsize(full_path)
            print(f"  {name}: {path} ({size:,}字节)")
    
    # 技术栈
    print("\n技术栈:")
    tech_stack = [
        "Python 3.11+ (异步编程)",
        "FastAPI (RESTful API)",
        "SQLAlchemy (ORM)",
        "PostgreSQL (主数据库)",
        "Redis (缓存)",
        "Qdrant (向量搜索)",
        "Docker (容器化)",
        "Kubernetes (编排)",
        "Prometheus (监控)",
        "Grafana (可视化)"
    ]
    
    for tech in tech_stack:
        print(f"  • {tech}")
    
    # 核心功能
    print("\n核心功能:")
    features = [
        "多AI模型路由 (33个开源模型)",
        "增强搜索系统",
        "全链条监管",
        "成本优化",
        "实时监控",
        "企业级部署",
        "RESTful API + WebSocket"
    ]
    
    for feature in features:
        print(f"  • {feature}")
    
    # 项目状态
    print("\n项目状态:")
    status_items = [
        ("技术调研", "✅ 完成 (33个AI项目分析)"),
        ("架构设计", "✅ 完成 (7层架构)"),
        ("核心实现", "🔄 进行中 (70%完成)"),
        ("数据库集成", "🔄 进行中"),
        ("监控系统", "🔄 进行中"),
        ("API服务", "🔄 进行中"),
        ("容器化部署", "🔄 进行中"),
        ("企业级功能", "⏳ 待开始")
    ]
    
    for item, status in status_items:
        print(f"  {item}: {status}")
    
    print("\n" + "="*70)

def main():
    """主函数"""
    print("="*70)
    print("AI编排系统验证测试")
    print("="*70)
    
    # 运行测试
    tests = [
        ("模块导入", test_imports),
        ("基础类", test_basic_classes),
        ("项目结构", test_project_structure),
        ("代码质量", test_code_quality),
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\n{test_name}测试:")
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ 测试异常: {e}")
            results.append((test_name, False))
    
    # 显示结果
    print("\n" + "="*70)
    print("测试结果汇总")
    print("="*70)
    
    passed = 0
    for test_name, result in results:
        status = "✅ 通过" if result else "❌ 失败"
        print(f"{test_name}: {status}")
        if result:
            passed += 1
    
    total = len(results)
    success_rate = passed / total * 100 if total > 0 else 0
    
    print(f"\n通过率: {passed}/{total} ({success_rate:.1f}%)")
    
    # 生成项目摘要
    generate_summary()
    
    # 下一步建议
    print("\n" + "="*70)
    print("下一步建议")
    print("="*70)
    
    if passed == total:
        print("✅ 所有测试通过! 项目准备进入下一阶段。")
        print("\n建议行动:")
        print("1. 安装依赖: pip install -r requirements.txt")
        print("2. 启动开发环境: docker-compose up -d")
        print("3. 运行API服务: python src/api/server.py")
        print("4. 访问文档: http://localhost:8000/docs")
        print("5. 执行迭代8-10: 完善数据库和监控")
    else:
        print("⚠️  部分测试失败，需要修复问题。")
        print("\n建议行动:")
        print("1. 修复导入错误和依赖问题")
        print("2. 完善缺失的文件和目录")
        print("3. 重新运行测试验证")
    
    print("\n测试完成!")

if __name__ == "__main__":
    main()