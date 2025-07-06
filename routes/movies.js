const express = require('express');
const router = express.Router();
const Movie = require('../models/movie');

// 获取所有电影
router.get('/', async (req, res) => {
  try {
    const movies = await Movie.getAllMovies();
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

// 根据ID获取电影详情
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: '无效的电影ID'
      });
    }

    const movie = await Movie.getMovieById(id);
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: '电影不存在'
      });
    }

    res.json({
      success: true,
      data: movie
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 根据类型获取电影
router.get('/type/:type', async (req, res) => {
  try {
    const type = req.params.type;
    const movies = await Movie.getMoviesByType(type);
    
    res.json({
      success: true,
      data: movies,
      count: movies.length,
      type: type
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 根据导演获取电影
router.get('/director/:director', async (req, res) => {
  try {
    const director = req.params.director;
    const movies = await Movie.getMoviesByDirector(director);
    
    res.json({
      success: true,
      data: movies,
      count: movies.length,
      director: director
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 根据演员获取电影
router.get('/actor/:actor', async (req, res) => {
  try {
    const actor = req.params.actor;
    const movies = await Movie.getMoviesByActor(actor);
    
    res.json({
      success: true,
      data: movies,
      count: movies.length,
      actor: actor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 搜索电影
router.get('/search/:term', async (req, res) => {
  try {
    const searchTerm = req.params.term;
    const movies = await Movie.searchMovies(searchTerm);
    
    res.json({
      success: true,
      data: movies,
      count: movies.length,
      searchTerm: searchTerm
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 获取高分电影
router.get('/top/:limit?', async (req, res) => {
  try {
    const limit = req.params.limit ? parseInt(req.params.limit) : 10;
    if (isNaN(limit) || limit <= 0) {
      return res.status(400).json({
        success: false,
        message: '无效的限制数量'
      });
    }

    const movies = await Movie.getTopRatedMovies(limit);
    
    res.json({
      success: true,
      data: movies,
      count: movies.length,
      limit: limit
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 获取电影统计信息
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await Movie.getMovieStats();
    
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

module.exports = router; 