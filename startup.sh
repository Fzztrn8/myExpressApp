#!/bin/bash

# Azure App Service 启动脚本

echo "Starting Node.js application..."

# 检查环境变量
echo "Checking environment variables..."
if [ -z "$AZURE_SQL_USER" ]; then
    echo "WARNING: AZURE_SQL_USER not set"
fi
if [ -z "$AZURE_SQL_PASSWORD" ]; then
    echo "WARNING: AZURE_SQL_PASSWORD not set"
fi
if [ -z "$AZURE_SQL_SERVER" ]; then
    echo "WARNING: AZURE_SQL_SERVER not set"
fi
if [ -z "$AZURE_SQL_DATABASE" ]; then
    echo "WARNING: AZURE_SQL_DATABASE not set"
fi

# 设置默认端口
export PORT=${PORT:-8080}
echo "Using port: $PORT"

# 安装依赖
echo "Installing dependencies..."
npm install --production

# 启动应用
echo "Starting application on port $PORT..."
node ./bin/www 