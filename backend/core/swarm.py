"""
VAL V6.1 Multi-AI Orchestration Core
Native Tool Integration Engine
"""

import subprocess
import json
import asyncio
import os

class SwarmDebate:
    """
    Swarm Debate Engine - Physical Native Tool Integration
    抛弃虚假的 asyncio.gather 模拟，直接调用物理工具
    """
    
    MCP_TOOLS_PATH = "/app/mcp_tools"
    
    async def run_parallel_debate(self, layer: str, prompt: str):
        """
        【强制调用宿主机原生工具 parallel_ai_skill】
        物理并行调用多模型，真并发非模拟
        """
        # Build command to call native parallel_ai_skill
        models = "claude-4.5,gemini-2.5-pro,gpt-5"
        cmd = [
            "python", 
            f"{self.MCP_TOOLS_PATH}/parallel_ai_skill/main.py",
            "--models", models,
            "--prompt", prompt,
            "--timeout", "30"
        ]
        
        try:
            # Execute native tool
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                check=True,
                timeout=35
            )
            opinions = json.loads(result.stdout)
            
            # 【强制调用 4AI工作流 进行高准确率裁判】
            fusion_cmd = [
                "python",
                f"{self.MCP_TOOLS_PATH}/4AI工作流/judge.py",
                "--opinions", json.dumps(opinions)
            ]
            
            fusion_result = subprocess.run(
                fusion_cmd,
                capture_output=True,
                text=True,
                check=True,
                timeout=10
            )
            
            consensus = json.loads(fusion_result.stdout)
            
            # 准确率校验红线: 必须达到 95%
            confidence = consensus.get("confidence", 0)
            if confidence < 0.95:
                raise ValueError(f"准确率未达 95% 红线 (当前: {confidence:.1%})，打回重组！")
            
            return {
                "opinions": opinions,
                "consensus": consensus,
                "layer": layer,
                "timestamp": "2026-04-18T00:00:00Z"
            }
            
        except subprocess.CalledProcessError as e:
            # 报错自动转交 zero_error_system
            heal_cmd = [
                "python",
                f"{self.MCP_TOOLS_PATH}/zero_error_system/heal.py",
                "--error", e.stderr,
                "--auto"
            ]
            
            subprocess.run(heal_cmd, capture_output=True, timeout=60)
            
            raise RuntimeError(f"Swarm调用失败，已转交自愈系统: {e.stderr}")
        
        except subprocess.TimeoutExpired:
            raise RuntimeError("Swarm execution timeout after 35s")
        
        except json.JSONDecodeError as e:
            raise RuntimeError(f"Invalid JSON output from native tools: {e}")
