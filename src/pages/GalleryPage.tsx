import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { PhotoWall } from '../components/PhotoWall';
import type { PhotoItem } from '../components/PhotoWall';
import { ArrowLeft, Grid3X3, LayoutGrid, Rows3, Film } from 'lucide-react';

// 从 photowall 目录加载的图片列表
const imageModules = import.meta.glob('/public/photowall/*.(jpg|png|jpeg|webp)', { 
  eager: true, 
  query: '?url',
  import: 'default' 
});

// 从 photowall 目录加载的视频列表 (Live Photo)
const videoModules = import.meta.glob('/public/photowall/*.(mov|mp4|webm)', { 
  eager: true, 
  query: '?url',
  import: 'default' 
});

// 预定义的文件大小映射 (实际项目中可通过构建时脚本生成)
// 由于浏览器无法直接获取静态文件大小，这里提供一个近似值
const fileSizeMap: Record<string, number> = {
  '-明日方舟主题地铁站-能天使.jpg': 2878538,
  '上海-明日方舟地铁站.jpg': 4300162,
  '公司环境1.png': 15105483,
  '公司环境2.png': 12730212,
  '养了几天.png': 14645983,
  '凤凰湖.png': 7856857,
  '别墅.jpg': 6600499,
  '又养了几天.png': 11374600,
  '同事结婚.png': 10003895,
  '同济大学.jpg': 2822476,
  '团建烧烤.png': 14696895,
  '团建聚餐.jpg': 6844093,
  '外滩看陆家嘴.jpg': 3290718,
  '徐家汇.jpg': 5076147,
  '新电脑1.png': 12285623,
  '新电脑2.png': 13860347,
  '明日方舟立牌.jpg': 4636537,
  '明日方舟立牌2.jpg': 4127301,
  '明日方舟立牌3.jpg': 3878363,
  '朋友送的礼物.jpg': 2377991,
  '植物园玻璃房.jpg': 4292915,
  '灵隐寺.jpg': 5867968,
  '猫刚领养.png': 5563378,
  '谷子店.jpg': 4707620,
  '陆家嘴2.jpg': 256174,
  '非洲之心.png': 14657115,
};

export const GalleryPage: React.FC = () => {
  const [columns, setColumns] = useState(4);
  const [isLoading, setIsLoading] = useState(true);

  // 构建视频文件名映射 (不含扩展名 -> 视频路径)
  const videoMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const path in videoModules) {
      const filename = path.split('/').pop() || '';
      const baseName = filename.replace(/\.(mov|mp4|webm)$/i, '');
      const src = path.replace('/public', '');
      map.set(baseName, src);
    }
    return map;
  }, []);

  // 解析图片列表
  const images = useMemo<PhotoItem[]>(() => {
    const result: PhotoItem[] = [];
    
    for (const path in imageModules) {
      const filename = path.split('/').pop() || '';
      const src = path.replace('/public', '');
      const alt = filename.replace(/\.(jpg|png|jpeg|webp)$/i, '').replace(/[-_]/g, ' ');
      const format = filename.split('.').pop()?.toUpperCase() || 'JPG';
      const baseName = filename.replace(/\.(jpg|png|jpeg|webp)$/i, '');
      
      // 查找是否有对应的 Live Photo 视频
      const videoSrc = videoMap.get(baseName);
      
      // 获取文件大小
      const size = fileSizeMap[filename];
      
      result.push({ 
        src, 
        alt, 
        filename, 
        format,
        size,
        videoSrc,
      });
    }
    
    // 按文件名排序
    return result.sort((a, b) => a.filename.localeCompare(b.filename, 'zh-CN'));
  }, [videoMap]);

  // 统计 Live Photo 数量
  const livePhotoCount = useMemo(() => {
    return images.filter(img => img.videoSrc).length;
  }, [images]);

  useEffect(() => {
    // 模拟加载延迟
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  // 响应式列数
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) setColumns(2);
      else if (width < 1024) setColumns(3);
      else if (width < 1536) setColumns(4);
      else setColumns(5);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            {/* 返回按钮 */}
            <a 
              href="/"
              className="flex items-center gap-2 text-white/70 hover:text-white transition-colors group"
            >
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">返回首页</span>
            </a>

            {/* 标题 */}
            <h1 className="text-xl font-bold tracking-tight">
              📸 Photo Wall
            </h1>

            {/* 列数控制 */}
            <div className="flex items-center gap-2 bg-white/5 rounded-lg p-1">
              <button
                onClick={() => setColumns(3)}
                className={`p-2 rounded transition-colors ${columns === 3 ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white'}`}
                title="3 列"
              >
                <Rows3 size={18} />
              </button>
              <button
                onClick={() => setColumns(4)}
                className={`p-2 rounded transition-colors ${columns === 4 ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white'}`}
                title="4 列"
              >
                <LayoutGrid size={18} />
              </button>
              <button
                onClick={() => setColumns(5)}
                className={`p-2 rounded transition-colors ${columns === 5 ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white'}`}
                title="5 列"
              >
                <Grid3X3 size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1800px] mx-auto px-4 sm:px-6 py-8">
        {/* 统计信息 */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center gap-4"
        >
          <p className="text-white/50 text-sm">
            共 <span className="text-white font-medium">{images.length}</span> 张照片
          </p>
          {livePhotoCount > 0 && (
            <div className="flex items-center gap-1 text-white/50 text-sm">
              <Film size={14} />
              <span><span className="text-white font-medium">{livePhotoCount}</span> 张实况照片</span>
            </div>
          )}
        </motion.div>

        {/* 照片墙 */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/20 border-t-white"></div>
          </div>
        ) : (
          <PhotoWall images={images} columns={columns} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 mt-16">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 text-center">
          <p className="text-white/40 text-sm">
            按 <kbd className="px-2 py-1 bg-white/10 rounded text-xs">Esc</kbd> 关闭预览，
            使用 <kbd className="px-2 py-1 bg-white/10 rounded text-xs">←</kbd> <kbd className="px-2 py-1 bg-white/10 rounded text-xs">→</kbd> 切换图片
          </p>
          {livePhotoCount > 0 && (
            <p className="text-white/30 text-xs mt-2">
              悬停在 <span className="inline-flex items-center gap-1"><Film size={10} /> LIVE</span> 标记的图片上可预览实况照片
            </p>
          )}
        </div>
      </footer>
    </div>
  );
};
