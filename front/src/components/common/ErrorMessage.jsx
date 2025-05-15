// src/components/common/ErrorMessage.jsx
import React from 'react';
import './ErrorMessage.css'; // 你需要创建对应的CSS文件

const ErrorMessage = ({ 
  message = '发生错误，请稍后再试。', 
  type = 'error',
  onClose 
}) => {
  const messageClasses = `message message-${type}`;
  
  return (
    <div className={messageClasses}>
      <div className="message-content">
        <span className="message-icon">
          {type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'}
        </span>
        <p className="message-text">{message}</p>
      </div>
      {onClose && (
        <button className="message-close" onClick={onClose}>
          &times;
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;