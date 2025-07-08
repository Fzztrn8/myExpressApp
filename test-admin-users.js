const axios = require('axios');

// 配置基础URL
const BASE_URL = 'http://localhost:3000';

// 测试数据
const testUser = {
  username: 'testuser_' + Date.now(),
  password: 'password123',
  email: 'test@example.com',
  phone: '13800138000'
};

// 颜色输出函数
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 测试管理员用户管理功能
async function testAdminUserManagement() {
  log('🚀 开始测试管理员用户管理功能...', 'blue');
  log('='.repeat(60), 'blue');

  try {
    // 测试1: 访问管理员登录页面
    log('\n📋 测试1: 访问管理员登录页面', 'yellow');
    try {
      const response = await axios.get(`${BASE_URL}/admin/login`);
      log(`✅ 管理员登录页面访问成功 (状态码: ${response.status})`, 'green');
    } catch (error) {
      log(`❌ 管理员登录页面访问失败: ${error.message}`, 'red');
    }

    // 测试2: 管理员登录
    log('\n📋 测试2: 管理员登录', 'yellow');
    try {
      const response = await axios.post(`${BASE_URL}/admin/login`, {
        password: 'admin123'
      }, {
        maxRedirects: 0,
        validateStatus: function (status) {
          return status >= 200 && status < 400;
        }
      });
      log(`✅ 管理员登录成功 (状态码: ${response.status})`, 'green');
    } catch (error) {
      if (error.response && error.response.status === 302) {
        log(`✅ 管理员登录成功 (重定向到管理后台)`, 'green');
      } else {
        log(`❌ 管理员登录失败: ${error.message}`, 'red');
      }
    }

    // 测试3: 访问用户管理页面
    log('\n📋 测试3: 访问用户管理页面', 'yellow');
    try {
      const response = await axios.get(`${BASE_URL}/admin/users`);
      log(`✅ 用户管理页面访问成功 (状态码: ${response.status})`, 'green');
    } catch (error) {
      log(`❌ 用户管理页面访问失败: ${error.message}`, 'red');
    }

    // 测试4: 访问用户统计页面
    log('\n📋 测试4: 访问用户统计页面', 'yellow');
    try {
      const response = await axios.get(`${BASE_URL}/admin/user-stats`);
      log(`✅ 用户统计页面访问成功 (状态码: ${response.status})`, 'green');
    } catch (error) {
      log(`❌ 用户统计页面访问失败: ${error.message}`, 'red');
    }

    // 测试5: 访问添加用户页面
    log('\n📋 测试5: 访问添加用户页面', 'yellow');
    try {
      const response = await axios.get(`${BASE_URL}/admin/users/add`);
      log(`✅ 添加用户页面访问成功 (状态码: ${response.status})`, 'green');
    } catch (error) {
      log(`❌ 添加用户页面访问失败: ${error.message}`, 'red');
    }

    log('\n' + '='.repeat(60), 'blue');
    log('🎉 管理员用户管理功能测试完成！', 'green');
    log('\n💡 提示：', 'yellow');
    log('1. 访问 http://localhost:3000/admin/login 进行管理员登录', 'yellow');
    log('2. 默认管理员密码：admin123', 'yellow');
    log('3. 登录后可以访问用户管理功能', 'yellow');
    log('4. 如果数据库未连接，系统会使用模拟数据', 'yellow');

  } catch (error) {
    log(`\n💥 测试过程中发生错误: ${error.message}`, 'red');
  }
}

// 运行测试
if (require.main === module) {
  testAdminUserManagement();
}

module.exports = { testAdminUserManagement }; 