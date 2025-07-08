const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

class User {
  // 创建用户表
  static async createTable() {
    const createTableSQL = `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='users' AND xtype='U')
      CREATE TABLE users (
        id INT IDENTITY(1,1) PRIMARY KEY,
        username NVARCHAR(100) NOT NULL UNIQUE,
        password_hash NVARCHAR(255) NOT NULL,
        email NVARCHAR(255),
        phone NVARCHAR(50),
        created_at DATETIME DEFAULT GETDATE()
      )
    `;
    
    try {
      await db.query(createTableSQL);
      console.log('用户表创建成功或已存在');
      return true;
    } catch (error) {
      console.error('创建用户表失败:', error);
      return false;
    }
  }

  // 用户注册
  static async register(userData) {
    const { username, password, email, phone } = userData;
    
    // 验证必填字段
    if (!username || !password) {
      throw new Error('用户名和密码是必填项');
    }
    
    // 验证用户名长度
    if (username.length < 3 || username.length > 20) {
      throw new Error('用户名长度必须在3-20个字符之间');
    }
    
    // 验证密码强度
    if (password.length < 6) {
      throw new Error('密码长度至少6个字符');
    }
    
    // 验证邮箱格式（如果提供）
    if (email && !this.isValidEmail(email)) {
      throw new Error('邮箱格式不正确');
    }
    
    // 验证手机号格式（如果提供）
    if (phone && !this.isValidPhone(phone)) {
      throw new Error('手机号格式不正确');
    }
    
    try {
      // 检查用户名是否已存在
      const existingUser = await this.findByUsername(username);
      if (existingUser) {
        throw new Error('用户名已存在');
      }
      
      // 检查邮箱是否已存在（如果提供）
      if (email) {
        const existingEmail = await this.findByEmail(email);
        if (existingEmail) {
          throw new Error('邮箱已被注册');
        }
      }
      
      // 加密密码
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);
      
      // 插入用户数据
      const insertSQL = `
        INSERT INTO users (username, password_hash, email, phone)
        VALUES (@username, @passwordHash, @email, @phone)
      `;
      
      const params = [
        { name: 'username', value: username },
        { name: 'passwordHash', value: passwordHash },
        { name: 'email', value: email || null },
        { name: 'phone', value: phone || null }
      ];
      
      const result = await db.query(insertSQL, params);
      
      // 获取新创建的用户（不包含密码）
      const newUser = await this.findByUsername(username);
      return {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        phone: newUser.phone,
        created_at: newUser.created_at
      };
      
    } catch (error) {
      throw error;
    }
  }

  // 用户登录
  static async login(username, password) {
    if (!username || !password) {
      throw new Error('用户名和密码是必填项');
    }
    
    try {
      // 查找用户
      const user = await this.findByUsername(username);
      if (!user) {
        throw new Error('用户名或密码错误');
      }
      
      // 验证密码
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        throw new Error('用户名或密码错误');
      }
      
      // 生成JWT token
      const token = jwt.sign(
        { 
          id: user.id, 
          username: user.username 
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );
      
      return {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          phone: user.phone,
          created_at: user.created_at
        },
        token
      };
      
    } catch (error) {
      throw error;
    }
  }

  // 根据用户名查找用户
  static async findByUsername(username) {
    const sql = 'SELECT * FROM users WHERE username = @username';
    const params = [{ name: 'username', value: username }];
    
    try {
      const result = await db.query(sql, params);
      return result.recordset[0] || null;
    } catch (error) {
      console.error('查找用户失败:', error);
      return null;
    }
  }

  // 根据邮箱查找用户
  static async findByEmail(email) {
    const sql = 'SELECT * FROM users WHERE email = @email';
    const params = [{ name: 'email', value: email }];
    
    try {
      const result = await db.query(sql, params);
      return result.recordset[0] || null;
    } catch (error) {
      console.error('查找用户失败:', error);
      return null;
    }
  }

  // 根据ID查找用户
  static async findById(id) {
    const sql = 'SELECT id, username, email, phone, created_at FROM users WHERE id = @id';
    const params = [{ name: 'id', value: id }];
    
    try {
      const result = await db.query(sql, params);
      return result.recordset[0] || null;
    } catch (error) {
      console.error('查找用户失败:', error);
      return null;
    }
  }

  // 更新用户信息
  static async updateUser(id, updateData) {
    const { email, phone } = updateData;
    
    // 验证邮箱格式（如果提供）
    if (email && !this.isValidEmail(email)) {
      throw new Error('邮箱格式不正确');
    }
    
    // 验证手机号格式（如果提供）
    if (phone && !this.isValidPhone(phone)) {
      throw new Error('手机号格式不正确');
    }
    
    try {
      // 检查邮箱是否已被其他用户使用
      if (email) {
        const existingEmail = await this.findByEmail(email);
        if (existingEmail && existingEmail.id !== id) {
          throw new Error('邮箱已被其他用户使用');
        }
      }
      
      const updateSQL = `
        UPDATE users 
        SET email = @email, phone = @phone
        WHERE id = @id
      `;
      
      const params = [
        { name: 'id', value: id },
        { name: 'email', value: email || null },
        { name: 'phone', value: phone || null }
      ];
      
      await db.query(updateSQL, params);
      
      // 返回更新后的用户信息
      return await this.findById(id);
      
    } catch (error) {
      throw error;
    }
  }

  // 修改密码
  static async changePassword(id, oldPassword, newPassword) {
    if (!oldPassword || !newPassword) {
      throw new Error('旧密码和新密码都是必填项');
    }
    
    if (newPassword.length < 6) {
      throw new Error('新密码长度至少6个字符');
    }
    
    try {
      // 获取用户信息
      const user = await this.findById(id);
      if (!user) {
        throw new Error('用户不存在');
      }
      
      // 获取完整用户信息（包含密码）
      const fullUser = await this.findByUsername(user.username);
      
      // 验证旧密码
      const isOldPasswordValid = await bcrypt.compare(oldPassword, fullUser.password_hash);
      if (!isOldPasswordValid) {
        throw new Error('旧密码错误');
      }
      
      // 加密新密码
      const saltRounds = 10;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);
      
      // 更新密码
      const updateSQL = 'UPDATE users SET password_hash = @passwordHash WHERE id = @id';
      const params = [
        { name: 'id', value: id },
        { name: 'passwordHash', value: newPasswordHash }
      ];
      
      await db.query(updateSQL, params);
      
      return { message: '密码修改成功' };
      
    } catch (error) {
      throw error;
    }
  }

  // 获取所有用户（管理员功能）
  static async getAllUsers() {
    const sql = 'SELECT id, username, email, phone, created_at FROM users ORDER BY created_at DESC';
    
    try {
      const result = await db.query(sql);
      return result.recordset;
    } catch (error) {
      console.error('获取用户列表失败:', error);
      return [];
    }
  }

  // 删除用户（管理员功能）
  static async deleteUser(id) {
    const sql = 'DELETE FROM users WHERE id = @id';
    const params = [{ name: 'id', value: id }];
    
    try {
      const result = await db.query(sql, params);
      return result.rowsAffected[0] > 0;
    } catch (error) {
      console.error('删除用户失败:', error);
      return false;
    }
  }

  // 验证邮箱格式
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // 验证手机号格式
  static isValidPhone(phone) {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  }

  // 验证JWT token
  static verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    } catch (error) {
      return null;
    }
  }
}

module.exports = User; 