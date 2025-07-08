const axios = require('axios');

// 配置基础URL
const BASE_URL = 'http://localhost:3000/users';

// 存储测试过程中的token
let authToken = '';

// 测试用户数据
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

// 测试函数
async function runTests() {
  log('🚀 开始用户API测试...', 'blue');
  log('='.repeat(50), 'blue');

  try {
    // 测试1: 初始化用户表
    log('\n📋 测试1: 初始化用户表', 'yellow');
    try {
      const response = await axios.post(`${BASE_URL}/init`);
      log(`✅ 初始化成功: ${response.data.message}`, 'green');
    } catch (error) {
      log(`❌ 初始化失败: ${error.response?.data?.message || error.message}`, 'red');
    }

    // 测试2: 检查用户名可用性
    log('\n📋 测试2: 检查用户名可用性', 'yellow');
    try {
      const response = await axios.get(`${BASE_URL}/check-username/${testUser.username}`);
      log(`✅ 用户名检查: ${response.data.message}`, 'green');
    } catch (error) {
      log(`❌ 用户名检查失败: ${error.response?.data?.message || error.message}`, 'red');
    }

    // 测试3: 检查邮箱可用性
    log('\n📋 测试3: 检查邮箱可用性', 'yellow');
    try {
      const response = await axios.get(`${BASE_URL}/check-email/${testUser.email}`);
      log(`✅ 邮箱检查: ${response.data.message}`, 'green');
    } catch (error) {
      log(`❌ 邮箱检查失败: ${error.response?.data?.message || error.message}`, 'red');
    }

    // 测试4: 用户注册
    log('\n📋 测试4: 用户注册', 'yellow');
    try {
      const response = await axios.post(`${BASE_URL}/register`, testUser);
      log(`✅ 注册成功: ${response.data.message}`, 'green');
      log(`   用户ID: ${response.data.data.id}`, 'green');
    } catch (error) {
      log(`❌ 注册失败: ${error.response?.data?.message || error.message}`, 'red');
      return; // 如果注册失败，停止后续测试
    }

    // 测试5: 重复注册（应该失败）
    log('\n📋 测试5: 重复注册测试', 'yellow');
    try {
      await axios.post(`${BASE_URL}/register`, testUser);
      log(`❌ 重复注册应该失败但成功了`, 'red');
    } catch (error) {
      log(`✅ 重复注册正确失败: ${error.response?.data?.message}`, 'green');
    }

    // 测试6: 用户登录
    log('\n📋 测试6: 用户登录', 'yellow');
    try {
      const response = await axios.post(`${BASE_URL}/login`, {
        username: testUser.username,
        password: testUser.password
      });
      authToken = response.data.data.token;
      log(`✅ 登录成功: ${response.data.message}`, 'green');
      log(`   Token: ${authToken.substring(0, 20)}...`, 'green');
    } catch (error) {
      log(`❌ 登录失败: ${error.response?.data?.message || error.message}`, 'red');
      return;
    }

    // 测试7: 验证Token
    log('\n📋 测试7: 验证Token', 'yellow');
    try {
      const response = await axios.get(`${BASE_URL}/verify`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      log(`✅ Token验证成功: ${response.data.message}`, 'green');
    } catch (error) {
      log(`❌ Token验证失败: ${error.response?.data?.message || error.message}`, 'red');
    }

    // 测试8: 获取用户信息
    log('\n📋 测试8: 获取用户信息', 'yellow');
    try {
      const response = await axios.get(`${BASE_URL}/profile`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      log(`✅ 获取用户信息成功`, 'green');
      log(`   用户名: ${response.data.data.username}`, 'green');
      log(`   邮箱: ${response.data.data.email}`, 'green');
    } catch (error) {
      log(`❌ 获取用户信息失败: ${error.response?.data?.message || error.message}`, 'red');
    }

    // 测试9: 更新用户信息
    log('\n📋 测试9: 更新用户信息', 'yellow');
    try {
      const updateData = {
        email: 'updated@example.com',
        phone: '13900139000'
      };
      const response = await axios.put(`${BASE_URL}/profile`, updateData, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      log(`✅ 更新用户信息成功: ${response.data.message}`, 'green');
    } catch (error) {
      log(`❌ 更新用户信息失败: ${error.response?.data?.message || error.message}`, 'red');
    }

    // 测试10: 修改密码
    log('\n📋 测试10: 修改密码', 'yellow');
    try {
      const response = await axios.put(`${BASE_URL}/password`, {
        oldPassword: testUser.password,
        newPassword: 'newpassword123'
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      log(`✅ 修改密码成功: ${response.data.message}`, 'green');
      
      // 使用新密码登录测试
      const loginResponse = await axios.post(`${BASE_URL}/login`, {
        username: testUser.username,
        password: 'newpassword123'
      });
      log(`✅ 新密码登录成功`, 'green');
      authToken = loginResponse.data.data.token;
    } catch (error) {
      log(`❌ 修改密码失败: ${error.response?.data?.message || error.message}`, 'red');
    }

    // 测试11: 无Token访问受保护资源
    log('\n📋 测试11: 无Token访问测试', 'yellow');
    try {
      await axios.get(`${BASE_URL}/profile`);
      log(`❌ 无Token访问应该失败但成功了`, 'red');
    } catch (error) {
      log(`✅ 无Token访问正确失败: ${error.response?.data?.message}`, 'green');
    }

    // 测试12: 无效Token访问
    log('\n📋 测试12: 无效Token访问测试', 'yellow');
    try {
      await axios.get(`${BASE_URL}/profile`, {
        headers: { Authorization: 'Bearer invalid-token' }
      });
      log(`❌ 无效Token访问应该失败但成功了`, 'red');
    } catch (error) {
      log(`✅ 无效Token访问正确失败: ${error.response?.data?.message}`, 'green');
    }

    log('\n' + '='.repeat(50), 'blue');
    log('🎉 所有测试完成！', 'green');

  } catch (error) {
    log(`\n💥 测试过程中发生错误: ${error.message}`, 'red');
  }
}

// 运行测试
if (require.main === module) {
  runTests();
}

module.exports = { runTests }; 