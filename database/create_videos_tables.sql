-- 视频功能数据库表结构（无文件上传/URL，仅本地ID和统计信息）

-- 1. 视频表
CREATE TABLE videos (
    id INT IDENTITY(1,1) PRIMARY KEY,
    title NVARCHAR(200) NOT NULL,
    description NVARCHAR(1000),
    view_count INT DEFAULT 0,         -- 观看次数
    like_count INT DEFAULT 0,         -- 点赞数
    comment_count INT DEFAULT 0,      -- 评论数
    status NVARCHAR(20) DEFAULT 'active', -- 状态：active, inactive, deleted
    created_by NVARCHAR(100),         -- 创建者
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

-- 2. 视频点赞表
CREATE TABLE video_likes (
    id INT IDENTITY(1,1) PRIMARY KEY,
    video_id INT NOT NULL,
    user_id NVARCHAR(100) NOT NULL,   -- 用户标识（可以是IP、用户ID等）
    user_ip NVARCHAR(45),             -- 用户IP地址
    user_agent NVARCHAR(500),         -- 用户代理
    created_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
    UNIQUE(video_id, user_id)         -- 防止重复点赞
);

-- 3. 视频评论表
CREATE TABLE video_comments (
    id INT IDENTITY(1,1) PRIMARY KEY,
    video_id INT NOT NULL,
    parent_id INT,                    -- 父评论ID（用于回复功能）
    user_id NVARCHAR(100) NOT NULL,   -- 用户标识
    user_name NVARCHAR(100),          -- 用户昵称
    user_ip NVARCHAR(45),             -- 用户IP地址
    content NVARCHAR(1000) NOT NULL,  -- 评论内容
    like_count INT DEFAULT 0,         -- 评论点赞数
    status NVARCHAR(20) DEFAULT 'active', -- 状态：active, hidden, deleted
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES video_comments(id)  -- 不加 ON DELETE CASCADE
);

-- 4. 评论点赞表
CREATE TABLE comment_likes (
    id INT IDENTITY(1,1) PRIMARY KEY,
    comment_id INT NOT NULL,
    user_id NVARCHAR(100) NOT NULL,
    user_ip NVARCHAR(45),
    created_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (comment_id) REFERENCES video_comments(id) ON DELETE CASCADE,
    UNIQUE(comment_id, user_id)       -- 防止重复点赞
);

-- 5. 视频观看记录表
CREATE TABLE video_views (
    id INT IDENTITY(1,1) PRIMARY KEY,
    video_id INT NOT NULL,
    user_id NVARCHAR(100),
    user_ip NVARCHAR(45) NOT NULL,
    user_agent NVARCHAR(500),
    view_duration INT,                -- 观看时长（秒）
    is_completed BIT DEFAULT 0,       -- 是否完整观看
    created_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
);

-- 创建索引以提高查询性能
CREATE INDEX idx_videos_status ON videos(status);
CREATE INDEX idx_videos_created_at ON videos(created_at);
CREATE INDEX idx_videos_view_count ON videos(view_count);
CREATE INDEX idx_videos_like_count ON videos(like_count);

CREATE INDEX idx_video_likes_video_id ON video_likes(video_id);
CREATE INDEX idx_video_likes_user_id ON video_likes(user_id);

CREATE INDEX idx_video_comments_video_id ON video_comments(video_id);
CREATE INDEX idx_video_comments_parent_id ON video_comments(parent_id);
CREATE INDEX idx_video_comments_created_at ON video_comments(created_at);

CREATE INDEX idx_comment_likes_comment_id ON comment_likes(comment_id);

CREATE INDEX idx_video_views_video_id ON video_views(video_id);
CREATE INDEX idx_video_views_user_ip ON video_views(user_ip);

-- 创建触发器来更新视频的统计信息
GO

-- 更新视频点赞数
CREATE TRIGGER tr_video_likes_update_count
ON video_likes
AFTER INSERT, DELETE
AS
BEGIN
    UPDATE videos 
    SET like_count = (
        SELECT COUNT(*) 
        FROM video_likes 
        WHERE video_id = videos.id
    )
    WHERE id IN (
        SELECT video_id FROM inserted
        UNION
        SELECT video_id FROM deleted
    );
END
GO

-- 更新视频评论数
CREATE TRIGGER tr_video_comments_update_count
ON video_comments
AFTER INSERT, DELETE
AS
BEGIN
    UPDATE videos 
    SET comment_count = (
        SELECT COUNT(*) 
        FROM video_comments 
        WHERE video_id = videos.id AND status = 'active'
    )
    WHERE id IN (
        SELECT video_id FROM inserted
        UNION
        SELECT video_id FROM deleted
    );
END
GO

-- 更新评论点赞数
CREATE TRIGGER tr_comment_likes_update_count
ON comment_likes
AFTER INSERT, DELETE
AS
BEGIN
    UPDATE video_comments 
    SET like_count = (
        SELECT COUNT(*) 
        FROM comment_likes 
        WHERE comment_id = video_comments.id
    )
    WHERE id IN (
        SELECT comment_id FROM inserted
        UNION
        SELECT comment_id FROM deleted
    );
END
GO

-- 插入示例数据
INSERT INTO videos (title, description, created_by) VALUES
('示例视频1', '这是一个示例视频描述', 'admin'),
('示例视频2', '另一个示例视频', 'admin');

-- 插入示例评论
INSERT INTO video_comments (video_id, user_id, user_name, content) VALUES
(1, 'user1', '用户1', '这个视频很棒！'),
(1, 'user2', '用户2', '学到了很多，谢谢分享'),
(2, 'user3', '用户3', '内容很有用');

-- 插入示例点赞
INSERT INTO video_likes (video_id, user_id, user_ip) VALUES
(1, 'user1', '192.168.1.1'),
(1, 'user2', '192.168.1.2'),
(2, 'user1', '192.168.1.1'); 