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

  // 创建视频
  static async createVideo(videoData) {
    try {
      const {
        title,
        description,
        filename,
        file_path,
        file_size,
        duration,
        thumbnail,
        format,
        resolution,
        created_by
      } = videoData;

      const sqlQuery = `
        INSERT INTO videos (title, description, filename, file_path, file_size, duration, thumbnail, format, resolution, created_by)
        VALUES (@param1, @param2, @param3, @param4, @param5, @param6, @param7, @param8, @param9, @param10);
        SELECT SCOPE_IDENTITY() as id;
      `;

      const result = await db.query(sqlQuery, [
        title,
        description || '',
        filename,
        file_path,
        file_size || 0,
        duration || 0,
        thumbnail || '',
        format || '',
        resolution || '',
        created_by || 'admin'
      ]);

      return result.recordset[0].id;
    } catch (error) {
      console.error('创建视频失败:', error);
      throw error;
    }
  }

  // 更新视频
  static async updateVideo(id, videoData) {
    try {
      const {
        title,
        description,
        filename,
        file_path,
        file_size,
        duration,
        thumbnail,
        format,
        resolution,
        status
      } = videoData;

      const sqlQuery = `
        UPDATE videos 
        SET title = @param1, 
            description = @param2, 
            filename = @param3, 
            file_path = @param4, 
            file_size = @param5, 
            duration = @param6, 
            thumbnail = @param7, 
            format = @param8, 
            resolution = @param9, 
            status = @param10,
            updated_at = GETDATE()
        WHERE id = @param11
      `;

      await db.query(sqlQuery, [
        title,
        description || '',
        filename,
        file_path,
        file_size || 0,
        duration || 0,
        thumbnail || '',
        format || '',
        resolution || '',
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
        AND (title LIKE @param2 OR description LIKE @param2)
        ORDER BY created_at DESC
        OFFSET @param3 ROWS FETCH NEXT @param4 ROWS ONLY
      `;
      
      const searchPattern = `%${searchTerm}%`;
      const videos = await db.query(sqlQuery, [status, searchPattern, offset, limit]);
      
      // 获取搜索结果总数
      const countQuery = `
        SELECT COUNT(*) as total FROM videos 
        WHERE status = @param1 
        AND (title LIKE @param2 OR description LIKE @param2)
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
      const sqlQuery = `
        SELECT 
          v.id,
          v.title,
          v.view_count,
          v.like_count,
          v.comment_count,
          COUNT(DISTINCT vl.user_id) as unique_likes,
          COUNT(DISTINCT vc.id) as total_comments,
          AVG(vw.view_duration) as avg_view_duration,
          COUNT(CASE WHEN vw.is_completed = 1 THEN 1 END) as completed_views
        FROM videos v
        LEFT JOIN video_likes vl ON v.id = vl.video_id
        LEFT JOIN video_comments vc ON v.id = vc.video_id AND vc.status = 'active'
        LEFT JOIN video_views vw ON v.id = vw.video_id
        WHERE v.id = @param1
        GROUP BY v.id, v.title, v.view_count, v.like_count, v.comment_count
      `;
      
      const result = await db.query(sqlQuery, [id]);
      return result.recordset[0] || null;
    } catch (error) {
      console.error('获取视频统计失败:', error);
      throw error;
    }
  }

  // 获取全局视频统计数据
  static async getGlobalVideoStats() {
    try {
      const stats = {};
      
      // 总视频数
      const totalVideosResult = await db.query('SELECT COUNT(*) as count FROM videos WHERE status = @param1', ['active']);
      stats.totalVideos = totalVideosResult.recordset[0].count;
      
      // 总观看次数
      const totalViewsResult = await db.query('SELECT SUM(view_count) as total FROM videos');
      stats.totalViews = totalViewsResult.recordset[0].total || 0;
      
      // 总点赞数
      const totalLikesResult = await db.query('SELECT COUNT(*) as count FROM video_likes');
      stats.totalLikes = totalLikesResult.recordset[0].count;
      
      // 总评论数
      const totalCommentsResult = await db.query('SELECT COUNT(*) as count FROM video_comments');
      stats.totalComments = totalCommentsResult.recordset[0].count;
      
      // 总存储空间
      const totalStorageResult = await db.query('SELECT SUM(file_size) as total FROM videos');
      stats.totalStorage = totalStorageResult.recordset[0].total || 0;
      
      // 平均文件大小
      const avgFileSizeResult = await db.query('SELECT AVG(file_size) as avg FROM videos');
      stats.avgFileSize = Math.round(avgFileSizeResult.recordset[0].avg || 0);
      
      // 活跃用户数（有观看记录的用户）
      const activeUsersResult = await db.query('SELECT COUNT(DISTINCT user_id) as count FROM video_views WHERE user_id IS NOT NULL');
      stats.activeUsers = activeUsersResult.recordset[0].count;
      
      // 平均观看时长
      const avgDurationResult = await db.query('SELECT AVG(view_duration) as avg FROM video_views WHERE view_duration > 0');
      stats.avgViewDuration = Math.round(avgDurationResult.recordset[0].avg || 0);
      
      return stats;
    } catch (error) {
      console.error('获取全局视频统计失败:', error);
      throw error;
    }
  }

  // 获取视频格式分布
  static async getFormatDistribution() {
    try {
      const query = `
        SELECT format, COUNT(*) as count 
        FROM videos 
        WHERE status = @param1
        GROUP BY format 
        ORDER BY count DESC
      `;
      const result = await db.query(query, ['active']);
      return result.recordset;
    } catch (error) {
      console.error('获取格式分布失败:', error);
      throw error;
    }
  }

  // 获取观看趋势数据
  static async getViewTrend(days = 30) {
    try {
      const query = `
        SELECT CAST(viewed_at AS DATE) as date, COUNT(*) as views
        FROM video_views 
        WHERE viewed_at >= DATEADD(day, -@param1, GETDATE())
        GROUP BY CAST(viewed_at AS DATE)
        ORDER BY date
      `;
      const result = await db.query(query, [days]);
      return result.recordset;
    } catch (error) {
      console.error('获取观看趋势失败:', error);
      throw error;
    }
  }
}

module.exports = Video; 