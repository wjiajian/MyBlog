import React from 'react';

export const Header: React.FC = () => {
  return (
    // ====== 可配置项：亮色主题头部 ======
    // fixed: 固定定位，不随页面滚动
    <header className="fixed top-0 left-0 w-full p-8 z-50 flex justify-between items-start pointer-events-none">
      <div className="pointer-events-auto bg-white/80 backdrop-blur-md px-4 py-3 rounded-xl border border-gray-200 shadow-sm">
        {/* ====== 可配置项：个性文本样式 ====== */}
        <h1 className="text-gray-600 text-lg font-semibold leading-relaxed tracking-wide">
          Everything I've built, written, and learned.
          <br />
          <span className="text-gray-900 font-bold text-xl">Archived in time.</span>
        </h1>
      </div>
      
      {/* 音乐按钮已移除 - 如需恢复请取消注释 */}
      {/* 
      <div className="pointer-events-auto">
         <button className="bg-white/80 hover:bg-white backdrop-blur-md border border-gray-200 rounded-full p-2 transition-colors text-gray-700 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
         </button>
      </div>
      */}
    </header>
  );
};
