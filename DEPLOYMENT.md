# Azure App Service 部署指南

## 准备工作

### 1. Azure SQL Database 配置

1. 在Azure门户中创建SQL Database
2. 记录以下信息：
   - 服务器名称 (例如: `your-server.database.windows.net`)
   - 数据库名称
   - 用户名
   - 密码

### 2. 创建数据库表

在Azure SQL Database中执行以下SQL脚本：

```sql
-- 创建电影表
CREATE TABLE movies (
    id INT IDENTITY(1,1) PRIMARY KEY,
    title NVARCHAR(255) NOT NULL,
    director NVARCHAR(255),
    actor NVARCHAR(255),
    type NVARCHAR(100),
    score DECIMAL(3,1),
    image NVARCHAR(MAX),
    description NVARCHAR(MAX)
);

-- 创建索引
CREATE INDEX IX_movies_type ON movies(type);
CREATE INDEX IX_movies_director ON movies(director);
CREATE INDEX IX_movies_actor ON movies(actor);
CREATE INDEX IX_movies_score ON movies(score);
```

或者直接运行 `database/create_movies_table.sql` 文件。

## 部署步骤

### 1. 创建Azure App Service

1. 登录Azure门户
2. 创建新的App Service
3. 选择Node.js运行时
4. 选择合适的定价层

### 2. 配置环境变量

在App Service的"配置" > "应用程序设置"中添加以下环境变量：

```
AZURE_SQL_USER=your_username
AZURE_SQL_PASSWORD=your_password
AZURE_SQL_SERVER=your-server.database.windows.net
AZURE_SQL_DATABASE=your_database_name
NODE_ENV=production
```

### 3. 配置数据库防火墙

在Azure SQL Database的"安全性" > "网络"中：
1. 允许Azure服务和资源访问此服务器
2. 添加App Service的IP地址到防火墙规则

### 4. 部署代码

#### 方法1: 使用Git部署
```bash
# 添加Azure远程仓库
git remote add azure https://your-app-name.scm.azurewebsites.net:443/your-app-name.git

# 推送代码
git push azure main
```

#### 方法2: 使用Azure CLI
```bash
# 安装Azure CLI
npm install -g azure-cli

# 登录Azure
az login

# 部署
az webapp deployment source config-zip --resource-group your-resource-group --name your-app-name --src your-app.zip
```

#### 方法3: 使用VS Code扩展
1. 安装Azure App Service扩展
2. 右键点击项目文件夹
3. 选择"Deploy to Web App"

### 5. 验证部署

1. 访问 `https://your-app-name.azurewebsites.net/api-docs`
2. 测试API接口
3. 检查应用日志

## 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查环境变量是否正确
   - 确认数据库防火墙设置
   - 验证用户名和密码

2. **应用启动失败**
   - 检查Node.js版本兼容性
   - 查看应用日志
   - 确认所有依赖已安装

3. **API返回500错误**
   - 检查数据库表是否存在
   - 验证SQL查询语法
   - 查看详细错误日志

### 查看日志

在Azure门户中：
1. 进入App Service
2. 选择"日志流"
3. 查看实时日志

或使用Azure CLI：
```bash
az webapp log tail --name your-app-name --resource-group your-resource-group
```

## 性能优化

1. **启用应用洞察**
   - 监控应用性能
   - 跟踪数据库查询
   - 分析用户行为

2. **配置自动缩放**
   - 根据CPU使用率自动扩展
   - 设置最小和最大实例数

3. **启用CDN**
   - 加速静态资源访问
   - 减少服务器负载

## 安全建议

1. **使用托管身份**
   - 避免在代码中硬编码凭据
   - 使用Azure Key Vault存储敏感信息

2. **启用HTTPS**
   - 配置SSL证书
   - 强制HTTPS重定向

3. **配置网络安全组**
   - 限制网络访问
   - 只允许必要的端口

## 监控和维护

1. **设置告警**
   - CPU使用率告警
   - 内存使用率告警
   - 错误率告警

2. **定期备份**
   - 数据库备份
   - 应用配置备份

3. **更新依赖**
   - 定期更新npm包
   - 修复安全漏洞 