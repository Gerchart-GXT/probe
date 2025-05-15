// src/components/dashboard/Overview.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getAllServers, getUserSubscriptions } from '../../api';
import { LoadingSpinner, ErrorMessage } from '../common';
import './Overview.css';

const Overview = () => {
  const { user } = useAuth();
  const [serverStats, setServerStats] = useState({
    total: 0,
    online: 0,
    offline: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSubscriptionAndServers = async () => {
      if (!user) return;

      try {
        setIsLoading(true);

        // 第一步：获取用户订阅的服务器ID列表
        const subscriptionsResponse = await getUserSubscriptions(user.id, user.token);
        const subscribedServerIds = subscriptionsResponse.servers.map(sub => sub.server_id);

        // 第二步：获取所有服务器数据
        const serversResponse = await getAllServers(user.token);
        const allServers = serversResponse.data || [];

        // 第三步：过滤出用户订阅的服务器
        const subscribedServers = allServers.filter(server => 
          subscribedServerIds.includes(server.id)
        );

        // 统计订阅服务器的总数、在线和离线数量
        const stats = {
          total: subscribedServers.length,
          online: subscribedServers.filter(server => server.status === 'online').length,
          offline: subscribedServers.filter(server => server.status === 'offline').length,
        };

        setServerStats(stats);
        setError('');
      } catch (err) {
        console.error('Error fetching server stats:', err);
        setError('无法获取服务器数据，请刷新页面重试');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscriptionAndServers();

    // 定期刷新（例如每分钟）
    const intervalId = setInterval(fetchSubscriptionAndServers, 60000);
    return () => clearInterval(intervalId);
  }, [user]);

  if (isLoading) {
    return <LoadingSpinner text="加载服务器数据..." />;
  }

  return (
    <div className="overview-container">
      <h2 className="overview-title">系统概览</h2>
      
      {error && (
        <ErrorMessage 
          message={error} 
          onClose={() => setError('')} 
        />
      )}
      
      <div className="stats-container">
        <div className="stat-card total">
          <div className="stat-icon">🖥️</div>
          <div className="stat-content">
            <h3 className="stat-title">总服务器数</h3>
            <p className="stat-value">{serverStats.total}</p>
          </div>
        </div>
        
        <div className="stat-card online">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3 className="stat-title">在线服务器</h3>
            <p className="stat-value">{serverStats.online}</p>
          </div>
        </div>
        
        <div className="stat-card offline">
          <div className="stat-icon">❌</div>
          <div className="stat-content">
            <h3 className="stat-title">离线服务器</h3>
            <p className="stat-value">{serverStats.offline}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;