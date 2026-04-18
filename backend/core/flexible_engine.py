#!/usr/bin/env python3
"""
VAL V6.2 Flexible Multi-AI Engine
可配置化多AI辩论系统 - 节点/模型/角色/轮次全可选
"""

import subprocess
import json
import asyncio
import os
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, asdict

@dataclass
class ModelConfig:
    """模型配置"""
    id: str
    name: str
    provider: str
    endpoint: str  # 4SAPI / Aliyun / Moonshot / Volcano
    type: str  # clarifier/builder/reviewer/arbiter/general
    capabilities: List[str]
    
@dataclass
class NodeConfig:
    """节点配置"""
    name: str
    url: str
    api_key: str
    available_models: List[str]
    enabled: bool = True

@dataclass
class DebateConfig:
    """辩论配置"""
    roles: List[str]  # 参与角色
    models: Dict[str, str]  # 角色->模型映射
    rounds: int  # 辩论轮次
    confidence_threshold: float  # 置信度阈值
    enable_search: bool  # 是否启用搜索
    context_window: int  # 上下文窗口


# 预定义模型库
MODEL_LIBRARY = {
    # 4SAPI 节点模型
    "glm-5.1": ModelConfig("glm-5.1", "GLM-5.1", "zhipu", "4SAPI", "clarifier", ["multimodal", "reasoning"]),
    "gemini-2.5-pro": ModelConfig("gemini-2.5-pro", "Gemini 2.5 Pro", "google", "4SAPI", "clarifier", ["multimodal", "vision"]),
    "gpt-5.3-codex-xhigh": ModelConfig("gpt-5.3-codex-xhigh", "GPT-5.3 Codex", "openai", "4SAPI", "builder", ["coding", "architecture"]),
    "claude-opus-4-6": ModelConfig("claude-opus-4-6", "Claude Opus 4.6", "anthropic", "4SAPI", "reviewer", ["reasoning", "safety"]),
    "claude-opus-4-7": ModelConfig("claude-opus-4-7", "Claude Opus 4.7", "anthropic", "4SAPI", "reviewer", ["reasoning", "analysis"]),
    "gpt-5.4": ModelConfig("gpt-5.4", "GPT-5.4", "openai", "4SAPI", "arbiter", ["synthesis", "decision"]),
    "gpt-5.4-xhigh": ModelConfig("gpt-5.4-xhigh", "GPT-5.4 xhigh", "openai", "4SAPI", "arbiter", ["synthesis", "high-quality"]),
    "kimi-k2.5": ModelConfig("kimi-k2.5", "Kimi K2.5", "moonshot", "4SAPI", "general", ["long-context", "reasoning"]),
    "deepseek-v3.2": ModelConfig("deepseek-v3.2", "DeepSeek V3.2", "deepseek", "4SAPI", "builder", ["coding", "math"]),
    "qwen3.6-plus": ModelConfig("qwen3.6-plus", "Qwen 3.6 Plus", "alibaba", "4SAPI", "general", ["chinese", "reasoning"]),
    
    # 阿里百炼节点模型
    "qwen-max": ModelConfig("qwen-max", "Qwen Max", "alibaba", "Aliyun", "arbiter", ["synthesis", "chinese"]),
    "qwen-plus": ModelConfig("qwen-plus", "Qwen Plus", "alibaba", "Aliyun", "builder", ["coding", "chinese"]),
    "qwen-coder-plus": ModelConfig("qwen-coder-plus", "Qwen Coder Plus", "alibaba", "Aliyun", "builder", ["coding"]),
}

# 节点配置（从环境变量读取密钥）
NODE_CONFIGS = {
    "4SAPI": NodeConfig(
        name="4SAPI",
        url="https://4sapi.com/v1/chat/completions",
        api_key=os.getenv("4SAPI_KEY", ""),
        available_models=["glm-5.1", "gemini-2.5-pro", "gpt-5.3-codex-xhigh", "claude-opus-4-6", 
                         "gpt-5.4", "kimi-k2.5", "deepseek-v3.2", "qwen3.6-plus"]
    ),
    "Aliyun": NodeConfig(
        name="Aliyun Bailian",
        url="https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
        api_key=os.getenv("ALIYUN_KEY", ""),
        available_models=["qwen-max", "qwen-plus", "qwen-coder-plus"],
        enabled=bool(os.getenv("ALIYUN_KEY", ""))
    ),
    "Moonshot": NodeConfig(
        name="Moonshot",
        url="https://api.moonshot.cn/v1/chat/completions",
        api_key=os.getenv("MOONSHOT_KEY", ""),
        available_models=["kimi-k2.5", "kimi-k2.6-code-preview"],
        enabled=bool(os.getenv("MOONSHOT_KEY", ""))
    )
}


class FlexibleDebateEngine:
    """灵活辩论引擎"""
    
    def __init__(self, config: DebateConfig):
        self.config = config
        self.context_history = []  # 上下文历史
        
    async def search_and_contextualize(self, query: str) -> str:
        """
        搜索并按Google标准处理知识
        返回带上下文的增强查询
        """
        if not self.config.enable_search:
            return query
            
        # 调用搜索工具（简化版，实际可集成Serper/Google API）
        search_cmd = [
            "python", 
            "/app/mcp_tools/search_knowledge/main.py",
            "--query", query,
            "--max_results", "5"
        ]
        
        try:
            result = subprocess.run(
                search_cmd, capture_output=True, text=True, timeout=15
            )
            if result.returncode == 0:
                search_data = json.loads(result.stdout)
                # 按Google标准格式化搜索结果
                formatted = self._format_search_results(search_data)
                
                # 加入上下文历史
                self.context_history.append({
                    "type": "search",
                    "query": query,
                    "results": formatted
                })
                
                return f"""
【搜索增强上下文】
原始查询: {query}

【检索到的知识】(按相关性排序)
{formatted}

【分析要求】
请基于以上上下文和您的专业知识进行分析和回答。
"""
        except Exception as e:
            # 搜索失败，使用原始查询
            pass
            
        return query
    
    def _format_search_results(self, data: Dict) -> str:
        """按Google标准格式化搜索结果"""
        formatted = []
        for idx, item in enumerate(data.get("results", []), 1):
            title = item.get("title", "N/A")
            snippet = item.get("snippet", "N/A")
            url = item.get("url", "")
            source = item.get("source", "Unknown")
            
            formatted.append(f"""
[{idx}] {title}
    来源: {source}
    摘要: {snippet[:200]}...
    链接: {url}
""")
        return "\n".join(formatted)
    
    async def call_model(self, role: str, model_id: str, prompt: str) -> Dict:
        """调用指定模型"""
        model_config = MODEL_LIBRARY.get(model_id)
        if not model_config:
            return {"role": role, "error": f"Unknown model: {model_id}"}
        
        node = NODE_CONFIGS.get(model_config.endpoint)
        if not node or not node.enabled:
            return {"role": role, "error": f"Node {model_config.endpoint} not available"}
        
        # 构建增强提示（加入上下文）
        enhanced_prompt = self._build_contextual_prompt(prompt, role)
        
        # 实际API调用（简化版，实际使用requests/httpx）
        # 这里模拟调用
        await asyncio.sleep(0.3)
        
        return {
            "role": role,
            "model": model_id,
            "provider": model_config.provider,
            "endpoint": model_config.endpoint,
            "type": model_config.type,
            "capabilities": model_config.capabilities,
            "opinion": f"[{role}] {model_id} analysis: {enhanced_prompt[:80]}...",
            "timestamp": "2026-04-18T00:00:00Z"
        }
    
    def _build_contextual_prompt(self, prompt: str, role: str) -> str:
        """构建带上下文的提示"""
        context = ""
        
        # 添加上下文历史
        if self.context_history:
            context = "【对话上下文】\n"
            for item in self.context_history[-self.config.context_window:]:
                if item["type"] == "search":
                    context += f"- 搜索: {item['query']}\n"
        
        # 添加角色特定指令
        role_instructions = {
            "clarifier": "你是一个需求分析专家。请仔细分析需求，提取关键要素。",
            "builder": "你是一个系统架构师。请设计可行、可扩展的架构方案。",
            "reviewer": "你是一个安全审计专家。请审查方案的安全性、完整性和潜在风险。",
            "arbiter": "你是一个终极仲裁者。请综合各方意见，给出最终决策和建议。"
        }
        
        return f"""
{context}
【当前角色】{role}
【角色指令】{role_instructions.get(role, "请提供专业分析。")}

【任务】
{prompt}
"""
    
    async def run_round(self, round_num: int, prompt: str) -> Dict:
        """运行单轮辩论"""
        print(f"\n=== Round {round_num}/{self.config.rounds} ===")
        
        # 并行调用所有角色
        tasks = []
        for role in self.config.roles:
            model_id = self.config.models.get(role, "gpt-5.4")
            tasks.append(self.call_model(role, model_id, prompt))
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        opinions = {}
        for role, result in zip(self.config.roles, results):
            if isinstance(result, Exception):
                opinions[role] = {"error": str(result)}
            else:
                opinions[role] = result
        
        # 添加到上下文
        self.context_history.append({
            "type": "debate",
            "round": round_num,
            "opinions": opinions
        })
        
        return opinions
    
    def calculate_consensus(self, all_rounds: List[Dict]) -> Dict:
        """计算多轮共识"""
        # 统计各角色意见
        role_weights = {"clarifier": 1.0, "builder": 1.0, "reviewer": 1.1, "arbiter": 1.2}
        
        valid_count = 0
        total_weight = 0
        heterogeneity_score = 0
        
        providers = set()
        model_types = set()
        
        for round_data in all_rounds:
            for role, data in round_data.items():
                if isinstance(data, dict) and "error" not in data:
                    weight = role_weights.get(role, 1.0)
                    total_weight += weight
                    valid_count += 1
                    
                    providers.add(data.get("provider", "unknown"))
                    model_types.add(data.get("type", "general"))
        
        # 异构度加成
        heterogeneity_score = min(0.1, len(model_types) * 0.025)
        
        # 基础置信度
        base_confidence = 0.6 + (valid_count * 0.03) + (len(all_rounds) * 0.02)
        confidence = min(0.98, base_confidence + heterogeneity_score)
        
        return {
            "confidence": round(confidence, 3),
            "threshold": self.config.confidence_threshold,
            "passed": confidence >= self.config.confidence_threshold,
            "rounds": len(all_rounds),
            "heterogeneous": {
                "providers": list(providers),
                "model_types": list(model_types),
                "diversity_score": len(model_types) / 4.0
            },
            "summary": "Consensus reached" if confidence >= self.config.confidence_threshold else "Needs more discussion"
        }
    
    async def run_debate(self, prompt: str) -> Dict:
        """运行完整辩论流程"""
        # 1. 搜索增强（如果启用）
        enhanced_prompt = await self.search_and_contextualize(prompt)
        
        # 2. 多轮辩论
        all_rounds = []
        for round_num in range(1, self.config.rounds + 1):
            round_result = await self.run_round(round_num, enhanced_prompt)
            all_rounds.append(round_result)
            
            # 轮间延迟
            if round_num < self.config.rounds:
                await asyncio.sleep(2)
        
        # 3. 计算共识
        consensus = self.calculate_consensus(all_rounds)
        
        return {
            "config": asdict(self.config),
            "prompt": prompt,
            "enhanced_prompt": enhanced_prompt if self.config.enable_search else None,
            "rounds": all_rounds,
            "consensus": consensus,
            "context_history": self.context_history
        }


# 快捷配置工厂
def create_config(
    mode: str = "standard",
    custom_roles: Optional[List[str]] = None,
    custom_models: Optional[Dict[str, str]] = None,
    rounds: int = 1,
    enable_search: bool = False
) -> DebateConfig:
    """
    创建配置
    modes: standard, minimal, deep, custom
    """
    presets = {
        "standard": {
            "roles": ["clarifier", "builder", "reviewer", "arbiter"],
            "models": {
                "clarifier": "glm-5.1",
                "builder": "gpt-5.3-codex-xhigh",
                "reviewer": "claude-opus-4-6",
                "arbiter": "gpt-5.4"
            },
            "rounds": rounds or 1,
            "threshold": 0.95
        },
        "minimal": {
            "roles": ["builder", "reviewer"],
            "models": {
                "builder": "gpt-5.3-codex-xhigh",
                "reviewer": "claude-opus-4-6"
            },
            "rounds": rounds or 1,
            "threshold": 0.90
        },
        "deep": {
            "roles": ["clarifier", "builder", "reviewer", "arbiter"],
            "models": {
                "clarifier": "gemini-2.5-pro",
                "builder": "gpt-5.3-codex-xhigh",
                "reviewer": "claude-opus-4-6",
                "arbiter": "gpt-5.4-xhigh"
            },
            "rounds": rounds or 3,
            "threshold": 0.97
        }
    }
    
    preset = presets.get(mode, presets["standard"])
    
    # 应用自定义
    if custom_roles:
        preset["roles"] = custom_roles
    if custom_models:
        preset["models"].update(custom_models)
    if rounds:
        preset["rounds"] = rounds
    
    return DebateConfig(
        roles=preset["roles"],
        models=preset["models"],
        rounds=preset["rounds"],
        confidence_threshold=preset["threshold"],
        enable_search=enable_search,
        context_window=5
    )


if __name__ == "__main__":
    # 测试运行
    import sys
    
    # 从命令行参数创建配置
    # 示例: python flexible_engine.py --mode standard --rounds 2 --search
    import argparse
    
    parser = argparse.ArgumentParser(description="VAL V6.2 Flexible Multi-AI Engine")
    parser.add_argument("--mode", choices=["standard", "minimal", "deep", "custom"], default="standard")
    parser.add_argument("--rounds", type=int, default=1)
    parser.add_argument("--search", action="store_true", help="Enable search enhancement")
    parser.add_argument("--roles", help="Comma-separated roles (for custom mode)")
    parser.add_argument("--prompt", required=True, help="Input prompt")
    
    args = parser.parse_args()
    
    custom_roles = args.roles.split(",") if args.roles else None
    
    config = create_config(
        mode=args.mode,
        custom_roles=custom_roles,
        rounds=args.rounds,
        enable_search=args.search
    )
    
    engine = FlexibleDebateEngine(config)
    result = asyncio.run(engine.run_debate(args.prompt))
    
    print(json.dumps(result, indent=2, ensure_ascii=False))
