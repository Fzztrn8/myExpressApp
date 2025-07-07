 const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Video = require('../models/video');
const Comment = require('../models/comment');
const Like = require('../models/like');

// 配置multer用于文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'public/uploads/videos';
    // 确保目录存在
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // 生成唯一文件名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB限制
  },
  fileFilter: function (req, file, cb) {
    // 只允许视频文件
    const allowedTypes = /mp4|avi|mov|wmv|flv|mkv|webm/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('只允许上传视频文件！'));
    }
  }
});

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

// 上传视频
router.post('/upload', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请选择要上传的视频文件'
      });
    }
    
    const { title, description } = req.body;
    
    if (!title) {
      return res.status(400).json({
        success: false,
        message: '视频标题是必填项'
      });
    }
    
    // 获取文件信息
    const fileStats = fs.statSync(req.file.path);
    const fileSize = fileStats.size;
    const filename = req.file.filename;
    const filePath = `/uploads/videos/${filename}`;
    
    // 创建视频记录
    const videoData = {
      title,
      description: description || '',
      filename,
      file_path: filePath,
      file_size: fileSize,
      duration: 0, // 可以通过ffmpeg等工具获取
      format: path.extname(filename).substring(1),
      resolution: '', // 可以通过ffmpeg等工具获取
      created_by: req.session.userId || 'anonymous'
    };
    
    const videoId = await Video.createVideo(videoData);
    
    res.json({
      success: true,
      message: '视频上传成功',
      data: {
        id: videoId,
        title,
        file_path: filePath
      }
    });
  } catch (error) {
    console.error('视频上传失败:', error);
    res.status(500).json({
      success: false,
      message: '视频上传失败',
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

// 视频点赞/取消点赞
router.post('/:id/like', async (req, res) => {
  try {
    const videoId = req.params.id;
    const userIp = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    
    // 生成用户ID（基于IP和时间戳）
    const userId = `user_${userIp.replace(/[.:]/g, '_')}_${Date.now()}`;
    
    const result = await Like.toggleVideoLike(videoId, {
      user_id: userId,
      user_ip: userIp,
      user_agent: userAgent
    });
    
    res.json({
      success: true,
      message: result.message,
      action: result.action
    });
  } catch (error) {
    console.error('视频点赞失败:', error);
    res.status(500).json({
      success: false,
      message: '视频点赞失败',
      error: error.message
    });
  }
});

// 检查用户是否已点赞视频
router.get('/:id/like/status', async (req, res) => {
  try {
    const videoId = req.params.id;
    const userIp = req.ip || req.connection.remoteAddress;
    const userId = `user_${userIp.replace(/[.:]/g, '_')}_${Date.now()}`;
    
    const hasLiked = await Like.hasUserLikedVideo(videoId, userId);
    
    res.json({
      success: true,
      hasLiked
    });
  } catch (error) {
    console.error('检查点赞状态失败:', error);
    res.status(500).json({
      success: false,
      message: '检查点赞状态失败',
      error: error.message
    });
  }
});

// 获取视频统计信息
router.get('/:id/stats', async (req, res) => {
  try {
    const videoId = req.params.id;
    const stats = await Video.getVideoStats(videoId);
    
    if (!stats) {
      return res.status(404).json({
        success: false,
        message: '视频不存在'
      });
    }
    
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

// 获取视频评论列表
router.get('/:id/comments', async (req, res) => {
  try {
    const videoId = req.params.id;
    const { page = 1, limit = 20, parentId } = req.query;
    
    const result = await Comment.getVideoComments(videoId, {
      page: parseInt(page),
      limit: parseInt(limit),
      parentId: parentId ? parseInt(parentId) : null
    });
    
    res.json({
      success: true,
      data: result.comments,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('获取评论列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取评论列表失败',
      error: error.message
    });
  }
});

// 添加评论
router.post('/:id/comments', async (req, res) => {
  try {
    const videoId = req.params.id;
    const { content, parentId, userName } = req.body;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: '评论内容不能为空'
      });
    }
    
    const userIp = req.ip || req.connection.remoteAddress;
    const userId = `user_${userIp.replace(/[.:]/g, '_')}_${Date.now()}`;
    
    const commentData = {
      video_id: videoId,
      parent_id: parentId ? parseInt(parentId) : null,
      user_id: userId,
      user_name: userName || '匿名用户',
      user_ip: userIp,
      content: content.trim()
    };
    
    const commentId = await Comment.createComment(commentData);
    
    res.json({
      success: true,
      message: '评论发布成功',
      data: { id: commentId }
    });
  } catch (error) {
    console.error('发布评论失败:', error);
    res.status(500).json({
      success: false,
      message: '发布评论失败',
      error: error.message
    });
  }
});

// 评论点赞
router.post('/comments/:commentId/like', async (req, res) => {
  try {
    const commentId = req.params.commentId;
    const userIp = req.ip || req.connection.remoteAddress;
    const userId = `user_${userIp.replace(/[.:]/g, '_')}_${Date.now()}`;
    
    const result = await Comment.likeComment(commentId, {
      user_id: userId,
      user_ip: userIp
    });
    
    res.json({
      success: true,
      message: result.message,
      action: result.action
    });
  } catch (error) {
    console.error('评论点赞失败:', error);
    res.status(500).json({
      success: false,
      message: '评论点赞失败',
      error: error.message
    });
  }
});

// 获取评论回复
router.get('/comments/:commentId/replies', async (req, res) => {
  try {
    const commentId = req.params.commentId;
    const { page = 1, limit = 10 } = req.query;
    
    const result = await Comment.getCommentReplies(commentId, {
      page: parseInt(page),
      limit: parseInt(limit)
    });
    
    res.json({
      success: true,
      data: result.replies,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('获取评论回复失败:', error);
    res.status(500).json({
      success: false,
      message: '获取评论回复失败',
      error: error.message
    });
  }
});

module.exports = router; 