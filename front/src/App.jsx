// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { WebSocketProvider } from './contexts/WebSocketContext';
import { AlertProvider } from './contexts/AlertContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ServerDetails from './pages/ServerDetails';
import AlertsPage from './pages/AlertsPage';
import './styles/global.css';

// 私有路由组件，只有登录后才能访问
const PrivateRoute = ({ element, ...rest }) => {
  const storedUser = localStorage.getItem('user');
  return storedUser ? element : <Navigate to="/login" />;
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <WebSocketProvider>
          <AlertProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route 
                path="/dashboard" 
                element={<PrivateRoute element={<Dashboard />} />} 
              />
              <Route 
                path="/server/:serverId" 
                element={<PrivateRoute element={<ServerDetails />} />} 
              />
              <Route 
                path="/alerts" 
                element={<PrivateRoute element={<AlertsPage />} />} 
              />
              <Route path="/" element={<Navigate to="/dashboard" />} />
              <Route path="*" element={<Navigate to="/dashboard" />} />
            </Routes>
          </AlertProvider>
        </WebSocketProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;