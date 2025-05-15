// src/contexts/AlertContext.js
import React, { createContext, useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getUserSubscriptions, getAlerts } from '../api';

export const AlertContext = createContext();

export const AlertProvider = ({ children }) => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // 获取用户订阅的服务器ID列表
  const fetchSubscribedServerIds = async () => {
    if (!user) return [];
    try {
      const response = await getUserSubscriptions(user.id, user.token);
      return response.servers.map(sub => sub.server_id);
    } catch (err) {
      console.error('Failed to fetch subscriptions:', err);
      return [];
    }
  };

  // 统计用户订阅服务器的报警总数
  const calculateUnreadCount = async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const serverIds = await fetchSubscribedServerIds();
      const now = new Date();
      const endTime = now.toISOString().replace('T', ' ').substring(0, 19);
      const startTime = '1970-01-01 00:00:00'; // 统计所有历史数据

      // 并行获取每个服务器的报警数据
      const alertsPromises = serverIds.map(serverId =>
        getAlerts(serverId, startTime, endTime, user.token)
      );

      const responses = await Promise.all(alertsPromises);
      const total = responses.reduce((sum, res) => sum + (res.data?.length || 0), 0);
      setUnreadCount(total);
    } catch (err) {
      console.error('Error calculating unread alerts:', err);
      setError('Failed to fetch alerts count');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const intervalId = setInterval(calculateUnreadCount, 60000); // 每分钟更新一次
    calculateUnreadCount(); // 初始加载

    return () => clearInterval(intervalId);
  }, [user]);
  
  // 将所有预警标记为已读
  const markAllAsRead = () => {
    setUnreadCount(0);
  };
  
  // 将特定预警标记为已读
  const markAsRead = (alertId) => {
    setAlerts(
      alerts.map(alert => 
        alert.id === alertId 
          ? { ...alert, read: true } 
          : alert
      )
    );
    
    // 重新计算未读数量
    const newUnreadCount = Math.max(0, unreadCount - 1);
    setUnreadCount(newUnreadCount);
  };
  
  // 添加新预警
  const addAlert = (alert) => {
    setAlerts([alert, ...alerts]);
    setUnreadCount(unreadCount + 1);
  };
  
  return (
    <AlertContext.Provider 
      value={{ 
        alerts, 
        unreadCount, 
        loading, 
        error, 
        markAllAsRead, 
        markAsRead, 
        addAlert 
      }}
    >
      {children}
    </AlertContext.Provider>
  );
};