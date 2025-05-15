// src/hooks/usePerformanceData.js
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { getPerformanceData } from '../api';

export const usePerformanceData = (serverId, timeRange) => {
  const { user } = useAuth();
  const [performanceData, setPerformanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchData = async () => {
      if (!user || !serverId) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        // 根据timeRange计算开始和结束时间
        const now = new Date();
        const endTime = now.toISOString().slice(0, 19).replace('T', ' ');
        let startTime;
        
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
          case '7days':
            startTime = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000)).toISOString().slice(0, 19).replace('T', ' ');
            break;
          case '30days':
            startTime = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000)).toISOString().slice(0, 19).replace('T', ' ');
            break;
          default:
            startTime = new Date(now.getTime() - (24 * 60 * 60 * 1000)).toISOString().slice(0, 19).replace('T', ' ');
        }
        
        const response = await getPerformanceData(
          parseInt(serverId),
          startTime,
          endTime,
          user.token
        );
        
        if (response && response.status) {
          setPerformanceData(response.data || []);
          setError(null);
        } else {
          setError('Failed to fetch performance data');
        }
      } catch (err) {
        console.error('Error in usePerformanceData hook:', err);
        setError(err.message || 'Error fetching performance data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    
    // 如果timeRange为1hour或6hours，设置自动刷新
let intervalId;
    if (timeRange === '1hour') {
      intervalId = setInterval(fetchData, 30000); // 30秒刷新一次
    } else if (timeRange === '6hours') {
      intervalId = setInterval(fetchData, 60000); // 1分钟刷新一次
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [user, serverId, timeRange]);
  
  // 返回钩子数据
  return {
    performanceData,
    loading,
    error,
    // 额外提供一个刷新方法
    refresh: async () => {
      if (!user || !serverId) return;
      
      try {
        setLoading(true);
        
        const now = new Date();
        const endTime = now.toISOString().slice(0, 19).replace('T', ' ');
        let startTime;
        
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
          case '7days':
            startTime = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000)).toISOString().slice(0, 19).replace('T', ' ');
            break;
          case '30days':
            startTime = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000)).toISOString().slice(0, 19).replace('T', ' ');
            break;
          default:
            startTime = new Date(now.getTime() - (24 * 60 * 60 * 1000)).toISOString().slice(0, 19).replace('T', ' ');
        }
        
        const response = await getPerformanceData(
          parseInt(serverId),
          startTime,
          endTime,
          user.token
        );
        
        if (response && response.status) {
          setPerformanceData(response.data || []);
          setError(null);
        } else {
          setError('Failed to fetch performance data');
        }
      } catch (err) {
        console.error('Error refreshing performance data:', err);
        setError(err.message || 'Error refreshing performance data');
      } finally {
        setLoading(false);
      }
    }
  };
};