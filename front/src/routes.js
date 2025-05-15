// src/routes.js
// 定义应用的路由配置

// 公共路由（不需要身份验证）
export const publicRoutes = [
  {
    path: '/login',
    name: '登录',
    exact: true
  },
  {
    path: '/register',
    name: '注册',
    exact: true
  }
];

// 私有路由（需要身份验证）
export const privateRoutes = [
  {
    path: '/dashboard',
    name: '仪表盘',
    exact: true
  },
  {
    path: '/server/:serverId',
    name: '服务器详情',
    exact: true
  },
  {
    path: '/alerts',
    name: '预警信息',
    exact: true
  }
];

// 路由守卫配置
export const guardRoutes = (user) => {
  if (!user) {
    // 用户未登录时，重定向到登录页
    return '/login';
  }
  
  return null; // 不重定向
};