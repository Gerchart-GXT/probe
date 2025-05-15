// src/components/auth/RegisterForm.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from '../../api';
import { ErrorMessage } from '../common';
import './RegisterForm.css';

const RegisterForm = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const navigate = useNavigate();

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 表单验证
    if (!username.trim() || !email.trim() || !password.trim()) {
      setError('所有字段都是必填的');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('两次输入的密码不匹配');
      return;
    }
    
    if (!validateEmail(email)) {
      setError('请输入有效的电子邮件地址');
      return;
    }
    
    if (password.length < 6) {
      setError('密码必须至少包含6个字符');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await register(username, password, email);
      setSuccess(response.message || '注册成功！请登录。');
      
      // 注册成功后等待一段时间再跳转到登录页面
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.message || '注册失败，请稍后再试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-form-container">
      <h2>注册新账号</h2>
      
      {error && <ErrorMessage message={error} type="error" onClose={() => setError('')} />}
      {success && <ErrorMessage message={success} type="success" onClose={() => setSuccess('')} />}
      
      <form className="register-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">用户名</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isLoading}
            placeholder="请设置用户名"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="email">电子邮件</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            placeholder="请输入有效的电子邮件"
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
            placeholder="请设置密码（至少6个字符）"
            required
            minLength={6}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="confirmPassword">确认密码</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isLoading}
            placeholder="请再次输入密码"
            required
          />
        </div>
        
        <button 
          type="submit" 
          className="register-button"
          disabled={isLoading}
        >
          {isLoading ? '注册中...' : '注册'}
        </button>
      </form>
      
      <div className="register-footer">
        <p>已有账号？ <a href="/login">登录</a></p>
      </div>
    </div>
  );
};

export default RegisterForm;