# 视频管理功能指南

## 功能概述

视频管理功能已简化为**只记录视频ID和基本信息**，不再支持文件上传功能。系统现在专注于管理外部视频平台（如YouTube、Bilibili等）的视频信息，包括观看次数、点赞数、评论数等统计数据。

## 主要特性

### ✅ 支持的功能
- **视频记录管理**: 添加、编辑、删除视频记录
- **外部视频ID**: 支持YouTube、Bilibili等平台的视频ID
- **统计信息**: 记录观看次数、点赞数、评论数
- **平台分类**: 支持多平台视频管理
- **搜索功能**: 按标题、描述、视频ID搜索
- **统计分析**: 平台分布、观看趋势等统计
- **批量操作**: 批量更新视频统计信息

### ❌ 移除的功能
- 文件上传功能
- 本地视频存储
- 视频文件处理
- 缩略图生成

## 数据模型

### 视频表结构 (videos)

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | INT | 主键ID |
| video_id | NVARCHAR(100) | 外部视频ID（如YouTube ID） |
| title | NVARCHAR(255) | 视频标题 |
| description | NVARCHAR(1000) | 视频描述 |
| platform | NVARCHAR(50) | 视频平台（youtube, bilibili等） |
|  |                |  |
| thumbnail | NVARCHAR(500) | 缩略图URL |
| duration | INT | 视频时长（秒） |
| view_count | INT | 观看次数 |
| like_count | INT | 点赞数 |
| comment_count | INT | 评论数 |
| created_by | NVARCHAR(100) | 创建者 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |
| status | NVARCHAR(20) | 状态（active, deleted） |

## API 接口

### 1. 获取视频列表
```http
GET /videos?page=1&limit=12&sortBy=created_at&sortOrder=DESC
```

**响应示例:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "video_id": "dQw4w9WgXcQ",
      "title": "Rick Astley - Never Gonna Give You Up",
      "description": "经典歌曲Never Gonna Give You Up的官方MV",
      "platform": "youtube",
      "thumbnail": "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
      "duration": 212,
      "view_count": 1500000000,
      "like_count": 15000000,
      "comment_count": 500000,
      "created_at": "2024-01-01T00:00:00.000Z",
      "status": "active"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 3,
    "totalPages": 1
  }
}
```

### 2. 添加视频记录
```http
POST /videos
Content-Type: application/json

{
  "video_id": "dQw4w9WgXcQ",
  "title": "视频标题",
  "description": "视频描述",
  "platform": "youtube",
  "thumbnail": "https://example.com/thumbnail.jpg",
  "duration": 180,
  "view_count": 1000,
  "like_count": 50,
  "comment_count": 10
}
```

### 3. 获取单个视频详情
```http
GET /videos/:id
```

### 4. 更新视频信息
```http
PUT /videos/:id
Content-Type: application/json

{
  "title": "更新后的标题",
  "description": "更新后的描述",
  "view_count": 2000,
  "like_count": 100
}
```

### 5. 删除视频
```http
DELETE /videos/:id
```

### 6. 搜索视频
```http
GET /videos/search/:keyword?page=1&limit=12
```

### 7. 获取热门视频
```http
GET /videos/popular/:limit
```

### 8. 获取最新视频
```http
GET /videos/latest/:limit
```

### 9. 获取视频统计信息
```http
GET /videos/:id/stats
```

### 10. 更新视频统计信息
```http
PATCH /videos/:id/stats
Content-Type: application/json

{
  "view_count": 3000,
  "like_count": 150,
  "comment_count": 25
}
```

### 11. 批量更新视频统计
```http
PATCH /videos/batch/stats
Content-Type: application/json

{
  "videoStats": [
    {
      "id": 1,
      "view_count": 5000,
      "like_count": 200,
      "comment_count": 30
    }
  ]
}
```

### 12. 获取平台分布统计
```http
GET /videos/stats/platforms
```

### 13. 获取观看趋势
```http
GET /videos/stats/trend/:days
```

## 使用示例

### 添加YouTube视频
```javascript
const videoData = {
  video_id: 'dQw4w9WgXcQ',
  title: 'Rick Astley - Never Gonna Give You Up',
  description: '经典歌曲Never Gonna Give You Up的官方MV',
  platform: 'youtube',
  thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
  duration: 212,
  view_count: 1500000000,
  like_count: 15000000,
  comment_count: 500000
};

const response = await fetch('/videos', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(videoData)
});
```

### 添加Bilibili视频
```javascript
const videoData = {
  video_id: 'BV1xx411c7mu',
  title: '【原神】4.0版本PV：「仿若无因的飞鸟」',
  description: '原神4.0版本宣传视频',
  platform: 'bilibili',
  thumbnail: 'https://i0.hdslb.com/bfs/archive/example.jpg',
  duration: 180,
  view_count: 5000000,
  like_count: 200000,
  comment_count: 15000
};
```

## 测试

### 运行测试脚本
```bash
# 测试视频管理功能
npm run test-video
```

### 手动测试
```bash
# 1. 启动应用
npm start

# 2. 获取视频列表
curl http://localhost:3000/videos

# 3. 添加视频记录
curl -X POST http://localhost:3000/videos \
  -H "Content-Type: application/json" \
  -d '{
    "video_id": "test123",
    "title": "测试视频",
    "platform": "youtube"
  }'

# 4. 获取视频详情
curl http://localhost:3000/videos/1

# 5. 更新统计信息
curl -X PATCH http://localhost:3000/videos/1/stats \
  -H "Content-Type: application/json" \
  -d '{
    "view_count": 1000,
    "like_count": 50
  }'
```

## 支持的平台

### YouTube
- **video_id**: YouTube视频ID（如 `dQw4w9WgXcQ`）
- **platform**: `youtube`

### Bilibili
- **video_id**: Bilibili视频ID（如 `BV1xx411c7mu`）
- **platform**: `bilibili`

### 其他平台
- 可以自定义平台名称
- 支持任意视频平台

## 统计功能

### 全局统计
- 总视频数
- 总观看次数
- 总点赞数
- 总评论数
- 平均时长
- 活跃视频数

### 平台统计
- 各平台视频数量
- 各平台总观看次数
- 各平台总点赞数

### 观看趋势
- 按日期统计观看次数
- 独立观看者数量

## 注意事项

1. **视频ID唯一性**: 同一平台下的视频ID必须唯一
2. **统计更新**: 可以通过API手动更新统计数据
3. **软删除**: 删除操作采用软删除，不会真正删除数据
4. **模拟数据**: 开发环境使用模拟数据，生产环境需要真实数据库

## 扩展建议

1. **API集成**: 可以集成YouTube、Bilibili等平台的API自动获取统计数据
2. **定时任务**: 设置定时任务自动更新视频统计信息
3. **缓存机制**: 对热门视频数据进行缓存优化
4. **数据分析**: 添加更详细的数据分析功能 