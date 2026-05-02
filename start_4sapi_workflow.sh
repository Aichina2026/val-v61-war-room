#!/bin/bash

# 4SAPI零错误工作流启动脚本
# 特性：延迟等待、自动重试、错误恢复、连续调用不中断

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 工作目录
WORKSPACE="/root/.openclaw/workspace"
LOG_DIR="$WORKSPACE/4sapi-workflow-logs"
CONFIG_FILE="$WORKSPACE/4sapi_workflow_config.json"
MAIN_SCRIPT="$WORKSPACE/4sapi_zero_error_workflow.js"

# 创建日志目录
mkdir -p "$LOG_DIR"

# 打印带颜色的消息
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查依赖
check_dependencies() {
    log_info "检查依赖..."
    
    # 检查Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js未安装"
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 14 ]; then
        log_error "Node.js版本需要14或更高，当前版本: $NODE_VERSION"
        exit 1
    fi
    
    log_success "Node.js版本: $(node --version)"
    
    # 检查脚本文件
    if [ ! -f "$MAIN_SCRIPT" ]; then
        log_error "主脚本不存在: $MAIN_SCRIPT"
        exit 1
    fi
    
    if [ ! -f "$CONFIG_FILE" ]; then
        log_warning "配置文件不存在，使用默认配置"
    fi
    
    log_success "依赖检查完成"
}

# 显示配置
show_config() {
    log_info "工作流配置:"
    echo "----------------------------------------"
    echo "工作流名称: 4SAPI零错误工作流"
    echo "版本: 1.0.0"
    echo "日志目录: $LOG_DIR"
    echo "配置文件: $CONFIG_FILE"
    echo "主脚本: $MAIN_SCRIPT"
    echo "----------------------------------------"
    
    if [ -f "$CONFIG_FILE" ]; then
        log_info "从配置文件加载的延迟设置:"
        DELAYS=$(grep -A 10 '"delays"' "$CONFIG_FILE" | grep -E '"(initial|betweenRequests|betweenRetries|afterError)"' | sed 's/,$//')
        echo "$DELAYS"
    fi
}

# 测试连接
test_connection() {
    log_info "测试4SAPI连接..."
    
    TEST_SCRIPT="$WORKSPACE/test_4sapi_zero_error.js"
    if [ ! -f "$TEST_SCRIPT" ]; then
        log_warning "测试脚本不存在，跳过连接测试"
        return 0
    fi
    
    if node "$TEST_SCRIPT" connectivity; then
        log_success "4SAPI连接测试成功"
        return 0
    else
        log_error "4SAPI连接测试失败"
        return 1
    fi
}

# 启动监控
start_monitoring() {
    log_info "启动工作流监控..."
    
    # 创建监控日志
    MONITOR_LOG="$LOG_DIR/monitor_$(date +%Y%m%d_%H%M%S).log"
    
    # 启动后台监控进程
    (
        while true; do
            echo "=== 监控检查 $(date) ===" >> "$MONITOR_LOG"
            
            # 检查工作流状态
            if node "$MAIN_SCRIPT" status >> "$MONITOR_LOG" 2>&1; then
                echo "工作流状态正常" >> "$MONITOR_LOG"
            else
                echo "工作流状态检查失败" >> "$MONITOR_LOG"
            fi
            
            # 检查日志文件大小
            LOG_SIZE=$(du -sh "$LOG_DIR" | cut -f1)
            echo "日志目录大小: $LOG_SIZE" >> "$MONITOR_LOG"
            
            # 等待5分钟
            sleep 300
        done
    ) &
    
    MONITOR_PID=$!
    echo "$MONITOR_PID" > "$LOG_DIR/monitor.pid"
    
    log_success "监控已启动 (PID: $MONITOR_PID)"
}

# 停止监控
stop_monitoring() {
    if [ -f "$LOG_DIR/monitor.pid" ]; then
        MONITOR_PID=$(cat "$LOG_DIR/monitor.pid")
        if kill -0 "$MONITOR_PID" 2>/dev/null; then
            kill "$MONITOR_PID"
            rm -f "$LOG_DIR/monitor.pid"
            log_success "监控已停止"
        else
            log_warning "监控进程不存在"
            rm -f "$LOG_DIR/monitor.pid"
        fi
    else
        log_info "没有运行的监控进程"
    fi
}

# 清理日志
cleanup_logs() {
    log_info "清理旧日志..."
    
    # 保留最近7天的日志
    find "$LOG_DIR" -name "*.log" -mtime +7 -delete
    find "$LOG_DIR" -name "workflow_report_*.json" -mtime +7 -delete
    find "$LOG_DIR" -name "4sapi_test_*.json" -mtime +7 -delete
    
    log_success "日志清理完成"
}

# 显示使用帮助
show_help() {
    echo "4SAPI零错误工作流管理脚本"
    echo ""
    echo "使用方法: $0 [命令]"
    echo ""
    echo "命令:"
    echo "  start             启动工作流示例"
    echo "  single [提示]     执行单次调用"
    echo "  custom [JSON]     执行自定义工作流"
    echo "  status            查看工作流状态"
    echo "  monitor-start     启动监控"
    echo "  monitor-stop      停止监控"
    echo "  test              测试连接"
    echo "  cleanup           清理旧日志"
    echo "  reset             重置工作流状态"
    echo "  config            显示配置"
    echo "  help              显示此帮助"
    echo ""
    echo "示例:"
    echo "  $0 start"
    echo "  $0 single '你好，请介绍你自己'"
    echo "  $0 custom '[{\"prompt\":\"测试\",\"model\":\"gpt-5.4\"}]'"
    echo ""
}

# 主函数
main() {
    COMMAND="${1:-help}"
    
    case "$COMMAND" in
        start)
            check_dependencies
            show_config
            test_connection
            log_info "启动示例工作流..."
            node "$MAIN_SCRIPT" run-example
            ;;
            
        single)
            PROMPT="${2:-'你好，请简单介绍一下你自己'}"
            MODEL="${3:-}"
            
            check_dependencies
            test_connection
            
            if [ -z "$MODEL" ]; then
                log_info "执行单次调用: $PROMPT"
                node "$MAIN_SCRIPT" single "$PROMPT"
            else
                log_info "执行单次调用: $PROMPT (模型: $MODEL)"
                node "$MAIN_SCRIPT" single "$PROMPT" "$MODEL"
            fi
            ;;
            
        custom)
            JSON="${2:-'[]'}"
            
            check_dependencies
            test_connection
            log_info "执行自定义工作流..."
            node "$MAIN_SCRIPT" custom "$JSON"
            ;;
            
        status)
            check_dependencies
            node "$MAIN_SCRIPT" status
            ;;
            
        monitor-start)
            check_dependencies
            start_monitoring
            ;;
            
        monitor-stop)
            stop_monitoring
            ;;
            
        test)
            check_dependencies
            test_connection
            ;;
            
        cleanup)
            cleanup_logs
            ;;
            
        reset)
            check_dependencies
            node "$MAIN_SCRIPT" reset
            ;;
            
        config)
            check_dependencies
            show_config
            ;;
            
        help|--help|-h)
            show_help
            ;;
            
        *)
            log_error "未知命令: $COMMAND"
            show_help
            exit 1
            ;;
    esac
}

# 运行主函数
main "$@"