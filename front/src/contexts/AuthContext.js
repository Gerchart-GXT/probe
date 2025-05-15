// src/contexts/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import { validateToken } from '../api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // 初始化 - 检查本地存储中是否存在用户信息
  useEffect(() => {
    const initAuth = async () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          // 验证token是否有效
          // const isValid = await validateToken(userData.token);
          const isValid = true

          if (isValid) {
            setUser(userData);
          } else {
            // token无效，清除本地存储
            localStorage.removeItem('user');
          }
        } catch (error) {
          console.error('Auth initialization error:', error);
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };
    
    initAuth();
  }, []);
  
  // 用户登录
  const login = async (username, password) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:7777/api'}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }
      
      const data = await response.json();
      
      // 创建用户对象，包含基本信息和token
      const userData = {
        id: data.user_id || 1, // 默认ID如果API没有返回
        username,
        token: data.access_token,
        avatar: data.avatar || null,
        exp : data.exp
      };
      
      // 保存到state和本地存储
      setUser(userData);
      console.log(data);
      
      localStorage.setItem('user', JSON.stringify(userData));
      
      return userData;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };
  
  // 用户注销
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };
  
  // 用户注册 - 仅返回成功消息，不自动登录
  const register = async (username, password, email) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:7777/api'}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, email }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };
  
  // 更新用户信息
  const updateUserInfo = (newInfo) => {
    if (user) {
      const updatedUser = { ...user, ...newInfo };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };
  
  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        loading, 
        login, 
        logout, 
        register, 
        updateUserInfo 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};