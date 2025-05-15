// src/api/subscriptions.js
import API_BASE_URL, { createHeaders, handleResponse } from './config';

/**
 * 获取用户订阅的服务器列表
 * @param {number} userId - 用户ID
 * @param {string} token - JWT令牌
 * @returns {Promise<Object>} - 包含服务器订阅列表的对象
 */
export const getUserSubscriptions = async (userId, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/subscriptions?user_id=${userId}`, {
      method: 'GET',
      headers: createHeaders(token),
    });
    
    return handleResponse(response);
  } catch (error) {
    console.error('Get subscriptions error:', error);
    throw error;
  }
};

/**
 * 订阅新的服务器
 * @param {number} userId - 用户ID
 * @param {number} serverId - 服务器ID
 * @param {Array<string>} tags - 标签数组
 * @param {string} notes - 备注
 * @param {string} token - JWT令牌
 * @returns {Promise<Object>} - 包含订阅结果的对象
 */
export const subscribeToServer = async (userId, serverId, tags, notes, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/subscriptions`, {
      method: 'POST',
      headers: createHeaders(token),
      body: JSON.stringify({ user_id: userId, server_id: serverId, tags, notes }),
    });
    
    return handleResponse(response);
  } catch (error) {
    console.error('Subscribe to server error:', error);
    throw error;
  }
};

/**
 * 取消订阅服务器
 * @param {number} subscriptionId - 订阅ID
 * @param {string} token - JWT令牌
 * @returns {Promise<Object>} - 包含取消订阅结果的对象
 */
export const unsubscribeFromServer = async (subscriptionId, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/subscriptions/${subscriptionId}`, {
      method: 'DELETE',
      headers: createHeaders(token),
    });
    
    return handleResponse(response);
  } catch (error) {
    console.error(`Unsubscribe from server error:`, error);
    throw error;
  }
};

/**
 * 更新服务器订阅信息
 * @param {number} subscriptionId - 订阅ID
 * @param {Array<string>} tags - 标签数组
 * @param {string} notes - 备注
 * @param {string} token - JWT令牌
 * @returns {Promise<Object>} - 包含更新结果的对象
 */
export const updateSubscription = async (subscriptionId, tags, notes, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/subscriptions/${subscriptionId}`, {
      method: 'PUT',
      headers: createHeaders(token),
      body: JSON.stringify({ tags, notes }),
    });
    
    return handleResponse(response);
  } catch (error) {
    console.error(`Update subscription error:`, error);
    throw error;
  }
};