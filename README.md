# 电影数据库API

这是一个基于Express.js的电影数据库查询API，支持在Azure App Service上部署。

## 功能特性

- 🎬 电影数据查询
- 🔍 多维度搜索（标题、导演、演员、类型）
- 📊 统计信息
- 🌐 RESTful API设计
- 📱 支持Azure App Service部署

## 数据库表结构

```sql
CREATE TABLE movies (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    director VARCHAR(255),
    actor VARCHAR(255),
    type VARCHAR(100),
    score DECIMAL(3,1),
    image TEXT,
    description TEXT
);
```

## API接口

### 1. 获取所有电影
```
GET /api/movies
```

### 2. 根据ID获取电影详情
```
GET /api/movies/:id
```

### 3. 根据类型获取电影
```
GET /api/movies/type/:type
```

### 4. 根据导演获取电影
```
GET /api/movies/director/:director
```

### 5. 根据演员获取电影
```
GET /api/movies/actor/:actor
```

### 6. 搜索电影
```
GET /api/movies/search/:term
```

### 7. 获取高分电影
```
GET /api/movies/top/:limit
```

### 8. 获取统计信息
```
GET /api/movies/stats/overview
```

## 部署到Azure App Service

### 1. 环境变量配置

在Azure App Service的应用设置中配置以下环境变量：

```
AZURE_SQL_USER=your_username
AZURE_SQL_PASSWORD=your_password
AZURE_SQL_SERVER=your-server.database.windows.net
AZURE_SQL_DATABASE=your_database_name
NODE_ENV=production
```

### 2. 数据库连接

确保您的Azure SQL Database已正确配置，并且应用服务可以访问数据库。

### 3. 部署步骤

1. 将代码推送到Git仓库
2. 在Azure App Service中配置部署源
3. 配置环境变量
4. 部署应用

## 本地开发

### 1. 安装依赖
```bash
npm install
```

### 2. 配置环境变量
复制 `env.example` 为 `.env` 并配置Azure SQL Database连接信息：

```bash
AZURE_SQL_USER=your_username
AZURE_SQL_PASSWORD=your_password
AZURE_SQL_SERVER=your-server.database.windows.net
AZURE_SQL_DATABASE=your_database_name
```

### 3. 创建数据库表
在Azure SQL Database中执行 `database/create_movies_table.sql` 脚本创建表和示例数据。

### 4. 测试数据库连接
```bash
npm run test-db
```

### 5. 启动应用
```bash
npm start
```

### 6. 访问API文档
打开浏览器访问 `http://localhost:3000/api-docs` 查看API文档和测试接口。

## 响应格式

所有API接口都返回JSON格式，包含以下字段：

```json
{
  "success": true,
  "data": [...],
  "count": 10,
  "message": "错误信息（当success为false时）"
}
```

## 错误处理

API包含完整的错误处理机制：

- 400: 请求参数错误
- 404: 资源不存在
- 500: 服务器内部错误

## 项目结构

```
myExpressApp/
├── config/
│   └── database.js          # 数据库配置
├── models/
│   └── movie.js            # 电影数据模型
├── routes/
│   ├── index.js            # 主路由
│   ├── users.js            # 用户路由
│   └── movies.js           # 电影API路由
├── views/
│   ├── api-docs.ejs        # API文档页面
│   ├── index.ejs           # 首页
│   └── error.ejs           # 错误页面
├── app.js                  # 主应用文件
├── package.json            # 项目配置
└── README.md               # 项目说明
```

## 技术栈

- **后端框架**: Express.js
- **数据库**: Azure SQL Database
- **部署平台**: Azure App Service
- **模板引擎**: EJS
- **数据库驱动**: mssql (node-mssql)

## 许可证

MIT License 

## 数据库结构自动检测与修复

本项目提供一键检测和修复数据库表结构的脚本：

```bash
node repairDatabaseStructure.js
```

- 自动检测 users、videos、video_comments 等核心表是否存在，不存在则自动创建。
- 自动检测每个表的字段是否齐全，缺失字段会自动补齐。
- 支持 SQL Server 环境。

> 建议在首次部署、数据库迁移或遇到表结构异常时运行。 