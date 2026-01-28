import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * 检查用户是否已认证
 * @returns true 如果已登录且未过期
 */
export function isAuthenticated(): boolean {
  const authStatus = localStorage.getItem('isAuthenticated');
  const authTime = localStorage.getItem('authTime');

  if (authStatus !== 'true' || !authTime) {
    return false;
  }

  // 检查登录是否过期（24小时）
  const authTimestamp = parseInt(authTime, 10);
  const expirationTime = 24 * 60 * 60 * 1000; // 24 hours
  const now = Date.now();

  if (now - authTimestamp > expirationTime) {
    // 清除过期的认证状态
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('authTime');
    return false;
  }

  return true;
}

/**
 * 登出函数
 */
export function logout(): void {
  localStorage.removeItem('isAuthenticated');
  localStorage.removeItem('authTime');
}

/**
 * 受保护路由组件
 * 如果用户未登录，重定向到登录页面
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const location = useLocation();

  if (!isAuthenticated()) {
    // 保存当前尝试访问的路径，登录后可以返回
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
