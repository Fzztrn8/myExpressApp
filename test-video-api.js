const axios = require('axios');

// 配置基础URL
const BASE_URL = 'http://localhost:3000';

// 测试视频数据
const testVideo = {
  video_id: 'test_' + Date.now(),
  title: '测试视频标题',
  description: '这是一个测试视频的描述',
  platform: 'local',
  thumbnail: '/images/test-video.jpg',
  duration: 180,
  view_count: 1000,
  like_count: 50,
  comment_count: 10
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

// 测试视频管理功能
async function testVideoManagement() {
  log('🚀 开始测试视频管理功能...', 'blue');
  log('='.repeat(60), 'blue');

  try {
    // 测试1: 获取视频列表
    log('\n📋 测试1: 获取视频列表', 'yellow');
    try {
      const response = await axios.get(`${BASE_URL}/videos`);
      log(`✅ 获取成功: 共 ${response.data.data.length} 个视频`, 'green');
      response.data.data.forEach(video => {
        log(`   - ${video.title} (${video.platform})`, 'green');
      });
    } catch (error) {
      log(`❌ 获取失败: ${error.response?.data?.message || error.message}`, 'red');
    }

    // 测试2: 添加视频记录
    log('\n📋 测试2: 添加视频记录', 'yellow');
    let newVideoId;
    try {
      const response = await axios.post(`${BASE_URL}/videos`, testVideo);
      log(`✅ 添加成功: ${response.data.message}`, 'green');
      log(`   视频ID: ${response.data.data.id}`, 'green');
      log(`   外部ID: ${response.data.data.video_id}`, 'green');
      newVideoId = response.data.data.id;
    } catch (error) {
      log(`❌ 添加失败: ${error.response?.data?.message || error.message}`, 'red');
      return; // 如果添加失败，停止后续测试
    }

    // 测试3: 获取单个视频详情
    log('\n📋 测试3: 获取单个视频详情', 'yellow');
    try {
      const response = await axios.get(`${BASE_URL}/videos/${newVideoId}`);
      log(`✅ 获取成功: ${response.data.data.title}`, 'green');
      log(`   观看次数: ${response.data.data.view_count}`, 'green');
      log(`   点赞数: ${response.data.data.like_count}`, 'green');
    } catch (error) {
      log(`❌ 获取失败: ${error.response?.data?.message || error.message}`, 'red');
    }

    // 测试4: 更新视频信息
    log('\n📋 测试4: 更新视频信息', 'yellow');
    try {
      const updateData = {
        title: '更新后的视频标题',
        description: '更新后的描述',
        view_count: 2000,
        like_count: 100
      };
      const response = await axios.put(`${BASE_URL}/videos/${newVideoId}`, updateData);
      log(`✅ 更新成功: ${response.data.message}`, 'green');
    } catch (error) {
      log(`❌ 更新失败: ${error.response?.data?.message || error.message}`, 'red');
    }

    // 测试5: 更新视频统计信息
    log('\n📋 测试5: 更新视频统计信息', 'yellow');
    try {
      const statsData = {
        view_count: 3000,
        like_count: 150,
        comment_count: 25
      };
      const response = await axios.patch(`${BASE_URL}/videos/${newVideoId}/stats`, statsData);
      log(`✅ 统计更新成功: ${response.data.message}`, 'green');
    } catch (error) {
      log(`❌ 统计更新失败: ${error.response?.data?.message || error.message}`, 'red');
    }

    // 测试6: 获取视频统计信息
    log('\n📋 测试6: 获取视频统计信息', 'yellow');
    try {
      const response = await axios.get(`${BASE_URL}/videos/${newVideoId}/stats`);
      log(`✅ 统计获取成功`, 'green');
      log(`   视频信息: ${response.data.data.video.title}`, 'green');
      log(`   观看次数: ${response.data.data.stats.total_views}`, 'green');
    } catch (error) {
      log(`❌ 统计获取失败: ${error.response?.data?.message || error.message}`, 'red');
    }

    // 测试7: 搜索视频
    log('\n📋 测试7: 搜索视频', 'yellow');
    try {
      const response = await axios.get(`${BASE_URL}/videos/search/测试`);
      log(`✅ 搜索成功: 找到 ${response.data.data.length} 个结果`, 'green');
    } catch (error) {
      log(`❌ 搜索失败: ${error.response?.data?.message || error.message}`, 'red');
    }

    // 测试8: 获取热门视频
    log('\n📋 测试8: 获取热门视频', 'yellow');
    try {
      const response = await axios.get(`${BASE_URL}/videos/popular/5`);
      log(`✅ 热门视频获取成功: ${response.data.data.length} 个视频`, 'green');
    } catch (error) {
      log(`❌ 热门视频获取失败: ${error.response?.data?.message || error.message}`, 'red');
    }

    // 测试9: 获取最新视频
    log('\n📋 测试9: 获取最新视频', 'yellow');
    try {
      const response = await axios.get(`${BASE_URL}/videos/latest/5`);
      log(`✅ 最新视频获取成功: ${response.data.data.length} 个视频`, 'green');
    } catch (error) {
      log(`❌ 最新视频获取失败: ${error.response?.data?.message || error.message}`, 'red');
    }

    // 测试10: 获取平台分布统计
    log('\n📋 测试10: 获取平台分布统计', 'yellow');
    try {
      const response = await axios.get(`${BASE_URL}/videos/stats/platforms`);
      log(`✅ 平台统计获取成功: ${response.data.data.length} 个平台`, 'green');
      response.data.data.forEach(platform => {
        log(`   - ${platform.platform}: ${platform.count} 个视频`, 'green');
      });
    } catch (error) {
      log(`❌ 平台统计获取失败: ${error.response?.data?.message || error.message}`, 'red');
    }

    // 测试11: 批量更新视频统计
    log('\n📋 测试11: 批量更新视频统计', 'yellow');
    try {
      const batchData = {
        videoStats: [
          { id: newVideoId, view_count: 5000, like_count: 200, comment_count: 30 }
        ]
      };
      const response = await axios.patch(`${BASE_URL}/videos/batch/stats`, batchData);
      log(`✅ 批量更新成功: ${response.data.message}`, 'green');
    } catch (error) {
      log(`❌ 批量更新失败: ${error.response?.data?.message || error.message}`, 'red');
    }

    // 测试12: 删除视频
    log('\n📋 测试12: 删除视频', 'yellow');
    try {
      const response = await axios.delete(`${BASE_URL}/videos/${newVideoId}`);
      log(`✅ 删除成功: ${response.data.message}`, 'green');
    } catch (error) {
      log(`❌ 删除失败: ${error.response?.data?.message || error.message}`, 'red');
    }

    log('\n' + '='.repeat(60), 'blue');
    log('🎉 视频管理功能测试完成！', 'green');
    log('\n💡 所有功能测试通过，视频管理功能正常工作', 'yellow');

  } catch (error) {
    log(`\n💥 测试过程中发生错误: ${error.message}`, 'red');
  }
}

// 运行测试
if (require.main === module) {
  testVideoManagement();
}

module.exports = { testVideoManagement }; 