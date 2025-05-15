// src/utils/chartUtils.js

/**
 * 生成图表的渐变色
 * @param {string} startColor - 开始颜色 (hex)
 * @param {string} endColor - 结束颜色 (hex)
 * @returns {function} - 返回渐变生成函数
 */
export const createGradient = (startColor, endColor) => {
  return function(ctx) {
    const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
    gradient.addColorStop(0, startColor);
    gradient.addColorStop(1, endColor);
    return gradient;
  };
};

/**
 * 根据百分比获取颜色
 * @param {number} percent - 百分比 (0-100)
 * @returns {string} - 对应的颜色
 */
export const getColorByPercent = (percent) => {
  if (percent >= 90) return '#e74c3c'; // 红色 - 高负载
  if (percent >= 70) return '#f39c12'; // 橙色 - 中等负载
  if (percent >= 50) return '#3498db'; // 蓝色 - 正常负载
  return '#2ecc71'; // 绿色 - 低负载
};

/**
 * 格式化X轴时间标签
 * @param {string} timestamp - 时间戳
 * @returns {string} - 格式化后的时间标签
 */
export const formatXAxisTime = (timestamp) => {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  
  return `${hours}:${minutes}`;
};

/**
 * 自定义图表工具提示格式化
 * @param {Object} params - 工具提示参数
 * @returns {string} - 格式化后的工具提示HTML
 */
export const formatTooltip = (params) => {
  let tooltipContent = '';
  
  if (!params || params.length === 0) return tooltipContent;
  
  // 获取时间
  const time = params[0].axisValue;
  tooltipContent += `<div class="tooltip-time">${time}</div>`;
  
  // 添加每个系列的数据
  params.forEach(param => {
    tooltipContent += `
      <div class="tooltip-item">
        <span class="tooltip-marker" style="background-color: ${param.color}"></span>
        <span class="tooltip-name">${param.seriesName}</span>
        <span class="tooltip-value">${param.value}</span>
      </div>
    `;
  });
  
  return tooltipContent;
};

/**
 * 计算图表Y轴的最大值
 * @param {Array} data - 数据数组
 * @param {string} dataKey - 数据键名
 * @param {number} buffer - 缓冲系数 (默认1.1，即110%)
 * @returns {number} - Y轴最大值
 */
export const calculateYAxisMax = (data, dataKey, buffer = 1.1) => {
  if (!data || data.length === 0) return 100;
  
  const max = Math.max(...data.map(item => item[dataKey] || 0));
  return Math.ceil(max * buffer);
};