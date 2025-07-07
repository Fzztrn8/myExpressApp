const db = require('../config/database');

class Like {
  // 视频点赞/取消点赞
  static async toggleVideoLike(videoId, userData) {
    try {
      const { user_id, user_ip, user_agent } = userData;

      // 检查是否已经点赞
      const checkQuery = 'SELECT id FROM video_likes WHERE video_id = @param1 AND user_id = @param2';
      const checkResult = await db.query(checkQuery, [videoId, user_id]);

      if (checkResult.recordset.length > 0) {
        // 已经点赞，取消点赞
        const deleteQuery = 'DELETE FROM video_likes WHERE video_id = @param1 AND user_id = @param2';
        await db.query(deleteQuery, [videoId, user_id]);
        return { action: 'unliked', message: '取消点赞成功' };
      } else {
        // 添加点赞
        const insertQuery = 'INSERT INTO video_likes (video_id, user_id, user_ip, user_agent) VALUES (@param1, @param2, @param3, @param4)';
        await db.query(insertQuery, [videoId, user_id, user_ip, user_agent || '']);
        return { action: 'liked', message: '点赞成功' };
      }
    } catch (error) {
      console.error('视频点赞操作失败:', error);
      throw error;
    }
  }

  // 检查用户是否已点赞视频
  static async hasUserLikedVideo(videoId, userId) {
    try {
      const sqlQuery = 'SELECT id FROM video_likes WHERE video_id = @param1 AND user_id = @param2';
      const result = await db.query(sqlQuery, [videoId, userId]);
      return result.recordset.length > 0;
    } catch (error) {
      console.error('检查视频点赞状态失败:', error);
      throw error;
    }
  }

  // 获取视频的点赞用户列表
  static async getVideoLikes(videoId, options = {}) {
    try {
      const { page = 1, limit = 20 } = options;
      const offset = (page - 1) * limit;
      
      const sqlQuery = `
        SELECT 
          vl.*,
          v.title as video_title
        FROM video_likes vl
        LEFT JOIN videos v ON vl.video_id = v.id
        WHERE vl.video_id = @param1
        ORDER BY vl.created_at DESC
        OFFSET @param2 ROWS FETCH NEXT @param3 ROWS ONLY
      `;
      
      const likes = await db.query(sqlQuery, [videoId, offset, limit]);
      
      // 获取总数
      const countQuery = 'SELECT COUNT(*) as total FROM video_likes WHERE video_id = @param1';
      const countResult = await db.query(countQuery, [videoId]);
      const total = countResult.recordset[0].total;
      
      return {
        likes: likes.recordset,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('获取视频点赞列表失败:', error);
      throw error;
    }
  }

  // 获取用户点赞的视频列表
  static async getUserLikedVideos(userId, options = {}) {
    try {
      const { page = 1, limit = 20 } = options;
      const offset = (page - 1) * limit;
      
      const sqlQuery = `
        SELECT 
          v.*,
          vl.created_at as liked_at
        FROM videos v
        INNER JOIN video_likes vl ON v.id = vl.video_id
        WHERE vl.user_id = @param1 
        AND v.status = 'active'
        ORDER BY vl.created_at DESC
        OFFSET @param2 ROWS FETCH NEXT @param3 ROWS ONLY
      `;
      
      const videos = await db.query(sqlQuery, [userId, offset, limit]);
      
      // 获取总数
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM video_likes vl
        INNER JOIN videos v ON vl.video_id = v.id
        WHERE vl.user_id = @param1 AND v.status = 'active'
      `;
      const countResult = await db.query(countQuery, [userId]);
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
      console.error('获取用户点赞视频失败:', error);
      throw error;
    }
  }

  // 获取视频点赞统计
  static async getVideoLikeStats(videoId) {
    try {
      const sqlQuery = `
        SELECT 
          COUNT(*) as total_likes,
          COUNT(DISTINCT user_id) as unique_users,
          COUNT(DISTINCT user_ip) as unique_ips,
          MIN(created_at) as first_like,
          MAX(created_at) as last_like
        FROM video_likes 
        WHERE video_id = @param1
      `;
      
      const result = await db.query(sqlQuery, [videoId]);
      return result.recordset[0] || null;
    } catch (error) {
      console.error('获取视频点赞统计失败:', error);
      throw error;
    }
  }

  // 批量获取视频点赞状态
  static async getBatchVideoLikeStatus(videoIds, userId) {
    try {
      if (!videoIds || videoIds.length === 0) {
        return {};
      }
      
      const placeholders = videoIds.map((_, index) => `@param${index + 1}`).join(',');
      const sqlQuery = `
        SELECT video_id, user_id 
        FROM video_likes 
        WHERE video_id IN (${placeholders}) AND user_id = @param${videoIds.length + 1}
      `;
      
      const params = [...videoIds, userId];
      const result = await db.query(sqlQuery, params);
      
      // 转换为对象格式
      const likeStatus = {};
      result.recordset.forEach(row => {
        likeStatus[row.video_id] = true;
      });
      
      return likeStatus;
    } catch (error) {
      console.error('批量获取视频点赞状态失败:', error);
      throw error;
    }
  }

  // 获取热门点赞视频（按点赞数排序）
  static async getMostLikedVideos(limit = 10, days = 30) {
    try {
      const sqlQuery = `
        SELECT 
          v.*,
          COUNT(vl.id) as recent_likes
        FROM videos v
        LEFT JOIN video_likes vl ON v.id = vl.video_id 
          AND vl.created_at >= DATEADD(day, -@param1, GETDATE())
        WHERE v.status = 'active'
        GROUP BY v.id, v.title, v.description, v.filename, v.file_path, v.file_size, 
                 v.duration, v.thumbnail, v.format, v.resolution, v.view_count, 
                 v.like_count, v.comment_count, v.status, v.created_by, v.created_at, v.updated_at
        ORDER BY recent_likes DESC, v.like_count DESC
        OFFSET 0 ROWS FETCH NEXT @param2 ROWS ONLY
      `;
      
      const result = await db.query(sqlQuery, [days, limit]);
      return result.recordset;
    } catch (error) {
      console.error('获取热门点赞视频失败:', error);
      throw error;
    }
  }

  // 删除用户的所有点赞（用于用户注销等场景）
  static async deleteUserLikes(userId) {
    try {
      const sqlQuery = 'DELETE FROM video_likes WHERE user_id = @param1';
      await db.query(sqlQuery, [userId]);
      return true;
    } catch (error) {
      console.error('删除用户点赞失败:', error);
      throw error;
    }
  }

  // 获取点赞趋势数据（用于统计图表）
  static async getLikeTrends(videoId, days = 7) {
    try {
      const sqlQuery = `
        SELECT 
          CAST(created_at AS DATE) as date,
          COUNT(*) as likes_count
        FROM video_likes 
        WHERE video_id = @param1 
        AND created_at >= DATEADD(day, -@param2, GETDATE())
        GROUP BY CAST(created_at AS DATE)
        ORDER BY date
      `;
      
      const result = await db.query(sqlQuery, [videoId, days]);
      return result.recordset;
    } catch (error) {
      console.error('获取点赞趋势失败:', error);
      throw error;
    }
  }
}

module.exports = Like; 