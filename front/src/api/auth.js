// src/api/auth.js
import API_BASE_URL, { createHeaders, handleResponse } from './config';

/**
 * 用户注册
 * @param {string} username - 用户名
 * @param {string} password - 密码
 * @param {string} email - 邮箱
 * @returns {Promise<Object>} - 包含message的对象
 */
export const register = async (username, password, email) => {
  try {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify({ username, password, email }),
    });
    
    return handleResponse(response);
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

/**
 * 用户登录
 * @param {string} username - 用户名
 * @param {string} password - 密码
 * @returns {Promise<Object>} - 包含access_token的对象
 */
export const login = async (username, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify({ username, password }),
    });
    
    return handleResponse(response);
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

/**
 * 判断当前token是否有效
 * @param {string} token - JWT令牌
 * @returns {Promise<boolean>} - 令牌是否有效
 */
export const validateToken = async (token) => {
  // 注意：这个API可能需要在后端实现
  try {
    const response = await fetch(`${API_BASE_URL}/validate-token`, {
      method: 'GET',
      headers: createHeaders(token),
    });
    
    return response.ok;
  } catch (error) {
    console.error('Token validation error:', error);
    return false;
  }
};