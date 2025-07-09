const express = require('express');
const router = express.Router();
const Video = require('../models/video');
const Comment = require('../models/comment');
const Like = require('../models/like');

// 获取视频列表
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 12, sortBy = 'created_at', sortOrder = 'DESC' } = req.query;
    
    const result = await Video.getAllVideos({
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder
    });
    
    res.json({
      success: true,
      data: result.videos,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('获取视频列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取视频列表失败',
      error: error.message
    });
  }
});

// 获取单个视频详情
router.get('/:id', async (req, res) => {
  try {
    const videoId = req.params.id;
    const video = await Video.getVideoById(videoId);
    
    if (!video) {
      return res.status(404).json({
        success: false,
        message: '视频不存在'
      });
    }
    
    // 增加观看次数
    await Video.incrementViewCount(videoId);
    
    // 记录观看记录
    const userIp = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    await Video.recordView(videoId, {
      user_id: req.session.userId || null,
      user_ip: userIp,
      user_agent: userAgent
    });
    
    res.json({
      success: true,
      data: video
    });
  } catch (error) {
    console.error('获取视频详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取视频详情失败',
      error: error.message
    });
  }
});

// 添加视频记录
router.post('/', async (req, res) => {
  try {
    const { 
      video_id, 
      title, 
      description, 
      platform, 
      thumbnail, 
      duration,
      view_count = 0,
      like_count = 0,
      comment_count = 0
    } = req.body;
    
    if (!video_id || !title) {
      return res.status(400).json({
        success: false,
        message: '视频ID和标题是必填项'
      });
    }
    
    // 检查是否已存在相同的视频ID
    const existingVideo = await Video.findByExternalId(video_id, platform || 'local');
    if (existingVideo) {
      return res.status(400).json({
        success: false,
        message: '该视频已存在'
      });
    }
    
    // 创建视频记录
    const videoData = {
      video_id,
      title,
      description: description || '',
      platform: platform || 'local',
      thumbnail: thumbnail || '',
      duration: duration || 0,
      view_count,
      like_count,
      comment_count,
      created_by: req.session.userId || 'admin'
    };
    
    const newVideoId = await Video.createVideo(videoData);
    
    res.json({
      success: true,
      message: '视频记录添加成功',
      data: {
        id: newVideoId,
        video_id,
        title,
        platform
      }
    });
  } catch (error) {
    console.error('添加视频记录失败:', error);
    res.status(500).json({
      success: false,
      message: '添加视频记录失败',
      error: error.message
    });
  }
});

// 更新视频信息
router.put('/:id', async (req, res) => {
  try {
    const videoId = req.params.id;
    const updateData = req.body;
    
    // 检查视频是否存在
    const existingVideo = await Video.getVideoById(videoId);
    if (!existingVideo) {
      return res.status(404).json({
        success: false,
        message: '视频不存在'
      });
    }
    
    // 更新视频信息
    await Video.updateVideo(videoId, updateData);
    
    res.json({
      success: true,
      message: '视频信息更新成功'
    });
  } catch (error) {
    console.error('更新视频信息失败:', error);
    res.status(500).json({
      success: false,
      message: '更新视频信息失败',
      error: error.message
    });
  }
});

// 删除视频
router.delete('/:id', async (req, res) => {
  try {
    const videoId = req.params.id;
    
    // 检查视频是否存在
    const existingVideo = await Video.getVideoById(videoId);
    if (!existingVideo) {
      return res.status(404).json({
        success: false,
        message: '视频不存在'
      });
    }
    
    // 软删除视频
    await Video.deleteVideo(videoId);
    
    res.json({
      success: true,
      message: '视频删除成功'
    });
  } catch (error) {
    console.error('删除视频失败:', error);
    res.status(500).json({
      success: false,
      message: '删除视频失败',
      error: error.message
    });
  }
});

// 搜索视频
router.get('/search/:keyword', async (req, res) => {
  try {
    const { keyword } = req.params;
    const { page = 1, limit = 12 } = req.query;
    
    const result = await Video.searchVideos(keyword, {
      page: parseInt(page),
      limit: parseInt(limit)
    });
    
    res.json({
      success: true,
      data: result.videos,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('搜索视频失败:', error);
    res.status(500).json({
      success: false,
      message: '搜索视频失败',
      error: error.message
    });
  }
});

// 获取热门视频
router.get('/popular/:limit?', async (req, res) => {
  try {
    const limit = parseInt(req.params.limit) || 10;
    const videos = await Video.getPopularVideos(limit);
    
    res.json({
      success: true,
      data: videos
    });
  } catch (error) {
    console.error('获取热门视频失败:', error);
    res.status(500).json({
      success: false,
      message: '获取热门视频失败',
      error: error.message
    });
  }
});

// 获取最新视频
router.get('/latest/:limit?', async (req, res) => {
  try {
    const limit = parseInt(req.params.limit) || 10;
    const videos = await Video.getLatestVideos(limit);
    
    res.json({
      success: true,
      data: videos
    });
  } catch (error) {
    console.error('获取最新视频失败:', error);
    res.status(500).json({
      success: false,
      message: '获取最新视频失败',
      error: error.message
    });
  }
});

// 获取视频统计信息
router.get('/:id/stats', async (req, res) => {
  try {
    const videoId = req.params.id;
    const stats = await Video.getVideoStats(videoId);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('获取视频统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取视频统计失败',
      error: error.message
    });
  }
});

// 更新视频统计信息（点赞数、评论数等）
router.patch('/:id/stats', async (req, res) => {
  try {
    const videoId = req.params.id;
    const { view_count, like_count, comment_count } = req.body;
    
    // 检查视频是否存在
    const existingVideo = await Video.getVideoById(videoId);
    if (!existingVideo) {
      return res.status(404).json({
        success: false,
        message: '视频不存在'
      });
    }
    
    // 更新统计信息
    const updateData = {};
    if (view_count !== undefined) updateData.view_count = view_count;
    if (like_count !== undefined) updateData.like_count = like_count;
    if (comment_count !== undefined) updateData.comment_count = comment_count;
    
    await Video.updateVideo(videoId, updateData);
    
    res.json({
      success: true,
      message: '视频统计信息更新成功'
    });
  } catch (error) {
    console.error('更新视频统计失败:', error);
    res.status(500).json({
      success: false,
      message: '更新视频统计失败',
      error: error.message
    });
  }
});

// 批量更新视频统计信息
router.patch('/batch/stats', async (req, res) => {
  try {
    const { videoStats } = req.body;
    
    if (!Array.isArray(videoStats) || videoStats.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的视频统计数据'
      });
    }
    
    await Video.batchUpdateStats(videoStats);
    
    res.json({
      success: true,
      message: `成功更新 ${videoStats.length} 个视频的统计信息`
    });
  } catch (error) {
    console.error('批量更新视频统计失败:', error);
    res.status(500).json({
      success: false,
      message: '批量更新视频统计失败',
      error: error.message
    });
  }
});

// 获取平台分布统计
router.get('/stats/platforms', async (req, res) => {
  try {
    const stats = await Video.getPlatformDistribution();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('获取平台分布统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取平台分布统计失败',
      error: error.message
    });
  }
});

// 获取观看趋势
router.get('/stats/trend/:days?', async (req, res) => {
  try {
    const days = parseInt(req.params.days) || 30;
    const trend = await Video.getViewTrend(days);
    
    res.json({
      success: true,
      data: trend
    });
  } catch (error) {
    console.error('获取观看趋势失败:', error);
    res.status(500).json({
      success: false,
      message: '获取观看趋势失败',
      error: error.message
    });
  }
});

// 获取视频评论列表
router.get('/:id/comments', async (req, res) => {
  try {
    const videoId = req.params.id;
    const { page = 1, limit = 20, parent_id = null } = req.query;
    const result = await Comment.getVideoComments(videoId, {
      page: parseInt(page),
      limit: parseInt(limit),
      parentId: parent_id === null ? null : parseInt(parent_id)
    });
    res.json({
      success: true,
      data: result.comments,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('获取视频评论失败:', error);
    res.status(500).json({ success: false, message: '获取评论失败', error: error.message });
  }
});

// 添加视频评论
router.post('/:id/comments', async (req, res) => {
  try {
    const videoId = req.params.id;
    const { parent_id, content } = req.body;
    const user_id = req.session.userId || 'guest';
    const user_name = req.session.username || '匿名用户';
    const user_ip = req.ip || req.connection.remoteAddress;
    if (!content) {
      return res.status(400).json({ success: false, message: '评论内容不能为空' });
    }
    const commentData = {
      video_id: videoId,
      parent_id: parent_id || null,
      user_id,
      user_name,
      user_ip,
      content
    };
    const commentId = await Comment.createComment(commentData);
    res.json({ success: true, message: '评论发布成功', data: { id: commentId } });
  } catch (error) {
    console.error('添加评论失败:', error);
    res.status(500).json({ success: false, message: '添加评论失败', error: error.message });
  }
});

// 删除视频评论（软删除）
router.delete('/comments/:commentId', async (req, res) => {
  try {
    const commentId = req.params.commentId;
    await Comment.deleteComment(commentId);
    res.json({ success: true, message: '评论删除成功' });
  } catch (error) {
    console.error('删除评论失败:', error);
    res.status(500).json({ success: false, message: '删除评论失败', error: error.message });
  }
});

// 获取单条评论详情
router.get('/comments/:commentId', async (req, res) => {
  try {
    const commentId = req.params.commentId;
    const comment = await Comment.getCommentById(commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: '评论不存在' });
    }
    res.json({ success: true, data: comment });
  } catch (error) {
    console.error('获取评论详情失败:', error);
    res.status(500).json({ success: false, message: '获取评论详情失败', error: error.message });
  }
});

// 评论点赞/取消点赞
router.post('/comments/:commentId/like', async (req, res) => {
  try {
    const commentId = req.params.commentId;
    const user_id = req.session.userId || 'guest';
    const user_ip = req.ip || req.connection.remoteAddress;
    const result = await Comment.likeComment(commentId, { user_id, user_ip });
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('评论点赞失败:', error);
    res.status(500).json({ success: false, message: '评论点赞失败', error: error.message });
  }
});

module.exports = router; 