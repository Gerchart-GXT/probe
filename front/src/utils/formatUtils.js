// src/utils/formatUtils.js

/**
 * 格式化字节大小为易读格式
 * @param {number} bytes - 字节数
 * @param {number} decimals - 小数位数 (默认2位)
 * @returns {string} - 格式化后的字符串，如 "1.5 MB"
 */
export const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
};


/**
 * 格式化传输速率为易读格式
 * @param {number} bytesPerSecond - 每秒字节数
 * @param {number} decimals - 小数位数 (默认2位)
 * @returns {string} - 格式化后的字符串，如 "1.5 MB/s"
 */
export const formatSpeed = (bytesPerSecond, decimals = 2) => {
  if (bytesPerSecond === 0) return '0 B/s';
  
  const formatted = formatBytes(bytesPerSecond, decimals);
  return formatted.replace(/\s([A-Z]+)$/, ' $1/s');
};

/**
 * 格式化百分比
 * @param {number} percent - 百分比值
 * @param {number} decimals - 小数位数 (默认1位)
 * @returns {string} - 格式化后的百分比字符串，如 "25.5%"
 */
export const formatPercent = (percent, decimals = 1) => {
  return percent.toFixed(decimals) + '%';
};

/**
 * 格式化数字，添加千位分隔符
 * @param {number} num - 数字
 * @returns {string} - 格式化后的字符串，如 "1,234,567"
 */
export const formatNumber = (num) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

/**
 * 截断长文本并添加省略号
 * @param {string} text - 原文本
 * @param {number} maxLength - 最大长度
 * @returns {string} - 截断后的文本
 */
export const truncateText = (text, maxLength) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * 解析JSON字符串，出错时返回默认值
 * @param {string} jsonString - JSON字符串
 * @param {*} defaultValue - 默认值
 * @returns {*} - 解析后的对象或默认值
 */
export const safeParseJSON = (jsonString, defaultValue = {}) => {
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    console.error('JSON parse error:', e);
    return defaultValue;
  }
};