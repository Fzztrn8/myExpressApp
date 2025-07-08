const axios = require('axios');

// 配置基础URL
const BASE_URL = 'http://localhost:3000';

// 测试用户数据
const testUser = {
  username: 'testuser_' + Math.floor(Math.random() * 1000),
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

// 测试用户注册功能修复
async function testUserRegistrationFix() {
  log('🚀 开始测试用户注册功能修复...', 'blue');
  log('='.repeat(60), 'blue');

  try {
    // 测试1: 初始化用户表
    log('\n📋 测试1: 初始化用户表', 'yellow');
    try {
      const response = await axios.post(`${BASE_URL}/users/init`);
      log(`✅ 初始化成功: ${response.data.message}`, 'green');
    } catch (error) {
      log(`❌ 初始化失败: ${error.response?.data?.message || error.message}`, 'red');
    }

    // 测试2: 用户注册
    log('\n📋 测试2: 用户注册', 'yellow');
    try {
      const response = await axios.post(`${BASE_URL}/users/register`, testUser);
      log(`✅ 注册成功: ${response.data.message}`, 'green');
      log(`   用户ID: ${response.data.data.id}`, 'green');
      log(`   用户名: ${response.data.data.username}`, 'green');
    } catch (error) {
      log(`❌ 注册失败: ${error.response?.data?.message || error.message}`, 'red');
      return; // 如果注册失败，停止后续测试
    }

    // 测试3: 用户登录
    log('\n📋 测试3: 用户登录', 'yellow');
    try {
      const response = await axios.post(`${BASE_URL}/users/login`, {
        username: testUser.username,
        password: testUser.password
      });
      log(`✅ 登录成功: ${response.data.message}`, 'green');
      log(`   Token: ${response.data.data.token.substring(0, 20)}...`, 'green');
    } catch (error) {
      log(`❌ 登录失败: ${error.response?.data?.message || error.message}`, 'red');
    }

    // 测试4: 检查用户名可用性
    log('\n📋 测试4: 检查用户名可用性', 'yellow');
    try {
      const response = await axios.get(`${BASE_URL}/users/check-username/${testUser.username}`);
      log(`✅ 用户名检查: ${response.data.message}`, 'green');
    } catch (error) {
      log(`❌ 用户名检查失败: ${error.response?.data?.message || error.message}`, 'red');
    }

    // 测试5: 检查邮箱可用性
    log('\n📋 测试5: 检查邮箱可用性', 'yellow');
    try {
      const response = await axios.get(`${BASE_URL}/users/check-email/${testUser.email}`);
      log(`✅ 邮箱检查: ${response.data.message}`, 'green');
    } catch (error) {
      log(`❌ 邮箱检查失败: ${error.response?.data?.message || error.message}`, 'red');
    }

    log('\n' + '='.repeat(60), 'blue');
    log('🎉 用户注册功能修复测试完成！', 'green');
    log('\n💡 如果所有测试都通过，说明参数处理问题已修复', 'yellow');

  } catch (error) {
    log(`\n💥 测试过程中发生错误: ${error.message}`, 'red');
  }
}

// 运行测试
if (require.main === module) {
  testUserRegistrationFix();
}

module.exports = { testUserRegistrationFix }; 