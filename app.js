// 加载环境变量
require('dotenv').config();

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var fileUpload = require('express-fileupload');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var moviesRouter = require('./routes/movies');
var cinemasRouter = require('./routes/cinemas');
var videosRouter = require('./routes/videos');
var adminRouter = require('./routes/admin');

// 导入数据库模块
const db = require('./config/database');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());

// 配置文件上传中间件
app.use(fileUpload({
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  abortOnLimit: true,
  createParentPath: true,
  useTempFiles: true,
  tempFileDir: '/tmp/',
  debug: false
}));

// 配置session
app.use(session({
  secret: 'movie-database-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // 在生产环境中应该设置为true
    maxAge: 24 * 60 * 60 * 1000 // 24小时
  }
}));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/api/movies', moviesRouter);
app.use('/api/cinemas', cinemasRouter);
app.use('/api/videos', videosRouter);
app.use('/admin', adminRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// 优雅关闭处理
process.on('SIGINT', async () => {
  console.log('\n🛑 收到关闭信号，正在优雅关闭应用...');
  
  try {
    // 停止数据库连接监控
    db.stopConnectionMonitor();
    console.log('✅ 数据库连接监控已停止');
    
    // 关闭数据库连接池
    const pool = db.pool();
    if (pool) {
      await pool.close();
      console.log('✅ 数据库连接池已关闭');
    }
    
    console.log('✅ 应用已优雅关闭');
    process.exit(0);
  } catch (error) {
    console.error('❌ 关闭过程中发生错误:', error);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 收到终止信号，正在优雅关闭应用...');
  
  try {
    // 停止数据库连接监控
    db.stopConnectionMonitor();
    console.log('✅ 数据库连接监控已停止');
    
    // 关闭数据库连接池
    const pool = db.pool();
    if (pool) {
      await pool.close();
      console.log('✅ 数据库连接池已关闭');
    }
    
    console.log('✅ 应用已优雅关闭');
    process.exit(0);
  } catch (error) {
    console.error('❌ 关闭过程中发生错误:', error);
    process.exit(1);
  }
});

module.exports = app;
