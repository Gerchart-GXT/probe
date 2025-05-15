// src/components/performance/CpuChart.jsx
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
} from 'recharts';
import './Charts.css';

const CpuChart = ({ data }) => {
  // 格式化X轴时间戳
  const formatXAxis = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
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
            CPU使用率: <span className="cpu-value">{payload[0].value.toFixed(2)}%</span>
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
          <YAxis 
            domain={[0, 100]} 
            label={{ value: '使用率 (%)', angle: -90, position: 'insideLeft' }} 
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="usage" 
            name="CPU使用率" 
            stroke="#8884d8" 
            activeDot={{ r: 8 }} 
            isAnimationActive={true}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CpuChart;