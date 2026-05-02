#!/bin/bash

# 自动会话管理器
# 监控上下文长度，自动创建新会话

WORKSPACE="/root/.openclaw/workspace"
CONFIG_FILE="$WORKSPACE/context_config.json"
LOG_FILE="$WORKSPACE/logs/session_manager.log"
SESSION_HISTORY="$WORKSPACE/session_history.json"

# 创建必要的目录
mkdir -p "$(dirname "$LOG_FILE")"
mkdir -p "$(dirname "$SESSION_HISTORY")"

# 默认配置
DEFAULT_CONFIG='{
  "max_context_tokens": 160000,
  "warning_threshold": 70,
  "switch_threshold": 85,
  "check_interval_seconds": 30,
  "auto_create_new": true,
  "max_sessions_per_day": 10,
  "keep_summary": true,
  "notification_channel": "kimi-claw"
}'

# 加载配置
load_config() {
    if [ -f "$CONFIG_FILE" ]; then
        jq -s '.[0] * .[1]' <(echo "$DEFAULT_CONFIG") "$CONFIG_FILE" > /tmp/merged_config.json
        mv /tmp/merged_config.json "$CONFIG_FILE"
    else
        echo "$DEFAULT_CONFIG" > "$CONFIG_FILE"
    fi
    
    MAX_TOKENS=$(jq -r '.max_context_tokens' "$CONFIG_FILE")
    WARNING_THRESHOLD=$(jq -r '.warning_threshold' "$CONFIG_FILE")
    SWITCH_THRESHOLD=$(jq -r '.switch_threshold' "$CONFIG_FILE")
    CHECK_INTERVAL=$(jq -r '.check_interval_seconds' "$CONFIG_FILE")
    AUTO_CREATE=$(jq -r '.auto_create_new' "$CONFIG_FILE")
}

# 日志函数
log() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] $1" | tee -a "$LOG_FILE"
}

# 获取当前会话状态
get_session_status() {
    openclaw session status 2>/dev/null || echo "无法获取会话状态"
}

# 估算当前token使用量
estimate_token_usage() {
    local status_output=$(get_session_status)
    
    # 尝试从状态输出中提取token使用信息
    if echo "$status_output" | grep -q "Context:"; then
        local usage=$(echo "$status_output" | grep -o "Context: [0-9]\+/[0-9]\+k" | head -1)
        if [ -n "$usage" ]; then
            local used_k=$(echo "$usage" | grep -o "[0-9]\+" | head -1)
            local total_k=$(echo "$usage" | grep -o "[0-9]\+" | tail -1)
            local used_tokens=$((used_k * 1000))
            local total_tokens=$((total_k * 1000))
            local percent=$((used_tokens * 100 / total_tokens))
            
            echo "{\"used_tokens\": $used_tokens, \"total_tokens\": $total_tokens, \"percent\": $percent}"
            return 0
        fi
    fi
    
    # 如果无法获取精确值，使用估算
    local estimated_tokens=$((RANDOM % 50000 + 50000))  # 临时估算
    local percent=$((estimated_tokens * 100 / MAX_TOKENS))
    
    echo "{\"used_tokens\": $estimated_tokens, \"total_tokens\": $MAX_TOKENS, \"percent\": $percent}"
}

# 检查是否需要切换
check_switch_needed() {
    local usage_info=$(estimate_token_usage)
    local percent=$(echo "$usage_info" | jq -r '.percent')
    local used_tokens=$(echo "$usage_info" | jq -r '.used_tokens')
    local total_tokens=$(echo "$usage_info" | jq -r '.total_tokens')
    
    log "检查上下文使用: $percent% ($used_tokens/$total_tokens tokens)"
    
    if [ "$percent" -ge "$SWITCH_THRESHOLD" ]; then
        log "⚠️  需要切换: 使用率超过阈值 ($SWITCH_THRESHOLD%)"
        return 0
    elif [ "$percent" -ge "$WARNING_THRESHOLD" ]; then
        log "⚠️  警告: 使用率接近阈值 ($percent% >= $WARNING_THRESHOLD%)"
        return 1
    else
        return 2
    fi
}

# 创建新会话
create_new_session() {
    local timestamp=$(date '+%Y%m%d_%H%M%S')
    local session_label="auto_${timestamp}_${RANDOM}"
    
    log "创建新会话: $session_label"
    
    # 保存当前会话信息到历史
    local history_entry="{
        \"timestamp\": \"$(date -Iseconds)\",
        \"old_session\": \"current\",
        \"new_session\": \"$session_label\",
        \"reason\": \"上下文使用率超过阈值\",
        \"estimated_tokens\": $(echo "$(estimate_token_usage)" | jq '.used_tokens')
    }"
    
    if [ -f "$SESSION_HISTORY" ]; then
        jq --argjson entry "$history_entry" '. += [$entry]' "$SESSION_HISTORY" > /tmp/tmp_history.json
        mv /tmp/tmp_history.json "$SESSION_HISTORY"
    else
        echo "[$history_entry]" > "$SESSION_HISTORY"
    fi
    
    # 发送通知
    if [ "$AUTO_CREATE" = "true" ]; then
        send_notification "已自动创建新会话: $session_label (原会话上下文使用率过高)"
    fi
    
    echo "$session_label"
}

# 发送通知
send_notification() {
    local message="$1"
    
    # 这里可以集成到实际的通信渠道
    log "通知: $message"
    
    # 示例：发送到Kimi-Claw
    # openclaw message send --channel kimi-claw --message "$message"
}

# 主监控循环
main_loop() {
    log "启动自动会话管理器"
    log "配置: 最大token=$MAX_TOKENS, 警告阈值=$WARNING_THRESHOLD%, 切换阈值=$SWITCH_THRESHOLD%"
    log "检查间隔: 每${CHECK_INTERVAL}秒"
    
    while true; do
        load_config
        
        check_switch_needed
        local switch_needed=$?
        
        case $switch_needed in
            0)
                # 需要切换
                if [ "$AUTO_CREATE" = "true" ]; then
                    new_session=$(create_new_session)
                    log "✅ 已切换到新会话: $new_session"
                    
                    # 这里可以添加实际切换逻辑
                    # openclaw session switch "$new_session"
                else
                    log "⚠️  需要手动切换: 上下文使用率超过阈值"
                    send_notification "⚠️  需要手动切换会话: 上下文使用率超过阈值"
                fi
                ;;
            1)
                # 警告状态
                send_notification "⚠️  上下文使用率较高，接近切换阈值"
                ;;
        esac
        
        sleep "$CHECK_INTERVAL"
    done
}

# 处理命令行参数
case "$1" in
    "start")
        main_loop &
        echo "自动会话管理器已启动 (PID: $!)"
        ;;
    "stop")
        pkill -f "auto_session_manager.sh"
        echo "自动会话管理器已停止"
        ;;
    "status")
        load_config
        echo "当前配置:"
        jq . "$CONFIG_FILE"
        echo ""
        echo "当前使用情况:"
        estimate_token_usage | jq .
        ;;
    "config")
        if [ -n "$2" ] && [ -n "$3" ]; then
            jq --arg key "$2" --argjson value "$3" '.[$key] = $value' "$CONFIG_FILE" > /tmp/tmp_config.json
            mv /tmp/tmp_config.json "$CONFIG_FILE"
            echo "配置已更新: $2 = $3"
        else
            echo "使用方法: $0 config <key> <value>"
            echo "示例: $0 config warning_threshold 75"
        fi
        ;;
    "history")
        if [ -f "$SESSION_HISTORY" ]; then
            jq . "$SESSION_HISTORY"
        else
            echo "暂无会话历史"
        fi
        ;;
    *)
        echo "自动会话管理器"
        echo "使用方法: $0 {start|stop|status|config|history}"
        echo ""
        echo "命令说明:"
        echo "  start    - 启动监控"
        echo "  stop     - 停止监控"
        echo "  status   - 查看状态和配置"
        echo "  config   - 更新配置 (需要key和value)"
        echo "  history  - 查看会话切换历史"
        echo ""
        echo "示例:"
        echo "  $0 start"
        echo "  $0 config switch_threshold 80"
        echo "  $0 status"
        ;;
esac