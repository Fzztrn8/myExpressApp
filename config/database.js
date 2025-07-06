const sql = require('mssql');

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
    requestTimeout: 30000,
    connectionTimeout: 30000
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

// 创建连接池
let pool;

// 初始化数据库连接
async function initializeDatabase() {
  if (useMockData) {
    console.log('✅ 模拟数据库模式已启用');
    return null;
  }

  try {
    pool = await sql.connect(config);
    console.log('✅ Azure SQL Database 连接成功');
    return pool;
  } catch (err) {
    console.error('❌ Azure SQL Database 连接错误:', err);
    console.log('🔄 切换到模拟数据模式');
    return null;
  }
}

// 模拟查询函数
function mockQuery(sqlQuery, params = []) {
  console.log('🔧 执行模拟查询:', sqlQuery);
  
  // 解析SQL查询类型
  if (sqlQuery.includes('SELECT COUNT(*)')) {
    return Promise.resolve({ recordset: [{ count: mockMovies.length }] });
  }
  
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
  
  // 统计查询
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

// 初始化连接
initializeDatabase().catch(console.error);

module.exports = {
  query,
  sql,
  pool: () => pool,
  useMockData: () => useMockData
}; 