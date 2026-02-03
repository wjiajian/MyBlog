import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Save, 
  ArrowLeft, 
  Loader2,
  AlertCircle,
  Upload,
  Image,
  X
} from 'lucide-react';
import MDEditor from '@uiw/react-md-editor';
import { authFetch } from '../../utils/auth';

interface PostData {
  title: string;
  slug?: string;
  content: string;
  type: 'tech' | 'life';
  categories: string;
  description: string;
  date: string;
  coverImage: string;
}

/**
 * 文章编辑器页面
 * 使用 @uiw/react-md-editor 提供专业的 Markdown 编辑体验
 * 统一使用网站亮色主题风格
 */
export const PostEditor: React.FC = () => {
  const navigate = useNavigate();
  const { type, filename } = useParams();
  const isEditing = !!filename;

  const [postData, setPostData] = useState<PostData>({
    title: '',
    slug: '',
    content: '',
    type: 'tech',
    categories: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    coverImage: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [error, setError] = useState('');
  const coverInputRef = useRef<HTMLInputElement>(null);

  // 上传封面图片
  const handleCoverUpload = async (file: File) => {
    if (!file) return;
    
    setIsUploadingCover(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('cover', file);
      // 将 slug 作为 query 参数传递，确保后端能第一时间获取到
      // 如果没有 slug，使用标题或默认值
      const folderName = postData.slug || postData.title || `cover-${Date.now()}`;
      // const safeSlug = encodeURIComponent(postData.slug || '');
      // formData.append('folderName', folderName);
      
      const response = await authFetch(`/api/posts/upload-cover?slug=${encodeURIComponent(postData.slug || '')}`, {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (data.success) {
        setPostData({ ...postData, coverImage: data.url });
      } else {
        setError(data.error || '上传封面失败');
      }
    } catch (err) {
      setError('上传封面图片失败');
    } finally {
      setIsUploadingCover(false);
    }
  };

  // 加载文章内容（编辑模式）
  useEffect(() => {
    if (isEditing && type && filename) {
      setIsLoading(true);
      fetch(`/api/posts/${type}/${filename}`)
        .then(res => res.json())
        .then(data => {
          if (data.meta) {
            setPostData({
              title: data.meta.title || '',
              slug: filename?.replace('.md', ''), // 编辑时从文件名获取 slug
              content: data.content || '',
              type: type as 'tech' | 'life',
              categories: data.meta.categories || '',
              description: data.meta.description || '',
              date: data.meta.date ? String(data.meta.date) : '',
              coverImage: data.meta.coverImage || '',
            });
          }
        })
        .catch(() => setError('加载文章失败'))
        .finally(() => setIsLoading(false));
    }
  }, [isEditing, type, filename]);

  // 保存文章
  const handleSave = async () => {
    if (!postData.title.trim()) {
      setError('标题不能为空');
      return;
    }
    if (!postData.content.trim()) {
      setError('内容不能为空');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const url = isEditing 
        ? `/api/posts/${type}/${filename}`
        : '/api/posts';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData),
      });

      const data = await response.json();

      if (data.success) {
        navigate('/admin/posts');
      } else {
        setError(data.error || '保存失败');
      }
    } catch (err) {
      setError('保存文章失败');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" data-color-mode="light">
      {/* 顶部工具栏 */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/posts')}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft size={20} />
            返回
          </button>
          <h1 className="text-lg font-bold text-gray-800">
            {isEditing ? '编辑文章' : '新建文章'}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl transition-colors disabled:opacity-50 shadow-lg shadow-blue-500/25"
          >
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            保存
          </button>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3"
        >
          <AlertCircle size={20} className="text-red-500" />
          <span className="text-red-600">{error}</span>
        </motion.div>
      )}

      <div className="flex-1 p-6 flex flex-col gap-4">
        {/* 元数据表单 */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-gray-600 text-sm mb-2">标题</label>
              <input
                type="text"
                value={postData.title}
                onChange={(e) => setPostData({ ...postData, title: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="文章标题"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-gray-600 text-sm mb-2">Slug (URL路径/文件名) <span className="text-xs text-gray-400 font-normal">可选，留空将使用标题</span></label>
              <input
                type="text"
                value={postData.slug || ''}
                onChange={(e) => setPostData({ ...postData, slug: e.target.value })}
                disabled={isEditing} // 编辑模式下文件名不可改
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="my-awesome-post"
              />
            </div>
            <div>
              <label className="block text-gray-600 text-sm mb-2">类型</label>
              <select
                value={postData.type}
                onChange={(e) => setPostData({ ...postData, type: e.target.value as 'tech' | 'life' })}
                disabled={isEditing}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-gray-800 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
              >
                <option value="tech">技术</option>
                <option value="life">生活</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-600 text-sm mb-2">分类</label>
              <input
                type="text"
                value={postData.categories}
                onChange={(e) => setPostData({ ...postData, categories: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="例如：React"
              />
            </div>
            <div>
              <label className="block text-gray-600 text-sm mb-2">日期</label>
              <input
                type="date"
                value={postData.date}
                onChange={(e) => setPostData({ ...postData, date: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-gray-800 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div className="md:col-span-2 lg:col-span-2">
              <label className="block text-gray-600 text-sm mb-2">描述</label>
              <input
                type="text"
                value={postData.description}
                onChange={(e) => setPostData({ ...postData, description: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="文章简短描述"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-gray-600 text-sm mb-2">封面图片</label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={postData.coverImage}
                  onChange={(e) => setPostData({ ...postData, coverImage: e.target.value })}
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="封面图片URL，或点击右侧上传"
                />
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  disabled={isUploadingCover}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors disabled:opacity-50"
                >
                  {isUploadingCover ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Upload size={18} />
                  )}
                  上传
                </button>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={(e) => e.target.files?.[0] && handleCoverUpload(e.target.files[0])}
                  className="hidden"
                />
              </div>
              {/* 封面预览 */}
              {postData.coverImage && (
                <div className="mt-3 relative inline-block">
                  <img
                    src={postData.coverImage}
                    alt="封面预览"
                    className="h-24 rounded-lg object-cover border border-gray-200"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setPostData({ ...postData, coverImage: '' })}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-md transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Markdown 编辑器 */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <MDEditor
            value={postData.content}
            onChange={(value) => setPostData({ ...postData, content: value || '' })}
            height="calc(100vh - 380px)"
            preview="live"
            hideToolbar={false}
            enableScroll={true}
            visibleDragbar={false}
          />
        </div>
      </div>
    </div>
  );
};
