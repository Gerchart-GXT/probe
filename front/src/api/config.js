// src/api/config.js
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:7777/api';

// 创建通用的请求头配置
export const createHeaders = (token = null) => {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// 处理响应
export const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API error: ${response.status}`);
  }
  return response.json();
};

export default API_BASE_URL;