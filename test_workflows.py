#!/usr/bin/env python3
import json
import subprocess
import time
import os

def check_team_mode():
    """测试team模式工作流"""
    print("🧪 测试 $team模式 - 4模型并行审查")
    print("=" * 60)
    
    # 检查team-mode.js文件是否存在
    team_mode_path = "/root/.openclaw/workspace/modules/code-generation/skills/code-generation/team-mode.js"
    
    if os.path.exists(team_mode_path):
        print(f"✅ team-mode.js 文件存在")
        
        # 检查文件内容
        with open(team_mode_path, 'r', encoding='utf-8') as f:
            content = f.read()
            if "teamMode" in content:
                print("✅ 文件中包含 teamMode 函数")
            else:
                print("❌ 文件中未找到 teamMode 函数")
            
        # 检查是否已安装
        print("\n📋 检查 coding-agent 技能状态...")
        result = subprocess.run(["openclaw", "skills", "info", "coding-agent"], 
                              capture_output=True, text=True, timeout=10)
        
        if result.returncode == 0:
            print("✅ coding-agent 技能已安装")
        else:
            print("❌ coding-agent 技能未安装或错误")
            print(f"错误: {result.stderr[:100]}...")
    
    else:
        print(f"❌ team-mode.js 文件不存在")
    
    print()

def check_ri_mode():
    """测试ri模式工作流"""
    print("🧪 测试 $ri模式 - 持久执行循环优化")
    print("=" * 60)
    
    ri_mode_path = "/root/.openclaw/workspace/modules/code-generation/sills/code-generation/ri-mode.js"
    
    if os.path.exists(ri_mode_path):
        print(f"✅ ri-mode.js 文件存在")
        print("✅ $ri 模式配置可用")
    else:
        print(f"❌ ri-mode.js 文件不存在")
    
    print("\n📋 检查 OpenClaw 网关工作流支持...")
    try:
        # 检查网关状态
        result = subprocess.run(["openclaw", "status"], 
                              capture_output=True, text=True, timeout=10)
        
        if result.returncode == 0:
            # 检查是否包含工作流相关信息
            if "codex" in result.stdout.lower() or "workflow" in result.stdout.lower():
                print("✅ 网关支持工作流处理")
            else:
                print("⚠️  网关可能未完全支持工作流")
        else:
            print("❌ 网关状态检查失败")
    
    except Exception as e:
        print(f"❌ 检查失败: {e}")

def check_architect_validation():
    """检查架构师验证功能"""
    print("\n🧪 测试 架构师验证工作流")
    print("=" * 60)
    
    # 检查是否有架构验证相关配置

    config_file = "/root/.openclaw/openclaw.json"
    with open(config_file, 'r', encoding='utf-8') as f:
        config = json.load(f)
    
    # 检查是否存在相关配置

    if "models" in config:
        providers = config["models"].get("providers", {})
        
        # 检查阿里云和火山引擎模型

        if "alibailian" in providers:
            print("✅ 阿里云百炼模型已配置")
        
        if "ark" in providers:
            print("✅ 火山引擎模型已配置")
        
        if "kimi" in providers:
            print("✅ Kimi 2.5 模型已配置")
        
        if "4sapi" in providers:
            print("✅ 4SAPI 模型已配置")
    
    # 检查是否能运行简单模型调用
    print("\n🔧 测试简单模型调用...")
    
    try:
        test_cmd = ["openclaw", "run", "--model", "ark/deepseek-v3.2", "Hello"]
        result = subprocess.run(test_cmd, capture_output=True, text=True, timeout=15)
        
        if result.returncode == 0 and result.stdout.strip():
            print("✅ 简单模型调用成功")
            print(f"响应: {result.stdout[:100]}...")
        else:
            print("⚠️  模型调用可能有问题")
            if result.stderr:
                print(f"错误: {result.stderr[:100]}...")
    
    except Exception as e:
        print(f"❌ 模型调用失败: {e}")

def main():
    print("🚀 测试 Oh-my-Codex 工作流系统")
    print("=" * 60)
    
    print("本次测试将验证以下工作流:")
    print("1. $team模式 - 4模型并行审查")
    print("2. $ri模式 - 持久执行循环优化")
    print("3. 架构师验证")
    
    print("\n" + "=" * 60)
    
    # 运行测试
    check_team_mode()
    check_ri_mode()
    check_architect_validation()
    
    print("\n" + "=" * 60)
    print("📊 测试完成！")
    print("\n💡 建议:")
    print("1. 确保所有模型API密钥有效")
    print("2. 测试前检查网络连接")
    print("3. 可运行实际代码审查任务验证")

if __name__ == "__main__":
    main()