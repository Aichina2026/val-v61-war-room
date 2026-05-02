# TOOLS.md - 全局技能调度与执行手册

## ⚠️ 绝对执行准则 (CRITICAL EXECUTION RULES)
你拥有一个原生的 `exec` 工具（用于执行终端命令）。
当用户要求你调用以下任何高级 AI 技能时，**你绝对不能只在文本中回复命令，你必须、也只能通过调用原生的 `exec` 工具，将对应的命令作为 `command` 参数传入并真实执行它！** 执行后，将终端返回的真实结果总结给用户。

---

## 🎯 重点核心技能库 (Core Skills)

### ⭐ 技能 1: 零错误自治系统 (Zero Error Auto-Agent)
- **触发条件**: 当用户要求“极度严谨”、“0错误”、“生产级完美方案”、“高并发防漏洞”时。
- **强制动作**: 立即调用你的 `exec` 工具，执行以下命令：
  `node /root/.openclaw/workspace/zero_error_system.cjs "[将用户的具体需求写在这里]"`

### ⭐ 技能 2: 多AI并行流体系统 (Deep Parallel AI Fluid)
- **触发条件**: 当用户要求设计复杂系统（如数学几何时空金融系统）、高标准代码、深度分析或多AI交叉验证时。
- **强制动作**: 立即调用你的 `exec` 工具，执行以下命令：
  `node /root/.openclaw/workspace/deep_parallel_skill.js "[将用户的具体需求写在这里]"`

### ⭐ 技能 3: AI 自愈修复引擎 (Auto-Fixer)
- **触发条件**: 当某个 .js 或 .cjs 脚本运行报错，或者用户要求修复脚本BUG时。
- **强制动作**: 立即调用你的 `exec` 工具，执行以下命令：
  `node /root/.openclaw/workspace/auto_fixer.cjs "[报错的文件绝对路径]"`

## 🆕 新统一架构 (New Unified Architecture)

### ⭐ 统一AI管理器 (Unified AI Manager)
- **触发条件**: 当需要统一管理所有AI技能时
- **强制动作**: 立即调用你的 `exec` 工具，执行以下命令：
  `node /root/.openclaw/workspace/unified_ai_manager.cjs list`

### ⭐ 分级AI系统 (Hierarchical AI System)
- **触发条件**: 当需要根据任务复杂度自动选择处理级别时
- **强制动作**: 立即调用你的 `exec` 工具，执行以下命令：
  `node /root/.openclaw/workspace/hierarchical_ai_system.cjs "任务" --auto`

### ⭐ 微智能体管理器 (Micro Agent Manager)
- **触发条件**: 当需要模块化AI协作时
- **强制动作**: 立即调用你的 `exec` 工具，执行以下命令：
  `node /root/.openclaw/workspace/micro_agent_manager.cjs auto "任务"`

## 📋 统一执行准则 (Unified Execution Rules)

1. **所有AI调用必须通过 `ai_core.cjs`**
2. **不再创建独立的CONFIG或axios配置**
3. **优先使用新系统（分级系统、微智能体）**
4. **旧技能已修复，保持向后兼容**

## 🔧 已修复的技能

✅ `deep_parallel_skill.cjs` - 统一从ai_core.cjs导入
✅ `zero_error_system.cjs` - 统一从ai_core.cjs导入  
✅ `parallel_4ai_system.js` - 统一从ai_core.cjs导入
✅ `hierarchical_ai_system.cjs` - 新建分级系统
✅ `micro_agent_manager.cjs` - 新建微智能体系统
✅ `unified_ai_manager.cjs` - 新建统一管理器

---
**系统统一完成时间：2026-03-19 10:52 GMT+8**
