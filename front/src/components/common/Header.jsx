// src/components/common/Header.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { AlertContext } from '../../contexts/AlertContext';
import { useContext } from 'react';
import { useWebSocket } from '../../hooks/useWebSocket'; // 新增：使用WebSocket上下文
import './Header.css'; // 你需要创建对应的CSS文件

const Header = () => {
  const { user, logout } = useAuth();
  const [alertsCount, setAlertsCount] = useState(0);
  const { unreadCount } = useContext(AlertContext); // 从AlertContext获取
  const navigate = useNavigate();
  const { 
    isConnected, 
    lastReceived, 
    connectionError, 
    reconnect 
  } = useWebSocket(); // 获取WebSocket状态

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleProfileClick = () => {
    navigate('/alerts');
  };

  const connectionStatus = () => {
    if (isConnected) {
      return (
        <div className="connection-status connected">
          ✅ 已连接WebSocket服务器 ｜ 
          <span className="last-received">
            最新数据包： {lastReceived ? new Date(lastReceived).toLocaleTimeString() : 'N/A'}
          </span>
        </div>
      );
    } else if (connectionError) {
      return (
        <div className="connection-status error">
          ❌ 连接失败，请重试
          <button onClick={reconnect} className="retry-btn">
            重试
          </button>
        </div>
      );
    } else {
      return <div className="connection-status connecting">正在连接...</div>;
    }
  };
  return (
    <header className="header">
      <div className="header-left">
        <Link to="/" className="logo-container">
          <img src="https://picture.imgxt.com/local/1/2025/03/11/67cfa8542c0fa.jpg" alt="Logo" className="logo" />
          <h1 className="app-title">服务器探针</h1>
        </Link>
      </div>
      <div className="header-center">
        {connectionStatus()}
      </div>
      <div className="header-right">
        {user ? (
          <div className="user-info">
            <div 
              className="user-avatar" 
              onClick={() => navigate('/alerts')}
            >
              <img 
                src={'https://picture.imgxt.com/local/1/2025/03/11/67cfa8542c0fa.jpg'} 
                alt={user.username} 
              />
              {unreadCount > 0 && (
                <span className="alerts-badge">{unreadCount}</span>
              )}
            </div>
            <span className="username">{user.username}</span>
            <button className="logout-btn" onClick={handleLogout}>
              登出
            </button>
          </div>
        ) : (
          <div className="auth-buttons">
            <Link to="/login" className="login-btn">登录</Link>
            <Link to="/register" className="register-btn">注册</Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;