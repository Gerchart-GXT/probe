// src/pages/Login.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LoginForm } from '../components/auth';
import { Header, Footer } from '../components/common';
import '../styles/pages/Login.css';

const Login = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // 如果用户已登录，重定向到仪表盘
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);
  
  return (
    <div className="login-page">
      <Header />
      <main className="login-content">
        <div className="login-container">
          <LoginForm />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Login;