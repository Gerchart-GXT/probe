// src/pages/Dashboard.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useWebSocket } from '../hooks/useWebSocket';
import { Header, Footer, LoadingSpinner, ErrorMessage } from '../components/common';
import { Overview, ServerList } from '../components/dashboard';
import '../styles/pages/Dashboard.css';

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { isConnected, error: wsError, reconnect } = useWebSocket();
  const navigate = useNavigate();
  
  // 如果用户未登录，重定向到登录页
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);
  
  if (authLoading) {
    return <LoadingSpinner text="正在加载..." />;
  }
  
  if (!user) {
    return null; // 等待重定向到登录页
  }
  
  return (
    <div className="dashboard-page">
      <Header />
      <main className="dashboard-content">
        {wsError && (
          <div className="ws-error-container">
            <ErrorMessage 
              message="WebSocket 连接错误，无法接收实时数据。" 
              type="warning"
            />
            <button 
              className="reconnect-button" 
              onClick={reconnect}
            >
              重新连接
            </button>
          </div>
        )}
        
        {!isConnected && !wsError && (
          <div className="ws-status-container">
            <p className="ws-connecting-message">正在连接WebSocket服务器...</p>
          </div>
        )}
        
        <Overview />
        <ServerList />
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;