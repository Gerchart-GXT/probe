// src/components/dashboard/ServerCard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLatestPerformanceData } from '../../api';
import { LoadingSpinner, Modal } from '../common';
import './ServerCard.css';
import { useWebSocket } from '../../hooks/useWebSocket';

const ServerCard = ({ 
  server, 
  subscription, 
  onEdit,
  token
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const navigate = useNavigate();

  const { serverData } = useWebSocket();
  const [performanceData, setPerformanceData] = useState(null);
  useEffect(() => {
    console.log(serverData);
    try {
      setIsLoading(true);
      const filteredData = serverData.find(item => item.server_id === server.id);
      if (filteredData) {
        setPerformanceData(filteredData);
      }
    } catch (err) {
      console.error(`Error fetching performance data for server ${server.id}:`, err);
    } finally {
      setIsLoading(false);
    }
  }, [serverData, server.id]);
  // useEffect(() => {
  //   // 获取最新的性能数据
  //   const fetchLatestData = async () => {
  //     if (!server || !server.id) return;

  //     try {
  //       setIsLoading(true);
  //       const response = await getLatestPerformanceData(server.id, token);
        
  //       if (response && response.status && response.data && response.data.length > 0) {
  //         setPerformanceData(response.data[response.data.length - 1]); // 获取最新的一条数据
  //       }
  //     } catch (err) {
  //       console.error(`Error fetching performance data for server ${server.id}:`, err);
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   };

  //   fetchLatestData();
    
  //   // 定期刷新数据
  //   const intervalId = setInterval(fetchLatestData, 30000); // 每30秒刷新一次
    
  //   return () => clearInterval(intervalId);
  // }, [server, token]);
  
  const handleViewDetails = () => {
    navigate(`/server/${server.id}`);
  };

  const handleEditClick = () => {
    if (onEdit) {
      onEdit(subscription);
    }
  };

  // 解析性能数据
  const getCpuUsage = () => {
    if (!performanceData || !performanceData.cpu_info) return 'N/A';
    
    try {
      const cpuInfo = JSON.parse(performanceData.cpu_info);
      return `${cpuInfo.percent_usage.toFixed(1)}%`;
    } catch (e) {
      return 'N/A';
    }
  };

  const getMemoryUsage = () => {
    if (!performanceData || !performanceData.memory_info) return 'N/A';
    
    try {
      const memoryInfo = JSON.parse(performanceData.memory_info);
      return `${memoryInfo.percent.toFixed(1)}%`;
    } catch (e) {
      return 'N/A';
    }
  };

  const getDiskUsage = () => {
    if (!performanceData || !performanceData.disk_info) return 'N/A';
    
    try {
      const diskInfo = JSON.parse(performanceData.disk_info);
      // 获取根目录的使用率
      const rootDisk = diskInfo.find(disk => disk.mountpoint === '/') || diskInfo[0];
      return rootDisk ? `${rootDisk.percent.toFixed(1)}%` : 'N/A';
    } catch (e) {
      return 'N/A';
    }
  };

 const getNetworkStats = () => {
    if (!performanceData || !performanceData.network_info) {
      return { 
        uploadSpeed: 'N/A', 
        downloadSpeed: 'N/A', 
        totalUpload: 'N/A', 
        totalDownload: 'N/A' 
      };
    }

    try {
      const networkInfo = JSON.parse(performanceData.network_info);
      
      // 初始化总统计值
      let totalUploadSpeed = 0;
      let totalDownloadSpeed = 0;
      let totalUpload = 0;
      let totalDownload = 0;

      // 遍历所有网络接口
      for (const [ifName, ifData] of Object.entries(networkInfo)) {
        // 跳过本地回环接口（127.0.0.1）
        const hasLocalIP = ifData.addresses?.some(addr => addr.ip === '127.0.0.1');
        if (hasLocalIP) continue;

        // 累加有效接口的数据
        if (ifData.io_stats) {
          
          totalUploadSpeed += ifData.io_stats.upload_speed || 0;
          totalDownloadSpeed += ifData.io_stats.download_speed || 0;
          totalUpload += ifData.io_stats.total_upload || 0;
          totalDownload += ifData.io_stats.total_download || 0;

        }
      }

      // 格式化函数
      const formatBytes = (bytes) => {
        if (bytes === 0 || !bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
      };

      const formatSpeed = (bytesPerSec) => {
        if (bytesPerSec === 0 || !bytesPerSec) return '0 B/s';
        return formatBytes(bytesPerSec) + '/s';
      };

      return {
        uploadSpeed: formatSpeed(totalUploadSpeed),
        downloadSpeed: formatSpeed(totalDownloadSpeed),
        totalUpload: formatBytes(totalUpload),
        totalDownload: formatBytes(totalDownload),
      };
    } catch (e) {
      return { 
        uploadSpeed: 'N/A', 
        downloadSpeed: 'N/A', 
        totalUpload: 'N/A', 
        totalDownload: 'N/A' 
      };
    }
  };

  // 获取服务器状态的CSS类
  const getStatusClass = () => {
    return server.status === 'online' ? 'status-online' : 'status-offline';
  };

  const networkStats = getNetworkStats();

  return (
    <div className={`server-card ${getStatusClass()}`}>
      <div className="server-card-header">
        <h3 className="server-name">{server.name}</h3>
        <div className="server-status">
          <span className={`status-indicator ${getStatusClass()}`}></span>
          <span className="status-text">{server.status === 'online' ? '在线' : '离线'}</span>
        </div>
      </div>
      
      <div className="server-info">
        <div className="info-row">
          <span className="info-label">IP地址:</span>
          <span className="info-value">{server.ip}</span>
        </div>
        <div className="info-row">
          <span className="info-label">平台:</span>
          <span className="info-value">{server.platform}</span>
        </div>
        <div className="info-row">
          <span className="info-label">最后心跳:</span>
          <span className="info-value">{server.last_seen}</span>
        </div>
        
        {subscription && (
          <>
            <div className="info-row">
              <span className="info-label">备注:</span>
              <span className="info-value">{subscription.notes || '无'}</span>
            </div>
            
            <div className="info-row">
              <span className="info-label">标签:</span>
              <div className="tags-container">
                {subscription.tags && subscription.tags.map((tag, index) => (
                  <span key={index} className="tag">{tag}</span>
                ))}
                {(!subscription.tags || subscription.tags.length === 0) && <span className="tag-empty">无标签</span>}
              </div>
            </div>
          </>
        )}
      </div>
      
      <div className="performance-data">
        <h4 className="performance-title">性能数据</h4>
        
        {isLoading ? (
          <LoadingSpinner size="small" text="加载中..." />
        ) : (
          <div className="performance-grid">
            <div className="performance-item">
              <span className="perf-label">CPU</span>
              <span className="perf-value">{getCpuUsage()}</span>
            </div>
            <div className="performance-item">
              <span className="perf-label">内存</span>
              <span className="perf-value">{getMemoryUsage()}</span>
            </div>
            <div className="performance-item">
              <span className="perf-label">磁盘</span>
              <span className="perf-value">{getDiskUsage()}</span>
            </div>
            <div className="performance-item">
              <span className="perf-label">上传速度</span>
              <span className="perf-value">{networkStats.uploadSpeed}</span>
            </div>
            <div className="performance-item">
              <span className="perf-label">下载速度</span>
              <span className="perf-value">{networkStats.downloadSpeed}</span>
            </div>
            <div className="performance-item">
              <span className="perf-label">总上传</span>
              <span className="perf-value">{networkStats.totalUpload}</span>
            </div>
            <div className="performance-item">
              <span className="perf-label">总下载</span>
              <span className="perf-value">{networkStats.totalDownload}</span>
            </div>
          </div>
        )}
      </div>
      
      <div className="server-card-actions">
        <button 
          className="action-button edit-button" 
          onClick={handleEditClick}
        >
          修改信息
        </button>
        <button 
          className="action-button details-button" 
          onClick={handleViewDetails}
        >
          查看详情
        </button>
      </div>
    </div>
  );
};

export default ServerCard;