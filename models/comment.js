const db = require('../config/database');

class Comment {
  // 获取视频的评论列表
  static async getVideoComments(videoId, options = {}) {
    try {
      const { page = 1, limit = 20, parentId = null } = options;
      const offset = (page - 1) * limit;
      
      let sqlQuery = `
        SELECT 
          c.*,
          COUNT(cl.id) as like_count,
          COUNT(replies.id) as reply_count
        FROM video_comments c
        LEFT JOIN comment_likes cl ON c.id = cl.comment_id
        LEFT JOIN video_comments replies ON c.id = replies.parent_id AND replies.status = 'active'
        WHERE c.video_id = @param1 
        AND c.status = 'active'
        AND c.parent_id ${parentId === null ? 'IS NULL' : '= @param2'}
        GROUP BY c.id, c.video_id, c.parent_id, c.user_id, c.user_name, c.user_ip, c.content, c.status, c.created_at, c.updated_at
        ORDER BY c.created_at DESC
        OFFSET @param3 ROWS FETCH NEXT @param4 ROWS ONLY
      `;
      
      const params = parentId === null ? [videoId, offset, limit] : [videoId, parentId, offset, limit];
      const comments = await db.query(sqlQuery, params);
      
      // 获取评论总数
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM video_comments 
        WHERE video_id = @param1 
        AND status = 'active'
        AND parent_id ${parentId === null ? 'IS NULL' : '= @param2'}
      `;
      const countParams = parentId === null ? [videoId] : [videoId, parentId];
      const countResult = await db.query(countQuery, countParams);
      const total = countResult.recordset[0].total;
      
      return {
        comments: comments.recordset,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('获取评论列表失败:', error);
      throw error;
    }
  }

  // 根据ID获取评论
  static async getCommentById(id) {
    try {
      const sqlQuery = 'SELECT * FROM video_comments WHERE id = @param1 AND status = @param2';
      const result = await db.query(sqlQuery, [id, 'active']);
      return result.recordset[0] || null;
    } catch (error) {
      console.error('获取评论失败:', error);
      throw error;
    }
  }

  // 创建评论
  static async createComment(commentData) {
    try {
      const {
        video_id,
        parent_id,
        user_id,
        user_name,
        user_ip,
        content
      } = commentData;

      const sqlQuery = `
        INSERT INTO video_comments (video_id, parent_id, user_id, user_name, user_ip, content)
        VALUES (@param1, @param2, @param3, @param4, @param5, @param6);
        SELECT SCOPE_IDENTITY() as id;
      `;

      const result = await db.query(sqlQuery, [
        video_id,
        parent_id || null,
        user_id,
        user_name || '匿名用户',
        user_ip,
        content
      ]);

      // 兼容mssql多语句返回结构
      let id = undefined;
      if (result.recordset && result.recordset[0] && result.recordset[0].id) {
        id = result.recordset[0].id;
      } else if (result.recordsets && result.recordsets[1] && result.recordsets[1][0] && result.recordsets[1][0].id) {
        id = result.recordsets[1][0].id;
      }
      if (!id) throw new Error('插入评论后未能获取新ID');
      return id;
    } catch (error) {
      console.error('创建评论失败:', error);
      throw error;
    }
  }

  // 更新评论
  static async updateComment(id, commentData) {
    try {
      const { content, status } = commentData;

      const sqlQuery = `
        UPDATE video_comments 
        SET content = @param1, 
            status = @param2,
            updated_at = GETDATE()
        WHERE id = @param3
      `;

      await db.query(sqlQuery, [
        content,
        status || 'active',
        id
      ]);

      return true;
    } catch (error) {
      console.error('更新评论失败:', error);
      throw error;
    }
  }

  // 删除评论（软删除）
  static async deleteComment(id) {
    try {
      const sqlQuery = 'UPDATE video_comments SET status = @param1, updated_at = GETDATE() WHERE id = @param2';
      await db.query(sqlQuery, ['deleted', id]);
      return true;
    } catch (error) {
      console.error('删除评论失败:', error);
      throw error;
    }
  }

  // 点赞评论
  static async likeComment(commentId, userData) {
    try {
      const { user_id, user_ip } = userData;

      // 检查是否已经点赞
      const checkQuery = 'SELECT id FROM comment_likes WHERE comment_id = @param1 AND user_id = @param2';
      const checkResult = await db.query(checkQuery, [commentId, user_id]);

      if (checkResult.recordset.length > 0) {
        // 已经点赞，取消点赞
        const deleteQuery = 'DELETE FROM comment_likes WHERE comment_id = @param1 AND user_id = @param2';
        await db.query(deleteQuery, [commentId, user_id]);
        return { action: 'unliked', message: '取消点赞成功' };
      } else {
        // 添加点赞
        const insertQuery = 'INSERT INTO comment_likes (comment_id, user_id, user_ip) VALUES (@param1, @param2, @param3)';
        await db.query(insertQuery, [commentId, user_id, user_ip]);
        return { action: 'liked', message: '点赞成功' };
      }
    } catch (error) {
      console.error('点赞评论失败:', error);
      throw error;
    }
  }

  // 检查用户是否已点赞评论
  static async hasUserLikedComment(commentId, userId) {
    try {
      const sqlQuery = 'SELECT id FROM comment_likes WHERE comment_id = @param1 AND user_id = @param2';
      const result = await db.query(sqlQuery, [commentId, userId]);
      return result.recordset.length > 0;
    } catch (error) {
      console.error('检查点赞状态失败:', error);
      throw error;
    }
  }

  // 获取评论的回复列表
  static async getCommentReplies(commentId, options = {}) {
    try {
      const { page = 1, limit = 10 } = options;
      const offset = (page - 1) * limit;
      
      const sqlQuery = `
        SELECT 
          c.*,
          COUNT(cl.id) as like_count
        FROM video_comments c
        LEFT JOIN comment_likes cl ON c.id = cl.comment_id
        WHERE c.parent_id = @param1 
        AND c.status = 'active'
        GROUP BY c.id, c.video_id, c.parent_id, c.user_id, c.user_name, c.user_ip, c.content, c.status, c.created_at, c.updated_at
        ORDER BY c.created_at ASC
        OFFSET @param2 ROWS FETCH NEXT @param3 ROWS ONLY
      `;
      
      const replies = await db.query(sqlQuery, [commentId, offset, limit]);
      
      // 获取回复总数
      const countQuery = 'SELECT COUNT(*) as total FROM video_comments WHERE parent_id = @param1 AND status = @param2';
      const countResult = await db.query(countQuery, [commentId, 'active']);
      const total = countResult.recordset[0].total;
      
      return {
        replies: replies.recordset,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('获取评论回复失败:', error);
      throw error;
    }
  }

  // 获取用户的所有评论
  static async getUserComments(userId, options = {}) {
    try {
      const { page = 1, limit = 20 } = options;
      const offset = (page - 1) * limit;
      
      const sqlQuery = `
        SELECT 
          c.*,
          v.title as video_title,
          v.thumbnail as video_thumbnail,
          COUNT(cl.id) as like_count
        FROM video_comments c
        LEFT JOIN videos v ON c.video_id = v.id
        LEFT JOIN comment_likes cl ON c.id = cl.comment_id
        WHERE c.user_id = @param1 
        AND c.status = 'active'
        GROUP BY c.id, c.video_id, c.parent_id, c.user_id, c.user_name, c.user_ip, c.content, c.status, c.created_at, c.updated_at, v.title, v.thumbnail
        ORDER BY c.created_at DESC
        OFFSET @param2 ROWS FETCH NEXT @param3 ROWS ONLY
      `;
      
      const comments = await db.query(sqlQuery, [userId, offset, limit]);
      
      // 获取总数
      const countQuery = 'SELECT COUNT(*) as total FROM video_comments WHERE user_id = @param1 AND status = @param2';
      const countResult = await db.query(countQuery, [userId, 'active']);
      const total = countResult.recordset[0].total;
      
      return {
        comments: comments.recordset,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('获取用户评论失败:', error);
      throw error;
    }
  }

  // 获取热门评论
  static async getPopularComments(videoId, limit = 5) {
    try {
      const sqlQuery = `
        SELECT 
          c.*,
          COUNT(cl.id) as like_count,
          COUNT(replies.id) as reply_count
        FROM video_comments c
        LEFT JOIN comment_likes cl ON c.id = cl.comment_id
        LEFT JOIN video_comments replies ON c.id = replies.parent_id AND replies.status = 'active'
        WHERE c.video_id = @param1 
        AND c.status = 'active'
        AND c.parent_id IS NULL
        GROUP BY c.id, c.video_id, c.parent_id, c.user_id, c.user_name, c.user_ip, c.content, c.status, c.created_at, c.updated_at
        ORDER BY like_count DESC, reply_count DESC, c.created_at DESC
        OFFSET 0 ROWS FETCH NEXT @param2 ROWS ONLY
      `;
      
      const result = await db.query(sqlQuery, [videoId, limit]);
      return result.recordset;
    } catch (error) {
      console.error('获取热门评论失败:', error);
      throw error;
    }
  }
}

module.exports = Comment; 