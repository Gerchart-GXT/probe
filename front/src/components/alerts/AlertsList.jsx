// src/components/alerts/AlertsList.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getAlerts, getUserSubscriptions } from '../../api';
import { LoadingSpinner, ErrorMessage } from '../common';
import AlertItem from './AlertItem';
import './AlertsList.css';

const AlertsList = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('7days'); // 默认显示7天的数据
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [customRange, setCustomRange] = useState(false);
  const [serverId, setServerId] = useState('all'); // 'all' 或特定服务器ID
  const [filterPriority, setFilterPriority] = useState('all'); // 'all', 'high', 'medium', 'low'

  // 获取用户订阅的服务器ID列表
  const [subscribedServers, setSubscribedServers] = useState([]);

  useEffect(() => {
    const fetchSubscribedServers = async () => {
      if (!user) return;
      try {
        const response = await getUserSubscriptions(user.id, user.token);
        const serverIds = response.servers.map(sub => sub.server_id);
        setSubscribedServers(serverIds);
      } catch (err) {
        console.error('Failed to fetch subscribed servers:', err);
        setSubscribedServers([]);
      }
    };
    fetchSubscribedServers();
  }, [user]);

  useEffect(() => {
    const fetchAlerts = async () => {
      if (!user) return;

      setIsLoading(true);
      setError('');

      try {
        let startTime, endTime;
        if (customRange && startDate && endDate) {
          startTime = `${startDate} 00:00:00`;
          endTime = `${endDate} 23:59:59`;
        } else {
          const now = new Date();
          endTime = now.toISOString().slice(0, 19).replace('T', ' ');
          switch (timeRange) {
            case '24hours':
              startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
              break;
            case '3days':
              startTime = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
              break;
            case '7days':
              startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
              break;
            case '30days':
              startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
              break;
            default:
              startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
          }
        }

        // 合并所有订阅服务器的报警数据
        let mergedAlerts = [];
        if (serverId === 'all') {
          const promises = subscribedServers.map(serverId => 
            getAlerts(serverId, startTime, endTime, user.token)
          );
          const responses = await Promise.all(promises);
          mergedAlerts = responses.reduce((acc, res) => acc.concat(res.data || []), []);
        } else {
          const response = await getAlerts(parseInt(serverId), startTime, endTime, user.token);
          mergedAlerts = response.data || [];
        }

        // 过滤有效警报（is_valid_alert为1）
        const validAlerts = mergedAlerts.filter(alert => alert.is_valid_alert);

        // 根据优先级过滤
        let filteredAlerts = validAlerts;
        if (filterPriority !== 'all') {
          filteredAlerts = validAlerts.filter(alert => {
            const { cpu_alert, memory_alert, disk_alert, network_alert } = alert;

            // 高优先级：任何指标超过阈值
            const isHigh = 
              cpu_alert.alert || 
              memory_alert.alert || 
              disk_alert.alert || 
              network_alert.download_alert || 
              network_alert.upload_alert;

            // 中等优先级：接近阈值但未触发
            const isMedium = 
              (cpu_alert.current_value > 0.8 * cpu_alert.threshold && !cpu_alert.alert) ||
              (memory_alert.current_value > 0.8 * memory_alert.threshold && !memory_alert.alert) ||
              (disk_alert.current_value > 0.8 * disk_alert.threshold && !disk_alert.alert) ||
              (network_alert.current_download > 0.8 * network_alert.download_threshold && !network_alert.download_alert) ||
              (network_alert.current_upload > 0.8 * network_alert.upload_threshold && !network_alert.upload_alert);

            if (filterPriority === 'high') return isHigh;
            if (filterPriority === 'medium') return isMedium;
            if (filterPriority === 'low') return !isHigh && !isMedium;
            return true;
          });
        }

        setAlerts(filteredAlerts);
        setError('');
      } catch (err) {
        console.error('Error fetching alerts:', err);
        setError('Failed to fetch alerts');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlerts();
  }, [user, subscribedServers, timeRange, customRange, startDate, endDate, serverId, filterPriority]);

  // 动态生成服务器选项
  const serverOptions = subscribedServers.map(id => (
    <option key={id} value={id}>
      服务器 {id}（订阅的服务器）
    </option>
  ));
  const handleTimeRangeChange = (e) => {
    setTimeRange(e.target.value);
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

  return (
    <div className="alerts-list">
      <div className="alerts-header">
        <h2>系统预警</h2>
        
        <div className="alerts-filters">
          <div className="filter-group">
            <label htmlFor="server-filter">服务器:</label>
            <select
              id="server-filter"
              value={serverId}
              onChange={(e) => setServerId(e.target.value)}
            >
              <option value="all">所有订阅服务器</option>
              {serverOptions}
            </select>
          </div>
          
          <div className="filter-group">
            <label htmlFor="priority-filter">优先级:</label>
            <select
              id="priority-filter"
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
            >
              <option value="all">所有级别</option>
              <option value="high">高</option>
              <option value="medium">中</option>
              <option value="low">低</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label htmlFor="time-range">时间范围:</label>
            <select 
              id="time-range" 
              value={timeRange} 
              onChange={handleTimeRangeChange}
              disabled={customRange}
            >
              <option value="24hours">最近24小时</option>
              <option value="3days">最近3天</option>
              <option value="7days">最近7天</option>
              <option value="30days">最近30天</option>
            </select>
          </div>
          
          <div className="custom-range">
            <label>
              <input 
                type="checkbox" 
                checked={customRange} 
                onChange={handleCustomRangeToggle} 
              />
              自定义时间范围
            </label>
            
            {customRange && (
              <div className="date-inputs">
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)}
                  max={endDate}
                />
                <span>至</span>
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  max={new Date().toISOString().slice(0, 10)}
                />
              </div>
            )}
          </div>
        </div>
      </div>
      
      {error && (
        <ErrorMessage 
          message={error} 
          onClose={() => setError('')} 
        />
      )}
      
      {isLoading ? (
        <LoadingSpinner text="加载预警数据..." />
      ) : (
        <div className="alerts-container">
          {alerts.length === 0 ? (
            <div className="no-alerts">
              <p>所选时间范围内没有预警信息。</p>
            </div>
          ) : (
            alerts.map(alert => (
              <AlertItem 
                key={alert.id} 
                alert={alert} 
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default AlertsList;