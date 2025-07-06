# Azure App Service 部署故障排除指南

## 常见错误及解决方案

### 1. 容器启动失败错误
```
ERROR - Container harmonyservise_2_8af78031 for site harmonyservise has exited, failing site start
ERROR - Container harmonyservise_2_8af78031 didn't respond to HTTP pings on port: 8080
```

#### 解决方案：
1. **检查端口配置**
   - 确保应用监听正确的端口（8080）
   - 检查 `bin/www` 文件中的端口设置

2. **检查环境变量**
   - 在Azure App Service中配置必要的环境变量
   - 即使没有数据库连接，应用也应该能启动

3. **查看详细日志**
   ```bash
   # 在Azure门户中查看日志流
   # 或使用Azure CLI
   az webapp log tail --name your-app-name --resource-group your-resource-group
   ```

### 2. 应用启动失败

#### 可能原因：
- 依赖包安装失败
- 代码语法错误
- 环境变量配置错误

#### 解决方案：
1. **检查package.json**
   - 确保所有依赖都正确列出
   - 检查Node.js版本兼容性

2. **本地测试**
   ```bash
   npm install
   npm start
   ```

3. **检查Azure App Service配置**
   - Node.js版本设置
   - 启动命令设置

### 3. 数据库连接问题

#### 症状：
- API返回500错误
- 日志显示数据库连接失败

#### 解决方案：
1. **检查环境变量**
   ```
   AZURE_SQL_USER=your_username
   AZURE_SQL_PASSWORD=your_password
   AZURE_SQL_SERVER=your-server.database.windows.net
   AZURE_SQL_DATABASE=your_database_name
   ```

2. **检查数据库防火墙**
   - 允许Azure服务访问
   - 添加App Service IP到防火墙规则

3. **验证数据库连接**
   - 使用Azure Data Studio测试连接
   - 确认数据库表已创建

## 部署检查清单

### 部署前：
- [ ] 本地测试通过
- [ ] 所有依赖已安装
- [ ] 端口配置正确（8080）
- [ ] 环境变量准备就绪

### 部署后：
- [ ] 检查应用状态
- [ ] 查看启动日志
- [ ] 测试健康检查端点 `/health`
- [ ] 验证API功能

## 调试步骤

### 1. 查看应用日志
```bash
# Azure CLI
az webapp log tail --name your-app-name --resource-group your-resource-group

# 或下载日志文件
az webapp log download --name your-app-name --resource-group your-resource-group
```

### 2. 测试健康检查
访问：`https://your-app-name.azurewebsites.net/health`

应该返回：
```json
{
  "status": "OK",
  "timestamp": "2025-07-05T19:12:46.997Z",
  "port": 8080,
  "environment": "production"
}
```

### 3. 检查应用配置
在Azure门户中：
1. 进入App Service
2. 检查"配置" > "应用程序设置"
3. 确认环境变量正确设置

## 常见配置问题

### 1. 端口配置
确保应用监听Azure App Service分配的端口：
```javascript
var port = normalizePort(process.env.PORT || '8080');
```

### 2. 环境变量
在Azure App Service中设置：
- `NODE_ENV=production`
- `PORT=8080`（通常Azure会自动设置）

### 3. 启动命令
确保package.json中的start脚本正确：
```json
{
  "scripts": {
    "start": "node ./bin/www"
  }
}
```

## 联系支持

如果问题仍然存在：
1. 收集完整的错误日志
2. 记录重现步骤
3. 提供应用配置信息
4. 联系Azure支持或查看Azure文档 