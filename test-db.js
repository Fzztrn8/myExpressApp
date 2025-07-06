// 数据库连接测试脚本
require('dotenv').config();

const db = require('./config/database');

async function testDatabaseConnection() {
  try {
    console.log('正在测试数据库连接...');
    
    // 测试简单查询
    const result = await db.query('SELECT 1 as test');
    console.log('✅ 数据库连接成功!');
    console.log('测试查询结果:', result.recordset);
    
    // 测试movies表是否存在
    try {
      const moviesResult = await db.query('SELECT COUNT(*) as count FROM movies');
      console.log('✅ movies表存在，记录数:', moviesResult.recordset[0].count);
    } catch (error) {
      console.log('⚠️ movies表不存在或无法访问:', error.message);
      console.log('请运行 database/create_movies_table.sql 创建表和数据');
    }
    
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    console.log('\n请检查以下环境变量是否正确配置:');
    console.log('- AZURE_SQL_USER');
    console.log('- AZURE_SQL_PASSWORD');
    console.log('- AZURE_SQL_SERVER');
    console.log('- AZURE_SQL_DATABASE');
  } finally {
    process.exit(0);
  }
}

testDatabaseConnection(); 