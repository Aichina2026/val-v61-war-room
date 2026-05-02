#!/usr/bin/env python3
"""
AI模型密钥验证器
自动检测和验证所有配置的API密钥
"""

import os
import json
import asyncio
import aiohttp
import time
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime
import logging

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@dataclass
class KeyValidationResult:
    """密钥验证结果"""
    key_name: str
    key_value: str
    provider: str
    is_valid: bool = False
    status_code: Optional[int] = None
    response_time_ms: float = 0.0
    error_message: str = ""
    model_info: Dict[str, Any] = field(default_factory=dict)
    tested_at: str = ""
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典"""
        return {
            "key_name": self.key_name,
            "provider": self.provider,
            "is_valid": self.is_valid,
            "response_time_ms": self.response_time_ms,
            "status_code": self.status_code,
            "error_message": self.error_message,
            "model_info": self.model_info,
            "tested_at": self.tested_at
        }

class KeyValidator:
    """密钥验证器"""
    
    def __init__(self):
        self.results: Dict[str, KeyValidationResult] = {}
        self.valid_keys: List[KeyValidationResult] = []
        self.invalid_keys: List[KeyValidationResult] = []
        
    def collect_keys(self) -> Dict[str, Dict[str, str]]:
        """收集所有环境变量中的密钥"""
        keys_by_provider = {
            "kimi": [],
            "ark": [],
            "ali": [],
            "4sapi": [],
            "other": []
        }
        
        # 收集所有密钥
        for key, value in os.environ.items():
            if "KEY" not in key.upper():
                continue
                
            # 跳过非密钥环境变量
            if key in ["PATH", "LESSKEY", "KEY_ROTATION_ENABLED"]:
                continue
                
            if not value or value.strip() == "":
                logger.warning(f"空值密钥: {key}")
                continue
                
            # 分类密钥
            key_lower = key.lower()
            if "kimi" in key_lower:
                keys_by_provider["kimi"].append({"name": key, "value": value})
            elif "ark" in key_lower:
                keys_by_provider["ark"].append({"name": key, "value": value})
            elif "ali" in key_lower:
                keys_by_provider["ali"].append({"name": key, "value": value})
            elif "4sapi" in key_lower or "foursapi" in key_lower:
                keys_by_provider["4sapi"].append({"name": key, "value": value})
            else:
                keys_by_provider["other"].append({"name": key, "value": value})
        
        total_keys = sum(len(keys) for keys in keys_by_provider.values())
        logger.info(f"收集到 {total_keys} 个密钥:")
        for provider, keys in keys_by_provider.items():
            if keys:
                logger.info(f"  {provider}: {len(keys)} 个密钥")
        
        return keys_by_provider
    
    async def validate_kimi_key(self, key_name: str, key_value: str, session: aiohttp.ClientSession) -> KeyValidationResult:
        """验证Kimi密钥"""
        result = KeyValidationResult(
            key_name=key_name,
            key_value=key_value[:10] + "..." if len(key_value) > 10 else key_value,
            provider="kimi",
            tested_at=datetime.now().isoformat()
        )
        
        try:
            start_time = time.time()
            
            # 测试API端点
            headers = {
                "Authorization": f"Bearer {key_value}",
                "Content-Type": "application/json"
            }
            
            # 简单测试：获取模型列表
            payload = {
                "model": "kimi-k2.5",
                "messages": [{"role": "user", "content": "test"}],
                "max_tokens": 5,
                "stream": False
            }
            
            async with session.post(
                "https://api.moonshot.cn/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=10
            ) as response:
                result.response_time_ms = (time.time() - start_time) * 1000
                result.status_code = response.status
                
                if response.status == 200:
                    result.is_valid = True
                    # 尝试获取模型信息
                    try:
                        data = await response.json()
                        result.model_info = {
                            "model": data.get("model", "unknown"),
                            "usage": data.get("usage", {}),
                            "can_test_k2.6": True  # 标记可以测试K2.6
                        }
                    except:
                        result.model_info = {"message": "响应解析成功"}
                elif response.status == 401:
                    result.is_valid =