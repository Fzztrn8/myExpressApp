# 从模拟数据切换到真实数据库

## 当前状态
- ✅ 本地开发：使用模拟数据（10部电影）
- 🔄 部署后：需要配置真实数据库

## 部署到Azure后的切换步骤

### 1. 配置Azure环境变量
在Azure App Service的"配置" > "应用程序设置"中添加：

```
AZURE_SQL_USER=your_actual_username
AZURE_SQL_PASSWORD=your_actual_password
AZURE_SQL_SERVER=your-actual-server.database.windows.net
AZURE_SQL_DATABASE=your_actual_database_name
NODE_ENV=production
```

### 2. 创建真实数据库表
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

### 3. 插入您的真实数据
```sql
-- 示例：插入您的电影数据
INSERT INTO movies (title, director, actor, type, score, image, description) VALUES
('您的电影标题1', '导演1', '演员1', '类型1', 9.0, '图片URL1', '描述1'),
('您的电影标题2', '导演2', '演员2', '类型2', 8.5, '图片URL2', '描述2');
-- 继续插入您的所有电影数据...
```

### 4. 验证切换
部署并配置完成后，应用会：
- 🔄 自动检测环境变量
- ✅ 连接到真实Azure SQL Database
- 📊 使用您的真实电影数据
- 🚫 不再使用模拟数据

## 如何确认已切换到真实数据库

### 检查日志
在Azure App Service的"日志流"中查看：
```
✅ Azure SQL Database 连接成功
```

而不是：
```
🔧 使用模拟数据模式 - 本地开发环境
```

### 检查数据
访问API接口，确认返回的是您的真实数据而不是模拟的10部电影。

## 故障排除

### 如果仍然显示模拟数据：
1. 检查环境变量是否正确配置
2. 确认数据库连接字符串格式
3. 验证数据库防火墙设置
4. 检查应用日志中的错误信息

### 如果数据库连接失败：
1. 确认Azure SQL Database服务状态
2. 检查网络连接和防火墙规则
3. 验证用户名和密码
4. 确认数据库名称正确

## 本地测试真实数据库（可选）

如果您想在本地也测试真实数据库，可以创建 `.env` 文件：

```bash
AZURE_SQL_USER=your_username
AZURE_SQL_PASSWORD=your_password
AZURE_SQL_SERVER=your-server.database.windows.net
AZURE_SQL_DATABASE=your_database_name
NODE_ENV=development
```

这样本地也会连接到真实数据库而不是使用模拟数据。 