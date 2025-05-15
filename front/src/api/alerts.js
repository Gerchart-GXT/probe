// src/api/alerts.js
import API_BASE_URL, { createHeaders, handleResponse } from './config';

/**
 * 获取服务器报警信息
 * @param {number} serverId - 服务器ID
 * @param {string} startTime - 开始时间 (YYYY-MM-DD HH:MM:SS)
 * @param {string} endTime - 结束时间 (YYYY-MM-DD HH:MM:SS)
 * @param {string} token - JWT令牌
 * @returns {Promise<Object>} - 包含报警信息的对象
 */
export const getAlerts = async (serverId, startTime, endTime, token) => {
  try {
    const url = new URL(`${API_BASE_URL}/alerts`);
    url.searchParams.append('server_id', serverId);
    url.searchParams.append('start_time', startTime);
    url.searchParams.append('end_time', endTime);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: createHeaders(token),
    });
    
    return handleResponse(response);
  } catch (error) {
    console.error('Get alerts error:', error);
    throw error;
  }
};

/**
 * 获取最新的报警信息
 * @param {number} serverId - 服务器ID
 * @param {string} token - JWT令牌
 * @returns {Promise<Object>} - 包含最新报警信息的对象
 */
export const getLatestAlerts = async (serverId, token) => {
  try {
    // 获取当前时间和7天前的时间
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const startTime = sevenDaysAgo.toISOString().replace('T', ' ').substring(0, 19);
    const endTime = now.toISOString().replace('T', ' ').substring(0, 19);
    
    return getAlerts(serverId, startTime, endTime, token);
  } catch (error) {
    console.error('Get latest alerts error:', error);
    throw error;
  }
};