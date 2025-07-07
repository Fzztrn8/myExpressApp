# 数据库连接监控功能

## 概述

本应用已集成自动数据库连接监控功能，能够定期检查数据库连接状态，并在连接断开时自动重连，确保应用的稳定性和可靠性。

## 功能特性

### 1. 自动连接监控
- **定期检查**: 默认每30秒检查一次数据库连接状态
- **自动重连**: 当连续失败次数达到阈值时自动尝试重连
- **智能重试**: 使用指数退避策略进行重连尝试

### 2. 监控配置
- **检查间隔**: 可配置检查频率（10-300秒）
- **重试策略**: 可配置最大重试次数和重试延迟
- **失败阈值**: 可配置连续失败次数阈值

### 3. 状态管理
- **实时状态**: 实时显示连接和监控状态
- **历史记录**: 记录最后成功检查时间和失败次数
- **手动控制**: 支持手动启动/停止监控

## 配置参数

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `checkInterval` | 30000ms | 连接检查间隔（毫秒） |
| `maxRetries` | 3 | 最大重试次数 |
| `retryDelay` | 5000ms | 重试延迟（毫秒） |
| `maxConsecutiveFailures` | 5 | 最大连续失败次数 |

## 使用方法

### 1. 自动启动
应用启动时会自动初始化数据库连接并启动监控：
```javascript
// 在 config/database.js 中
async function initializeDatabase() {
  const success = await connectWithRetry();
  
  // 如果连接成功，启动监控
  if (success) {
    startConnectionMonitor();
  }
  
  return success;
}
```

### 2. 手动控制
通过管理员界面可以手动控制监控：

#### 启动监控
```javascript
await fetch('/admin/start-monitor', { method: 'POST' });
```

#### 停止监控
```javascript
await fetch('/admin/stop-monitor', { method: 'POST' });
```

#### 手动检查连接
```javascript
await fetch('/admin/check-connection', { method: 'POST' });
```

#### 更新配置
```javascript
await fetch('/admin/update-monitor-config', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    checkInterval: 60000,  // 60秒
    maxRetries: 5,
    retryDelay: 10000,     // 10秒
    maxConsecutiveFailures: 3
  })
});
```

### 3. 状态查询
```javascript
// 获取监控状态
const response = await fetch('/admin/monitor-status');
const status = await response.json();
```

## 监控流程

### 1. 定期检查
```javascript
async function performConnectionCheck() {
  try {
    const isConnected = await checkDatabaseConnection();
    
    if (isConnected) {
      // 连接正常，重置失败计数
      connectionMonitor.consecutiveFailures = 0;
      connectionMonitor.lastSuccessfulCheck = new Date();
    } else {
      // 连接失败，增加失败计数
      connectionMonitor.consecutiveFailures++;
      
      // 达到阈值时尝试重连
      if (connectionMonitor.consecutiveFailures >= connectionMonitor.maxConsecutiveFailures) {
        await attemptReconnection();
      }
    }
  } catch (error) {
    // 处理检查过程中的错误
    connectionMonitor.consecutiveFailures++;
  }
}
```

### 2. 自动重连
```javascript
async function attemptReconnection() {
  try {
    // 关闭现有连接池
    if (pool) {
      await pool.close();
      pool = null;
    }
    
    // 等待后重连
    await new Promise(resolve => setTimeout(resolve, connectionMonitor.retryDelay));
    
    // 尝试重新连接
    const success = await connectWithRetry(connectionMonitor.maxRetries, connectionMonitor.retryDelay);
    
    if (success) {
      connectionMonitor.consecutiveFailures = 0;
      connectionMonitor.lastSuccessfulCheck = new Date();
    }
  } catch (error) {
    console.error('重新连接失败:', error.message);
  }
}
```

## 优雅关闭

应用支持优雅关闭，确保在关闭时正确停止监控和关闭数据库连接：

```javascript
// 在 app.js 中
process.on('SIGINT', async () => {
  console.log('正在优雅关闭应用...');
  
  // 停止数据库连接监控
  db.stopConnectionMonitor();
  
  // 关闭数据库连接池
  const pool = db.pool();
  if (pool) {
    await pool.close();
  }
  
  process.exit(0);
});
```

## 管理界面

### 数据库诊断页面
访问 `/admin/db-diagnostic` 可以查看：
- 连接监控状态
- 实时连接状态
- 监控配置参数
- 手动控制按钮

### 功能按钮
- **启动监控**: 手动启动连接监控
- **停止监控**: 手动停止连接监控
- **手动检查**: 立即执行一次连接检查
- **刷新状态**: 更新监控状态显示
- **配置参数**: 修改监控配置

## 日志输出

监控功能会输出详细的日志信息：

```
🔄 启动数据库连接监控...
✅ 连接监控已启动，检查间隔: 30秒
✅ 数据库连接状态正常
⚠️ 数据库连接检查失败 (1/5)
🔄 连续失败次数达到阈值，尝试重新连接...
✅ 数据库重新连接成功
```

## 故障排除

### 常见问题

1. **监控未启动**
   - 检查数据库连接是否成功
   - 查看应用启动日志

2. **频繁重连**
   - 检查网络连接稳定性
   - 调整重试参数
   - 检查数据库服务器状态

3. **配置不生效**
   - 确保配置参数在有效范围内
   - 重启监控服务

### 调试建议

1. 启用详细日志输出
2. 检查网络连接状态
3. 验证数据库配置
4. 监控系统资源使用情况

## 最佳实践

1. **合理设置检查间隔**: 避免过于频繁的检查影响性能
2. **配置适当的重试策略**: 平衡重连成功率和系统负载
3. **监控日志**: 定期检查监控日志，及时发现问题
4. **备份策略**: 结合监控功能，制定完善的数据库备份策略

## 技术实现

### 核心文件
- `config/database.js`: 数据库连接和监控逻辑
- `routes/admin.js`: 监控管理API
- `views/admin/db-diagnostic.ejs`: 监控管理界面
- `app.js`: 应用启动和优雅关闭

### 依赖模块
- `mssql`: SQL Server数据库驱动
- `express`: Web框架
- `express-session`: 会话管理

这个监控功能确保了应用在数据库连接不稳定时的自动恢复能力，提高了系统的可靠性和用户体验。 