// src/components/common/LoadingSpinner.jsx
import React from 'react';
import './LoadingSpinner.css'; // 你需要创建对应的CSS文件

const LoadingSpinner = ({ size = 'medium', text = '加载中...' }) => {
  const spinnerClasses = `spinner spinner-${size}`;
  
  return (
    <div className="spinner-container">
      <div className={spinnerClasses}></div>
      {text && <p className="spinner-text">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;