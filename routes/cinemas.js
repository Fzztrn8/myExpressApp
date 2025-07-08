const express = require('express');
const router = express.Router();
const Cinema = require('../models/cinema');

// 获取所有影院
router.get('/', async (req, res) => {
  try {
    const cinemas = await Cinema.getAllCinemas();
    res.json({
      success: true,
      data: cinemas,
      count: cinemas.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 根据ID获取影院详情
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const cinema = await Cinema.getCinemaById(id);
    if (!cinema) {
      return res.status(404).json({
        success: false,
        message: '影院不存在'
      });
    }

    res.json({
      success: true,
      data: cinema
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 获取指定影院下所有电影信息
router.get('/:id/movies', async (req, res) => {
  try {
    const cinemaId = req.params.id;
    const movies = await Cinema.getMoviesByCinemaId(cinemaId);
    res.json({
      success: true,
      data: movies,
      count: movies.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 根据城市获取影院
router.get('/city/:city', async (req, res) => {
  try {
    const city = req.params.city;
    const cinemas = await Cinema.getCinemasByCity(city);
    
    res.json({
      success: true,
      data: cinemas,
      count: cinemas.length,
      city: city
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 根据距离范围获取影院
router.get('/distance/:maxDistance', async (req, res) => {
  try {
    const maxDistance = parseFloat(req.params.maxDistance);
    if (isNaN(maxDistance) || maxDistance < 0) {
      return res.status(400).json({
        success: false,
        message: '无效的距离参数'
      });
    }

    const cinemas = await Cinema.getCinemasByDistance(maxDistance);
    
    res.json({
      success: true,
      data: cinemas,
      count: cinemas.length,
      maxDistance: maxDistance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 根据价格范围获取影院
router.get('/price/:minPrice/:maxPrice', async (req, res) => {
  try {
    const minPrice = parseFloat(req.params.minPrice);
    const maxPrice = parseFloat(req.params.maxPrice);
    
    if (isNaN(minPrice) || isNaN(maxPrice) || minPrice < 0 || maxPrice < 0 || minPrice > maxPrice) {
      return res.status(400).json({
        success: false,
        message: '无效的价格参数'
      });
    }

    const cinemas = await Cinema.getCinemasByPrice(minPrice, maxPrice);
    
    res.json({
      success: true,
      data: cinemas,
      count: cinemas.length,
      priceRange: { min: minPrice, max: maxPrice }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 根据评分获取影院
router.get('/rating/:minRating', async (req, res) => {
  try {
    const minRating = parseFloat(req.params.minRating);
    if (isNaN(minRating) || minRating < 0 || minRating > 10) {
      return res.status(400).json({
        success: false,
        message: '无效的评分参数（0-10）'
      });
    }

    const cinemas = await Cinema.getCinemasByRating(minRating);
    
    res.json({
      success: true,
      data: cinemas,
      count: cinemas.length,
      minRating: minRating
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 搜索影院
router.get('/search/:term', async (req, res) => {
  try {
    const searchTerm = req.params.term;
    const cinemas = await Cinema.searchCinemas(searchTerm);
    
    res.json({
      success: true,
      data: cinemas,
      count: cinemas.length,
      searchTerm: searchTerm
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 获取高分影院
router.get('/top/:limit?', async (req, res) => {
  try {
    const limit = req.params.limit ? parseInt(req.params.limit) : 10;
    if (isNaN(limit) || limit <= 0) {
      return res.status(400).json({
        success: false,
        message: '无效的限制数量'
      });
    }

    const cinemas = await Cinema.getTopRatedCinemas(limit);
    
    res.json({
      success: true,
      data: cinemas,
      count: cinemas.length,
      limit: limit
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 获取最近影院
router.get('/nearest/:limit?', async (req, res) => {
  try {
    const limit = req.params.limit ? parseInt(req.params.limit) : 10;
    if (isNaN(limit) || limit <= 0) {
      return res.status(400).json({
        success: false,
        message: '无效的限制数量'
      });
    }

    const cinemas = await Cinema.getNearestCinemas(limit);
    
    res.json({
      success: true,
      data: cinemas,
      count: cinemas.length,
      limit: limit
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 获取最便宜影院
router.get('/cheapest/:limit?', async (req, res) => {
  try {
    const limit = req.params.limit ? parseInt(req.params.limit) : 10;
    if (isNaN(limit) || limit <= 0) {
      return res.status(400).json({
        success: false,
        message: '无效的限制数量'
      });
    }

    const cinemas = await Cinema.getCheapestCinemas(limit);
    
    res.json({
      success: true,
      data: cinemas,
      count: cinemas.length,
      limit: limit
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 获取影院统计信息
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await Cinema.getCinemaStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 获取所有城市列表
router.get('/cities/list', async (req, res) => {
  try {
    const cities = await Cinema.getAllCities();
    
    res.json({
      success: true,
      data: cities,
      count: cities.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 高级筛选影院
router.post('/filter', async (req, res) => {
  try {
    const filters = req.body;
    
    // 验证筛选参数
    if (filters.minRating && (filters.minRating < 0 || filters.minRating > 10)) {
      return res.status(400).json({
        success: false,
        message: '评分范围应为0-10'
      });
    }
    
    if (filters.maxDistance && filters.maxDistance < 0) {
      return res.status(400).json({
        success: false,
        message: '距离不能为负数'
      });
    }
    
    if (filters.minPrice && filters.minPrice < 0) {
      return res.status(400).json({
        success: false,
        message: '价格不能为负数'
      });
    }
    
    if (filters.maxPrice && filters.maxPrice < 0) {
      return res.status(400).json({
        success: false,
        message: '价格不能为负数'
      });
    }
    
    if (filters.minPrice && filters.maxPrice && filters.minPrice > filters.maxPrice) {
      return res.status(400).json({
        success: false,
        message: '最低价格不能大于最高价格'
      });
    }

    const cinemas = await Cinema.filterCinemas(filters);
    
    res.json({
      success: true,
      data: cinemas,
      count: cinemas.length,
      filters: filters
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router; 