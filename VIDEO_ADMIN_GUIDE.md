# 视频管理功能说明

## 功能概述

视频管理功能为管理员提供了完整的视频内容管理解决方案，包括视频上传、编辑、删除、统计分析和用户行为跟踪等功能。

## 主要功能

### 1. 视频数据管理 (`/admin/videos`)

#### 功能特性
- **视频列表展示**: 分页显示所有视频，支持搜索功能
- **视频上传**: 支持多种视频格式，最大500MB
- **视频编辑**: 修改视频标题、描述、状态等信息
- **视频删除**: 软删除，保留数据完整性
- **批量操作**: 支持批量删除和状态修改

#### 支持的视频格式
- MP4 (推荐)
- AVI
- MOV
- WMV
- FLV
- MKV
- WebM

#### 文件大小限制
- 最大文件大小: 500MB
- 自动文件大小验证
- 上传进度显示

### 2. 视频统计信息 (`/admin/video-stats`)

#### 统计指标
- **总视频数**: 活跃状态的视频总数
- **总观看次数**: 所有视频的累计观看次数
- **总点赞数**: 所有视频的累计点赞数
- **总评论数**: 所有视频的累计评论数
- **总存储空间**: 所有视频文件的总大小
- **活跃用户数**: 有观看记录的用户数量
- **平均观看时长**: 用户观看视频的平均时长

#### 图表分析
- **观看趋势图**: 显示最近30天的观看趋势
- **格式分布图**: 显示不同视频格式的分布情况
- **热门视频榜**: 按观看次数和点赞数排序的热门视频
- **最新视频榜**: 最近上传的视频列表

### 3. 视频表单管理 (`/admin/videos/add`, `/admin/videos/edit/:id`)

#### 添加视频功能
- 视频文件上传和验证
- 自动提取文件信息（大小、格式）
- 表单验证和错误提示
- 实时文件大小显示

#### 编辑视频功能
- 修改视频基本信息
- 查看视频统计信息
- 视频状态管理（正常/禁用）
- 视频预览功能

## 数据库结构

### 核心表结构

#### videos 表
```sql
CREATE TABLE videos (
  id INT IDENTITY(1,1) PRIMARY KEY,
  title NVARCHAR(255) NOT NULL,
  description NTEXT,
  filename NVARCHAR(255),
  file_path NVARCHAR(500),
  file_size BIGINT DEFAULT 0,
  duration INT DEFAULT 0,
  thumbnail NVARCHAR(500),
  format NVARCHAR(50),
  resolution NVARCHAR(50),
  view_count INT DEFAULT 0,
  like_count INT DEFAULT 0,
  comment_count INT DEFAULT 0,
  status NVARCHAR(20) DEFAULT 'active',
  created_by NVARCHAR(100),
  created_at DATETIME2 DEFAULT GETDATE(),
  updated_at DATETIME2 DEFAULT GETDATE()
);
```

#### video_likes 表
```sql
CREATE TABLE video_likes (
  id INT IDENTITY(1,1) PRIMARY KEY,
  video_id INT NOT NULL,
  user_id NVARCHAR(100),
  user_ip NVARCHAR(45),
  created_at DATETIME2 DEFAULT GETDATE(),
  FOREIGN KEY (video_id) REFERENCES videos(id)
);
```

#### video_comments 表
```sql
CREATE TABLE video_comments (
  id INT IDENTITY(1,1) PRIMARY KEY,
  video_id INT NOT NULL,
  user_id NVARCHAR(100),
  user_name NVARCHAR(100),
  content NTEXT NOT NULL,
  parent_id INT,
  like_count INT DEFAULT 0,
  status NVARCHAR(20) DEFAULT 'active',
  created_at DATETIME2 DEFAULT GETDATE(),
  FOREIGN KEY (video_id) REFERENCES videos(id)
);
```

#### video_views 表
```sql
CREATE TABLE video_views (
  id INT IDENTITY(1,1) PRIMARY KEY,
  video_id INT NOT NULL,
  user_id NVARCHAR(100),
  user_ip NVARCHAR(45),
  user_agent NTEXT,
  view_duration INT DEFAULT 0,
  is_completed BIT DEFAULT 0,
  viewed_at DATETIME2 DEFAULT GETDATE(),
  FOREIGN KEY (video_id) REFERENCES videos(id)
);
```

## API 接口

### 管理端API

#### 视频管理
- `GET /admin/videos` - 视频列表页面
- `GET /admin/videos/add` - 添加视频页面
- `POST /admin/videos/add` - 添加视频
- `GET /admin/videos/edit/:id` - 编辑视频页面
- `POST /admin/videos/edit/:id` - 更新视频
- `POST /admin/videos/delete/:id` - 删除视频

#### 视频统计
- `GET /admin/video-stats` - 视频统计页面

### 前端API

#### 视频播放
- `GET /api/videos` - 获取视频列表
- `GET /api/videos/:id` - 获取视频详情
- `GET /api/videos/:id/stream` - 视频流播放
- `POST /api/videos/:id/view` - 记录观看

#### 互动功能
- `POST /api/videos/:id/like` - 点赞视频
- `DELETE /api/videos/:id/like` - 取消点赞
- `GET /api/videos/:id/comments` - 获取评论
- `POST /api/videos/:id/comments` - 添加评论

#### 搜索和推荐
- `GET /api/videos/search` - 搜索视频
- `GET /api/videos/popular` - 热门视频
- `GET /api/videos/latest` - 最新视频

## 文件存储

### 存储结构
```
public/
├── uploads/
│   ├── videos/          # 视频文件存储
│   │   ├── video_1234567890.mp4
│   │   └── ...
│   └── thumbnails/      # 视频缩略图存储
│       ├── thumb_1234567890.jpg
│       └── ...
```

### 文件命名规则
- 视频文件: `video_{timestamp}.{extension}`
- 缩略图: `thumb_{timestamp}.jpg`
- 时间戳确保文件名唯一性

### 安全考虑
- 文件类型验证
- 文件大小限制
- 文件名安全处理
- 路径遍历防护

## 用户识别机制

### 匿名用户
- 使用IP地址识别
- 记录用户代理信息
- 生成临时用户ID

### 注册用户
- 关联用户账户
- 个性化推荐
- 观看历史记录

## 防重复机制

### 点赞防重复
- 同一IP/用户对同一视频只能点赞一次
- 支持取消点赞功能
- 点赞状态实时更新

### 观看记录防重复
- 基于时间间隔的防重复
- 支持观看时长记录
- 完成状态跟踪

## 性能优化

### 数据库优化
- 索引优化（video_id, user_id, created_at）
- 分页查询
- 统计查询缓存

### 文件处理
- 异步文件上传
- 文件压缩和转码
- CDN集成支持

### 前端优化
- 懒加载视频列表
- 图片压缩和缓存
- 响应式设计

## 安全考虑

### 文件上传安全
- 文件类型白名单
- 文件大小限制
- 恶意文件检测
- 病毒扫描集成

### 数据安全
- SQL注入防护
- XSS攻击防护
- CSRF令牌验证
- 输入数据验证

### 访问控制
- 管理员权限验证
- 用户身份验证
- 操作日志记录
- 敏感操作确认

## 部署说明

### 环境要求
- Node.js 14+
- SQL Server 2016+
- 足够的存储空间
- 网络带宽支持

### 配置项
```env
# 视频上传配置
VIDEO_MAX_SIZE=524288000
VIDEO_ALLOWED_TYPES=mp4,avi,mov,wmv,flv,mkv,webm
VIDEO_UPLOAD_PATH=public/uploads/videos

# 缩略图配置
THUMBNAIL_WIDTH=320
THUMBNAIL_HEIGHT=240
THUMBNAIL_QUALITY=80
```

### 启动步骤
1. 安装依赖: `npm install`
2. 配置环境变量
3. 创建数据库表
4. 创建上传目录
5. 启动应用: `npm start`

## 扩展功能

### 计划中的功能
- 视频转码服务
- 自动缩略图生成
- 视频水印添加
- 字幕支持
- 多语言支持
- 移动端优化

### 第三方集成
- 云存储服务（AWS S3, Azure Blob）
- CDN服务
- 视频处理服务
- 分析统计服务

## 故障排除

### 常见问题
1. **文件上传失败**
   - 检查文件大小限制
   - 验证文件格式
   - 确认目录权限

2. **视频播放问题**
   - 检查文件路径
   - 验证文件完整性
   - 确认浏览器支持

3. **统计数据显示异常**
   - 检查数据库连接
   - 验证查询语句
   - 确认数据完整性

### 日志查看
- 应用日志: `logs/app.log`
- 错误日志: `logs/error.log`
- 访问日志: `logs/access.log`

## 联系支持

如有问题或建议，请联系开发团队或查看项目文档。 