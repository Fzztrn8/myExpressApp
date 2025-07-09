// 数据库结构自动检测与修复脚本
const db = require('./config/database');

// 需要检测/修复的表结构定义
const tableDefinitions = [
  {
    name: 'users',
    columns: [
      { name: 'id', type: 'INT', isPrimaryKey: true, isNullable: 'NO' },
      { name: 'username', type: 'NVARCHAR', maxLength: 100, isNullable: 'NO' },
      { name: 'password_hash', type: 'NVARCHAR', maxLength: 255, isNullable: 'NO' },
      { name: 'email', type: 'NVARCHAR', maxLength: 255, isNullable: 'YES' },
      { name: 'phone', type: 'NVARCHAR', maxLength: 50, isNullable: 'YES' },
      { name: 'created_at', type: 'DATETIME', isNullable: 'YES', defaultValue: 'GETDATE()' }
    ]
  },
  {
    name: 'videos',
    columns: [
      { name: 'id', type: 'INT', isPrimaryKey: true, isNullable: 'NO' },
      { name: 'video_id', type: 'NVARCHAR', maxLength: 100, isNullable: 'NO' },
      { name: 'title', type: 'NVARCHAR', maxLength: 200, isNullable: 'NO' },
      { name: 'description', type: 'NVARCHAR', maxLength: 1000, isNullable: 'YES' },
      { name: 'platform', type: 'NVARCHAR', maxLength: 50, isNullable: 'YES' },
      { name: 'thumbnail', type: 'NVARCHAR', maxLength: 500, isNullable: 'YES' },
      { name: 'duration', type: 'INT', isNullable: 'YES' },
      { name: 'view_count', type: 'INT', isNullable: 'YES', defaultValue: 0 },
      { name: 'like_count', type: 'INT', isNullable: 'YES', defaultValue: 0 },
      { name: 'comment_count', type: 'INT', isNullable: 'YES', defaultValue: 0 },
      { name: 'status', type: 'NVARCHAR', maxLength: 20, isNullable: 'YES', defaultValue: 'active' },
      { name: 'created_by', type: 'NVARCHAR', maxLength: 100, isNullable: 'YES' },
      { name: 'created_at', type: 'DATETIME2', isNullable: 'YES', defaultValue: 'GETDATE()' },
      { name: 'updated_at', type: 'DATETIME2', isNullable: 'YES', defaultValue: 'GETDATE()' }
    ]
  },
  {
    name: 'video_comments',
    columns: [
      { name: 'id', type: 'INT', isPrimaryKey: true, isNullable: 'NO' },
      { name: 'video_id', type: 'INT', isNullable: 'NO' },
      { name: 'parent_id', type: 'INT', isNullable: 'YES' },
      { name: 'user_id', type: 'NVARCHAR', maxLength: 100, isNullable: 'NO' },
      { name: 'user_name', type: 'NVARCHAR', maxLength: 100, isNullable: 'YES' },
      { name: 'user_ip', type: 'NVARCHAR', maxLength: 45, isNullable: 'YES' },
      { name: 'content', type: 'NVARCHAR', maxLength: 1000, isNullable: 'NO' },
      { name: 'like_count', type: 'INT', isNullable: 'YES', defaultValue: 0 },
      { name: 'status', type: 'NVARCHAR', maxLength: 20, isNullable: 'YES', defaultValue: 'active' },
      { name: 'created_at', type: 'DATETIME2', isNullable: 'YES', defaultValue: 'GETDATE()' },
      { name: 'updated_at', type: 'DATETIME2', isNullable: 'YES', defaultValue: 'GETDATE()' }
    ]
  }
];

async function repairTable(tableDef) {
  const { name, columns } = tableDef;
  const tables = await db.getAllTables();
  const tableNames = tables.map(t => t.table_name.toLowerCase());
  if (!tableNames.includes(name.toLowerCase())) {
    console.log(`表 ${name} 不存在，正在创建...`);
    await db.createTable(name, columns);
    console.log(`表 ${name} 已创建。`);
    return;
  }
  // 检查字段
  const schema = await db.getTableSchema(name);
  const existingCols = schema.map(col => col.column_name.toLowerCase());
  for (const col of columns) {
    if (!existingCols.includes(col.name.toLowerCase())) {
      console.log(`表 ${name} 缺少字段 ${col.name}，正在补齐...`);
      await db.addColumn(name, col.name, col.type, col.isNullable, col.defaultValue, col.maxLength);
      console.log(`字段 ${col.name} 已添加到表 ${name}`);
    }
  }
}

async function main() {
  console.log('开始自动检测和修复数据库结构...');
  for (const tableDef of tableDefinitions) {
    await repairTable(tableDef);
  }
  console.log('数据库结构检测与修复完成。');
  process.exit(0);
}

main().catch(err => {
  console.error('数据库结构修复出错:', err);
  process.exit(1);
}); 