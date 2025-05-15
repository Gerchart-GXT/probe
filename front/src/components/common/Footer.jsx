// src/components/common/Footer.jsx
import React from 'react';
import './Footer.css'; // 你需要创建对应的CSS文件

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="footer">
      <div className="footer-content">
        <p>&copy; {currentYear} 服务器探针系统. 保留所有权利.</p>
        <div className="footer-links">
          <a href="/about">关于我们</a>
          <a href="/privacy">隐私政策</a>
          <a href="/terms">使用条款</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;