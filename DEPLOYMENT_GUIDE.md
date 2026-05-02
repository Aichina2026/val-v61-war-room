# VAL Pro 网站修复部署指南

## 问题描述
原始网址 `http://118.196.114.22:3210/pro_index.html` 无法访问，端口3210无服务运行。

## 解决方案
1. 在端口3210启动Web服务
2. 提供 `pro_index.html` 文件
3. 配置环境变量
4. 集成现有服务（端口3000和8000）

## 文件说明
- `val_pro_index.html` - 主HTML文件
- `val_pro_env.sh` - 环境变量配置
- `start_val_pro.sh` - 服务启动脚本
- `val_pro_nginx.conf` - Nginx配置示例
- `val_pro_server.py` - Python HTTP服务器

## 快速部署

### 方法1: 使用Python服务器（推荐）
```bash
# 1. 上传文件到服务器
scp val_pro_* user@118.196.114.22:/opt/val_pro/

# 2. 登录服务器
ssh user@118.196.114.22

# 3. 进入目录
cd /opt/val_pro

# 4. 设置权限
chmod +x *.sh

# 5. 加载环境变量
source val_pro_env.sh

# 6. 启动服务
./start_val_pro.sh 3210

# 7. 检查服务
curl http://localhost:3210/pro_index.html
curl http://localhost:3210/health
curl http://localhost:3210/env
```

### 方法2: 使用Nginx
```bash
# 1. 复制配置文件
sudo cp val_pro_nginx.conf /etc/nginx/sites-available/val_pro
sudo ln -s /etc/nginx/sites-available/val_pro /etc/nginx/sites-enabled/

# 2. 创建网站目录
sudo mkdir -p /var/www/val_pro
sudo cp val_pro_index.html /var/www/val_pro/pro_index.html

# 3. 测试配置
sudo nginx -t

# 4. 重启Nginx
sudo systemctl restart nginx

# 5. 检查服务
curl http://118.196.114.22:3210/pro_index.html
```

### 方法3: 使用Docker
```bash
# 创建Dockerfile
cat > Dockerfile << DOCKEREOF
FROM nginx:alpine
COPY val_pro_index.html /usr/share/nginx/html/pro_index.html
COPY val_pro_env.sh /etc/val_pro/env.sh
EXPOSE 3210
CMD ["nginx", "-g", "daemon off;"]
DOCKEREOF

# 构建镜像
docker build -t val-pro-site .

# 运行容器
docker run -d \
  -p 3210:80 \
  --name val-pro \
  --env-file val_pro_env.sh \
  val-pro-site
```

## 环境变量
关键环境变量已配置在 `val_pro_env.sh` 中：
- `VAL_API_BASE_URL` - API服务地址
- `VAL_DASHBOARD_URL` - 控制台地址
- `VAL_SITE_URL` - 当前网站地址
- `VAL_AI_MODEL` - 默认AI模型
- 其他配置参数

## 验证
1. 访问 `http://118.196.114.22:3210/pro_index.html`
2. 检查环境变量端点 `http://118.196.114.22:3210/env`
3. 检查健康状态 `http://118.196.114.22:3210/health`
4. 检查服务集成 `http://118.196.114.22:3210/api/services`

## 监控
- 服务日志: 查看Python服务器或Nginx日志
- 健康检查: 定期访问 `/health` 端点
- 性能监控: 使用配置的监控端口（如9090）

## 故障排除
1. **端口被占用**: 检查端口3210是否被其他服务使用
2. **权限问题**: 确保Web服务器有文件读取权限
3. **防火墙**: 检查防火墙是否允许端口3210
4. **服务依赖**: 确保端口3000和8000的服务正常运行

## 更新
1. 更新HTML文件: 替换 `val_pro_index.html`
2. 更新环境变量: 编辑 `val_pro_env.sh`
3. 重启服务: 停止并重新启动服务
```

echo "   ✓ 部署指南已创建: $DEPLOY_GUIDE"

echo ""
echo "========================================="
echo "部署准备完成！"
echo "========================================="
echo ""
echo "已创建以下文件："
echo "1. $HTML_FILE        - 网站HTML文件"
echo "2. $ENV_CONFIG_FILE  - 环境变量配置"
echo "3. $START_SCRIPT     - 服务启动脚本"
echo "4. $NGINX_CONFIG     - Nginx配置示例"
echo "5. $DEPLOY_GUIDE     - 部署指南"
echo ""
echo "下一步："
echo "1. 将文件上传到服务器 118.196.114.22"
echo "2. 按照部署指南进行操作"
echo "3. 启动服务在端口3210"
echo "4. 验证访问 http://118.196.114.22:3210/pro_index.html"
echo ""
echo "环境变量已配置："
for env_var in "${ENV_VARS[@]}"; do
    echo "  $env_var"
done
