const express = require('express');
const router = express.Router();
const Movie = require('../models/movie');
const Cinema = require('../models/cinema');
const Video = require('../models/video');
const User = require('../models/user');
const db = require('../config/database');
const { exec } = require('child_process');

// 管理员密码 - 从环境变量读取，如果没有设置则使用默认密码
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// 验证管理员密码的中间件
function requireAuth(req, res, next) {
  if (req.session.adminAuthenticated) {
    return next();
  }
  
  if (req.method === 'POST' && req.body.password === ADMIN_PASSWORD) {
    req.session.adminAuthenticated = true;
    return next();
  }
  
  res.render('admin/login', { 
    title: '管理员登录',
    error: req.method === 'POST' ? '密码错误' : ''
  });
}

// 管理员登录页面
router.get('/login', (req, res) => {
  res.render('admin/login', { 
    title: '管理员登录',
    error: ''
  });
});

// 管理员登录处理
router.post('/login', (req, res) => {
  if (req.body.password === ADMIN_PASSWORD) {
    req.session.adminAuthenticated = true;
    res.redirect('/admin');
  } else {
    res.render('admin/login', { 
      title: '管理员登录',
      error: '密码错误'
    });
  }
});

// 管理员登出
router.get('/logout', (req, res) => {
  req.session.adminAuthenticated = false;
  res.redirect('/admin/login');
});

// 管理员首页
router.get('/', requireAuth, async (req, res) => {
  try {
    // 检查数据库连接状态
    await db.checkDatabaseConnection();
    const connectionStatus = db.getConnectionStatus();
    
    res.render('admin/index', { 
      title: '数据管理后台',
      message: req.query.message || '',
      connectionStatus: connectionStatus
    });
  } catch (error) {
    res.render('admin/index', { 
      title: '数据管理后台',
      message: req.query.message || '',
      connectionStatus: {
        connected: false,
        lastCheck: new Date(),
        error: error.message
      }
    });
  }
});

// 手动连接数据库
router.post('/connect-db', requireAuth, async (req, res) => {
  try {
    const success = await db.connectDatabase();
    if (success) {
      res.redirect('/admin?message=数据库连接成功');
    } else {
      res.redirect('/admin?message=数据库连接失败');
    }
  } catch (error) {
    res.redirect(`/admin?message=连接错误: ${error.message}`);
  }
});

// 电影数据管理页面
router.get('/movies', requireAuth, async (req, res) => {
  try {
    const movies = await Movie.getAllMovies();
    res.render('admin/movies', { 
      title: '电影数据管理',
      movies: movies,
      message: req.query.message || ''
    });
  } catch (error) {
    res.render('admin/movies', { 
      title: '电影数据管理',
      movies: [],
      message: `错误: ${error.message}`
    });
  }
});

// 添加电影页面
router.get('/movies/add', requireAuth, (req, res) => {
  res.render('admin/movie-form', { 
    title: '添加电影',
    movie: {},
    action: 'add'
  });
});

// 编辑电影页面
router.get('/movies/edit/:id', requireAuth, async (req, res) => {
  try {
    const movie = await Movie.getMovieById(req.params.id);
    if (!movie) {
      return res.redirect('/admin/movies?message=电影不存在');
    }
    res.render('admin/movie-form', { 
      title: '编辑电影',
      movie: movie,
      action: 'edit'
    });
  } catch (error) {
    res.redirect(`/admin/movies?message=错误: ${error.message}`);
  }
});

// 添加电影
router.post('/movies/add', requireAuth, async (req, res) => {
  try {
    const { title, director, actor, type, score, image, description } = req.body;
    
    // 验证必填字段
    if (!title) {
      return res.render('admin/movie-form', { 
        title: '添加电影',
        movie: req.body,
        action: 'add',
        error: '电影标题是必填项'
      });
    }

    await Movie.createMovie({
      title,
      director: director || '',
      actor: actor || '',
      type: type || '',
      score: score ? parseFloat(score) : 0,
      image: image || '',
      description: description || ''
    });

    res.redirect('/admin/movies?message=电影添加成功');
  } catch (error) {
    res.render('admin/movie-form', { 
      title: '添加电影',
      movie: req.body,
      action: 'add',
      error: `添加失败: ${error.message}`
    });
  }
});

// 更新电影
router.post('/movies/edit/:id', requireAuth, async (req, res) => {
  try {
    const { title, director, actor, type, score, image, description } = req.body;
    
    if (!title) {
      return res.render('admin/movie-form', { 
        title: '编辑电影',
        movie: { ...req.body, id: req.params.id },
        action: 'edit',
        error: '电影标题是必填项'
      });
    }

    await Movie.updateMovie(req.params.id, {
      title,
      director: director || '',
      actor: actor || '',
      type: type || '',
      score: score ? parseFloat(score) : 0,
      image: image || '',
      description: description || ''
    });

    res.redirect('/admin/movies?message=电影更新成功');
  } catch (error) {
    res.render('admin/movie-form', { 
      title: '编辑电影',
      movie: { ...req.body, id: req.params.id },
      action: 'edit',
      error: `更新失败: ${error.message}`
    });
  }
});

// 删除电影
router.post('/movies/delete/:id', requireAuth, async (req, res) => {
  try {
    await Movie.deleteMovie(req.params.id);
    res.redirect('/admin/movies?message=电影删除成功');
  } catch (error) {
    res.redirect(`/admin/movies?message=删除失败: ${error.message}`);
  }
});

// 影院数据管理页面
router.get('/cinemas', requireAuth, async (req, res) => {
  try {
    const cinemas = await Cinema.getAllCinemas();
    res.render('admin/cinemas', { 
      title: '影院数据管理',
      cinemas: cinemas,
      message: req.query.message || ''
    });
  } catch (error) {
    res.render('admin/cinemas', { 
      title: '影院数据管理',
      cinemas: [],
      message: `错误: ${error.message}`
    });
  }
});

// 添加影院页面
router.get('/cinemas/add', requireAuth, (req, res) => {
  res.render('admin/cinema-form', { 
    title: '添加影院',
    cinema: {},
    action: 'add'
  });
});

// 编辑影院页面
router.get('/cinemas/edit/:id', requireAuth, async (req, res) => {
  try {
    const cinema = await Cinema.getCinemaById(req.params.id);
    if (!cinema) {
      return res.redirect('/admin/cinemas?message=影院不存在');
    }
    res.render('admin/cinema-form', { 
      title: '编辑影院',
      cinema: cinema,
      action: 'edit'
    });
  } catch (error) {
    res.redirect(`/admin/cinemas?message=错误: ${error.message}`);
  }
});

// 添加影院
router.post('/cinemas/add', requireAuth, async (req, res) => {
  try {
    const { id, name, address, distance_km, avg_price, rating, city } = req.body;
    
    if (!id || !name) {
      return res.render('admin/cinema-form', { 
        title: '添加影院',
        cinema: req.body,
        action: 'add',
        error: '影院ID和名称是必填项'
      });
    }

    await Cinema.createCinema({
      id,
      name,
      address: address || '',
      distance_km: distance_km ? parseFloat(distance_km) : 0,
      avg_price: avg_price ? parseFloat(avg_price) : 0,
      rating: rating ? parseFloat(rating) : 0,
      city: city || ''
    });

    res.redirect('/admin/cinemas?message=影院添加成功');
  } catch (error) {
    res.render('admin/cinema-form', { 
      title: '添加影院',
      cinema: req.body,
      action: 'add',
      error: `添加失败: ${error.message}`
    });
  }
});

// 更新影院
router.post('/cinemas/edit/:id', requireAuth, async (req, res) => {
  try {
    const { name, address, distance_km, avg_price, rating, city } = req.body;
    
    if (!name) {
      return res.render('admin/cinema-form', { 
        title: '编辑影院',
        cinema: { ...req.body, id: req.params.id },
        action: 'edit',
        error: '影院名称是必填项'
      });
    }

    await Cinema.updateCinema(req.params.id, {
      name,
      address: address || '',
      distance_km: distance_km ? parseFloat(distance_km) : 0,
      avg_price: avg_price ? parseFloat(avg_price) : 0,
      rating: rating ? parseFloat(rating) : 0,
      city: city || ''
    });

    res.redirect('/admin/cinemas?message=影院更新成功');
  } catch (error) {
    res.render('admin/cinema-form', { 
      title: '编辑影院',
      cinema: { ...req.body, id: req.params.id },
      action: 'edit',
      error: `更新失败: ${error.message}`
    });
  }
});

// 删除影院
router.post('/cinemas/delete/:id', requireAuth, async (req, res) => {
  try {
    await Cinema.deleteCinema(req.params.id);
    res.redirect('/admin/cinemas?message=影院删除成功');
  } catch (error) {
    res.redirect(`/admin/cinemas?message=删除失败: ${error.message}`);
  }
});

// 批量导入页面
router.get('/import', requireAuth, (req, res) => {
  res.render('admin/import', { 
    title: '批量数据导入',
    message: req.query.message || ''
  });
});

// 批量导入电影
router.post('/import/movies', requireAuth, async (req, res) => {
  try {
    const { moviesData } = req.body;
    
    if (!moviesData) {
      return res.redirect('/admin/import?message=请输入电影数据');
    }

    const movies = JSON.parse(moviesData);
    let successCount = 0;
    let errorCount = 0;

    for (const movie of movies) {
      try {
        await Movie.createMovie(movie);
        successCount++;
      } catch (error) {
        errorCount++;
        console.error(`导入电影失败: ${movie.title}`, error);
      }
    }

    res.redirect(`/admin/import?message=导入完成: 成功${successCount}条, 失败${errorCount}条`);
  } catch (error) {
    res.redirect(`/admin/import?message=导入失败: ${error.message}`);
  }
});

// 批量导入影院
router.post('/import/cinemas', requireAuth, async (req, res) => {
  try {
    const { cinemasData } = req.body;
    
    if (!cinemasData) {
      return res.redirect('/admin/import?message=请输入影院数据');
    }

    const cinemas = JSON.parse(cinemasData);
    let successCount = 0;
    let errorCount = 0;

    for (const cinema of cinemas) {
      try {
        await Cinema.createCinema(cinema);
        successCount++;
      } catch (error) {
        errorCount++;
        console.error(`导入影院失败: ${cinema.name}`, error);
      }
    }

    res.redirect(`/admin/import?message=导入完成: 成功${successCount}条, 失败${errorCount}条`);
  } catch (error) {
    res.redirect(`/admin/import?message=导入失败: ${error.message}`);
  }
});

// 数据库表结构管理页面
router.get('/db', requireAuth, async (req, res) => {
  try {
    const tables = await db.getAllTables();
    const dataTypes = db.getSqlServerDataTypes();
    
    res.render('admin/db', { 
      title: '数据库表结构管理',
      tables: tables,
      dataTypes: dataTypes,
      message: req.query.message || '',
      error: req.query.error || ''
    });
  } catch (error) {
    res.render('admin/db', { 
      title: '数据库表结构管理',
      tables: [],
      dataTypes: db.getSqlServerDataTypes(),
      message: '',
      error: `错误: ${error.message}`
    });
  }
});

// 查看表结构
router.get('/db/table/:tableName', requireAuth, async (req, res) => {
  try {
    const tableName = req.params.tableName;
    const schema = await db.getTableSchema(tableName);
    const dataTypes = db.getSqlServerDataTypes();
    
    res.render('admin/table-schema', { 
      title: `表结构 - ${tableName}`,
      tableName: tableName,
      schema: schema,
      dataTypes: dataTypes,
      message: req.query.message || '',
      error: req.query.error || ''
    });
  } catch (error) {
    res.redirect(`/admin/db?error=获取表结构失败: ${error.message}`);
  }
});

// 添加列到表
router.post('/db/add-column', requireAuth, async (req, res) => {
  try {
    const { tableName, columnName, dataType, isNullable, defaultValue, maxLength } = req.body;
    
    if (!tableName || !columnName || !dataType) {
      return res.redirect(`/admin/db/table/${tableName}?error=表名、列名和数据类型是必填项`);
    }
    
    const result = await db.addColumn(
      tableName, 
      columnName, 
      dataType, 
      isNullable || 'YES', 
      defaultValue || null,
      maxLength || null
    );
    
    if (result.success) {
      res.redirect(`/admin/db/table/${tableName}?message=${result.message}`);
    } else {
      res.redirect(`/admin/db/table/${tableName}?error=${result.message}`);
    }
  } catch (error) {
    res.redirect(`/admin/db/table/${req.body.tableName}?error=添加列失败: ${error.message}`);
  }
});

// 删除列
router.post('/db/drop-column', requireAuth, async (req, res) => {
  try {
    const { tableName, columnName } = req.body;
    
    if (!tableName || !columnName) {
      return res.redirect(`/admin/db/table/${tableName}?error=表名和列名是必填项`);
    }
    
    const result = await db.dropColumn(tableName, columnName);
    
    if (result.success) {
      res.redirect(`/admin/db/table/${tableName}?message=${result.message}`);
    } else {
      res.redirect(`/admin/db/table/${tableName}?error=${result.message}`);
    }
  } catch (error) {
    res.redirect(`/admin/db/table/${req.body.tableName}?error=删除列失败: ${error.message}`);
  }
});

// 创建新表页面
router.get('/db/create-table', requireAuth, (req, res) => {
  const dataTypes = db.getSqlServerDataTypes();
  res.render('admin/create-table', { 
    title: '创建新表',
    dataTypes: dataTypes,
    message: req.query.message || '',
    error: req.query.error || ''
  });
});

// 创建新表
router.post('/db/create-table', requireAuth, async (req, res) => {
  try {
    const { tableName, columns } = req.body;
    
    if (!tableName) {
      return res.redirect('/admin/db/create-table?error=表名是必填项');
    }
    
    // 解析列数据
    let parsedColumns = [];
    if (Array.isArray(columns)) {
      parsedColumns = columns.filter(col => col.name && col.type);
    } else if (typeof columns === 'string') {
      try {
        parsedColumns = JSON.parse(columns);
      } catch (e) {
        return res.redirect('/admin/db/create-table?error=列数据格式错误');
      }
    }
    
    if (parsedColumns.length === 0) {
      return res.redirect('/admin/db/create-table?error=至少需要定义一个列');
    }
    
    const result = await db.createTable(tableName, parsedColumns);
    
    if (result.success) {
      res.redirect(`/admin/db?message=${result.message}`);
    } else {
      res.redirect(`/admin/db/create-table?error=${result.message}`);
    }
  } catch (error) {
    res.redirect(`/admin/db/create-table?error=创建表失败: ${error.message}`);
  }
});

// 删除表
router.post('/db/drop-table', requireAuth, async (req, res) => {
  try {
    const { tableName } = req.body;
    
    if (!tableName) {
      return res.redirect('/admin/db?error=表名是必填项');
    }
    
    const result = await db.dropTable(tableName);
    
    if (result.success) {
      res.redirect(`/admin/db?message=${result.message}`);
    } else {
      res.redirect(`/admin/db?error=${result.message}`);
    }
  } catch (error) {
    res.redirect(`/admin/db?error=删除表失败: ${error.message}`);
  }
});

// 数据库连接诊断
router.get('/db-diagnostic', requireAuth, async (req, res) => {
  try {
    const diagnostic = {
      timestamp: new Date(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        useMockData: db.useMockData(),
        hasConfig: {
          user: !!process.env.AZURE_SQL_USER,
          password: !!process.env.AZURE_SQL_PASSWORD,
          server: !!process.env.AZURE_SQL_SERVER,
          database: !!process.env.AZURE_SQL_DATABASE
        }
      },
      connection: db.getConnectionStatus(),
      monitor: db.getConnectionMonitorStatus(),
      network: {
        canReachServer: false,
        serverAddress: process.env.AZURE_SQL_SERVER || '未配置',
        port: 1433
      }
    };

    // 测试网络连接（如果配置了服务器地址）
    if (process.env.AZURE_SQL_SERVER) {
      try {
        const net = require('net');
        const server = process.env.AZURE_SQL_SERVER.replace('.database.windows.net', '');
        const testConnection = () => {
          return new Promise((resolve) => {
            const socket = new net.Socket();
            const timeout = setTimeout(() => {
              socket.destroy();
              resolve(false);
            }, 5000);
            
            socket.connect(1433, `${server}.database.windows.net`, () => {
              clearTimeout(timeout);
              socket.destroy();
              resolve(true);
            });
            
            socket.on('error', () => {
              clearTimeout(timeout);
              resolve(false);
            });
          });
        };
        
        diagnostic.network.canReachServer = await testConnection();
      } catch (err) {
        diagnostic.network.error = err.message;
      }
    }

    res.render('admin/db-diagnostic', { 
      title: '数据库连接诊断',
      diagnostic: diagnostic
    });
  } catch (error) {
    res.render('admin/db-diagnostic', { 
      title: '数据库连接诊断',
      diagnostic: {
        timestamp: new Date(),
        error: error.message
      }
    });
  }
});

// 测试数据库连接
router.post('/test-connection', requireAuth, async (req, res) => {
  try {
    const result = await db.connectDatabase();
    res.json({ 
      success: result, 
      message: result ? '连接成功' : '连接失败',
      status: db.getConnectionStatus()
    });
  } catch (error) {
    res.json({ 
      success: false, 
      message: `连接测试失败: ${error.message}`,
      status: db.getConnectionStatus()
    });
  }
});

// 启动连接监控
router.post('/start-monitor', requireAuth, (req, res) => {
  try {
    db.startConnectionMonitor();
    res.json({ 
      success: true, 
      message: '连接监控已启动',
      status: db.getConnectionMonitorStatus()
    });
  } catch (error) {
    res.json({ 
      success: false, 
      message: `启动监控失败: ${error.message}`
    });
  }
});

// 停止连接监控
router.post('/stop-monitor', requireAuth, (req, res) => {
  try {
    db.stopConnectionMonitor();
    res.json({ 
      success: true, 
      message: '连接监控已停止',
      status: db.getConnectionMonitorStatus()
    });
  } catch (error) {
    res.json({ 
      success: false, 
      message: `停止监控失败: ${error.message}`
    });
  }
});

// 获取连接监控状态
router.get('/monitor-status', requireAuth, (req, res) => {
  try {
    res.json({ 
      success: true, 
      status: db.getConnectionMonitorStatus()
    });
  } catch (error) {
    res.json({ 
      success: false, 
      message: `获取监控状态失败: ${error.message}`
    });
  }
});

// 更新连接监控配置
router.post('/update-monitor-config', requireAuth, (req, res) => {
  try {
    const { checkInterval, maxRetries, retryDelay, maxConsecutiveFailures } = req.body;
    
    const config = {};
    if (checkInterval) config.checkInterval = parseInt(checkInterval);
    if (maxRetries) config.maxRetries = parseInt(maxRetries);
    if (retryDelay) config.retryDelay = parseInt(retryDelay);
    if (maxConsecutiveFailures) config.maxConsecutiveFailures = parseInt(maxConsecutiveFailures);
    
    db.updateConnectionMonitorConfig(config);
    res.json({ 
      success: true, 
      message: '监控配置已更新',
      status: db.getConnectionMonitorStatus()
    });
  } catch (error) {
    res.json({ 
      success: false, 
      message: `更新配置失败: ${error.message}`
    });
  }
});

// 手动执行连接检查
router.post('/check-connection', requireAuth, async (req, res) => {
  try {
    await db.performConnectionCheck();
    res.json({ 
      success: true, 
      message: '连接检查已完成',
      status: db.getConnectionStatus(),
      monitor: db.getConnectionMonitorStatus()
    });
  } catch (error) {
    res.json({ 
      success: false, 
      message: `连接检查失败: ${error.message}`
    });
  }
});

// 一键修复数据库结构并返回日志
router.post('/repair-db', requireAuth, async (req, res) => {
  exec('node repairDatabaseStructure.js', { cwd: process.cwd() }, (error, stdout, stderr) => {
    if (error) {
      return res.json({ success: false, log: stderr || error.message });
    }
    res.json({ success: true, log: stdout });
  });
});

// 工具函数：格式化文件大小
function formatFileSize(size) {
  if (!size) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return size.toFixed(2) + ' ' + units[i];
}

// 工具函数：格式化时长
function formatDuration(seconds) {
  if (!seconds) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// 视频管理页面
router.get('/videos', requireAuth, async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    
    let videos;
    if (search) {
      const result = await Video.searchVideos(search, { page: parseInt(page), limit: parseInt(limit) });
      videos = result.videos;
    } else {
      const result = await Video.getAllVideos({ page: parseInt(page), limit: parseInt(limit) });
      videos = result.videos;
    }
    
    res.render('admin/videos', { 
      title: '视频管理',
      videos: videos,
      message: req.query.message || '',
      formatFileSize, // 传递格式化文件大小函数
      formatDuration // 传递格式化时长函数
    });
  } catch (error) {
    res.render('admin/videos', { 
      title: '视频管理',
      videos: [],
      message: `错误: ${error.message}`,
      formatFileSize,
      formatDuration
    });
  }
});

// 视频统计页面
router.get('/video-stats', requireAuth, async (req, res) => {
  try {
    // 获取统计数据
    const stats = await Video.getGlobalVideoStats();
    
    // 获取热门视频
    const popularVideos = await Video.getPopularVideos(10);
    
    // 获取最新视频
    const latestVideos = await Video.getLatestVideos(10);
    
    // 获取格式分布数据
    const formatDistribution = await Video.getFormatDistribution();
    const formatData = {
      labels: formatDistribution.map(item => item.format),
      values: formatDistribution.map(item => item.count)
    };
    
    // 获取观看趋势数据
    const viewTrend = await Video.getViewTrend(30);
    const chartData = {
      labels: viewTrend.map(item => new Date(item.date).toLocaleDateString('zh-CN')),
      views: viewTrend.map(item => item.views)
    };
    
    res.render('admin/video-stats', { 
      title: '视频统计',
      stats: stats,
      popularVideos: popularVideos,
      latestVideos: latestVideos,
      chartData: chartData,
      formatData: formatData
    });
  } catch (error) {
    res.render('admin/video-stats', { 
      title: '视频统计',
      stats: {},
      popularVideos: [],
      latestVideos: [],
      chartData: { labels: [], views: [] },
      formatData: { labels: [], values: [] },
      error: error.message
    });
  }
});

// 添加视频页面
router.get('/videos/add', requireAuth, (req, res) => {
  res.render('admin/video-form', { 
    title: '添加视频',
    video: {},
    action: 'add'
  });
});

// 编辑视频页面
router.get('/videos/edit/:id', requireAuth, async (req, res) => {
  try {
    const video = await Video.getVideoById(req.params.id);
    if (!video) {
      return res.redirect('/admin/videos?message=视频不存在');
    }
    res.render('admin/video-form', { 
      title: '编辑视频',
      video: video,
      action: 'edit'
    });
  } catch (error) {
    res.redirect(`/admin/videos?message=错误: ${error.message}`);
  }
});

// 添加视频
router.post('/videos/add', requireAuth, async (req, res) => {
  try {
    const { title, description } = req.body;
    
    if (!title) {
      return res.render('admin/video-form', { 
        title: '添加视频',
        video: req.body,
        action: 'add',
        error: '视频标题是必填项'
      });
    }

    // 处理文件上传
    if (!req.files || !req.files.video) {
      return res.render('admin/video-form', { 
        title: '添加视频',
        video: req.body,
        action: 'add',
        error: '请选择视频文件'
      });
    }

    const videoFile = req.files.video;
    
    // 验证文件类型
    const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/mkv', 'video/webm'];
    if (!allowedTypes.includes(videoFile.mimetype)) {
      return res.render('admin/video-form', { 
        title: '添加视频',
        video: req.body,
        action: 'add',
        error: '不支持的文件格式'
      });
    }

    // 验证文件大小 (500MB)
    const maxSize = 500 * 1024 * 1024;
    if (videoFile.size > maxSize) {
      return res.render('admin/video-form', { 
        title: '添加视频',
        video: req.body,
        action: 'add',
        error: '文件大小不能超过500MB'
      });
    }

    // 生成唯一文件名
    const timestamp = Date.now();
    const extension = videoFile.name.split('.').pop();
    const filename = `video_${timestamp}.${extension}`;
    const filePath = `uploads/videos/${filename}`;
    const fullPath = `public/${filePath}`;

    // 保存文件
    await videoFile.mv(fullPath);

    // 创建视频记录
    await Video.createVideo({
      title,
      description: description || '',
      filename: filename,
      file_path: `/${filePath}`,
      file_size: videoFile.size,
      duration: 0, // 暂时设为0，后续可以添加视频时长检测
      format: extension,
      resolution: '', // 暂时为空，后续可以添加分辨率检测
      created_by: 'admin'
    });

    res.redirect('/admin/videos?message=视频添加成功');
  } catch (error) {
    res.render('admin/video-form', { 
      title: '添加视频',
      video: req.body,
      action: 'add',
      error: `添加失败: ${error.message}`
    });
  }
});

// 更新视频
router.post('/videos/edit/:id', requireAuth, async (req, res) => {
  try {
    const { title, description, status } = req.body;
    
    if (!title) {
      return res.render('admin/video-form', { 
        title: '编辑视频',
        video: { ...req.body, id: req.params.id },
        action: 'edit',
        error: '视频标题是必填项'
      });
    }

    await Video.updateVideo(req.params.id, {
      title,
      description: description || '',
      status: status || 'active'
    });

    res.redirect('/admin/videos?message=视频更新成功');
  } catch (error) {
    res.render('admin/video-form', { 
      title: '编辑视频',
      video: { ...req.body, id: req.params.id },
      action: 'edit',
      error: `更新失败: ${error.message}`
    });
  }
});

// 删除视频
router.post('/videos/delete/:id', requireAuth, async (req, res) => {
  try {
    await Video.deleteVideo(req.params.id);
    res.redirect('/admin/videos?message=视频删除成功');
  } catch (error) {
    res.redirect(`/admin/videos?message=删除失败: ${error.message}`);
  }
});

// ==================== 用户管理路由 ====================

// 用户管理页面
router.get('/users', requireAuth, async (req, res) => {
  try {
    const users = await User.getAllUsers();
    res.render('admin/users', { 
      title: '用户管理',
      users: users,
      message: req.query.message || ''
    });
  } catch (error) {
    res.render('admin/users', { 
      title: '用户管理',
      users: [],
      message: `错误: ${error.message}`
    });
  }
});

// 添加用户页面
router.get('/users/add', requireAuth, (req, res) => {
  res.render('admin/user-form', { 
    title: '添加用户',
    user: {},
    action: 'add'
  });
});

// 编辑用户页面
router.get('/users/edit/:id', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.redirect('/admin/users?message=用户不存在');
    }
    res.render('admin/user-form', { 
      title: '编辑用户',
      user: user,
      action: 'edit'
    });
  } catch (error) {
    res.redirect(`/admin/users?message=错误: ${error.message}`);
  }
});

// 添加用户
router.post('/users/add', requireAuth, async (req, res) => {
  try {
    const { username, password, email, phone } = req.body;
    
    // 验证必填字段
    if (!username || !password) {
      return res.render('admin/user-form', { 
        title: '添加用户',
        user: req.body,
        action: 'add',
        error: '用户名和密码是必填项'
      });
    }

    await User.register({
      username,
      password,
      email: email || null,
      phone: phone || null
    });

    res.redirect('/admin/users?message=用户添加成功');
  } catch (error) {
    res.render('admin/user-form', { 
      title: '添加用户',
      user: req.body,
      action: 'add',
      error: `添加失败: ${error.message}`
    });
  }
});

// 更新用户信息
router.post('/users/edit/:id', requireAuth, async (req, res) => {
  try {
    const { email, phone } = req.body;
    
    await User.updateUser(req.params.id, {
      email: email || null,
      phone: phone || null
    });

    res.redirect('/admin/users?message=用户信息更新成功');
  } catch (error) {
    res.render('admin/user-form', { 
      title: '编辑用户',
      user: { ...req.body, id: req.params.id },
      action: 'edit',
      error: `更新失败: ${error.message}`
    });
  }
});

// 删除用户
router.post('/users/delete/:id', requireAuth, async (req, res) => {
  try {
    const result = await User.deleteUser(req.params.id);
    if (result) {
      res.redirect('/admin/users?message=用户删除成功');
    } else {
      res.redirect('/admin/users?message=用户不存在');
    }
  } catch (error) {
    res.redirect(`/admin/users?message=删除失败: ${error.message}`);
  }
});

// 重置用户密码
router.post('/users/reset-password/:id', requireAuth, async (req, res) => {
  try {
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
      return res.redirect('/admin/users?message=新密码长度至少6个字符');
    }

    // 获取用户信息
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.redirect('/admin/users?message=用户不存在');
    }

    // 使用User模型的方法重置密码
    const fullUser = await User.findByUsername(user.username);
    if (!fullUser) {
      return res.redirect('/admin/users?message=用户不存在');
    }

    // 直接更新密码哈希
    const bcrypt = require('bcryptjs');
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);
    
    const updateSQL = 'UPDATE users SET password_hash = @passwordHash WHERE id = @id';
    const params = [
      { name: 'id', value: req.params.id },
      { name: 'passwordHash', value: newPasswordHash }
    ];
    
    await db.query(updateSQL, params);

    res.redirect('/admin/users?message=密码重置成功');
  } catch (error) {
    res.redirect(`/admin/users?message=密码重置失败: ${error.message}`);
  }
});

// 用户统计页面
router.get('/user-stats', requireAuth, async (req, res) => {
  try {
    const users = await User.getAllUsers();
    
    // 计算统计数据
    const stats = {
      totalUsers: users.length,
      usersWithEmail: users.filter(u => u.email).length,
      usersWithPhone: users.filter(u => u.phone).length,
      recentUsers: users.filter(u => {
        const createdDate = new Date(u.created_at);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return createdDate > weekAgo;
      }).length
    };

    // 按创建时间分组
    const usersByMonth = {};
    users.forEach(user => {
      const date = new Date(user.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      usersByMonth[monthKey] = (usersByMonth[monthKey] || 0) + 1;
    });

    res.render('admin/user-stats', { 
      title: '用户统计',
      stats: stats,
      users: users,
      usersByMonth: usersByMonth
    });
  } catch (error) {
    res.render('admin/user-stats', { 
      title: '用户统计',
      stats: {},
      users: [],
      usersByMonth: {},
      error: error.message
    });
  }
});

// 功能文档页面
router.get('/docs', requireAuth, (req, res) => {
  res.render('admin/docs', { 
    title: '功能文档'
  });
});

module.exports = router; 