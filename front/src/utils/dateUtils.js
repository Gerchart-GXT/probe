// src/utils/dateUtils.js

/**
 * 格式化日期时间为 YYYY-MM-DD HH:MM:SS
 * @param {Date|string} date - 日期对象或日期字符串
 * @returns {string} - 格式化后的日期字符串
 */
export const formatDateTime = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

/**
 * 格式化日期为 YYYY-MM-DD
 * @param {Date|string} date - 日期对象或日期字符串
 * @returns {string} - 格式化后的日期字符串
 */
export const formatDate = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * 格式化为友好的时间显示，如"x分钟前"、"x小时前"等
 * @param {Date|string} date - 日期对象或日期字符串
 * @returns {string} - 友好的时间字符串
 */
export const formatRelativeTime = (date) => {
  const now = new Date();
  const d = date instanceof Date ? date : new Date(date);
  const diff = now.getTime() - d.getTime();
  
  // 将毫秒转换为秒
  const seconds = Math.floor(diff / 1000);
  
  if (seconds < 60) {
    return '刚刚';
  }
  
  // 分钟
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}分钟前`;
  }
  
  // 小时
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}小时前`;
  }
  
  // 天
  const days = Math.floor(hours / 24);
  if (days < 30) {
    return `${days}天前`;
  }
  
  // 月
  const months = Math.floor(days / 30);
  if (months < 12) {
    return `${months}个月前`;
  }
  
  // 年
  const years = Math.floor(months / 12);
  return `${years}年前`;
};

/**
 * 获取日期的时间部分 (HH:MM)
 * @param {Date|string} date - 日期对象或日期字符串
 * @returns {string} - 时间字符串
 */
export const getTimeString = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  return `${hours}:${minutes}`;
};

/**
 * 计算两个日期之间的差异（天数）
 * @param {Date|string} dateStart - 开始日期
 * @param {Date|string} dateEnd - 结束日期
 * @returns {number} - 天数差异
 */
export const daysBetween = (dateStart, dateEnd) => {
  const start = new Date(dateStart);
  const end = new Date(dateEnd);
  
  // 设置时间为0来只比较日期
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  
  // 计算差异（毫秒）
  const diffTime = Math.abs(end - start);
  
  // 转换为天数
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};