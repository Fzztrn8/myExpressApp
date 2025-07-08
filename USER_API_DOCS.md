# 用户注册登录API文档

## 概述

本文档描述了用户注册、登录和管理的API接口。所有API都返回JSON格式的响应。

## 基础URL

```
http://localhost:3000/users
```

## 认证

大部分API需要JWT token认证。在请求头中添加：

```
Authorization: Bearer <your-jwt-token>
```

## API端点

### 1. 初始化用户表

**POST** `/users/init`

初始化用户表（如果不存在则创建）。

**请求示例：**
```bash
curl -X POST http://localhost:3000/users/init
```

**响应示例：**
```json
{
  "success": true,
  "message": "用户表初始化成功"
}
```

### 2. 用户注册

**POST** `/users/register`

注册新用户。

**请求体：**
```json
{
  "username": "testuser",
  "password": "password123",
  "email": "test@example.com",
  "phone": "13800138000"
}
```

**字段说明：**
- `username` (必填): 用户名，3-20个字符
- `password` (必填): 密码，至少6个字符
- `email` (可选): 邮箱地址
- `phone` (可选): 手机号码

**响应示例：**
```json
{
  "success": true,
  "message": "注册成功",
  "data": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "phone": "13800138000",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

**错误响应：**
```json
{
  "success": false,
  "message": "用户名已存在"
}
```

### 3. 用户登录

**POST** `/users/login`

用户登录并获取JWT token。

**请求体：**
```json
{
  "username": "testuser",
  "password": "password123"
}
```

**响应示例：**
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "user": {
      "id": 1,
      "username": "testuser",
      "email": "test@example.com",
      "phone": "13800138000",
      "created_at": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 4. 获取用户信息

**GET** `/users/profile`

获取当前登录用户的信息（需要认证）。

**请求头：**
```
Authorization: Bearer <your-jwt-token>
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "phone": "13800138000",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### 5. 更新用户信息

**PUT** `/users/profile`

更新当前用户的信息（需要认证）。

**请求头：**
```
Authorization: Bearer <your-jwt-token>
```

**请求体：**
```json
{
  "email": "newemail@example.com",
  "phone": "13900139000"
}
```

**响应示例：**
```json
{
  "success": true,
  "message": "用户信息更新成功",
  "data": {
    "id": 1,
    "username": "testuser",
    "email": "newemail@example.com",
    "phone": "13900139000",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### 6. 修改密码

**PUT** `/users/password`

修改当前用户的密码（需要认证）。

**请求头：**
```
Authorization: Bearer <your-jwt-token>
```

**请求体：**
```json
{
  "oldPassword": "password123",
  "newPassword": "newpassword123"
}
```

**响应示例：**
```json
{
  "success": true,
  "message": "密码修改成功"
}
```

### 7. 验证Token

**GET** `/users/verify`

验证JWT token是否有效（需要认证）。

**请求头：**
```
Authorization: Bearer <your-jwt-token>
```

**响应示例：**
```json
{
  "success": true,
  "message": "Token有效",
  "data": {
    "id": 1,
    "username": "testuser"
  }
}
```

### 8. 检查用户名可用性

**GET** `/users/check-username/:username`

检查用户名是否已被使用。

**请求示例：**
```bash
curl http://localhost:3000/users/check-username/testuser
```

**响应示例：**
```json
{
  "success": true,
  "available": false,
  "message": "用户名已存在"
}
```

### 9. 检查邮箱可用性

**GET** `/users/check-email/:email`

检查邮箱是否已被注册。

**请求示例：**
```bash
curl http://localhost:3000/users/check-email/test@example.com
```

**响应示例：**
```json
{
  "success": true,
  "available": true,
  "message": "邮箱可用"
}
```

## 管理员API

### 10. 获取所有用户列表

**GET** `/users/admin/users`

获取所有用户列表（需要管理员权限）。

**请求头：**
```
Authorization: Bearer <admin-jwt-token>
```

**响应示例：**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com",
      "phone": "13800138000",
      "created_at": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": 2,
      "username": "testuser",
      "email": "test@example.com",
      "phone": "13900139000",
      "created_at": "2024-01-02T00:00:00.000Z"
    }
  ]
}
```

### 11. 删除用户

**DELETE** `/users/admin/users/:id`

删除指定用户（需要管理员权限）。

**请求头：**
```
Authorization: Bearer <admin-jwt-token>
```

**请求示例：**
```bash
curl -X DELETE http://localhost:3000/users/admin/users/2
```

**响应示例：**
```json
{
  "success": true,
  "message": "用户删除成功"
}
```

## 错误处理

所有API都遵循统一的错误响应格式：

```json
{
  "success": false,
  "message": "错误描述"
}
```

常见HTTP状态码：
- `200`: 成功
- `201`: 创建成功
- `400`: 请求参数错误
- `401`: 未认证
- `403`: 权限不足
- `404`: 资源不存在
- `500`: 服务器内部错误

## 数据验证规则

### 用户名
- 长度：3-20个字符
- 唯一性：不能重复

### 密码
- 长度：至少6个字符

### 邮箱
- 格式：标准邮箱格式
- 唯一性：不能重复（如果提供）

### 手机号
- 格式：中国大陆手机号格式（11位数字，以1开头）

## 安全说明

1. 密码使用bcrypt加密存储
2. JWT token有效期为24小时
3. 所有敏感操作都需要认证
4. 管理员操作需要特殊权限

## 使用示例

### 完整注册登录流程

```bash
# 1. 初始化用户表
curl -X POST http://localhost:3000/users/init

# 2. 注册用户
curl -X POST http://localhost:3000/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123",
    "email": "test@example.com",
    "phone": "13800138000"
  }'

# 3. 用户登录
curl -X POST http://localhost:3000/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'

# 4. 使用token访问受保护的API
curl -X GET http://localhost:3000/users/profile \
  -H "Authorization: Bearer <your-jwt-token>"
``` 