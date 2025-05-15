// src/components/performance/PerformanceDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getPerformanceData, getServerById } from '../../api';
import { LoadingSpinner, ErrorMessage } from '../common';
import CpuChart from './CpuChart';
import MemoryChart from './MemoryChart';
import DiskChart from './DiskChart';
import NetworkChart from './NetworkChart';
import './PerformanceDetail.css';

const PerformanceDetail = () => {
  const { serverId } = useParams();
  const { user } = useAuth();
  const [server, setServer] = useState(null);
  const [performanceData, setPerformanceData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // 时间范围选择
  const [timeRange, setTimeRange] = useState('1day'); // 默认显示1天的数据
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [customRange, setCustomRange] = useState(false);

  useEffect(() => {
    const fetchServerInfo = async () => {
      if (!user || !serverId) return;
      
      try {
        const response = await getServerById(parseInt(serverId), user.token);
        if (response) {
          setServer(response);
        }
      } catch (err) {
        console.error('Error fetching server info:', err);
        setError('无法获取服务器信息');
      }
    };
    
    fetchServerInfo();
  }, [user, serverId]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !serverId) return;
      
      setIsLoading(true);
      setError('');
      
      try {
        let startTime, endTime;
        
        if (customRange && startDate && endDate) {
          // 使用用户选择的自定义日期范围
          startTime = `${startDate} 00:00:00`;
          endTime = `${endDate} 23:59:59`;
        } else {
          // 使用预定义的时间范围
          const now = new Date();
          endTime = now.toISOString().slice(0, 19).replace('T', ' ');
          
          switch (timeRange) {
            case '1hour':
              startTime = new Date(now.getTime() - (60 * 60 * 1000)).toISOString().slice(0, 19).replace('T', ' ');
              break;
            case '6hours':
              startTime = new Date(now.getTime() - (6 * 60 * 60 * 1000)).toISOString().slice(0, 19).replace('T', ' ');
              break;
            case '12hours':
              startTime = new Date(now.getTime() - (12 * 60 * 60 * 1000)).toISOString().slice(0, 19).replace('T', ' ');
              break;
            case '1day':
              startTime = new Date(now.getTime() - (24 * 60 * 60 * 1000)).toISOString().slice(0, 19).replace('T', ' ');
              break;
            case '1week':
              startTime = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000)).toISOString().slice(0, 19).replace('T', ' ');
              break;
            case '1month':
              startTime = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000)).toISOString().slice(0, 19).replace('T', ' ');
              break;
            default:
              startTime = new Date(now.getTime() - (24 * 60 * 60 * 1000)).toISOString().slice(0, 19).replace('T', ' ');
          }
        }
        
        const response = await getPerformanceData(
          parseInt(serverId),
          startTime,
          endTime,
          user.token
        );
        
        if (response && response.status) {
          console.log(response.data);
          
          setPerformanceData(response.data || []);
        } else {
          setError('获取性能数据失败');
        }
      } catch (err) {
        console.error('Error fetching performance data:', err);
        setError('获取性能数据时发生错误');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
    
    // 如果不是自定义范围，则设置定时刷新
    let intervalId;
    if (!customRange && timeRange === '1hour') {
      intervalId = setInterval(() => fetchData(), 30000); // 30秒刷新一次
    } else if (!customRange && timeRange === '6hours') {
      intervalId = setInterval(() => fetchData(), 60000); // 1分钟刷新一次
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [user, serverId, timeRange, customRange, startDate, endDate]);

  const handleTimeRangeChange = (e) => {
    const newRange = e.target.value;
    setTimeRange(newRange);
    setCustomRange(false);
  };

  const handleCustomRangeToggle = () => {
    setCustomRange(!customRange);
    
    if (!customRange) {
      // 初始化自定义日期为过去30天
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
      
      setEndDate(now.toISOString().slice(0, 10));
      setStartDate(thirtyDaysAgo.toISOString().slice(0, 10));
    }
  };

  // 数据处理函数，从性能数据中提取特定的指标
  const processCpuData = () => {

    return performanceData.map(item => {
      try {
        const cpuInfo = item.cpu_info;
        return {
          timestamp: item.timestamp,
          usage: cpuInfo.percent_usage || 0.0
        };
      } catch (e) {
        return { timestamp: item.timestamp, usage: 0 };
      }
    });
  };

  const processMemoryData = () => {
    return performanceData.map(item => {
      try {
        const memoryInfo = item.memory_info;
        return {
          timestamp: item.timestamp,
          total: memoryInfo.total || 0,
          used: memoryInfo.used || 0,
          percent: memoryInfo.percent || 0
        };
      } catch (e) {
        return { timestamp: item.timestamp, total: 0, used: 0, percent: 0 };
      }
    });
  };

  const processDiskData = () => {
    return performanceData.map(item => {
      try {
        const diskInfo = item.disk_info;
        // 只返回根分区的数据或第一个分区
        const rootDisk = diskInfo.find(disk => disk.mountpoint === '/') || diskInfo[0] || {};
        return {
          timestamp: item.timestamp,
          total: rootDisk.total || 0,
          used: rootDisk.used || 0,
          percent: rootDisk.percent || 0,
          mountpoint: rootDisk.mountpoint || '/'
        };
      } catch (e) {
        return { timestamp: item.timestamp, total: 0, used: 0, percent: 0, mountpoint: '/' };
      }
    });
  };

  const processNetworkData = () => {
    return performanceData.map(item => {
      try {
        const networkInfo = item.network_info;
        
        // 查找主要网络接口
        let mainInterface = null;
        for (const [ifName, ifData] of Object.entries(networkInfo)) {
          if (ifData.addresses && ifData.addresses.length > 0 && ifData.addresses[0].ip) {
            mainInterface = { name: ifName, ...ifData };
            break;
          }
        }
        
        if (!mainInterface) {
          // 如果没有找到带IP的接口，使用第一个接口
          const firstIfName = Object.keys(networkInfo)[0];
          mainInterface = { name: firstIfName, ...networkInfo[firstIfName] };
        }
        
        return {
          timestamp: item.timestamp,
          interface: mainInterface.name,
          uploadSpeed: mainInterface.io_stats?.upload_speed || 0,
          downloadSpeed: mainInterface.io_stats?.download_speed || 0,
          totalUpload: mainInterface.io_stats?.total_upload || 0,
          totalDownload: mainInterface.io_stats?.total_download || 0
        };
      } catch (e) {
        return { 
          timestamp: item.timestamp, 
          interface: 'unknown',
          uploadSpeed: 0, 
          downloadSpeed: 0,
          totalUpload: 0,
          totalDownload: 0
        };
      }
    });
  };

  if (isLoading && !performanceData.length) {
    return <LoadingSpinner text="加载性能数据..." />;
  }

  return (
    <div className="performance-detail">
      <div className="performance-header">
        <div className="server-info">
          <h2>{server?.name || '服务器详情'}</h2>
          <p className="server-meta">
            IP: {server?.ip || 'N/A'} | 
            平台: {server?.platform || 'N/A'} | 
            状态: <span className={`status ${server?.status || 'unknown'}`}>
              {server?.status === 'online' ? '在线' : '离线'}
            </span>
          </p>
        </div>
        
        <div className="time-range-controls">
          <div className="time-range-select">
            <label htmlFor="time-range">时间范围:</label>
            <select 
              id="time-range" 
              value={timeRange} 
              onChange={handleTimeRangeChange}
              disabled={customRange}
            >
              <option value="1hour">最近1小时</option>
              <option value="6hours">最近6小时</option>
              <option value="12hours">最近12小时</option>
              <option value="1day">最近1天</option>
              <option value="1week">最近1周</option>
              <option value="1month">最近1个月</option>
            </select>
          </div>
          
          <div className="custom-range-toggle">
            <label>
              <input 
                type="checkbox" 
                checked={customRange} 
                onChange={handleCustomRangeToggle} 
              />
              自定义时间范围
            </label>
          </div>
          
          {customRange && (
            <div className="custom-date-inputs">
              <div className="date-input">
                <label htmlFor="start-date">开始日期:</label>
                <input 
                  type="date" 
                  id="start-date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)}
                  max={endDate}
                />
              </div>
              <div className="date-input">
                <label htmlFor="end-date">结束日期:</label>
                <input 
                  type="date" 
                  id="end-date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  max={new Date().toISOString().slice(0, 10)}
                />
              </div>
            </div>
          )}
        </div>
      </div>
      
      {error && (
        <ErrorMessage 
          message={error} 
          onClose={() => setError('')} 
        />
      )}
      
      {performanceData.length === 0 ? (
        <div className="no-data-message">
          <p>所选时间范围内没有性能数据。</p>
        </div>
      ) : (
        <div className="charts-container">
          <div className="chart-section">
            <h3>CPU 使用率</h3>
            <CpuChart data={processCpuData()} />
          </div>
          
          <div className="chart-section">
            <h3>内存使用率</h3>
            <MemoryChart data={processMemoryData()} />
          </div>
          
          <div className="chart-section">
            <h3>磁盘使用率</h3>
            <DiskChart data={processDiskData()} />
          </div>
          
          <div className="chart-section">
            <h3>网络流量</h3>
            <NetworkChart data={processNetworkData()} />
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceDetail;