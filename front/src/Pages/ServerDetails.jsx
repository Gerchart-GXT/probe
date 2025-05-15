// src/pages/ServerDetails.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getServerById } from '../api';
import { Header, Footer, LoadingSpinner, ErrorMessage } from '../components/common';
import { PerformanceDetail } from '../components/performance';
import '../styles/pages/ServerDetails.css';

const ServerDetails = () => {
  const { serverId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const [server, setServer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  
  // 如果用户未登录，重定向到登录页
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);
  
  // 获取服务器详情
  useEffect(() => {
    const fetchServerDetails = async () => {
      if (!user || !serverId) return;
      
      try {
        setLoading(true);
        
        const response = await getServerById(parseInt(serverId), user.token);
        
        if (response) {
          setServer(response);
          setError(null);
        } else {
          setError('无法获取服务器详情');
        }
      } catch (err) {
        console.error('Error fetching server details:', err);
        setError('获取服务器详情时发生错误');
      } finally {
        setLoading(false);
      }
    };
    
    fetchServerDetails();
  }, [user, serverId]);
  
  if (authLoading || loading) {
    return <LoadingSpinner text="正在加载服务器详情..." />;
  }
  
  if (!user) {
    return null; // 等待重定向到登录页
  }
  
  return (
    <div className="server-details-page">
      <Header />
      <main className="server-details-content">
        {error ? (
          <ErrorMessage message={error} />
        ) : server ? (
          <div className="server-details-container">
            <div className="back-button-container">
              <button 
                className="back-button"
                onClick={() => navigate('/dashboard')}
              >
                返回仪表盘
              </button>
            </div>
            
            <PerformanceDetail />
          </div>
        ) : (
          <div className="server-not-found">
            <h2>未找到服务器</h2>
            <p>无法找到ID为{serverId}的服务器。</p>
            <button 
              className="back-button"
              onClick={() => navigate('/dashboard')}
            >
              返回仪表盘
            </button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ServerDetails;