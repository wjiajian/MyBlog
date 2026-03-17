import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  FileText,
  Calendar,
  Tag,
  Loader2,
  AlertCircle,
  Upload,
  CheckCircle,
} from 'lucide-react';
import { authFetch } from '../../utils/auth';
import { usePageTitle } from '../../hooks/usePageTitle';

interface Post {
  filename: string;
  title: string;
  date: string;
  year: number;
  type: string;
  categories?: string;
  description?: string;
  path: string;
}

interface ImportResult {
  success?: boolean;
  error?: string;
  message?: string;
  path?: string;
  parsed?: {
    title?: string;
    type?: string;
    categories?: string;
    date?: string;
  };
}

/**
 * 文章管理页面
 * 统一使用网站亮色主题风格
 */
export const PostsManagement: React.FC = () => {
  usePageTitle('文章管理');
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 加载文章列表
  const loadPosts = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/posts');
      const data = await response.json();
      setPosts(data.posts || []);
    } catch {
      setError('加载文章列表失败');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadPosts();
  }, []);

  // 删除文章
  const handleDelete = async (post: Post) => {
    setIsDeleting(true);
    try {
      const response = await authFetch(`/api/posts/${post.type}/${post.filename}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        setPosts(posts.filter(p => p.path !== post.path));
        setDeleteConfirm(null);
        setSuccess('文章删除成功');
      } else {
        setError(data.error || '删除失败');
      }
    } catch {
      setError('删除文章失败');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleImportMarkdown = async (file: File) => {
    setIsImporting(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await authFetch('/api/posts/import-markdown', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json() as ImportResult;

      if (!response.ok || !data.success) {
        setError(data.error || 'Markdown 导入失败');
        return;
      }

      const parsedType = data.parsed?.type === 'life' ? '生活' : '技术';
      const parsedCategory = data.parsed?.categories?.trim() || '未填写';
      setSuccess(
        `导入成功：已创建《${data.parsed?.title || file.name}》 · ${parsedType} · ${parsedCategory}`,
      );
      await loadPosts();
    } catch {
      setError('Markdown 导入失败');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 过滤文章
  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.categories?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* 页面标题 */}
      <div className="flex flex-col gap-4 mb-8 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">文章管理</h1>
          <p className="text-gray-500 mt-1">共 {posts.length} 篇文章</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:border-blue-300 hover:text-blue-600 text-gray-700 rounded-xl transition-colors shadow-sm disabled:opacity-50"
          >
            {isImporting ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
            导入 Markdown
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,text/markdown"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                void handleImportMarkdown(file);
              }
            }}
          />
          <Link
            to="/admin/posts/new"
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl transition-colors shadow-lg shadow-blue-500/25"
          >
            <Plus size={20} />
            新建文章
          </Link>
        </div>
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        {/* 搜索栏 */}
        <div className="relative max-w-md">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索文章标题或分类..."
            className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-12 pr-4 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors shadow-sm"
          />
        </div>
        <p className="text-sm text-gray-400">
          支持导入带 frontmatter 的 .md 文件，自动映射标题、日期、分类、摘要与正文。
        </p>
      </div>

      {/* 成功提示 */}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3"
        >
          <CheckCircle size={20} className="text-emerald-500" />
          <span className="text-emerald-700">{success}</span>
        </motion.div>
      )}

      {/* 错误提示 */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3"
        >
          <AlertCircle size={20} className="text-red-500" />
          <span className="text-red-600">{error}</span>
        </motion.div>
      )}

      {/* 加载状态 */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-blue-500" />
        </div>
      ) : (
        /* 文章列表 */
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          {filteredPosts.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <FileText size={48} className="mx-auto mb-4 opacity-50" />
              <p>暂无文章</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">标题</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">分类</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">日期</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">类型</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPosts.map((post) => (
                  <tr key={post.path} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <FileText size={18} className="text-gray-400" />
                        <span className="text-gray-800 font-medium">{post.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {post.categories ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-sm">
                          <Tag size={12} />
                          {post.categories}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-500 text-sm">
                        <Calendar size={14} />
                        {post.date}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-lg text-xs ${
                        post.type === 'tech'
                          ? 'bg-purple-50 text-purple-600'
                          : 'bg-green-50 text-green-600'
                      }`}>
                        {post.type === 'tech' ? '技术' : '生活'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/admin/posts/${post.type}/${post.filename}/edit`)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="编辑"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(post.path)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="删除"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* 删除确认对话框 */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 border border-gray-200 shadow-xl"
          >
            <h3 className="text-lg font-bold text-gray-800 mb-2">确认删除</h3>
            <p className="text-gray-500 mb-6">
              确定要删除这篇文章吗？此操作不可撤销。
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors"
                disabled={isDeleting}
              >
                取消
              </button>
              <button
                onClick={() => {
                  const post = posts.find(p => p.path === deleteConfirm);
                  if (post) handleDelete(post);
                }}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors flex items-center gap-2"
                disabled={isDeleting}
              >
                {isDeleting && <Loader2 size={16} className="animate-spin" />}
                删除
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
