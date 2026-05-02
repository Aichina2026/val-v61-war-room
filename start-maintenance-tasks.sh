#!/bin/bash
#
# 4AI系统维护任务启动脚本
# 用于启动和管理定时维护任务
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OPENCLAW_DIR="/root/.openclaw"
CONFIG_FILE="${OPENCLAW_DIR}/cron/jobs.json"
LOG_DIR="${OPENCLAW_DIR}/logs/maintenance"
REPORT_DIR="${OPENCLAW_DIR}/workspace/maintenance-reports"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
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
    log_info "检查系统依赖..."
    
    local missing=0
    
    # 检查Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装"
        missing=1
    else
        log_success "Node.js: $(node --version)"
    fi
    
    # 检查npm
    if ! command -v npm &> /dev/null; then
        log_warning "npm 未安装"
    else
        log_success "npm: $(npm --version)"
    fi
    
    # 检查Git
    if ! command -v git &> /dev/null; then
        log_warning "Git 未安装"
    else
        log_success "Git: $(git --version)"
    fi
    
    # 检查curl
    if ! command -v curl &> /dev/null; then
        log_error "curl 未安装"
        missing=1
    else
        log_success "curl: 已安装"
    fi
    
    # 检查cron服务
    if ! systemctl is-active --quiet cron 2>/dev/null && ! systemctl is-active --quiet crond 2>/dev/null; then
        log_warning "cron服务未运行"
    else
        log_success "cron服务: 运行中"
    fi
    
    if [ $missing -eq 1 ]; then
        log_error "缺少必要的依赖，请先安装"
        exit 1
    fi
    
    return 0
}

# 初始化目录
init_directories() {
    log_info "初始化目录结构..."
    
    mkdir -p "$LOG_DIR"
    mkdir -p "$REPORT_DIR"
    mkdir -p "${OPENCLAW_DIR}/backups"
    
    log_success "目录结构初始化完成"
}

# 检查配置文件
check_config() {
    log_info "检查配置文件..."
    
    if [ ! -f "$CONFIG_FILE" ]; then
        log_error "配置文件不存在: $CONFIG_FILE"
        return 1
    fi
    
    # 验证JSON格式
    if ! python3 -m json.tool "$CONFIG_FILE" > /dev/null 2>&1; then
        log_error "配置文件格式错误"
        return 1
    fi
    
    local job_count=$(jq '.jobs | length' "$CONFIG_FILE" 2>/dev/null || echo "0")
    log_success "配置文件有效，找到 $job_count 个任务"
    
    return 0
}

# 显示任务列表
list_tasks() {
    log_info "定时维护任务列表:"
    echo ""
    
    if [ -f "$CONFIG_FILE" ]; then
        jq -r '.jobs[] | "\(.id) - \(.name)\n   描述: \(.description)\n   计划: \(.schedule)\n   状态: \(if .enabled then "启用" else "禁用" end)\n   下次运行: \(.next_run // "未设置")\n"' "$CONFIG_FILE" 2>/dev/null || \
        echo "   无法解析任务列表，请检查配置文件格式"
    else
        log_error "配置文件不存在"
    fi
}

# 测试单个任务
test_task() {
    local task_id="$1"
    
    log_info "测试任务: $task_id"
    
    if [ ! -f "$CONFIG_FILE" ]; then
        log_error "配置文件不存在"
        return 1
    fi
    
    local command=$(jq -r ".jobs[] | select(.id == \"$task_id\") | .command" "$CONFIG_FILE" 2>/dev/null)
    
    if [ -z "$command" ] || [ "$command" = "null" ]; then
        log_error "未找到任务: $task_id"
        return 1
    fi
    
    log_info "执行命令: $command"
    
    # 创建测试日志文件
    local test_log="${LOG_DIR}/test-${task_id}-$(date +%Y%m%d-%H%M%S).log"
    
    # 执行命令（带超时）
    timeout 60 bash -c "$command" > "$test_log" 2>&1
    
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        log_success "任务测试成功"
        echo "输出:"
        cat "$test_log"
    elif [ $exit_code -eq 124 ]; then
        log_warning "任务超时（60秒）"
        echo "部分输出:"
        head -50 "$test_log"
    else
        log_error "任务测试失败 (退出码: $exit_code)"
        echo "错误输出:"
        cat "$test_log"
    fi
    
    return $exit_code
}

# 运行健康检查
run_health_check() {
    log_info "运行系统健康检查..."
    
    local health_check_script="${SCRIPT_DIR}/health-check.js"
    
    if [ ! -f "$health_check_script" ]; then
        log_error "健康检查脚本不存在: $health_check_script"
        return 1
    fi
    
    node "$health_check_script" --full
    
    return $?
}

# 运行备份
run_backup() {
    log_info "运行系统备份..."
    
    local backup_script="${SCRIPT_DIR}/backup-system.js"
    
    if [ ! -f "$backup_script" ]; then
        log_error "备份脚本不存在: $backup_script"
        return 1
    fi
    
    node "$backup_script" --full
    
    return $?
}

# 安装cron任务
install_cron_jobs() {
    log_info "安装cron任务..."
    
    if [ ! -f "$CONFIG_FILE" ]; then
        log_error "配置文件不存在"
        return 1
    fi
    
    # 创建临时cron文件
    local temp_cron="/tmp/openclaw-maintenance-$(date +%s).cron"
    
    # 添加环境变量
    echo "# OpenClaw 4AI Maintenance Tasks" > "$temp_cron"
    echo "# Generated: $(date)" >> "$temp_cron"
    echo "# DO NOT EDIT MANUALLY" >> "$temp_cron"
    echo "" >> "$temp_cron"
    echo "PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin" >> "$temp_cron"
    echo "HOME=/root" >> "$temp_cron"
    echo "OPENCLAW_DIR=/root/.openclaw" >> "$temp_cron"
    echo "" >> "$temp_cron"
    
    # 提取启用的任务
    jq -r '.jobs[] | select(.enabled == true) | "\(.schedule) cd /root && \(.command) >> \(env.LOG_DIR)/\(.id)-$(date +\\%Y\\%m\\%d).log 2>&1"' "$CONFIG_FILE" >> "$temp_cron" 2>/dev/null
    
    if [ $? -ne 0 ]; then
        log_error "生成cron任务失败"
        rm -f "$temp_cron"
        return 1
    fi
    
    # 显示生成的cron任务
    log_info "生成的cron任务:"
    echo ""
    cat "$temp_cron"
    echo ""
    
    # 询问是否安装
    read -p "是否安装这些cron任务？ (y/N): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # 备份现有cron
        local backup_file="/tmp/crontab-backup-$(date +%Y%m%d-%H%M%S).bak"
        crontab -l > "$backup_file" 2>/dev/null || true
        
        # 安装新cron
        crontab "$temp_cron"
        
        if [ $? -eq 0 ]; then
            log_success "cron任务安装成功"
            log_info "旧cron已备份到: $backup_file"
        else
            log_error "cron任务安装失败"
            # 恢复备份
            if [ -s "$backup_file" ]; then
                crontab "$backup_file"
                log_info "已恢复旧cron配置"
            fi
            rm -f "$temp_cron" "$backup_file"
            return 1
        fi
    else
        log_info "取消安装"
    fi
    
    rm -f "$temp_cron"
    return 0
}

# 显示系统状态
show_status() {
    log_info "系统状态概览"
    echo ""
    
    # 内存使用
    echo "内存使用:"
    free -h | grep -E "^Mem:" | awk '{print "  总量: "$2, "已用: "$3, "可用: "$4, "使用率: "$3/$2*100"%"}'
    echo ""
    
    # 磁盘使用
    echo "磁盘使用:"
    df -h / | tail -1 | awk '{print "  总量: "$2, "已用: "$3, "可用: "$4, "使用率: "$5}'
    echo ""
    
    # 进程状态
    echo "OpenClaw进程:"
    if pgrep -f "openclaw-gateway" > /dev/null; then
        echo "  ✅ openclaw-gateway: 运行中"
    else
        echo "  ❌ openclaw-gateway: 未运行"
    fi
    
    if pgrep -f "AgentEventLoop.js" > /dev/null; then
        echo "  ✅ 4AI事件循环: 运行中"
    else
        echo "  ❌ 4AI事件循环: 未运行"
    fi
    echo ""
    
    # 网络连通性
    echo "网络连通性:"
    if curl -s -I https://api.github.com > /dev/null; then
        echo "  ✅ GitHub API: 可访问"
    else
        echo "  ❌ GitHub API: 不可访问"
    fi
    echo ""
}

# 显示帮助
show_help() {
    cat << EOF
4AI系统维护任务管理工具

用法: $0 [命令]

命令:
  check         检查系统和依赖
  init          初始化目录结构
  list          列出所有维护任务
  test <id>     测试指定任务
  health        运行健康检查
  backup        运行系统备份
  install       安装cron定时任务
  status        显示系统状态
  help          显示此帮助信息

示例:
  $0 check
  $0 init
  $0 list
  $0 test health_check_daily
  $0 health
  $0 install

EOF
}

# 主函数
main() {
    local command="$1"
    local arg="$2"
    
    case "$command" in
        "check")
            check_dependencies
            check_config
            ;;
        "init")
            init_directories
            ;;
        "list")
            list_tasks
            ;;
        "test")
            if [ -z "$arg" ]; then
                log_error "请指定任务ID"
                show_help
                exit 1
            fi
            test_task "$arg"
            ;;
        "health")
            run_health_check
            ;;
        "backup")
            run_backup
            ;;
        "install")
            check_dependencies
            init_directories
            check_config
            install_cron_jobs
            ;;
        "status")
            show_status
            ;;
        "help"|"--help"|"-h"|"")
            show_help
            ;;
        *)
            log_error "未知命令: $command"
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"