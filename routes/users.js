var express = require('express');
var router = express.Router();
const User = require('../models/user');

// 中间件：验证JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: '访问令牌缺失' 
    });
  }

  const decoded = User.verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ 
      success: false, 
      message: '访问令牌无效或已过期' 
    });
  }

  req.user = decoded;
  next();
};

// 中间件：验证管理员权限
const requireAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.username !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: '需要管理员权限' 
      });
    }
    next();
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: '权限验证失败' 
    });
  }
};

// 初始化用户表
router.post('/init', async (req, res) => {
  try {
    const result = await User.createTable();
    if (result) {
      res.json({ 
        success: true, 
        message: '用户表初始化成功' 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: '用户表初始化失败' 
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: '初始化失败', 
      error: error.message 
    });
  }
});

// 用户注册
router.post('/register', async (req, res) => {
  try {
    const { username, password, email, phone } = req.body;
    
    const user = await User.register({ username, password, email, phone });
    
    res.status(201).json({
      success: true,
      message: '注册成功',
      data: user
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// 用户登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const result = await User.login(username, password);
    
    res.json({
      success: true,
      message: '登录成功',
      data: result
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message
    });
  }
});

// 获取当前用户信息
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取用户信息失败',
      error: error.message
    });
  }
});

// 更新用户信息
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { email, phone } = req.body;
    
    const updatedUser = await User.updateUser(req.user.id, { email, phone });
    
    res.json({
      success: true,
      message: '用户信息更新成功',
      data: updatedUser
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// 修改密码
router.put('/password', authenticateToken, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    
    const result = await User.changePassword(req.user.id, oldPassword, newPassword);
    
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// 验证token
router.get('/verify', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Token有效',
    data: {
      id: req.user.id,
      username: req.user.username
    }
  });
});

// 管理员：获取所有用户列表
router.get('/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await User.getAllUsers();
    
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取用户列表失败',
      error: error.message
    });
  }
});

// 管理员：删除用户
router.delete('/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: '不能删除自己的账户'
      });
    }
    
    const result = await User.deleteUser(userId);
    
    if (result) {
      res.json({
        success: true,
        message: '用户删除成功'
      });
    } else {
      res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '删除用户失败',
      error: error.message
    });
  }
});

// 检查用户名是否可用
router.get('/check-username/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const existingUser = await User.findByUsername(username);
    
    res.json({
      success: true,
      available: !existingUser,
      message: existingUser ? '用户名已存在' : '用户名可用'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '检查用户名失败',
      error: error.message
    });
  }
});

// 检查邮箱是否可用
router.get('/check-email/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    if (!User.isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: '邮箱格式不正确'
      });
    }
    
    const existingUser = await User.findByEmail(email);
    
    res.json({
      success: true,
      available: !existingUser,
      message: existingUser ? '邮箱已被注册' : '邮箱可用'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '检查邮箱失败',
      error: error.message
    });
  }
});

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

module.exports = router;
