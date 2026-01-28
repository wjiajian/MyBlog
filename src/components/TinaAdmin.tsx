import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { logout } from './ProtectedRoute';

/**
 * TinaCMS 管理后台入口组件
 * 显示管理界面或嵌入 TinaCMS iframe
 */
export const TinaAdmin: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部工具栏 */}
      <div className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-gray-900">TinaCMS Admin</span>
          <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
            已登录
          </span>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="/"
            className="text-gray-600 hover:text-gray-900 text-sm transition-colors"
          >
            返回网站
          </a>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={16} />
            <span className="text-sm">登出</span>
          </button>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="pt-14">
        <div className="max-w-4xl mx-auto p-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              欢迎来到管理后台
            </h1>
            <p className="text-gray-600 mb-6">
              TinaCMS 管理界面正在加载中。如果您看到此页面，说明：
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 mb-8">
              <li>您已成功登录管理后台</li>
              <li>TinaCMS开发服务器可能尚未启动</li>
            </ul>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">如何启动 TinaCMS？</h3>
              <p className="text-blue-800 text-sm mb-3">
                在开发环境中，请确保使用以下命令启动项目：
              </p>
              <code className="block bg-blue-100 px-3 py-2 rounded text-blue-900 text-sm">
                npm run dev
              </code>
              <p className="text-blue-700 text-xs mt-2">
                这将同时启动 Vite 开发服务器和 TinaCMS 本地服务
              </p>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4">
              <a
                href="/"
                className="flex flex-col items-center p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <span className="text-3xl mb-2">🏠</span>
                <span className="text-gray-700 font-medium">返回首页</span>
              </a>
              <a
                href="/timeline"
                className="flex flex-col items-center p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <span className="text-3xl mb-2">📅</span>
                <span className="text-gray-700 font-medium">查看时间线</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
