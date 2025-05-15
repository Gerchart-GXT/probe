// src/pages/AlertsPage.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Header, Footer, LoadingSpinner } from '../components/common';
import { AlertsList } from '../components/alerts';
import '../styles/pages/AlertsPage.css';

const AlertsPage = () => {
  const { user, loading: authLoading } = useAuth();
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
    <div className="alerts-page">
      <Header />
      <main className="alerts-content">
        <div className="alerts-container">
          <div className="back-button-container">
            <button 
              className="back-button"
              onClick={() => navigate('/dashboard')}
            >
              返回仪表盘
            </button>
          </div>
          
          <AlertsList />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AlertsPage;