// src/api/servers.js
import API_BASE_URL, { createHeaders, handleResponse } from './config';

/**
 * 获取所有服务器信息
 * @param {string} token - JWT令牌 
 * @returns {Promise<Object>} - 包含服务器列表的对象
 */
export const getAllServers = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/servers`, {
      method: 'GET',
      headers: createHeaders(token),
    });
    
    return handleResponse(response);
  } catch (error) {
    console.error('Get servers error:', error);
    throw error;
  }
};

/**
 * 获取单个服务器信息
 * @param {number} serverId - 服务器ID
 * @param {string} token - JWT令牌
 * @returns {Promise<Object>} - 服务器详细信息
 */
export const getServerById = async (serverId, token) => {
  try {
    // 获取原始响应数据
    const responseData = await getAllServers(token);
    
    // 统一数据结构处理（关键修复点）
    const servers = Array.isArray(responseData) 
      ? responseData 
      : responseData?.data || [];

    // 防御性类型检查
    if (!Array.isArray(servers)) {
      throw new Error("Invalid servers data structure");
    }

    // 健壮的ID匹配（支持数字和字符串ID）
    const foundServer = servers.find(server => 
      String(server?.id) === String(serverId)
    );

    if (!foundServer) {
      throw new Error(`Server ${serverId} not found`);
    }

    return foundServer;
  } catch (error) {
    console.error(`[API] Get server ${serverId} failed:`, error);
    throw new Error(
      error.message || `Failed to retrieve server ${serverId}`
    );
  }
};