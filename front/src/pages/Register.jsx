// src/pages/Register.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { RegisterForm } from '../components/auth';
import { Header, Footer } from '../components/common';
import '../styles/pages/Register.css';

const Register = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // 如果用户已登录，重定向到仪表盘
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);
  
  return (
    <div className="register-page">
      <Header />
      <main className="register-content">
        <div className="register-container">
          <RegisterForm />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Register;