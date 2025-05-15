// src/utils/authUtils.js

/**
 * 检查令牌是否有效（未过期）
 * @param {string} token - JWT令牌
 * @returns {boolean} - 令牌是否有效
 */
export const isTokenValid = (token) => {
  if (!token) return false;
  
  try {
    // JWT令牌由三部分组成，用.分隔
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    // 解码令牌的Payload部分
    const payload = JSON.parse(atob(parts[1]));
    
    // 检查是否有过期时间
    if (!payload.exp) return true;
    
    // 将过期时间转换为毫秒
    const expirationTime = payload.exp * 1000;
    const currentTime = Date.now();
    
    return currentTime < expirationTime;
  } catch (error) {
    console.error('Token validation error:', error);
    return false;
  }
};

/**
 * 获取用户ID从JWT令牌
 * @param {string} token - JWT令牌
 * @returns {number|null} - 用户ID或null
 */
export const getUserIdFromToken = (token) => {
  if (!token) return null;
  
  try {
    // JWT令牌由三部分组成，用.分隔
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    // 解码令牌的Payload部分
    const payload = JSON.parse(atob(parts[1]));
    
    // 返回用户ID (假设JWT包含user_id字段)
    return payload.user_id || null;
  } catch (error) {
    console.error('Get user ID from token error:', error);
    return null;
  }
};

/**
 * 检查用户是否有权限访问资源
 * @param {Object} user - 用户对象
 * @param {string} resource - 资源名称
 * @returns {boolean} - 是否有权限
 */
export const hasPermission = (user, resource) => {
  if (!user) return false;
  
  // 这里可以实现基于用户角色/权限的访问控制
  // 简单示例：始终返回true，表示用户有权限
  return true;
};