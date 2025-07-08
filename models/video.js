const db = require('../config/database');

class Video {
  // 获取所有视频
  static async getAllVideos(options = {}) {
    try {
      const { page = 1, limit = 10, status = 'active', sortBy = 'created_at', sortOrder = 'DESC' } = options;
      const offset = (page - 1) * limit;
      
      let sqlQuery = `
        SELECT * FROM videos 
        WHERE status = @param1
        ORDER BY ${sortBy} ${sortOrder}
        OFFSET @param2 ROWS FETCH NEXT @param3 ROWS ONLY
      `;
      
      const videos = await db.query(sqlQuery, [status, offset, limit]);
      
      // 获取总数
      const countQuery = 'SELECT COUNT(*) as total FROM videos WHERE status = @param1';
      const countResult = await db.query(countQuery, [status]);
      const total = countResult.recordset[0].total;
      
      return {
        videos: videos.recordset,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('获取视频列表失败:', error);
      throw error;
    }
  }

  // 根据ID获取视频
  static async getVideoById(id) {
    try {
      const sqlQuery = 'SELECT * FROM videos WHERE id = @param1 AND status != @param2';
      const result = await db.query(sqlQuery, [id, 'deleted']);
      return result.recordset[0] || null;
    } catch (error) {
      console.error('获取视频失败:', error);
      throw error;
    }
  }

  // 创建视频记录
  static async createVideo(videoData) {
    try {
      const {
        video_id, // 视频ID
        title,
        description,
        platform, // 视频平台（local, youtube, bilibili, etc.）
        thumbnail, // 缩略图URL
        duration, // 视频时长（秒）
        view_count = 0, // 观看次数
        like_count = 0, // 点赞数
        comment_count = 0, // 评论数
        created_by
      } = videoData;

      const sqlQuery = `
        INSERT INTO videos (video_id, title, description, platform, thumbnail, duration, view_count, like_count, comment_count, created_by)
        VALUES (@param1, @param2, @param3, @param4, @param5, @param6, @param7, @param8, @param9, @param10);
        SELECT SCOPE_IDENTITY() as id;
      `;

      const result = await db.query(sqlQuery, [
        video_id,
        title,
        description || '',
        platform || 'local',
        thumbnail || '',
        duration || 0,
        view_count,
        like_count,
        comment_count,
        created_by || 'admin'
      ]);

      return result.recordset[0].id;
    } catch (error) {
      console.error('创建视频记录失败:', error);
      throw error;
    }
  }

  // 更新视频信息
  static async updateVideo(id, videoData) {
    try {
      const {
        title,
        description,
        platform,
        thumbnail,
        duration,
        view_count,
        like_count,
        comment_count,
        status
      } = videoData;

      const sqlQuery = `
        UPDATE videos 
        SET title = @param1, 
            description = @param2, 
            platform = @param3, 
            thumbnail = @param4, 
            duration = @param5, 
            view_count = @param6, 
            like_count = @param7, 
            comment_count = @param8, 
            status = @param9,
            updated_at = GETDATE()
        WHERE id = @param10
      `;

      await db.query(sqlQuery, [
        title,
        description || '',
        platform || 'local',
        thumbnail || '',
        duration || 0,
        view_count || 0,
        like_count || 0,
        comment_count || 0,
        status || 'active',
        id
      ]);

      return true;
    } catch (error) {
      console.error('更新视频失败:', error);
      throw error;
    }
  }

  // 删除视频（软删除）
  static async deleteVideo(id) {
    try {
      const sqlQuery = 'UPDATE videos SET status = @param1, updated_at = GETDATE() WHERE id = @param2';
      await db.query(sqlQuery, ['deleted', id]);
      return true;
    } catch (error) {
      console.error('删除视频失败:', error);
      throw error;
    }
  }

  // 增加观看次数
  static async incrementViewCount(id) {
    try {
      const sqlQuery = 'UPDATE videos SET view_count = view_count + 1 WHERE id = @param1';
      await db.query(sqlQuery, [id]);
      return true;
    } catch (error) {
      console.error('增加观看次数失败:', error);
      throw error;
    }
  }

  // 更新点赞数
  static async updateLikeCount(id, likeCount) {
    try {
      const sqlQuery = 'UPDATE videos SET like_count = @param1 WHERE id = @param2';
      await db.query(sqlQuery, [likeCount, id]);
      return true;
    } catch (error) {
      console.error('更新点赞数失败:', error);
      throw error;
    }
  }

  // 更新评论数
  static async updateCommentCount(id, commentCount) {
    try {
      const sqlQuery = 'UPDATE videos SET comment_count = @param1 WHERE id = @param2';
      await db.query(sqlQuery, [commentCount, id]);
      return true;
    } catch (error) {
      console.error('更新评论数失败:', error);
      throw error;
    }
  }

  // 记录观看记录
  static async recordView(videoId, userData) {
    try {
      const { user_id, user_ip, user_agent, view_duration, is_completed } = userData;
      
      const sqlQuery = `
        INSERT INTO video_views (video_id, user_id, user_ip, user_agent, view_duration, is_completed)
        VALUES (@param1, @param2, @param3, @param4, @param5, @param6)
      `;

      await db.query(sqlQuery, [
        videoId,
        user_id || null,
        user_ip,
        user_agent || '',
        view_duration || 0,
        is_completed || false
      ]);

      return true;
    } catch (error) {
      console.error('记录观看记录失败:', error);
      throw error;
    }
  }

  // 搜索视频
  static async searchVideos(searchTerm, options = {}) {
    try {
      const { page = 1, limit = 10, status = 'active' } = options;
      const offset = (page - 1) * limit;
      
      const sqlQuery = `
        SELECT * FROM videos 
        WHERE status = @param1 
        AND (title LIKE @param2 OR description LIKE @param2 OR video_id LIKE @param2)
        ORDER BY created_at DESC
        OFFSET @param3 ROWS FETCH NEXT @param4 ROWS ONLY
      `;
      
      const searchPattern = `%${searchTerm}%`;
      const videos = await db.query(sqlQuery, [status, searchPattern, offset, limit]);
      
      // 获取总数
      const countQuery = `
        SELECT COUNT(*) as total FROM videos 
        WHERE status = @param1 
        AND (title LIKE @param2 OR description LIKE @param2 OR video_id LIKE @param2)
      `;
      const countResult = await db.query(countQuery, [status, searchPattern]);
      const total = countResult.recordset[0].total;
      
      return {
        videos: videos.recordset,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('搜索视频失败:', error);
      throw error;
    }
  }

  // 获取热门视频
  static async getPopularVideos(limit = 10) {
    try {
      const sqlQuery = `
        SELECT * FROM videos 
        WHERE status = 'active' 
        ORDER BY view_count DESC, like_count DESC 
        OFFSET 0 ROWS FETCH NEXT @param1 ROWS ONLY
      `;
      
      const result = await db.query(sqlQuery, [limit]);
      return result.recordset;
    } catch (error) {
      console.error('获取热门视频失败:', error);
      throw error;
    }
  }

  // 获取最新视频
  static async getLatestVideos(limit = 10) {
    try {
      const sqlQuery = `
        SELECT * FROM videos 
        WHERE status = 'active' 
        ORDER BY created_at DESC 
        OFFSET 0 ROWS FETCH NEXT @param1 ROWS ONLY
      `;
      
      const result = await db.query(sqlQuery, [limit]);
      return result.recordset;
    } catch (error) {
      console.error('获取最新视频失败:', error);
      throw error;
    }
  }

  // 获取视频统计信息
  static async getVideoStats(id) {
    try {
      const video = await this.getVideoById(id);
      if (!video) {
        throw new Error('视频不存在');
      }

      // 获取观看记录统计
      const viewStatsQuery = `
        SELECT 
          COUNT(*) as total_views,
          COUNT(DISTINCT user_id) as unique_viewers,
          AVG(view_duration) as avg_duration,
          COUNT(CASE WHEN is_completed = 1 THEN 1 END) as completed_views
        FROM video_views 
        WHERE video_id = @param1
      `;
      
      const viewStats = await db.query(viewStatsQuery, [id]);
      
      return {
        video: video,
        stats: {
          ...viewStats.recordset[0],
          like_count: video.like_count,
          comment_count: video.comment_count
        }
      };
    } catch (error) {
      console.error('获取视频统计失败:', error);
      throw error;
    }
  }

  // 获取全局视频统计
  static async getGlobalVideoStats() {
    try {
      const sqlQuery = `
        SELECT 
          COUNT(*) as total_videos,
          SUM(view_count) as total_views,
          SUM(like_count) as total_likes,
          SUM(comment_count) as total_comments,
          AVG(duration) as avg_duration,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_videos
        FROM videos 
        WHERE status != 'deleted'
      `;
      
      const result = await db.query(sqlQuery);
      return result.recordset[0];
    } catch (error) {
      console.error('获取全局视频统计失败:', error);
      throw error;
    }
  }

  // 获取平台分布统计
  static async getPlatformDistribution() {
    try {
      const sqlQuery = `
        SELECT 
          platform,
          COUNT(*) as count,
          SUM(view_count) as total_views,
          SUM(like_count) as total_likes
        FROM videos 
        WHERE status = 'active'
        GROUP BY platform
        ORDER BY count DESC
      `;
      
      const result = await db.query(sqlQuery);
      return result.recordset;
    } catch (error) {
      console.error('获取平台分布统计失败:', error);
      throw error;
    }
  }

  // 获取观看趋势
  static async getViewTrend(days = 30) {
    try {
      const sqlQuery = `
        SELECT 
          CAST(view_date AS DATE) as date,
          COUNT(*) as views,
          COUNT(DISTINCT user_id) as unique_viewers
        FROM video_views 
        WHERE view_date >= DATEADD(day, -@param1, GETDATE())
        GROUP BY CAST(view_date AS DATE)
        ORDER BY date DESC
      `;
      
      const result = await db.query(sqlQuery, [days]);
      return result.recordset;
    } catch (error) {
      console.error('获取观看趋势失败:', error);
      throw error;
    }
  }

  // 根据外部视频ID查找视频
  static async findByExternalId(videoId, platform) {
    try {
      const sqlQuery = 'SELECT * FROM videos WHERE video_id = @param1 AND platform = @param2 AND status != @param3';
      const result = await db.query(sqlQuery, [videoId, platform, 'deleted']);
      return result.recordset[0] || null;
    } catch (error) {
      console.error('根据外部ID查找视频失败:', error);
      throw error;
    }
  }

  // 批量更新视频统计信息
  static async batchUpdateStats(videoStats) {
    try {
      for (const stat of videoStats) {
        const { id, view_count, like_count, comment_count } = stat;
        await this.updateVideo(id, { view_count, like_count, comment_count });
      }
      return true;
    } catch (error) {
      console.error('批量更新视频统计失败:', error);
      throw error;
    }
  }
}

module.exports = Video; 