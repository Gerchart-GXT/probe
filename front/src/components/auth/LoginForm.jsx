// src/components/auth/LoginForm.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ErrorMessage } from '../common';
import './LoginForm.css';

const LoginForm = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 简单表单验证
    if (!username.trim() || !password.trim()) {
      setError('用户名和密码不能为空');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      await login(username, password);
      // 登录成功，跳转到仪表盘页面
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || '登录失败，请检查用户名和密码');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-form-container">
      <h2>登录</h2>
      
      {error && <ErrorMessage message={error} onClose={() => setError('')} />}
      
      <form className="login-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">用户名</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isLoading}
            placeholder="请输入用户名"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">密码</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            placeholder="请输入密码"
            required
          />
        </div>
        
        <button 
          type="submit" 
          className="login-button"
          disabled={isLoading}
        >
          {isLoading ? '登录中...' : '登录'}
        </button>
      </form>
      
      <div className="login-footer">
        <p>还没有账号？ <a href="/register">注册</a></p>
      </div>
    </div>
  );
};

export default LoginForm;