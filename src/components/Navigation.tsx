import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, FolderOpen, Search, User, X, ChevronDown, Menu } from 'lucide-react';
import { posts } from '../data/posts';

interface NavigationProps {
  onCategoryChange?: (category: string | null) => void;
  onSearchSelect?: (postId: string) => void;
  currentCategory?: string | null;
}

// 精确匹配函数：只做包含匹配，支持多关键词
const exactMatch = (text: string, query: string): boolean => {
  if (!text || !query) return false;
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase().trim();
  
  // 分词匹配（用空格分隔的多个关键词，全部都要包含）
  const keywords = lowerQuery.split(/\s+/).filter(k => k.length > 0);
  return keywords.every(keyword => lowerText.includes(keyword));
};

export const Navigation: React.FC<NavigationProps> = ({ 
  onCategoryChange, 
  onSearchSelect,
  currentCategory 
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // 获取所有唯一分类
  const categories = Array.from(new Set(posts.map(p => p.categories).filter(Boolean))) as string[];

  // 搜索结果：严格精确匹配
  const searchResults = searchQuery.trim() 
    ? posts.filter(post => {
        const query = searchQuery.trim();
        // 优先匹配标题（最相关）
        if (exactMatch(post.title, query)) return true;
        // 匹配标签（精确）
        if (post.tags?.some(tag => exactMatch(tag, query))) return true;
        // 匹配描述
        if (exactMatch(post.description, query)) return true;
        // 匹配正文内容（完整词匹配，至少3个字符才搜索正文）
        if (query.length >= 3 && post.content && exactMatch(post.content, query)) return true;
        return false;
      }).slice(0, 5)
    : [];


  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
        setSearchQuery('');
      }
      if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
        setIsCategoryOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 搜索框展开时自动聚焦
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // 关闭移动菜单当路由变化时
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleSearchSelect = (postId: string) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    setIsMobileMenuOpen(false);
    if (location.pathname !== '/') {
      navigate('/');
    }
    setTimeout(() => {
      onSearchSelect?.(postId);
    }, 100);
  };

  const handleCategorySelect = (category: string | null) => {
    setIsCategoryOpen(false);
    setIsMobileMenuOpen(false);
    onCategoryChange?.(category);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* 桌面端导航 */}
      <nav className="hidden md:flex items-center gap-1">
      {/* 首页 */}
      <Link
        to="/"
        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors duration-200 cursor-pointer
          ${isActive('/') ? 'text-gray-900 bg-gray-100' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
      >
        <Home size={18} />
        <span className="text-sm font-medium">首页</span>
      </Link>

      {/* 分类下拉 */}
      <div ref={categoryRef} className="relative">
        <button
          onClick={() => setIsCategoryOpen(!isCategoryOpen)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors duration-200 cursor-pointer
            ${currentCategory ? 'text-gray-900 bg-gray-100' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
        >
          <FolderOpen size={18} />
          <span className="text-sm font-medium">
            {currentCategory || '分类'}
          </span>
          <ChevronDown size={14} className={`transition-transform duration-200 ${isCategoryOpen ? 'rotate-180' : ''}`} />
        </button>

        {isCategoryOpen && (
          <div className="absolute top-full right-0 mt-2 w-36 bg-white/95 backdrop-blur-md rounded-xl border border-gray-200 shadow-lg overflow-hidden z-50">
            <button
              onClick={() => handleCategorySelect(null)}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer
                ${!currentCategory ? 'text-gray-900 bg-gray-100' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
            >
              全部
            </button>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => handleCategorySelect(category)}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer
                  ${currentCategory === category ? 'text-gray-900 bg-gray-100' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
              >
                {category}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 搜索 */}
      <div ref={searchContainerRef} className="relative">
        <div className="flex items-center">
          {isSearchOpen ? (
            <div className="flex items-center bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索文章..."
                className="w-48 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none"
              />
              <button
                onClick={() => {
                  setIsSearchOpen(false);
                  setSearchQuery('');
                }}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
            >
              <Search size={18} />
              <span className="text-sm font-medium">搜索</span>
            </button>
          )}
        </div>

        {/* 搜索结果下拉 */}
        {isSearchOpen && searchResults.length > 0 && (
          <div className="absolute top-full right-0 mt-2 w-72 bg-white/95 backdrop-blur-md rounded-xl border border-gray-200 shadow-lg overflow-hidden z-50">
            {searchResults.map(post => (
              <button
                key={post.id}
                onClick={() => handleSearchSelect(post.id)}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-100 last:border-b-0"
              >
                <div className="text-sm font-medium text-gray-900 truncate">{post.title}</div>
                <div className="text-xs text-gray-500 mt-0.5">{post.categories} · {post.date}</div>
              </button>
            ))}
          </div>
        )}

        {isSearchOpen && searchQuery.trim() && searchResults.length === 0 && (
          <div className="absolute top-full right-0 mt-2 w-72 bg-white/95 backdrop-blur-md rounded-xl border border-gray-200 shadow-lg p-4 z-50">
            <div className="text-sm text-gray-500 text-center">未找到相关文章</div>
          </div>
        )}
      </div>

      {/* 关于 */}
      <Link
        to="/about"
        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors duration-200 cursor-pointer
          ${isActive('/about') ? 'text-gray-900 bg-gray-100' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
      >
        <User size={18} />
        <span className="text-sm font-medium">关于</span>
      </Link>
      </nav>

      {/* 移动端汉堡菜单 */}
      <div ref={mobileMenuRef} className="md:hidden relative">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* 移动端下拉菜单 */}
        {isMobileMenuOpen && (
          <div className="absolute top-full right-0 mt-2 w-56 bg-white/95 backdrop-blur-md rounded-xl border border-gray-200 shadow-lg overflow-hidden z-50">
            {/* 首页 */}
            <Link
              to="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 transition-colors cursor-pointer
                ${isActive('/') ? 'text-gray-900 bg-gray-100' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
            >
              <Home size={18} />
              <span className="text-sm font-medium">首页</span>
            </Link>

            {/* 分类 */}
            <div className="border-t border-gray-100">
              <div className="px-4 py-2 text-xs text-gray-400 uppercase tracking-wider">分类</div>
              <button
                onClick={() => handleCategorySelect(null)}
                className={`w-full flex items-center gap-3 px-4 py-2 transition-colors cursor-pointer
                  ${!currentCategory ? 'text-gray-900 bg-gray-100' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <span className="text-sm">全部</span>
              </button>
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => handleCategorySelect(category)}
                  className={`w-full flex items-center gap-3 px-4 py-2 transition-colors cursor-pointer
                    ${currentCategory === category ? 'text-gray-900 bg-gray-100' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <span className="text-sm">{category}</span>
                </button>
              ))}
            </div>

            {/* 搜索 */}
            <div className="border-t border-gray-100 p-3">
              <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2">
                <Search size={16} className="text-gray-400 mr-2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索文章..."
                  className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none"
                />
              </div>
              {/* 移动端搜索结果 */}
              {searchQuery.trim() && searchResults.length > 0 && (
                <div className="mt-2 space-y-1">
                  {searchResults.map(post => (
                    <button
                      key={post.id}
                      onClick={() => handleSearchSelect(post.id)}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <div className="text-sm font-medium text-gray-900 truncate">{post.title}</div>
                    </button>
                  ))}
                </div>
              )}
              {searchQuery.trim() && searchResults.length === 0 && (
                <div className="mt-2 text-sm text-gray-500 text-center py-2">未找到相关文章</div>
              )}
            </div>

            {/* 关于 */}
            <Link
              to="/about"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 border-t border-gray-100 transition-colors cursor-pointer
                ${isActive('/about') ? 'text-gray-900 bg-gray-100' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
            >
              <User size={18} />
              <span className="text-sm font-medium">关于</span>
            </Link>
          </div>
        )}
      </div>
    </>
  );
};
