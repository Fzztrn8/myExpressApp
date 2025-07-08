const db = require('../config/database');

class Cinema {
  // 获取所有影院
  static async getAllCinemas() {
    try {
      const query = 'SELECT * FROM Cinemas ORDER BY rating DESC, distance_km ASC';
      const result = await db.query(query);
      return result.recordset;
    } catch (error) {
      throw new Error(`获取影院列表失败: ${error.message}`);
    }
  }

  // 根据ID获取影院详情
  static async getCinemaById(id) {
    try {
      const query = 'SELECT * FROM Cinemas WHERE id = @param1';
      const result = await db.query(query, [id]);
      return result.recordset[0];
    } catch (error) {
      throw new Error(`获取影院详情失败: ${error.message}`);
    }
  }

  // 根据城市获取影院
  static async getCinemasByCity(city) {
    try {
      const query = 'SELECT * FROM Cinemas WHERE city = @param1 ORDER BY rating DESC, distance_km ASC';
      const result = await db.query(query, [city]);
      return result.recordset;
    } catch (error) {
      throw new Error(`获取城市影院失败: ${error.message}`);
    }
  }

  // 根据距离范围获取影院
  static async getCinemasByDistance(maxDistance) {
    try {
      const query = 'SELECT * FROM Cinemas WHERE distance_km <= @param1 ORDER BY distance_km ASC, rating DESC';
      const result = await db.query(query, [maxDistance]);
      return result.recordset;
    } catch (error) {
      throw new Error(`获取距离影院失败: ${error.message}`);
    }
  }

  // 根据价格范围获取影院
  static async getCinemasByPrice(minPrice, maxPrice) {
    try {
      const query = 'SELECT * FROM Cinemas WHERE avg_price >= @param1 AND avg_price <= @param2 ORDER BY avg_price ASC, rating DESC';
      const result = await db.query(query, [minPrice, maxPrice]);
      return result.recordset;
    } catch (error) {
      throw new Error(`获取价格影院失败: ${error.message}`);
    }
  }

  // 根据评分获取影院
  static async getCinemasByRating(minRating) {
    try {
      const query = 'SELECT * FROM Cinemas WHERE rating >= @param1 ORDER BY rating DESC, distance_km ASC';
      const result = await db.query(query, [minRating]);
      return result.recordset;
    } catch (error) {
      throw new Error(`获取评分影院失败: ${error.message}`);
    }
  }

  // 搜索影院（名称、地址、城市）
  static async searchCinemas(searchTerm) {
    try {
      const query = `
        SELECT * FROM Cinemas 
        WHERE name LIKE @param1 
        OR address LIKE @param1 
        OR city LIKE @param1
        ORDER BY rating DESC, distance_km ASC
      `;
      const result = await db.query(query, [`%${searchTerm}%`]);
      return result.recordset;
    } catch (error) {
      throw new Error(`搜索影院失败: ${error.message}`);
    }
  }

  // 获取高分影院
  static async getTopRatedCinemas(limit = 10) {
    try {
      const query = 'SELECT TOP (@param1) * FROM Cinemas ORDER BY rating DESC, distance_km ASC';
      const result = await db.query(query, [limit]);
      return result.recordset;
    } catch (error) {
      throw new Error(`获取高分影院失败: ${error.message}`);
    }
  }

  // 获取最近影院
  static async getNearestCinemas(limit = 10) {
    try {
      const query = 'SELECT TOP (@param1) * FROM Cinemas ORDER BY distance_km ASC, rating DESC';
      const result = await db.query(query, [limit]);
      return result.recordset;
    } catch (error) {
      throw new Error(`获取最近影院失败: ${error.message}`);
    }
  }

  // 获取最便宜影院
  static async getCheapestCinemas(limit = 10) {
    try {
      const query = 'SELECT TOP (@param1) * FROM Cinemas WHERE avg_price IS NOT NULL ORDER BY avg_price ASC, rating DESC';
      const result = await db.query(query, [limit]);
      return result.recordset;
    } catch (error) {
      throw new Error(`获取最便宜影院失败: ${error.message}`);
    }
  }

  // 获取影院统计信息
  static async getCinemaStats() {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_cinemas,
          COUNT(DISTINCT city) as total_cities,
          AVG(CAST(rating AS FLOAT)) as average_rating,
          MAX(rating) as highest_rating,
          MIN(rating) as lowest_rating,
          AVG(CAST(avg_price AS FLOAT)) as average_price,
          MAX(avg_price) as highest_price,
          MIN(avg_price) as lowest_price,
          AVG(CAST(distance_km AS FLOAT)) as average_distance,
          MAX(distance_km) as farthest_distance,
          MIN(distance_km) as nearest_distance
        FROM Cinemas
      `;
      const result = await db.query(query);
      return result.recordset[0];
    } catch (error) {
      throw new Error(`获取影院统计失败: ${error.message}`);
    }
  }

  // 获取所有城市列表
  static async getAllCities() {
    try {
      const query = 'SELECT DISTINCT city FROM Cinemas WHERE city IS NOT NULL ORDER BY city';
      const result = await db.query(query);
      return result.recordset.map(row => row.city);
    } catch (error) {
      throw new Error(`获取城市列表失败: ${error.message}`);
    }
  }

  // 根据多个条件筛选影院
  static async filterCinemas(filters) {
    try {
      let query = 'SELECT * FROM Cinemas WHERE 1=1';
      const params = [];
      let paramIndex = 1;

      if (filters.city) {
        query += ` AND city = @param${paramIndex}`;
        params.push(filters.city);
        paramIndex++;
      }

      if (filters.minRating) {
        query += ` AND rating >= @param${paramIndex}`;
        params.push(filters.minRating);
        paramIndex++;
      }

      if (filters.maxDistance) {
        query += ` AND distance_km <= @param${paramIndex}`;
        params.push(filters.maxDistance);
        paramIndex++;
      }

      if (filters.minPrice) {
        query += ` AND avg_price >= @param${paramIndex}`;
        params.push(filters.minPrice);
        paramIndex++;
      }

      if (filters.maxPrice) {
        query += ` AND avg_price <= @param${paramIndex}`;
        params.push(filters.maxPrice);
        paramIndex++;
      }

      // 排序
      if (filters.sortBy === 'distance') {
        query += ' ORDER BY distance_km ASC, rating DESC';
      } else if (filters.sortBy === 'price') {
        query += ' ORDER BY avg_price ASC, rating DESC';
      } else {
        query += ' ORDER BY rating DESC, distance_km ASC';
      }

      const result = await db.query(query, params);
      return result.recordset;
    } catch (error) {
      throw new Error(`筛选影院失败: ${error.message}`);
    }
  }

  // 创建影院
  static async createCinema(cinemaData) {
    try {
      const query = `
        INSERT INTO Cinemas (id, name, address, distance_km, avg_price, rating, city)
        VALUES (@param1, @param2, @param3, @param4, @param5, @param6, @param7)
      `;
      const result = await db.query(query, [
        cinemaData.id,
        cinemaData.name,
        cinemaData.address,
        cinemaData.distance_km,
        cinemaData.avg_price,
        cinemaData.rating,
        cinemaData.city
      ]);
      return result;
    } catch (error) {
      throw new Error(`创建影院失败: ${error.message}`);
    }
  }

  // 更新影院
  static async updateCinema(id, cinemaData) {
    try {
      const query = `
        UPDATE Cinemas 
        SET name = @param1, address = @param2, distance_km = @param3, 
            avg_price = @param4, rating = @param5, city = @param6
        WHERE id = @param7
      `;
      const result = await db.query(query, [
        cinemaData.name,
        cinemaData.address,
        cinemaData.distance_km,
        cinemaData.avg_price,
        cinemaData.rating,
        cinemaData.city,
        id
      ]);
      return result;
    } catch (error) {
      throw new Error(`更新影院失败: ${error.message}`);
    }
  }

  // 删除影院
  static async deleteCinema(id) {
    try {
      const query = 'DELETE FROM Cinemas WHERE id = @param1';
      const result = await db.query(query, [id]);
      return result;
    } catch (error) {
      throw new Error(`删除影院失败: ${error.message}`);
    }
  }

  // 获取指定影院下所有电影信息
  static async getMoviesByCinemaId(cinemaId) {
    try {
      const query = `
        SELECT m.*
        FROM cinema_movie cm
        JOIN movies m ON cm.movie_id = m.id
        WHERE cm.cinema_id = @param1
        ORDER BY m.id
      `;
      const result = await db.query(query, [cinemaId]);
      return result.recordset;
    } catch (error) {
      throw new Error(`获取影院电影失败: ${error.message}`);
    }
  }
}

module.exports = Cinema; 