// src/components/performance/MemoryChart.jsx
import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
} from 'recharts';
import './Charts.css';

const MemoryChart = ({ data }) => {
  // console.log(data);
  
  // 格式化X轴时间戳
  const formatXAxis = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
  };
  
  // 格式化内存大小
  const formatMemory = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // 自定义Tooltip内容
  const CustomTooltip = ({ active, payload, label }) => {    
    if (active && payload && payload.length) {
      const date = new Date(label);
      const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
      
      return (
        <div className="custom-tooltip">
          <p className="tooltip-time">{formattedDate}</p>
          <p className="tooltip-value">
            内存使用率: <span className="memory-percent">{payload[0].value.toFixed(2)}%</span>
          </p>
          <p className="tooltip-value">
            已用内存: <span className="memory-used">{formatMemory(payload[1].value)}</span>
          </p>
          <p className="tooltip-value">
            总内存: <span className="memory-total">{formatMemory(payload[2].value)}</span>
          </p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className="chart-wrapper">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="timestamp"
            tickFormatter={formatXAxis}
            label={{ value: '时间', position: 'insideBottomRight', offset: 0 }}
          />
          
          {/* 主 Y 轴（内存使用率） */}
          <YAxis
            yAxisId="left"
            domain={[0, 100]}
            allowDataOverflow={true}
            label={{ value: '使用率 (%)', angle: -90, position: 'insideLeft' }}
          />
          
          {/* 隐藏的辅助 Y 轴（处理大内存数值） */}
          <YAxis
            yAxisId="right"
            orientation="right"
            hide={true}
          />

          <Tooltip content={<CustomTooltip />} />
          <Legend />

          {/* 内存使用率（主线条） */}
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="percent"
            name="内存使用率"
            stroke="#82ca9d"
            activeDot={{ r: 8 }}
          />

          {/* 已用内存（完全隐藏） */}
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="used"
            name="已用内存"
            stroke="transparent"
            strokeWidth={0}
            dot={false}
            activeDot={false}
          />

          {/* 总内存（完全隐藏） */}
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="total"
            name="总内存"
            stroke="transparent"
            strokeWidth={0}
            dot={false}
            activeDot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MemoryChart;