const db = require('../config/database');

class Movie {
  // 获取所有电影
  static async getAllMovies() {
    try {
      const query = 'SELECT * FROM movies ORDER BY id';
      const result = await db.query(query);
      return result.recordset;
    } catch (error) {
      throw new Error(`获取电影列表失败: ${error.message}`);
    }
  }

  // 根据ID获取电影
  static async getMovieById(id) {
    try {
      const query = 'SELECT * FROM movies WHERE id = @param1';
      const result = await db.query(query, [id]);
      return result.recordset[0];
    } catch (error) {
      throw new Error(`获取电影详情失败: ${error.message}`);
    }
  }

  // 根据类型获取电影
  static async getMoviesByType(type) {
    try {
      const query = 'SELECT * FROM movies WHERE type = @param1 ORDER BY score DESC';
      const result = await db.query(query, [type]);
      return result.recordset;
    } catch (error) {
      throw new Error(`获取类型电影失败: ${error.message}`);
    }
  }

  // 根据导演获取电影
  static async getMoviesByDirector(director) {
    try {
      const query = 'SELECT * FROM movies WHERE director LIKE @param1 ORDER BY score DESC';
      const result = await db.query(query, [`%${director}%`]);
      return result.recordset;
    } catch (error) {
      throw new Error(`获取导演电影失败: ${error.message}`);
    }
  }

  // 根据演员获取电影
  static async getMoviesByActor(actor) {
    try {
      const query = 'SELECT * FROM movies WHERE actor LIKE @param1 ORDER BY score DESC';
      const result = await db.query(query, [`%${actor}%`]);
      return result.recordset;
    } catch (error) {
      throw new Error(`获取演员电影失败: ${error.message}`);
    }
  }

  // 搜索电影（标题、导演、演员）
  static async searchMovies(searchTerm) {
    try {
      const query = `
        SELECT * FROM movies 
        WHERE title LIKE @param1 
        OR director LIKE @param1 
        OR actor LIKE @param1 
        OR description LIKE @param1
        ORDER BY score DESC
      `;
      const result = await db.query(query, [`%${searchTerm}%`]);
      return result.recordset;
    } catch (error) {
      throw new Error(`搜索电影失败: ${error.message}`);
    }
  }

  // 创建电影
  static async createMovie(movieData) {
    try {
      const query = `
        INSERT INTO movies (title, director, actor, type, score, image, description)
        VALUES (@param1, @param2, @param3, @param4, @param5, @param6, @param7)
      `;
      const result = await db.query(query, [
        movieData.title,
        movieData.director,
        movieData.actor,
        movieData.type,
        movieData.score,
        movieData.image,
        movieData.description
      ]);
      return result;
    } catch (error) {
      throw new Error(`创建电影失败: ${error.message}`);
    }
  }

  // 更新电影
  static async updateMovie(id, movieData) {
    try {
      const query = `
        UPDATE movies 
        SET title = @param1, director = @param2, actor = @param3, 
            type = @param4, score = @param5, image = @param6, description = @param7
        WHERE id = @param8
      `;
      const result = await db.query(query, [
        movieData.title,
        movieData.director,
        movieData.actor,
        movieData.type,
        movieData.score,
        movieData.image,
        movieData.description,
        id
      ]);
      return result;
    } catch (error) {
      throw new Error(`更新电影失败: ${error.message}`);
    }
  }

  // 删除电影
  static async deleteMovie(id) {
    try {
      const query = 'DELETE FROM movies WHERE id = @param1';
      const result = await db.query(query, [id]);
      return result;
    } catch (error) {
      throw new Error(`删除电影失败: ${error.message}`);
    }
  }

  // 获取高分电影
  static async getTopRatedMovies(limit = 10) {
    try {
      const query = 'SELECT TOP (@param1) * FROM movies ORDER BY score DESC';
      const result = await db.query(query, [limit]);
      return result.recordset;
    } catch (error) {
      throw new Error(`获取高分电影失败: ${error.message}`);
    }
  }

  // 获取电影统计信息
  static async getMovieStats() {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_movies,
          AVG(CAST(score AS FLOAT)) as average_score,
          MAX(score) as highest_score,
          MIN(score) as lowest_score,
          COUNT(DISTINCT type) as total_types,
          COUNT(DISTINCT director) as total_directors
        FROM movies
      `;
      const result = await db.query(query);
      return result.recordset[0];
    } catch (error) {
      throw new Error(`获取电影统计失败: ${error.message}`);
    }
  }
}

module.exports = Movie; 