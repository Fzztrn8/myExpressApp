# 数据库连接配置指南

## 问题诊断

如果你遇到 "Failed to connect to harmonyservice.database.windows.net:1433 in 15000ms" 错误，请按以下步骤排查：

## 1. 环境变量配置

创建 `.env` 文件并配置以下变量：

```env
# Azure SQL Database 连接配置
AZURE_SQL_SERVER=your-server.database.windows.net
AZURE_SQL_DATABASE=your_database_name
AZURE_SQL_USER=your_username
AZURE_SQL_PASSWORD=your_password

# 管理员密码
ADMIN_PASSWORD=admin123

# 应用环境
NODE_ENV=development
PORT=3000
```

## 2. 常见问题解决方案

### 连接超时问题

1. **检查网络连接**
   - 确保你的网络可以访问互联网
   - 检查防火墙是否阻止了 1433 端口

2. **Azure SQL Database 防火墙设置**
   - 登录 Azure 门户
   - 找到你的 SQL Database
   - 在"安全" > "网络"中添加你的 IP 地址
   - 或者临时允许所有 IP (0.0.0.0/0)

3. **服务器名称格式**
   - 确保服务器名称格式正确：`server-name.database.windows.net`
   - 不要包含协议前缀 (https://)

4. **连接字符串验证**
   - 使用 Azure 门户的连接字符串工具验证
   - 确保用户名和密码正确

### 认证问题

1. **用户名格式**
   - 使用完整的用户名，通常包含服务器名
   - 例如：`username@server-name`

2. **密码特殊字符**
   - 如果密码包含特殊字符，确保正确转义
   - 在 `.env` 文件中用引号包围密码

3. **数据库权限**
   - 确保用户有访问指定数据库的权限

## 3. 使用诊断工具

应用内置了数据库连接诊断工具：

1. 启动应用：`npm start`
2. 访问：`http://localhost:3000/admin`
3. 点击"数据库连接诊断"
4. 查看详细的诊断信息

## 4. 测试连接

### 使用诊断页面
- 访问 `/admin/db-diagnostic`
- 点击"测试连接"按钮

### 使用命令行
```bash
# 测试网络连通性
telnet your-server.database.windows.net 1433

# 或者使用 PowerShell
Test-NetConnection -ComputerName your-server.database.windows.net -Port 1433
```

## 5. 模拟数据模式

如果无法连接真实数据库，应用会自动切换到模拟数据模式：

- 使用内存中的模拟数据
- 所有功能正常工作
- 适合开发和测试

## 6. 连接优化

应用已优化了以下连接参数：

- 连接超时：60秒
- 请求超时：60秒
- 连接池大小：5个连接
- 自动重试机制：3次重试

## 7. 故障排除清单

- [ ] 环境变量是否正确设置？
- [ ] 服务器名称格式是否正确？
- [ ] 用户名和密码是否正确？
- [ ] Azure 防火墙是否允许你的 IP？
- [ ] 网络是否可以访问 1433 端口？
- [ ] 数据库服务器是否处于活动状态？

## 8. 获取帮助

如果问题仍然存在：

1. 查看应用日志中的详细错误信息
2. 使用诊断工具获取更多信息
3. 检查 Azure SQL Database 的服务状态
4. 联系 Azure 支持或网络管理员 