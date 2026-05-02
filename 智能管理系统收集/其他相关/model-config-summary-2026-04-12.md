# 模型配置更新摘要
## 更新时间：2026-04-12 23:40 UTC

## 1. 更新后的模型配置概览

### 1.1 火山引擎 (ark) - 2个模型
1. **deepseek-v3.2** (火山引擎版)
   - 上下文窗口：200k
   - 最大输出：8192 tokens
   - API类型：openai-completions

2. **glm-4-7-251222** (智谱GLM-4-7B 251222版本)
   - 上下文窗口：128k
   - 最大输出：4096 tokens
   - 支持推理：是
   - API类型：openai-chat

### 1.2 阿里云百炼 (alibailian) - 4个模型
1. **glm-5** (智谱GLM-5)
   - 上下文窗口：128k
   - 最大输出：8192 tokens
   - 成本：输入 $0.005/1K，输出 $0.01/1K
   - 支持推理：是

2. **qwen3.6-plus** (通义千问3.6-Plus)
   - 上下文窗口：128k
   - 最大输出：8192 tokens
   - 成本：输入 $0.003/1K，输出 $0.006/1K
   - 支持推理：是

3. **qwen3-max** (通义千问3-Max)
   - 上下文窗口：128k
   - 最大输出：8192 tokens
   - 成本：输入 $0.008/1K，输出 $0.016/1K
   - 支持推理：是

4. **deepseek-v3.2** (阿里云版)
   - 上下文窗口：200k
   - 最大输出：8192 tokens
   - 成本：输入 $0.001/1K，输出 $0.002/1K
   - 支持推理：是

### 1.3 Kimi官方 (kimi) - 1个模型
1. **kimi-k2.5** (Kimi Chat 2.5)
   - 上下文窗口：128k
   - 最大输出：64000 tokens
   - 支持推理：是
   - API类型：openai-chat

### 1.4 4SAPI (4sapi) - 3个模型
1. **gemini-3.1-pro-preview** (Google Gemini 3.1 Pro Preview)
   - 上下文窗口：128k
   - 最大输出：4096 tokens
   - 支持推理：是

2. **gpt-5.4** (OpenAI GPT-5.4)
   - 上下文窗口：128k
   - 最大输出：4096 tokens
   - 支持推理：是

3. **claude-opus-4.6** (Anthropic Claude Opus 4.6)
   - 上下文窗口：200k
   - 最大输出：4096 tokens
   - 支持推理：是

## 2. OMC工作流阶段策略配置

### 2.1 分析阶段 (analysis)
- **主要策略**：balanced
- **备用策略**：fast
- **优先模型**：
  1. gemini-3.1-pro-preview
  2. glm-5
  3. deepseek-v3.2

### 2.2 设计阶段 (design)
- **主要策略**：high-quality
- **备用策略**：balanced
- **优先模型**：
  1. claude-opus-4.6
  2. gpt-5.4
  3. qwen3-max

### 2.3 生成阶段 (generation)
- **主要策略**：cost-effective
- **备用策略**：balanced
- **优先模型**：
  1. deepseek-v3.2
  2. glm-4-7-251222
  3. qwen3.6-plus

### 2.4 审查阶段 (review)
- **主要策略**：balanced
- **备用策略**：high-quality
- **优先模型**：
  1. kimi-k2.5
  2. deepseek-v3.2
  3. claude-opus-4.6

### 2.5 优化阶段 (optimization)
- **主要策略**：fast
- **备用策略**：cost-effective
- **优先模型**：
  1. gemini-3.1-pro-preview
  2. gpt-5.4
  3. glm-5

## 3. 分级调用策略对应

### 3.1 L0级 (虚拟角色层)
- 使用：单个默认模型上下文切换
- 推荐：deepseek-v3.2 (火山引擎版)

### 3.2 L1级 (国产模型协同层)
- 使用：glm-4-7-251222 + deepseek-v3.2
- 每个模型扮演2个角色

### 3.3 L2级 (国产模型全角色层)
- 使用：glm-5 + qwen3.6-plus + qwen3-max + deepseek-v3.2 (阿里云版)
- 每个模型专职1个角色

### 3.4 L3级 (国际顶级模型层)
- 使用：gemini-3.1-pro-preview + gpt-5.4 + claude-opus-4.6 + kimi-k2.5
- 每个模型专职1个角色

## 4. 系统重启建议

由于OMC路由系统之前遇到SIGTERM错误，建议重启系统以确保新配置生效：

```bash
# 停止当前OMC自动化系统
pkill -f omc-automation-system

# 等待5秒
sleep 5

# 重新启动OMC系统
cd /root/.openclaw/workspace
node omc-automation-system.js start
```

## 5. 验证步骤

1. **配置验证**：检查openclaw-update-models.json文件格式
2. **路由测试**：运行简单的路由测试命令
3. **模型可用性**：测试每个模型的API连接
4. **性能监控**：观察新配置下的系统性能

## 6. 注意事项

1. **API密钥**：确保所有提供商的API密钥已正确配置
2. **成本控制**：阿里云百炼模型有成本，注意使用量
3. **网络连接**：确保可以访问所有API端点
4. **兼容性**：注意不同API类型（openai-chat vs openai-completions）的差异

---
*配置更新完成时间：2026-04-12T15:40:00Z*