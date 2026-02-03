import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Upload, 
  Trash2, 
  Image as ImageIcon,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react';
import { authFetch } from '../../utils/auth';

interface Photo {
  filename: string;
  src: string;
  srcMedium?: string;
  srcTiny?: string;
  width?: number;
  height?: number;
  size?: number;
}

/**
 * 照片管理页面
 * 统一使用网站亮色主题风格
 */
export const PhotosManagement: React.FC = () => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // 加载照片列表
  const loadPhotos = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/photos/metadata');
      const data = await response.json();
      setPhotos(data.photos || []);
    } catch (err) {
      setError('加载照片列表失败');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPhotos();
  }, []);

  // 处理文件上传
  const handleUpload = async (files: FileList | File[]) => {
    if (!files.length) return;

    setIsUploading(true);
    setError('');
    setSuccess('');
    setUploadProgress(0);

    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('photos', file);
    });

    try {
      const response = await authFetch('/api/photos/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`成功上传 ${data.uploaded.length} 张照片`);
        await loadPhotos();
      } else {
        setError(data.error || '上传失败');
      }
    } catch (err) {
      setError('上传照片失败');
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  // 触发照片处理
  const handleProcess = async () => {
    setIsProcessing(true);
    setError('');
    setSuccess('');

    try {
      const response = await authFetch('/api/photos/process', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('照片处理已启动，请稍后刷新查看结果');
      } else {
        setError(data.error || '处理失败');
      }
    } catch (err) {
      setError('启动照片处理失败');
    } finally {
      setIsProcessing(false);
    }
  };

  // 删除照片
  const handleDelete = async (filename: string) => {
    setIsDeleting(true);
    try {
      const response = await authFetch(`/api/photos/${encodeURIComponent(filename)}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        setPhotos(photos.filter(p => p.filename !== filename));
        setDeleteConfirm(null);
        setSuccess('照片已删除');
      } else {
        setError(data.error || '删除失败');
      }
    } catch (err) {
      setError('删除照片失败');
    } finally {
      setIsDeleting(false);
    }
  };

  // 拖拽事件处理
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    handleUpload(files);
  }, []);

  // 格式化文件大小
  const formatSize = (bytes?: number) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">照片管理</h1>
          <p className="text-gray-500 mt-1">共 {photos.length} 张照片</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleProcess}
            disabled={isProcessing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl transition-colors disabled:opacity-50 shadow-sm"
          >
            {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
            处理照片
          </button>
          <label className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl transition-colors cursor-pointer shadow-lg shadow-blue-500/25">
            <Upload size={18} />
            上传照片
            <input
              type="file"
              accept="image/*,.heic"
              multiple
              onChange={(e) => e.target.files && handleUpload(e.target.files)}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* 提示消息 */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <AlertCircle size={20} className="text-red-500" />
            <span className="text-red-600">{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">
            <X size={18} />
          </button>
        </motion.div>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <CheckCircle size={20} className="text-green-500" />
            <span className="text-green-600">{success}</span>
          </div>
          <button onClick={() => setSuccess('')} className="text-green-400 hover:text-green-600">
            <X size={18} />
          </button>
        </motion.div>
      )}

      {/* 拖拽上传区域 */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`mb-6 border-2 border-dashed rounded-2xl p-8 text-center transition-colors ${
          isDragging 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-200 hover:border-gray-300 bg-white'
        }`}
      >
        {isUploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={32} className="animate-spin text-blue-500" />
            <p className="text-gray-500">上传中...</p>
            {uploadProgress !== null && (
              <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
          </div>
        ) : (
          <>
            <Upload size={32} className={`mx-auto mb-3 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
            <p className={isDragging ? 'text-blue-600' : 'text-gray-500'}>
              拖拽照片到此处上传，或点击上方按钮选择文件
            </p>
            <p className="text-gray-400 text-sm mt-2">
              支持 JPG、PNG、WebP、HEIC 格式
            </p>
          </>
        )}
      </div>

      {/* 加载状态 */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-blue-500" />
        </div>
      ) : photos.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <ImageIcon size={48} className="mx-auto mb-4 opacity-50" />
          <p>暂无照片</p>
        </div>
      ) : (
        /* 照片网格 */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {photos.map((photo) => (
            <motion.div
              key={photo.filename}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="group relative aspect-square bg-gray-100 rounded-xl overflow-hidden border border-gray-200 shadow-sm"
            >
              <img
                src={photo.srcMedium || photo.srcTiny || photo.src}
                alt={photo.filename}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              {/* 悬停遮罩 */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                <button
                  onClick={() => setDeleteConfirm(photo.filename)}
                  className="p-2 bg-red-500/90 hover:bg-red-500 text-white rounded-lg transition-colors"
                >
                  <Trash2 size={18} />
                </button>
                <span className="text-white/80 text-xs text-center px-2 truncate max-w-full">
                  {photo.filename}
                </span>
                <span className="text-white/60 text-xs">
                  {formatSize(photo.size)}
                </span>
              </div>
            </motion.div>
          ))}
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
            <p className="text-gray-500 mb-2">
              确定要删除这张照片吗？
            </p>
            <p className="text-gray-400 text-sm mb-6 truncate">
              {deleteConfirm}
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
                onClick={() => handleDelete(deleteConfirm)}
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
