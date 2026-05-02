# AI编排系统Docker镜像
# 版本: 1.0.0
# 构建日期: 2026-04-14

# 第一阶段: 构建阶段
FROM python:3.11-slim as builder

# 设置工作目录
WORKDIR /app

# 设置环境变量
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# 安装系统依赖
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 复制依赖文件
COPY requirements.txt .
COPY requirements-dev.txt .

# 安装Python依赖
RUN pip install --user --no-cache-dir -r requirements.txt

# 第二阶段: 运行阶段
FROM python:3.11-slim as runner

# 设置工作目录
WORKDIR /app

# 创建非root用户
RUN groupadd -r aiuser && useradd -r -g aiuser aiuser

# 设置环境变量
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PATH=/home/aiuser/.local/bin:$PATH \
    PYTHONPATH=/app/src:$PYTHONPATH \
    ENVIRONMENT=production \
    LOG_LEVEL=INFO \
    PORT=8000 \
    HOST=0.0.0.0

# 安装运行时依赖
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    gnupg \
    wget \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# 安装Node.js (用于一些工具)
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g npm

# 从构建阶段复制已安装的Python包
COPY --from=builder /root/.local /home/aiuser/.local

# 复制应用代码
COPY --chown=aiuser:aiuser . .

# 创建必要的目录
RUN mkdir -p /app/data /app/logs /app/models /app/config \
    && chown -R aiuser:aiuser /app

# 切换到非root用户
USER aiuser

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:${PORT}/health || exit 1

# 暴露端口
EXPOSE ${PORT}

# 启动命令
CMD ["python", "-m", "src.api.server"]