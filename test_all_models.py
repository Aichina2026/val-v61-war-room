#!/usr/bin/env python3
import json
import subprocess
import time

def get_model_list():
    """获取所有配置的模型"""
    config_file = "/root/.openclaw/openclaw.json"
    
    with open(config_file, 'r', encoding='utf-8') as f:
        config = json.load(f)
    
    models = []
    for provider_name, provider in config["models"]["providers"].items():
        for model in provider["models"]:
            model_id = model["id"]
            full_model_id = f"{provider_name}/{model_id}"
            models.append({
                "full_id": full_model_id,
                "provider": provider_name,
                "model_id": model_id,
                "name": model.get("name", model_id)
            })
    
    return models

def test_model(model_id, test_prompt):
    """测试单个模型"""
    print(f"🧪 测试模型: {model_id}")
    
    cmd = ["openclaw", "run", "--model", model_id, test_prompt]
    
    try:
        start_time = time.time()
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        end_time = time.time()
        
        if result.returncode == 0:
            response = result.stdout.strip()
            if response:
                print(f"   ✅ 测试成功 (耗时: {end_time - start_time:.2f}秒)")
                print(f"   响应: {response[:100]}...")
                return True, response
            else:
                print(f"   ⚠️  返回为空响应")
                return False, "空响应"
        else:
            print(f"   ❌ 测试失败 (代码: {result.returncode})")
            if result.stderr:
                print(f"   错误: {result.stderr[:100]}")
            return False, result.stderr
    
    except subprocess.TimeoutExpired:
        print(f"   ⏰ 测试超时 (30秒)")
        return False, "超时"
    except Exception as e:
        print(f"   ❌ 测试异常: {e}")
        return False, str(e)

def main():
    print("🚀 开始测试所有配置的模型...")
    print("=" * 60)
    
    models = get_model_list()
    total_models = len(models)
    print(f"📊 总共需要测试 {total_models} 个模型:")
    
    for i, model in enumerate(models, 1):
        print(f"\n{i}/{total_models}: {model['name']} ({model['full_id']})")
    
    print("\n" + "=" * 60)
    print("🔍 开始执行测试...")
    
    test_prompt = "请用一句话介绍你自己，并说明你的主要能力。"
    print(f"测试提示: \"{test_prompt}\"")
    
    successful_models = []
    failed_models = []
    
    for model in models:
        print(f"\n{'='*60}")
        model_id = model["full_id"]
        success, result = test_model(model_id, test_prompt)
        
        if success:
            successful_models.append(model)
        else:
            failed_models.append((model, result))
        
        # 添加短暂延迟，避免API速率限制
        time.sleep(2)
    
    print("\n" + "="*60)
    print("📋 测试结果汇总:")
    print(f"✅ 成功的模型: {len(successful_models)} 个")
    print(f"❌ 失败的模型: {len(failed_models)} 个")
    
    if successful_models:
        print("\n✅ 成功的模型列表:")
        for model in successful_models:
            print(f"  - {model['full_id']} ({model['name']})")
    
    if failed_models:
        print("\n❌ 失败的模型列表:")
        for model, error in failed_models:
            print(f"  - {model['full_id']} ({model['name']})")
            print(f"    错误: {error[:100]}")
    
    print(f"\n📈 成功率: {len(successful_models)}/{total_models} ({len(successful_models)/total_models*100:.1f}%)")
    
    # 提供测试建议
    print("\n💡 测试建议:")
    print("1. 先测试阿里云模型 (alibailian/glm-5)")
    print("2. 再测试火山引擎模型 (ark/deepseek-v3.2)")
    print("3. 最后测试4SAPI和Kimi模型")
    print("4. 如果测试失败，请检查API密钥和网络连接")

if __name__ == "__main__":
    main()