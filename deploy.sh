#!/bin/bash
# AI编排系统部署脚本
# 版本: 1.0.0 | 2026-04-14

set -e  # 遇到错误立即退出

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

# 检查命令是否存在
check_command() {
    if ! command -v $1 &> /dev/null; then
        log_error "$1 未安装，请先安装"
        exit 1
    fi
}

# 显示帮助
show_help() {
    echo "AI编排系统部署脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help          显示帮助信息"
    echo "  -e, --env ENV       部署环境 (dev|staging|prod) [默认: dev]"
    echo "  -t, --tag TAG       镜像标签 [默认: latest]"
    echo "  -c, --config FILE   配置文件路径"
    echo "  -d, --dry-run       干运行，不实际执行"
    echo "  -f, --force         强制部署，跳过检查"
    echo ""
    echo "示例:"
    echo "  $0 -e prod -t v1.0.0"
    echo "  $0 --env staging --tag test-2026-04-14"
}

# 默认参数
ENVIRONMENT="dev"
IMAGE_TAG="latest"
CONFIG_FILE=""
DRY_RUN=false
FORCE=false

# 解析参数
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -e|--env)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -t|--tag)
            IMAGE_TAG="$2"
            shift 2
            ;;
        -c|--config)
            CONFIG_FILE="$2"
            shift 2
            ;;
        -d|--dry-run)
            DRY_RUN=true
            shift
            ;;
        -f|--force)
            FORCE=true
            shift
            ;;
        *)
            log_error "未知参数: $1"
            show_help
            exit 1
            ;;
    esac
done

# 环境配置
case $ENVIRONMENT in
    dev)
        NAMESPACE="ai-orchestrator-dev"
        REGISTRY="registry.dev.ai-system.com"
        REPLICAS=1
        ;;
    staging)
        NAMESPACE="ai-orchestrator-staging"
        REGISTRY="registry.staging.ai-system.com"
        REPLICAS=2
        ;;
    prod)
        NAMESPACE="ai-orchestrator"
        REGISTRY="registry.ai-system.com"
        REPLICAS=3
        ;;
    *)
        log_error "未知环境: $ENVIRONMENT"
        exit 1
        ;;
esac

# 配置文件
if [ -z "$CONFIG_FILE" ]; then
    CONFIG_FILE="config/${ENVIRONMENT}.yaml"
fi

# 检查必需命令
check_command docker
check_command kubectl
check_command helm

# 显示部署信息
log_info "开始部署 AI 编排系统"
log_info "环境: $ENVIRONMENT"
log_info "命名空间: $NAMESPACE"
log_info "镜像标签: $IMAGE_TAG"
log_info "配置文件: $CONFIG_FILE"
log_info "副本数: $REPLICAS"

if [ "$DRY_RUN" = true ]; then
    log_warning "干运行模式，不实际执行"
fi

# 函数：检查命名空间
check_namespace() {
    log_info "检查命名空间..."
    if ! kubectl get namespace "$NAMESPACE" &> /dev/null; then
        log_warning "命名空间 $NAMESPACE 不存在，正在创建..."
        if [ "$DRY_RUN" = false ]; then
            kubectl create namespace "$NAMESPACE"
            log_success "命名空间创建成功"
        else
            log_info "干运行: kubectl create namespace $NAMESPACE"
        fi
    else
        log_success "命名空间已存在"
    fi
}

# 函数：检查配置
check_config() {
    log_info "检查配置文件..."
    if [ ! -f "$CONFIG_FILE" ]; then
        log_error "配置文件不存在: $CONFIG_FILE"
        exit 1
    fi
    
    # 验证配置文件
    if ! yq eval '.' "$CONFIG_FILE" &> /dev/null; then
        log_error "配置文件格式错误: $CONFIG_FILE"
        exit 1
    fi
    
    log_success "配置文件验证通过"
}

# 函数：构建镜像
build_image() {
    log_info "构建 Docker 镜像..."
    
    if [ "$DRY_RUN" = false ]; then
        docker build -t "$REGISTRY/ai-orchestrator:$IMAGE_TAG" .
        
        if [ $? -eq 0 ]; then
            log_success "镜像构建成功"
        else
            log_error "镜像构建失败"
            exit 1
        fi
    else
        log_info "干运行: docker build -t $REGISTRY/ai-orchestrator:$IMAGE_TAG ."
    fi
}

# 函数：推送镜像
push_image() {
    log_info "推送镜像到仓库..."
    
    if [ "$DRY_RUN" = false ]; then
        docker push "$REGISTRY/ai-orchestrator:$IMAGE_TAG"
        
        if [ $? -eq 0 ]; then
            log_success "镜像推送成功"
        else
            log_error "镜像推送失败"
            exit 1
        fi
    else
        log_info "干运行: docker push $REGISTRY/ai-orchestrator:$IMAGE_TAG"
    fi
}

# 函数：更新配置
update_config() {
    log_info "更新部署配置..."
    
    # 创建临时配置文件
    TEMP_CONFIG="deploy/temp-${ENVIRONMENT}.yaml"
    mkdir -p deploy
    
    # 替换镜像标签
    sed "s|{{IMAGE_TAG}}|$IMAGE_TAG|g" "k8s/deployment.yaml" > "$TEMP_CONFIG"
    sed -i "s|{{REPLICAS}}|$REPLICAS|g" "$TEMP_CONFIG"
    sed -i "s|{{REGISTRY}}|$REGISTRY|g" "$TEMP_CONFIG"
    
    log_success "配置更新完成: $TEMP_CONFIG"
}

# 函数：应用配置
apply_config() {
    log_info "应用 Kubernetes 配置..."
    
    if [ "$DRY_RUN" = false ]; then
        # 应用配置
        kubectl apply -f "$TEMP_CONFIG" --namespace="$NAMESPACE"
        
        if [ $? -eq 0 ]; then
            log_success "配置应用成功"
        else
            log_error "配置应用失败"
            exit 1
        fi
    else
        log_info "干运行: kubectl apply -f $TEMP_CONFIG --namespace=$NAMESPACE"
    fi
}

# 函数：等待部署就绪
wait_for_deployment() {
    log_info "等待部署就绪..."
    
    if [ "$DRY_RUN" = false ]; then
        DEPLOYMENT_NAME="ai-orchestrator"
        TIMEOUT=300  # 5分钟
        INTERVAL=10
        
        for ((i=0; i<TIMEOUT/INTERVAL; i++)); do
            READY=$(kubectl get deployment "$DEPLOYMENT_NAME" -n "$NAMESPACE" -o jsonpath='{.status.readyReplicas}')
            DESIRED=$(kubectl get deployment "$DEPLOYMENT_NAME" -n "$NAMESPACE" -o jsonpath='{.status.replicas}')
            
            if [ "$READY" = "$DESIRED" ] && [ "$READY" -ge 1 ]; then
                log_success "部署就绪: $READY/$DESIRED 个Pod运行中"
                return 0
            fi
            
            log_info "等待中... ($((i*INTERVAL))秒/$TIMEOUT秒)"
            sleep $INTERVAL
        done
        
        log_error "部署超时，请检查Pod状态"
        kubectl get pods -n "$NAMESPACE"
        exit 1
    else
        log_info "干运行: 跳过等待部署就绪"
    fi
}

# 函数：运行健康检查
run_health_check() {
    log_info "运行健康检查..."
    
    if [ "$DRY_RUN" = false ]; then
        # 获取服务地址
        SERVICE_NAME="ai-orchestrator"
        PORT=8000
        
        # 等待服务就绪
        kubectl wait --for=condition=ready pod -l app=ai-orchestrator -n "$NAMESPACE" --timeout=60s
        
        # 创建端口转发
        kubectl port-forward "service/$SERVICE_NAME" "$PORT:$PORT" -n "$NAMESPACE" &
        PF_PID=$!
        sleep 5
        
        # 运行健康检查
        if curl -f "http://localhost:$PORT/health" &> /dev/null; then
            log_success "健康检查通过"
        else
            log_error "健康检查失败"
            kill $PF_PID 2>/dev/null
            exit 1
        fi
        
        # 停止端口转发
        kill $PF_PID 2>/dev/null
    else
        log_info "干运行: 跳过健康检查"
    fi
}

# 函数：显示部署状态
show_deployment_status() {
    log_info "显示部署状态..."
    
    if [ "$DRY_RUN" = false ]; then
        echo ""
        echo "="*60
        echo "部署状态"
        echo "="*60
        
        # Pod状态
        echo "Pod状态:"
        kubectl get pods -n "$NAMESPACE" -l app=ai-orchestrator
        
        echo ""
        
        # 服务状态
        echo "服务状态:"
        kubectl get services -n "$NAMESPACE" -l app=ai-orchestrator
        
        echo ""
        
        # 部署状态
        echo "部署状态:"
        kubectl get deployments -n "$NAMESPACE" -l app=ai-orchestrator
        
        echo ""
        
        # 事件
        echo "最近事件:"
        kubectl get events -n "$NAMESPACE" --sort-by='.lastTimestamp' | tail -10
        
        echo "="*60
    else
        log_info "干运行: 跳过状态显示"
    fi
}

# 函数：清理临时文件
cleanup() {
    log_info "清理临时文件..."
    
    if [ -f "$TEMP_CONFIG" ]; then
        rm -f "$TEMP_CONFIG"
        log_success "临时文件已清理"
    fi
}

# 主部署流程
main() {
    log_info "开始部署流程..."
    
    # 1. 检查命名空间
    check_namespace
    
    # 2. 检查配置
    check_config
    
    # 3. 构建镜像
    build_image
    
    # 4. 推送镜像
    push_image
    
    # 5. 更新配置
    update_config
    
    # 6. 应用配置
    apply_config
    
    # 7. 等待部署就绪
    wait_for_deployment
    
    # 8. 运行健康检查
    run_health_check
    
    # 9. 显示部署状态
    show_deployment_status
    
    # 10. 清理
    cleanup
    
    log_success "AI编排系统部署完成!"
    log_info "环境: $ENVIRONMENT"
    log_info "命名空间: $NAMESPACE"
    log_info "访问地址: http://ai-orchestrator.$NAMESPACE.svc.cluster.local:8000"
    
    if [ "$ENVIRONMENT" = "prod" ]; then
        log_warning "生产环境部署完成，请确保监控和告警已配置"
    fi
}

# 执行主函数
trap cleanup EXIT
main