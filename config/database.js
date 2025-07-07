const sql = require('mssql');

// 数据库连接状态
let dbConnectionStatus = {
  connected: false,
  lastCheck: null,
  error: null
};

// 连接池实例
let pool = null;

// 连接监控配置
let connectionMonitor = {
  isRunning: false,
  interval: null,
  checkInterval: 30000, // 30秒检查一次
  maxRetries: 3,
  retryDelay: 5000, // 5秒重试延迟
  lastSuccessfulCheck: null,
  consecutiveFailures: 0,
  maxConsecutiveFailures: 5
};

// 模拟数据 - 当没有数据库连接时使用
const mockMovies = [
  {
    id: 1,
    title: '肖申克的救赎',
    director: '弗兰克·德拉邦特',
    actor: '蒂姆·罗宾斯',
    type: '剧情',
    score: 9.7,
    image: 'https://example.com/shawshank.jpg',
    description: '银行家安迪被误判杀害妻子，在肖申克监狱中度过漫长岁月，最终通过智慧和毅力获得自由。'
  },
  {
    id: 2,
    title: '教父',
    director: '弗朗西斯·福特·科波拉',
    actor: '马龙·白兰度',
    type: '犯罪',
    score: 9.6,
    image: 'https://example.com/godfather.jpg',
    description: '黑手党家族的故事，展现了权力、家族和背叛的复杂关系。'
  },
  {
    id: 3,
    title: '盗梦空间',
    director: '克里斯托弗·诺兰',
    actor: '莱昂纳多·迪卡普里奥',
    type: '科幻',
    score: 9.3,
    image: 'https://example.com/inception.jpg',
    description: '一个关于梦境和现实的故事，探讨了人类意识的深层奥秘。'
  },
  {
    id: 4,
    title: '泰坦尼克号',
    director: '詹姆斯·卡梅隆',
    actor: '莱昂纳多·迪卡普里奥',
    type: '爱情',
    score: 9.4,
    image: 'https://example.com/titanic.jpg',
    description: '1912年泰坦尼克号邮轮上的爱情故事，展现了跨越阶级的真挚感情。'
  },
  {
    id: 5,
    title: '阿甘正传',
    director: '罗伯特·泽米吉斯',
    actor: '汤姆·汉克斯',
    type: '剧情',
    score: 9.5,
    image: 'https://example.com/forrest-gump.jpg',
    description: '一个智商只有75的男人，却经历了美国历史上许多重要事件。'
  },
  {
    id: 6,
    title: '星际穿越',
    director: '克里斯托弗·诺兰',
    actor: '马修·麦康纳',
    type: '科幻',
    score: 9.2,
    image: 'https://example.com/interstellar.jpg',
    description: '在人类面临灭绝危机时，一组宇航员穿越虫洞寻找新的家园。'
  },
  {
    id: 7,
    title: '指环王：王者归来',
    director: '彼得·杰克逊',
    actor: '伊利亚·伍德',
    type: '奇幻',
    score: 9.0,
    image: 'https://example.com/lotr.jpg',
    description: '中土世界的最终决战，弗罗多必须将魔戒带到末日火山销毁。'
  },
  {
    id: 8,
    title: '黑客帝国',
    director: '沃卓斯基姐妹',
    actor: '基努·里维斯',
    type: '科幻',
    score: 9.1,
    image: 'https://example.com/matrix.jpg',
    description: '一个关于虚拟现实和人工智能的哲学思考。'
  },
  {
    id: 9,
    title: '美丽人生',
    director: '罗伯托·贝尼尼',
    actor: '罗伯托·贝尼尼',
    type: '剧情',
    score: 9.5,
    image: 'https://example.com/life-is-beautiful.jpg',
    description: '在纳粹集中营中，父亲用游戏的方式保护儿子的纯真。'
  },
  {
    id: 10,
    title: '千与千寻',
    director: '宫崎骏',
    actor: '柊瑠美',
    type: '动画',
    score: 9.4,
    image: 'https://example.com/spirited-away.jpg',
    description: '少女千寻在神秘世界中寻找父母的故事，充满了奇幻和温情。'
  }
];

// 模拟影院数据
const mockCinemas = [
  {
    id: 'C001',
    name: '万达影城(朝阳店)',
    address: '北京市朝阳区建国路93号万达广场4层',
    distance_km: 2.5,
    avg_price: 45.00,
    rating: 8.5,
    city: '北京'
  },
  {
    id: 'C002',
    name: 'CGV影城(三里屯店)',
    address: '北京市朝阳区三里屯路19号三里屯太古里北区N3-B1',
    distance_km: 3.2,
    avg_price: 52.00,
    rating: 8.8,
    city: '北京'
  },
  {
    id: 'C003',
    name: '百老汇影城(国贸店)',
    address: '北京市朝阳区建国门外大街1号国贸商城B1层',
    distance_km: 4.1,
    avg_price: 48.00,
    rating: 8.2,
    city: '北京'
  },
  {
    id: 'C004',
    name: '星美国际影城(西单店)',
    address: '北京市西城区西单北大街120号西单大悦城6层',
    distance_km: 5.8,
    avg_price: 42.00,
    rating: 7.9,
    city: '北京'
  },
  {
    id: 'C005',
    name: '保利国际影城(天安门店)',
    address: '北京市东城区东长安街1号东方广场地下一层',
    distance_km: 6.2,
    avg_price: 55.00,
    rating: 8.6,
    city: '北京'
  },
  {
    id: 'C006',
    name: '金逸影城(上海环贸店)',
    address: '上海市徐汇区淮海中路999号环贸广场6层',
    distance_km: 1.8,
    avg_price: 50.00,
    rating: 8.7,
    city: '上海'
  },
  {
    id: 'C007',
    name: '万达影城(上海五角场店)',
    address: '上海市杨浦区政立路489号万达广场4层',
    distance_km: 3.5,
    avg_price: 46.00,
    rating: 8.3,
    city: '上海'
  },
  {
    id: 'C008',
    name: 'CGV影城(广州天河店)',
    address: '广州市天河区天河路208号天河城5层',
    distance_km: 2.1,
    avg_price: 44.00,
    rating: 8.4,
    city: '广州'
  },
  {
    id: 'C009',
    name: '百老汇影城(深圳海岸城店)',
    address: '深圳市南山区文心五路33号海岸城购物中心3层',
    distance_km: 1.5,
    avg_price: 49.00,
    rating: 8.9,
    city: '深圳'
  },
  {
    id: 'C010',
    name: '星美国际影城(成都春熙路店)',
    address: '成都市锦江区春熙路北段1号春熙路步行街',
    distance_km: 2.8,
    avg_price: 38.00,
    rating: 8.1,
    city: '成都'
  }
];

// 检查环境变量
const requiredEnvVars = [
  'AZURE_SQL_USER',
  'AZURE_SQL_PASSWORD', 
  'AZURE_SQL_SERVER',
  'AZURE_SQL_DATABASE'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

// 判断是否使用模拟数据
const useMockData = missingVars.length > 0 || process.env.NODE_ENV === 'development';

if (useMockData) {
  console.log('🔧 使用模拟数据模式 - 本地开发环境');
  console.log('📊 当前使用10部模拟电影数据');
  if (missingVars.length > 0) {
    console.warn('⚠️ 缺少以下环境变量:', missingVars.join(', '));
    console.warn('💡 部署到Azure时请配置真实的环境变量');
  }
} else {
  console.log('🌐 检测到环境变量，将尝试连接真实Azure SQL Database');
}

// Azure SQL Database 配置
const config = {
  user: process.env.AZURE_SQL_USER || 'your_username',
  password: process.env.AZURE_SQL_PASSWORD || 'your_password',
  server: process.env.AZURE_SQL_SERVER || 'your-server.database.windows.net',
  database: process.env.AZURE_SQL_DATABASE || 'your_database_name',
  options: {
    encrypt: true,
    trustServerCertificate: false,
    enableArithAbort: true,
    requestTimeout: 60000,        // 增加请求超时时间
    connectionTimeout: 60000,     // 增加连接超时时间
    cancelTimeout: 5000,          // 取消操作超时
    packetSize: 4096,             // 数据包大小
    useUTC: true,                 // 使用UTC时间
    charset: 'utf8'               // 字符集
  },
  pool: {
    max: 5,                       // 减少最大连接数
    min: 0,
    idleTimeoutMillis: 300000,    // 增加空闲超时时间（5分钟）
    acquireTimeoutMillis: 60000,  // 获取连接超时
    createTimeoutMillis: 60000,   // 创建连接超时
    destroyTimeoutMillis: 5000,   // 销毁连接超时
    reapIntervalMillis: 1000,     // 清理间隔
    createRetryIntervalMillis: 200 // 重试间隔
  },
  connectionRetryInterval: 1000,  // 连接重试间隔
  maxRetriesOnTries: 3            // 最大重试次数
};

// 检查数据库连接状态
async function checkDatabaseConnection() {
  try {
    if (useMockData) {
      dbConnectionStatus = {
        connected: false,
        lastCheck: new Date(),
        error: '模拟数据模式'
      };
      return false;
    }

    if (!pool) {
      dbConnectionStatus = {
        connected: false,
        lastCheck: new Date(),
        error: '连接池未初始化'
      };
      return false;
    }

    // 执行简单查询测试连接
    await pool.request().query('SELECT 1');
    dbConnectionStatus = {
      connected: true,
      lastCheck: new Date(),
      error: null
    };
    return true;
  } catch (err) {
    dbConnectionStatus = {
      connected: false,
      lastCheck: new Date(),
      error: err.message
    };
    return false;
  }
}

// 手动连接数据库
async function connectDatabase() {
  try {
    if (useMockData) {
      console.log('✅ 模拟数据库模式已启用');
      dbConnectionStatus = {
        connected: false,
        lastCheck: new Date(),
        error: '模拟数据模式'
      };
      return false;
    }

    // 如果已有连接池，先关闭
    if (pool) {
      try {
        await pool.close();
        console.log('🔄 关闭现有连接池');
      } catch (err) {
        console.warn('⚠️ 关闭连接池时出错:', err.message);
      }
      pool = null;
    }

    console.log('🔄 正在连接 Azure SQL Database...');
    console.log(`📍 服务器: ${config.server}`);
    console.log(`📊 数据库: ${config.database}`);
    console.log(`👤 用户: ${config.user}`);

    pool = await sql.connect(config);
    
    // 测试连接
    await pool.request().query('SELECT 1 as test');
    
    console.log('✅ Azure SQL Database 连接成功');
    dbConnectionStatus = {
      connected: true,
      lastCheck: new Date(),
      error: null
    };
    return true;
  } catch (err) {
    console.error('❌ Azure SQL Database 连接错误:', err);
    
    // 详细的错误信息
    let errorMessage = err.message;
    if (err.code === 'ETIMEDOUT') {
      errorMessage = '连接超时 - 请检查网络连接和防火墙设置';
    } else if (err.code === 'ELOGIN') {
      errorMessage = '登录失败 - 请检查用户名和密码';
    } else if (err.code === 'ESOCKET') {
      errorMessage = '网络连接失败 - 请检查服务器地址和网络设置';
    } else if (err.code === 'EALREADYCONNECTED') {
      errorMessage = '已经连接到数据库';
    }
    
    dbConnectionStatus = {
      connected: false,
      lastCheck: new Date(),
      error: errorMessage
    };
    return false;
  }
}

// 带重试的数据库连接
async function connectWithRetry(maxRetries = 3, delay = 2000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 连接尝试 ${attempt}/${maxRetries}`);
      const success = await connectDatabase();
      if (success) {
        return true;
      }
    } catch (err) {
      console.error(`❌ 连接尝试 ${attempt} 失败:`, err.message);
    }
    
    if (attempt < maxRetries) {
      console.log(`⏳ 等待 ${delay/1000} 秒后重试...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 1.5; // 指数退避
    }
  }
  
  console.error(`❌ 经过 ${maxRetries} 次尝试后连接失败`);
  return false;
}

// 启动连接监控
function startConnectionMonitor() {
  if (connectionMonitor.isRunning) {
    console.log('⚠️ 连接监控已在运行中');
    return;
  }

  console.log('🔄 启动数据库连接监控...');
  connectionMonitor.isRunning = true;
  
  // 立即执行一次检查
  performConnectionCheck();
  
  // 设置定期检查
  connectionMonitor.interval = setInterval(performConnectionCheck, connectionMonitor.checkInterval);
  
  console.log(`✅ 连接监控已启动，检查间隔: ${connectionMonitor.checkInterval/1000}秒`);
}

// 停止连接监控
function stopConnectionMonitor() {
  if (!connectionMonitor.isRunning) {
    return;
  }

  console.log('🛑 停止数据库连接监控...');
  connectionMonitor.isRunning = false;
  
  if (connectionMonitor.interval) {
    clearInterval(connectionMonitor.interval);
    connectionMonitor.interval = null;
  }
  
  console.log('✅ 连接监控已停止');
}

// 执行连接检查
async function performConnectionCheck() {
  try {
    const isConnected = await checkDatabaseConnection();
    
    if (isConnected) {
      connectionMonitor.consecutiveFailures = 0;
      connectionMonitor.lastSuccessfulCheck = new Date();
      console.log('✅ 数据库连接状态正常');
    } else {
      connectionMonitor.consecutiveFailures++;
      console.warn(`⚠️ 数据库连接检查失败 (${connectionMonitor.consecutiveFailures}/${connectionMonitor.maxConsecutiveFailures})`);
      
      // 如果连续失败次数达到阈值，尝试重连
      if (connectionMonitor.consecutiveFailures >= connectionMonitor.maxConsecutiveFailures) {
        console.log('🔄 连续失败次数达到阈值，尝试重新连接...');
        await attemptReconnection();
      }
    }
  } catch (error) {
    connectionMonitor.consecutiveFailures++;
    console.error('❌ 连接检查过程中发生错误:', error.message);
  }
}

// 尝试重新连接
async function attemptReconnection() {
  try {
    console.log('🔄 开始重新连接数据库...');
    
    // 关闭现有连接池
    if (pool) {
      try {
        await pool.close();
        console.log('🔄 已关闭现有连接池');
      } catch (err) {
        console.warn('⚠️ 关闭连接池时出错:', err.message);
      }
      pool = null;
    }
    
    // 等待一段时间后重连
    await new Promise(resolve => setTimeout(resolve, connectionMonitor.retryDelay));
    
    // 尝试重新连接
    const success = await connectWithRetry(connectionMonitor.maxRetries, connectionMonitor.retryDelay);
    
    if (success) {
      console.log('✅ 数据库重新连接成功');
      connectionMonitor.consecutiveFailures = 0;
      connectionMonitor.lastSuccessfulCheck = new Date();
    } else {
      console.error('❌ 数据库重新连接失败');
    }
  } catch (error) {
    console.error('❌ 重新连接过程中发生错误:', error.message);
  }
}

// 获取连接监控状态
function getConnectionMonitorStatus() {
  return {
    isRunning: connectionMonitor.isRunning,
    checkInterval: connectionMonitor.checkInterval,
    lastSuccessfulCheck: connectionMonitor.lastSuccessfulCheck,
    consecutiveFailures: connectionMonitor.consecutiveFailures,
    maxConsecutiveFailures: connectionMonitor.maxConsecutiveFailures
  };
}

// 更新连接监控配置
function updateConnectionMonitorConfig(config) {
  if (config.checkInterval && config.checkInterval > 0) {
    connectionMonitor.checkInterval = config.checkInterval;
  }
  if (config.maxRetries && config.maxRetries > 0) {
    connectionMonitor.maxRetries = config.maxRetries;
  }
  if (config.retryDelay && config.retryDelay > 0) {
    connectionMonitor.retryDelay = config.retryDelay;
  }
  if (config.maxConsecutiveFailures && config.maxConsecutiveFailures > 0) {
    connectionMonitor.maxConsecutiveFailures = config.maxConsecutiveFailures;
  }
  
  console.log('✅ 连接监控配置已更新:', config);
}

// 初始化数据库连接
async function initializeDatabase() {
  const success = await connectWithRetry();
  
  // 如果连接成功，启动监控
  if (success) {
    startConnectionMonitor();
  }
  
  return success;
}

// 模拟查询函数
function mockQuery(sqlQuery, params = []) {
  console.log('🔧 执行模拟查询:', sqlQuery);
  
  // 解析SQL查询类型
  if (sqlQuery.includes('SELECT COUNT(*)')) {
    return Promise.resolve({ recordset: [{ count: mockMovies.length }] });
  }
  
  // 电影查询
  if (sqlQuery.includes('SELECT * FROM movies')) {
    let filteredMovies = [...mockMovies];
    
    // 根据ID查询
    if (sqlQuery.includes('WHERE id = @param1')) {
      const id = parseInt(params[0]);
      filteredMovies = mockMovies.filter(movie => movie.id === id);
    }
    
    // 根据类型查询
    if (sqlQuery.includes('WHERE type = @param1')) {
      const type = params[0];
      filteredMovies = mockMovies.filter(movie => movie.type === type);
    }
    
    // 根据导演查询
    if (sqlQuery.includes('WHERE director LIKE @param1')) {
      const director = params[0].replace(/%/g, '');
      filteredMovies = mockMovies.filter(movie => 
        movie.director.includes(director)
      );
    }
    
    // 根据演员查询
    if (sqlQuery.includes('WHERE actor LIKE @param1')) {
      const actor = params[0].replace(/%/g, '');
      filteredMovies = mockMovies.filter(movie => 
        movie.actor.includes(actor)
      );
    }
    
    // 搜索查询
    if (sqlQuery.includes('WHERE title LIKE @param1') && sqlQuery.includes('OR director LIKE @param1')) {
      const searchTerm = params[0].replace(/%/g, '');
      filteredMovies = mockMovies.filter(movie => 
        movie.title.includes(searchTerm) ||
        movie.director.includes(searchTerm) ||
        movie.actor.includes(searchTerm) ||
        movie.description.includes(searchTerm)
      );
    }
    
    // 限制结果数量
    if (sqlQuery.includes('TOP (@param1)')) {
      const limit = parseInt(params[0]);
      filteredMovies = filteredMovies.slice(0, limit);
    }
    
    // 排序
    if (sqlQuery.includes('ORDER BY score DESC')) {
      filteredMovies.sort((a, b) => b.score - a.score);
    } else if (sqlQuery.includes('ORDER BY id')) {
      filteredMovies.sort((a, b) => a.id - b.id);
    }
    
    return Promise.resolve({ recordset: filteredMovies });
  }
  
  // 影院查询
  if (sqlQuery.includes('SELECT * FROM Cinemas')) {
    let filteredCinemas = [...mockCinemas];
    
    // 根据ID查询
    if (sqlQuery.includes('WHERE id = @param1')) {
      const id = params[0];
      filteredCinemas = mockCinemas.filter(cinema => cinema.id === id);
    }
    
    // 根据城市查询
    if (sqlQuery.includes('WHERE city = @param1')) {
      const city = params[0];
      filteredCinemas = mockCinemas.filter(cinema => cinema.city === city);
    }
    
    // 根据距离查询
    if (sqlQuery.includes('WHERE distance_km <= @param1')) {
      const maxDistance = parseFloat(params[0]);
      filteredCinemas = mockCinemas.filter(cinema => cinema.distance_km <= maxDistance);
    }
    
    // 根据价格范围查询
    if (sqlQuery.includes('WHERE avg_price >= @param1 AND avg_price <= @param2')) {
      const minPrice = parseFloat(params[0]);
      const maxPrice = parseFloat(params[1]);
      filteredCinemas = mockCinemas.filter(cinema => 
        cinema.avg_price >= minPrice && cinema.avg_price <= maxPrice
      );
    }
    
    // 根据评分查询
    if (sqlQuery.includes('WHERE rating >= @param1')) {
      const minRating = parseFloat(params[0]);
      filteredCinemas = mockCinemas.filter(cinema => cinema.rating >= minRating);
    }
    
    // 搜索查询
    if (sqlQuery.includes('WHERE name LIKE @param1') && sqlQuery.includes('OR address LIKE @param1')) {
      const searchTerm = params[0].replace(/%/g, '');
      filteredCinemas = mockCinemas.filter(cinema => 
        cinema.name.includes(searchTerm) ||
        cinema.address.includes(searchTerm) ||
        cinema.city.includes(searchTerm)
      );
    }
    
    // 限制结果数量
    if (sqlQuery.includes('TOP (@param1)')) {
      const limit = parseInt(params[0]);
      filteredCinemas = filteredCinemas.slice(0, limit);
    }
    
    // 排序
    if (sqlQuery.includes('ORDER BY rating DESC')) {
      filteredCinemas.sort((a, b) => b.rating - a.rating);
    } else if (sqlQuery.includes('ORDER BY distance_km ASC')) {
      filteredCinemas.sort((a, b) => a.distance_km - b.distance_km);
    } else if (sqlQuery.includes('ORDER BY avg_price ASC')) {
      filteredCinemas.sort((a, b) => a.avg_price - b.avg_price);
    }
    
    return Promise.resolve({ recordset: filteredCinemas });
  }
  
  // 电影统计查询
  if (sqlQuery.includes('COUNT(*) as total_movies')) {
    const stats = {
      total_movies: mockMovies.length,
      average_score: mockMovies.reduce((sum, movie) => sum + movie.score, 0) / mockMovies.length,
      highest_score: Math.max(...mockMovies.map(m => m.score)),
      lowest_score: Math.min(...mockMovies.map(m => m.score)),
      total_types: new Set(mockMovies.map(m => m.type)).size,
      total_directors: new Set(mockMovies.map(m => m.director)).size
    };
    return Promise.resolve({ recordset: [stats] });
  }
  
  // 影院统计查询
  if (sqlQuery.includes('COUNT(*) as total_cinemas')) {
    const stats = {
      total_cinemas: mockCinemas.length,
      total_cities: new Set(mockCinemas.map(c => c.city)).size,
      average_rating: mockCinemas.reduce((sum, cinema) => sum + cinema.rating, 0) / mockCinemas.length,
      highest_rating: Math.max(...mockCinemas.map(c => c.rating)),
      lowest_rating: Math.min(...mockCinemas.map(c => c.rating)),
      average_price: mockCinemas.reduce((sum, cinema) => sum + cinema.avg_price, 0) / mockCinemas.length,
      highest_price: Math.max(...mockCinemas.map(c => c.avg_price)),
      lowest_price: Math.min(...mockCinemas.map(c => c.avg_price)),
      average_distance: mockCinemas.reduce((sum, cinema) => sum + cinema.distance_km, 0) / mockCinemas.length,
      farthest_distance: Math.max(...mockCinemas.map(c => c.distance_km)),
      nearest_distance: Math.min(...mockCinemas.map(c => c.distance_km))
    };
    return Promise.resolve({ recordset: [stats] });
  }
  
  // 获取城市列表
  if (sqlQuery.includes('SELECT DISTINCT city FROM Cinemas')) {
    const cities = [...new Set(mockCinemas.map(cinema => cinema.city))].sort();
    return Promise.resolve({ recordset: cities.map(city => ({ city })) });
  }
  
  // 电影插入操作
  if (sqlQuery.includes('INSERT INTO movies')) {
    const newId = Math.max(...mockMovies.map(m => m.id)) + 1;
    const newMovie = {
      id: newId,
      title: params[0],
      director: params[1],
      actor: params[2],
      type: params[3],
      score: params[4],
      image: params[5],
      description: params[6]
    };
    mockMovies.push(newMovie);
    return Promise.resolve({ recordset: [newMovie] });
  }
  
  // 电影更新操作
  if (sqlQuery.includes('UPDATE movies SET')) {
    const id = parseInt(params[7]);
    const movieIndex = mockMovies.findIndex(m => m.id === id);
    if (movieIndex !== -1) {
      mockMovies[movieIndex] = {
        ...mockMovies[movieIndex],
        title: params[0],
        director: params[1],
        actor: params[2],
        type: params[3],
        score: params[4],
        image: params[5],
        description: params[6]
      };
    }
    return Promise.resolve({ recordset: [] });
  }
  
  // 电影删除操作
  if (sqlQuery.includes('DELETE FROM movies WHERE id = @param1')) {
    const id = parseInt(params[0]);
    const movieIndex = mockMovies.findIndex(m => m.id === id);
    if (movieIndex !== -1) {
      mockMovies.splice(movieIndex, 1);
    }
    return Promise.resolve({ recordset: [] });
  }
  
  // 影院插入操作
  if (sqlQuery.includes('INSERT INTO Cinemas')) {
    const newCinema = {
      id: params[0],
      name: params[1],
      address: params[2],
      distance_km: params[3],
      avg_price: params[4],
      rating: params[5],
      city: params[6]
    };
    mockCinemas.push(newCinema);
    return Promise.resolve({ recordset: [newCinema] });
  }
  
  // 影院更新操作
  if (sqlQuery.includes('UPDATE Cinemas SET')) {
    const id = params[6];
    const cinemaIndex = mockCinemas.findIndex(c => c.id === id);
    if (cinemaIndex !== -1) {
      mockCinemas[cinemaIndex] = {
        ...mockCinemas[cinemaIndex],
        name: params[0],
        address: params[1],
        distance_km: params[2],
        avg_price: params[3],
        rating: params[4],
        city: params[5]
      };
    }
    return Promise.resolve({ recordset: [] });
  }
  
  // 影院删除操作
  if (sqlQuery.includes('DELETE FROM Cinemas WHERE id = @param1')) {
    const id = params[0];
    const cinemaIndex = mockCinemas.findIndex(c => c.id === id);
    if (cinemaIndex !== -1) {
      mockCinemas.splice(cinemaIndex, 1);
    }
    return Promise.resolve({ recordset: [] });
  }
  
  return Promise.resolve({ recordset: [] });
}

// 执行查询的通用函数
async function query(sqlQuery, params = []) {
  try {
    if (useMockData || !pool) {
      return await mockQuery(sqlQuery, params);
    }
    
    const request = pool.request();
    
    // 添加参数
    params.forEach((param, index) => {
      request.input(`param${index + 1}`, param);
    });
    
    const result = await request.query(sqlQuery);
    return result;
  } catch (err) {
    console.error('查询执行错误:', err);
    // 如果真实数据库查询失败，回退到模拟数据
    console.log('🔄 回退到模拟数据模式');
    return await mockQuery(sqlQuery, params);
  }
}

// 获取所有表名
async function getAllTables() {
  try {
    if (useMockData) {
      // 返回模拟的表结构
      return [
        { table_name: 'movies' },
        { table_name: 'Cinemas' }
      ];
    }
    
    const sqlQuery = `
      SELECT TABLE_NAME as table_name 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE' 
      AND TABLE_CATALOG = @param1
      ORDER BY TABLE_NAME
    `;
    
    const result = await query(sqlQuery, [config.database]);
    return result.recordset;
  } catch (error) {
    console.error('获取表列表失败:', error);
    return [];
  }
}

// 获取表结构
async function getTableSchema(tableName) {
  try {
    if (useMockData) {
      // 返回模拟的表结构
      if (tableName.toLowerCase() === 'movies') {
        return [
          { column_name: 'id', data_type: 'int', is_nullable: 'NO', column_default: null },
          { column_name: 'title', data_type: 'nvarchar', is_nullable: 'NO', column_default: null },
          { column_name: 'director', data_type: 'nvarchar', is_nullable: 'YES', column_default: null },
          { column_name: 'actor', data_type: 'nvarchar', is_nullable: 'YES', column_default: null },
          { column_name: 'type', data_type: 'nvarchar', is_nullable: 'YES', column_default: null },
          { column_name: 'score', data_type: 'float', is_nullable: 'YES', column_default: null },
          { column_name: 'image', data_type: 'nvarchar', is_nullable: 'YES', column_default: null },
          { column_name: 'description', data_type: 'nvarchar', is_nullable: 'YES', column_default: null }
        ];
      } else if (tableName.toLowerCase() === 'cinemas') {
        return [
          { column_name: 'id', data_type: 'nvarchar', is_nullable: 'NO', column_default: null },
          { column_name: 'name', data_type: 'nvarchar', is_nullable: 'NO', column_default: null },
          { column_name: 'address', data_type: 'nvarchar', is_nullable: 'YES', column_default: null },
          { column_name: 'distance_km', data_type: 'float', is_nullable: 'YES', column_default: null },
          { column_name: 'avg_price', data_type: 'float', is_nullable: 'YES', column_default: null },
          { column_name: 'rating', data_type: 'float', is_nullable: 'YES', column_default: null },
          { column_name: 'city', data_type: 'nvarchar', is_nullable: 'YES', column_default: null }
        ];
      }
      return [];
    }
    
    const sqlQuery = `
      SELECT 
        COLUMN_NAME as column_name,
        DATA_TYPE as data_type,
        IS_NULLABLE as is_nullable,
        COLUMN_DEFAULT as column_default,
        CHARACTER_MAXIMUM_LENGTH as max_length,
        NUMERIC_PRECISION as numeric_precision,
        NUMERIC_SCALE as numeric_scale
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = @param1 
      AND TABLE_CATALOG = @param2
      ORDER BY ORDINAL_POSITION
    `;
    
    const result = await query(sqlQuery, [tableName, config.database]);
    return result.recordset;
  } catch (error) {
    console.error('获取表结构失败:', error);
    return [];
  }
}

// 添加列到表
async function addColumn(tableName, columnName, dataType, isNullable = 'YES', defaultValue = null, maxLength = null) {
  try {
    if (useMockData) {
      console.log(`🔧 模拟添加列: ${tableName}.${columnName} ${dataType}`);
      return { success: true, message: '模拟模式：列添加成功' };
    }
    
    let sqlQuery = `ALTER TABLE ${tableName} ADD ${columnName} ${dataType}`;
    
    // 处理字符串类型的长度
    if (maxLength && (dataType.toLowerCase().includes('varchar') || dataType.toLowerCase().includes('nvarchar'))) {
      sqlQuery = `ALTER TABLE ${tableName} ADD ${columnName} ${dataType}(${maxLength})`;
    }
    
    // 处理是否允许NULL
    if (isNullable === 'NO') {
      sqlQuery += ' NOT NULL';
    }
    
    // 处理默认值
    if (defaultValue !== null && defaultValue !== '') {
      if (typeof defaultValue === 'string' && !defaultValue.startsWith('(')) {
        sqlQuery += ` DEFAULT '${defaultValue}'`;
      } else {
        sqlQuery += ` DEFAULT ${defaultValue}`;
      }
    }
    
    await query(sqlQuery);
    return { success: true, message: '列添加成功' };
  } catch (error) {
    console.error('添加列失败:', error);
    return { success: false, message: `添加列失败: ${error.message}` };
  }
}

// 创建新表
async function createTable(tableName, columns) {
  try {
    if (useMockData) {
      console.log(`🔧 模拟创建表: ${tableName}`);
      return { success: true, message: '模拟模式：表创建成功' };
    }
    
    if (!columns || columns.length === 0) {
      return { success: false, message: '至少需要定义一个列' };
    }
    
    let sqlQuery = `CREATE TABLE ${tableName} (`;
    const columnDefinitions = columns.map(col => {
      let definition = `${col.name} ${col.type}`;
      
      // 处理字符串类型的长度
      if (col.maxLength && (col.type.toLowerCase().includes('varchar') || col.type.toLowerCase().includes('nvarchar'))) {
        definition = `${col.name} ${col.type}(${col.maxLength})`;
      }
      
      // 处理是否允许NULL
      if (col.isNullable === 'NO') {
        definition += ' NOT NULL';
      }
      
      // 处理默认值
      if (col.defaultValue !== null && col.defaultValue !== '') {
        if (typeof col.defaultValue === 'string' && !col.defaultValue.startsWith('(')) {
          definition += ` DEFAULT '${col.defaultValue}'`;
        } else {
          definition += ` DEFAULT ${col.defaultValue}`;
        }
      }
      
      // 处理主键
      if (col.isPrimaryKey) {
        definition += ' PRIMARY KEY';
      }
      
      return definition;
    });
    
    sqlQuery += columnDefinitions.join(', ') + ')';
    
    await query(sqlQuery);
    return { success: true, message: '表创建成功' };
  } catch (error) {
    console.error('创建表失败:', error);
    return { success: false, message: `创建表失败: ${error.message}` };
  }
}

// 删除表
async function dropTable(tableName) {
  try {
    if (useMockData) {
      console.log(`🔧 模拟删除表: ${tableName}`);
      return { success: true, message: '模拟模式：表删除成功' };
    }
    
    const sqlQuery = `DROP TABLE ${tableName}`;
    await query(sqlQuery);
    return { success: true, message: '表删除成功' };
  } catch (error) {
    console.error('删除表失败:', error);
    return { success: false, message: `删除表失败: ${error.message}` };
  }
}

// 删除列
async function dropColumn(tableName, columnName) {
  try {
    if (useMockData) {
      console.log(`🔧 模拟删除列: ${tableName}.${columnName}`);
      return { success: true, message: '模拟模式：列删除成功' };
    }
    
    const sqlQuery = `ALTER TABLE ${tableName} DROP COLUMN ${columnName}`;
    await query(sqlQuery);
    return { success: true, message: '列删除成功' };
  } catch (error) {
    console.error('删除列失败:', error);
    return { success: false, message: `删除列失败: ${error.message}` };
  }
}

// 获取SQL Server数据类型列表
function getSqlServerDataTypes() {
  return [
    { value: 'int', label: 'int - 整数' },
    { value: 'bigint', label: 'bigint - 大整数' },
    { value: 'smallint', label: 'smallint - 小整数' },
    { value: 'tinyint', label: 'tinyint - 微整数' },
    { value: 'decimal', label: 'decimal - 精确小数' },
    { value: 'numeric', label: 'numeric - 数值' },
    { value: 'float', label: 'float - 浮点数' },
    { value: 'real', label: 'real - 实数' },
    { value: 'money', label: 'money - 货币' },
    { value: 'smallmoney', label: 'smallmoney - 小货币' },
    { value: 'bit', label: 'bit - 布尔值' },
    { value: 'char', label: 'char - 固定字符' },
    { value: 'varchar', label: 'varchar - 可变字符' },
    { value: 'nchar', label: 'nchar - 固定Unicode字符' },
    { value: 'nvarchar', label: 'nvarchar - 可变Unicode字符' },
    { value: 'text', label: 'text - 文本' },
    { value: 'ntext', label: 'ntext - Unicode文本' },
    { value: 'date', label: 'date - 日期' },
    { value: 'time', label: 'time - 时间' },
    { value: 'datetime', label: 'datetime - 日期时间' },
    { value: 'datetime2', label: 'datetime2 - 日期时间2' },
    { value: 'smalldatetime', label: 'smalldatetime - 小日期时间' },
    { value: 'timestamp', label: 'timestamp - 时间戳' },
    { value: 'uniqueidentifier', label: 'uniqueidentifier - 唯一标识符' },
    { value: 'binary', label: 'binary - 二进制' },
    { value: 'varbinary', label: 'varbinary - 可变二进制' },
    { value: 'image', label: 'image - 图像' },
    { value: 'xml', label: 'xml - XML数据' }
  ];
}

// 初始化连接
initializeDatabase().catch(console.error);

module.exports = {
  query,
  sql,
  pool: () => pool,
  useMockData: () => useMockData,
  checkDatabaseConnection,
  connectDatabase,
  getConnectionStatus: () => dbConnectionStatus,
  getAllTables,
  getTableSchema,
  addColumn,
  createTable,
  dropTable,
  dropColumn,
  getSqlServerDataTypes,
  // 连接监控相关函数
  startConnectionMonitor,
  stopConnectionMonitor,
  getConnectionMonitorStatus,
  updateConnectionMonitorConfig,
  performConnectionCheck
}; 