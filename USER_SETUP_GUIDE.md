# 用户注册登录功能设置指南

## 概述

本项目已新增完整的用户注册登录功能，包括：
- 用户注册和登录
- JWT token认证
- 用户信息管理
- 密码加密存储
- 管理员功能

## 快速开始

### 1. 安装依赖

确保已安装所有必要的依赖：

```bash
npm install
```

主要新增的依赖：
- `bcryptjs`: 密码加密
- `jsonwebtoken`: JWT token生成和验证
- `axios`: API测试（可选）

### 2. 环境配置

复制环境变量示例文件并配置：

```bash
cp env.example .env
```

在 `.env` 文件中配置以下变量：

```env
# 数据库配置
AZURE_SQL_USER=your_username
AZURE_SQL_PASSWORD=your_password
AZURE_SQL_SERVER=your-server.database.windows.net
AZURE_SQL_DATABASE=your_database_name

# JWT 密钥（重要：生产环境请使用强密钥）
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# 应用配置
NODE_ENV=development
PORT=3000
```

### 3. 启动应用

```bash
npm start
```

或者开发模式：

```bash
npm run dev
```

### 4. 初始化用户表

首次使用需要初始化用户表：

```bash
curl -X POST http://localhost:3000/users/init
```

或者使用测试脚本：

```bash
npm run test-user
```

## API使用示例

### 用户注册

```bash
curl -X POST http://localhost:3000/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123",
    "email": "test@example.com",
    "phone": "13800138000"
  }'
```

### 用户登录

```bash
curl -X POST http://localhost:3000/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'
```

### 获取用户信息

```bash
curl -X GET http://localhost:3000/users/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 数据库表结构

用户表 `users` 包含以下字段：

| 列名 | 数据类型 | 允许NULL | 默认值 | 说明 |
|------|----------|----------|--------|------|
| id | int | 否 | 自增 | 主键 |
| username | nvarchar(100) | 否 | 无 | 用户名（唯一） |
| password_hash | nvarchar(255) | 否 | 无 | 加密后的密码 |
| email | nvarchar(255) | 是 | 无 | 邮箱地址 |
| phone | nvarchar(50) | 是 | 无 | 手机号码 |
| created_at | datetime | 是 | GETDATE() | 创建时间 |

## 安全特性

1. **密码加密**: 使用bcrypt算法加密存储密码
2. **JWT认证**: 基于token的无状态认证
3. **输入验证**: 用户名、邮箱、手机号格式验证
4. **唯一性检查**: 用户名和邮箱唯一性验证
5. **权限控制**: 管理员功能需要特殊权限

## 数据验证规则

### 用户名
- 长度：3-20个字符
- 唯一性：不能重复

### 密码
- 长度：至少6个字符
- 加密：使用bcrypt（10轮盐值）

### 邮箱
- 格式：标准邮箱格式验证
- 唯一性：不能重复（如果提供）

### 手机号
- 格式：中国大陆手机号格式（11位数字，以1开头）

## 测试

运行完整的API测试：

```bash
npm run test-user
```

测试包括：
- 用户表初始化
- 用户注册
- 用户登录
- Token验证
- 用户信息管理
- 密码修改
- 权限验证

## 管理员功能

### 创建管理员账户

首先注册一个普通用户，然后手动在数据库中将其用户名改为"admin"：

```sql
UPDATE users SET username = 'admin' WHERE id = 1;
```

### 管理员API

- `GET /users/admin/users`: 获取所有用户列表
- `DELETE /users/admin/users/:id`: 删除指定用户

## 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查数据库连接配置
   - 确保数据库服务正在运行

2. **JWT token无效**
   - 检查JWT_SECRET环境变量是否正确设置
   - 确保token没有过期（默认24小时）

3. **用户名已存在**
   - 使用不同的用户名
   - 或使用 `/users/check-username/:username` 检查可用性

4. **权限不足**
   - 确保使用正确的管理员账户
   - 检查token是否有效

### 日志查看

应用运行时会输出详细的日志信息，包括：
- 数据库连接状态
- API请求处理
- 错误信息

## 生产环境部署

### 安全建议

1. **JWT密钥**: 使用强随机密钥，定期更换
2. **HTTPS**: 在生产环境中启用HTTPS
3. **环境变量**: 不要在代码中硬编码敏感信息
4. **数据库安全**: 使用强密码，限制数据库访问权限

### 性能优化

1. **连接池**: 数据库连接池已配置
2. **缓存**: 考虑添加Redis缓存用户会话
3. **日志**: 配置适当的日志级别

## 扩展功能

可以考虑添加的功能：
- 邮箱验证
- 手机号验证
- 密码重置
- 用户角色管理
- 登录历史记录
- 账户锁定机制

## 支持

如有问题，请查看：
- `USER_API_DOCS.md`: 详细的API文档
- `test-user-api.js`: 测试脚本示例
- 应用日志输出 