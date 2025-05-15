// src/api/performanceData.js
import API_BASE_URL, { createHeaders, handleResponse } from './config';

/**
 * 获取服务器性能数据
 * @param {number} serverId - 服务器ID
 * @param {string} startTime - 开始时间 (YYYY-MM-DD HH:MM:SS)
 * @param {string} endTime - 结束时间 (YYYY-MM-DD HH:MM:SS)
 * @param {string} token - JWT令牌
 * @returns {Promise<Object>} - 包含性能数据的对象
 */
export const getPerformanceData = async (serverId, startTime, endTime, token) => {
  try {
    const url = new URL(`${API_BASE_URL}/performance-data`);
    url.searchParams.append('server_id', serverId);
    url.searchParams.append('start_time', startTime);
    url.searchParams.append('end_time', endTime);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: createHeaders(token),
    });
    return handleResponse(response);
  } catch (error) {
    console.error('Get performance data error:', error);
    throw error;
  }
};

/**
 * 获取最新的性能数据
 * @param {number} serverId - 服务器ID
 * @param {string} token - JWT令牌
 * @returns {Promise<Object>} - 包含最新性能数据的对象
 */
export const getLatestPerformanceData = async (serverId, token) => {
  try {
    // 获取当前时间和24小时前的时间
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const startTime = oneDayAgo.toISOString().replace('T', ' ').substring(0, 19);
    const endTime = now.toISOString().replace('T', ' ').substring(0, 19);
    
    return getPerformanceData(serverId, startTime, endTime, token);
  } catch (error) {
    console.error('Get latest performance data error:', error);
    throw error;
  }
};