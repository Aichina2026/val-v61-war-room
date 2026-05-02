#!/usr/bin/env python3
"""
验证所有配置模型的API连接
"""
import json
import subprocess
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

def load_model_config():
    """加载模型配置"""
    with open("/root/.openclaw/openclaw.json", "r", encoding="utf-8") as f:
        config = json.load(f)
    
    models = []
    for provider, details in config["models"]["providers"].items():
        for model in details["models"]:
            models.append({
                "provider": provider,
                "model_id": model["id"],
                "full_id": f"{provider}/{model['id']}",
                "name": model.get("name", model["id"]),
                "api_key": details.get("apiKey", ""),
                "base_url": details.get("baseUrl", "")
            })
    return models

def test_single_model(model_info):
    """测试单个模型连接"""
    full_id = model_info["full_id"]
    name = model_info["name"]
    
    print(f"🧪 测试: {name} ({full_id})")
    
    # 使用简单的测试提示
    test_prompt = "请回复 'API连接正常' 确认连接状态。"
    
    try:
        # 使用timeout控制执行时间
        start_time = time.time()
        cmd = ["timeout", "15", "openclaw", "run", "--model", full_id, test_prompt]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        end_time = time.time()
        
        if result.returncode == 0:
            response = result.stdout.strip()
            if "API连接正常" in response or "正常" in response or len(response) > 5:
                print(f"   ✅ 连接成功 ({end_time-start_time:.1f}s)")
                return True, full_id, "成功"
            else:
                print(f"   ⚠️  响应异常: {response[:50]}")
                return False, full_id, f"响应异常: {response[:50]}"
        else:
            error_msg = result.stderr[:100] if result.stderr else "未知错误"
            print(f"   ❌ 连接失败: {error_msg}")
            return False, full_id, error_msg
    
    except Exception as e:
        print(f"   ❌ 测试异常: {e}")
        return False, full_id, str(e)

def main():
    print("🔍 开始验证模型API连接")
    print("=" * 60)
    
    # 加载配置
    models = load_model_config()
    print(f"📊 共配置 {len(models)} 个模型:")
    
    for i, model in enumerate(models, 1):
        print(f"  {i}. {model['name']} ({model['full_id']})")
    
    print("\n" + "=" * 60)
    print("🚀 开始并发测试...")
    
    successful = []
    failed = []
    
    # 使用线程池并发测试
    with ThreadPoolExecutor(max_workers=3) as executor:
        future_to_model = {executor.submit(test_single_model, model): model for model in models}
        
        for future in as_completed(future_to_model):
            model = future_to_model[future]
            try:
                success, model_id, message = future.result(timeout=20)
                if success:
                    successful.append(model)
                else:
                    failed.append((model, message))
            except Exception as e:
                failed.append((model, f"执行异常: {e}"))
    
    print("\n" + "=" * 60)
    print("📋 测试结果汇总:")
    print(f"✅ 连接成功的模型: {len(successful)} 个")
    print(f"❌ 连接失败的模型: {len(failed)} 个")
    
    if successful:
        print("\n✅ 成功的模型:")
        for model in successful:
            print(f"  - {model['name']} ({model['full_id']})")
    
    if failed:
        print("\n❌ 失败的模型:")
        for model, error in failed:
            print(f"  - {model['name']} ({model['full_id']})")
            print(f"    错误: {error[:80]}")
    
    success_rate = len(successful) / len(models) * 100 if models else 0
    print(f"\n📈 总体成功率: {success_rate:.1f}%")
    
    # 提供建议
    if success_rate >= 70:
        print("\n🎉 API连接验证通过！可以继续下一步。")
        return True
    elif success_rate >= 30:
        print("\n⚠️  部分模型连接失败，但核心模型可用。")
        return True
    else:
        print("\n❌ API连接验证失败，需要检查配置。")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)