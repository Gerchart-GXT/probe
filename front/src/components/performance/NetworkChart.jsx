// src/components/performance/NetworkChart.jsx
import React, { useState } from 'react';
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

const NetworkChart = ({ data }) => {
  console.log(data);

  const [showDownload, setShowDownload] = useState(true);
  const [showUpload, setShowUpload] = useState(true);
  
  // 格式化X轴时间戳
  const formatXAxis = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  // 格式化网络速度
  const formatSpeed = (bytesPerSec) => {
    if (bytesPerSec === 0) return '0 B/s';
    const k = 1024;
    const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s', 'TB/s'];
    const i = Math.floor(Math.log(bytesPerSec) / Math.log(k));
    return parseFloat((bytesPerSec / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 格式化总流量
 const formatTraffic = (bytes) => {
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
      const networkInfo = payload[0].payload;
      
      return (
        <div className="custom-tooltip">
          <p className="tooltip-time">{formattedDate}</p>
          <p className="tooltip-label">网络接口: {networkInfo.interface}</p>
          {showUpload && (
            <p className="tooltip-value">
              上传速度: <span className="upload-speed">{formatSpeed(networkInfo.uploadSpeed)}</span>
            </p>
          )}
          {showDownload && (
            <p className="tooltip-value">
              下载速度: <span className="download-speed">{formatSpeed(networkInfo.downloadSpeed)}</span>
            </p>
          )}
          <p className="tooltip-value">
            总上传: <span className="total-upload">{formatTraffic(networkInfo.totalUpload)}</span>
          </p>
          <p className="tooltip-value">
            总下载: <span className="total-download">{formatTraffic(networkInfo.totalDownload)}</span>
          </p>
        </div>
      );
    }
    
    return null;
  };

  // 图例点击切换显示
  const handleLegendClick = (entry) => {
    if (entry.dataKey === 'uploadSpeed') {
      setShowUpload(!showUpload);
    } else if (entry.dataKey === 'downloadSpeed') {
      setShowDownload(!showDownload);
    }
  };

  return (
    <div className="chart-wrapper">
      <div className="chart-controls">
        <label className="chart-control-item">
          <input
            type="checkbox"
            checked={showUpload}
            onChange={() => setShowUpload(!showUpload)}
          />
          显示上传速度
        </label>
        <label className="chart-control-item">
          <input
            type="checkbox"
            checked={showDownload}
            onChange={() => setShowDownload(!showDownload)}
          />
          显示下载速度
        </label>
      </div>
      
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
            label={{ value: '速度 (字节/秒)', angle: -90, position: 'insideLeft' }} 
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend onClick={handleLegendClick} />
          {showUpload && (
            <Line 
              type="monotone" 
              dataKey="uploadSpeed" 
              name="上传速度" 
              stroke="#8884d8" 
              activeDot={{ r: 8 }} 
              isAnimationActive={true}
            />
          )}
          {showDownload && (
            <Line 
              type="monotone" 
              dataKey="downloadSpeed" 
              name="下载速度" 
              stroke="#82ca9d" 
              activeDot={{ r: 8 }} 
              isAnimationActive={true}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default NetworkChart;