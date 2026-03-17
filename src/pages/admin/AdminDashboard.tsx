import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, Image, Clock } from 'lucide-react';
import { usePageTitle } from '../../hooks/usePageTitle';

/**
 * 管理后台首页/仪表盘
 * 统一使用网站亮色主题风格
 */
export const AdminDashboard: React.FC = () => {
  usePageTitle('管理后台');
  const menuItems = [
    {
      icon: <FileText size={32} />,
      title: '文章管理',
      description: '创建、编辑和删除博客文章',
      path: '/admin/posts',
      color: 'from-blue-500 to-indigo-600',
    },
    {
      icon: <Image size={32} />,
      title: '照片管理',
      description: '上传、处理和管理照片墙图片',
      path: '/admin/photos',
      color: 'from-purple-500 to-pink-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* 欢迎区域 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">欢迎回来 👋</h1>
        <p className="text-gray-500 mt-2">选择一个模块开始管理你的博客</p>
      </div>

      {/* 快捷入口 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {menuItems.map((item, index) => (
          <motion.div
            key={item.path}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link
              to={item.path}
              className="block bg-white hover:bg-gray-50 border border-gray-200 rounded-2xl p-6 transition-all group shadow-sm hover:shadow-md"
            >
              <div className={`w-16 h-16 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                {item.icon}
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">{item.title}</h2>
              <p className="text-gray-500">{item.description}</p>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* 提示信息 */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <Clock size={20} className="text-blue-600" />
          </div>
          <div>
            <h3 className="text-gray-800 font-medium mb-1">提示</h3>
            <p className="text-gray-500 text-sm">
              文章修改后会立即生效，无需重新构建。照片上传后会自动处理并写入 OSS。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
