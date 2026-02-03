/**
 * usePosts.ts - 动态获取文章数据的 Hook
 * 
 * 提供文章列表和单篇文章的动态加载功能，
 * 使得后台新建文章后前台能立即显示。
 */
import { useState, useEffect, useCallback, useRef } from 'react';

// 文章元数据类型（与后端API返回格式匹配）
export interface PostMeta {
  id: string;
  title: string;
  year: number;
  date: string;
  _sortDate: string;
  description: string;
  coverImage: string;
  categories: string;
  type: 'tech' | 'life';
  tags?: string[];
  link: string;
}

// 完整文章类型
export interface Post extends PostMeta {
  content: string;
}

// API 返回的原始文章格式
interface RawPost {
  filename: string;
  title: string;
  date: string;
  year: number;
  type: string;
  categories?: string;
  description?: string;
  tags?: string[];
  coverImage?: string;
  path: string;
}

// 全局缓存
let postsCache: Post[] | null = null;
let postsCacheTime = 0;
const CACHE_DURATION = 30000; // 30秒缓存

/**
 * 将 ISO 日期格式 (YYYY-MM-DD) 转换为显示格式 (Jan 07)
 */
function formatDateForDisplay(isoDate: string): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const date = new Date(isoDate);
  if (isNaN(date.getTime())) {
    return 'Jan 01';
  }
  const month = months[date.getMonth()];
  const day = String(date.getDate()).padStart(2, '0');
  return `${month} ${day}`;
}

/**
 * 生成文章 ID（从文件名提取）
 */
function generatePostId(filename: string): string {
  return filename.replace('.md', '');
}

/**
 * 转换 API 返回的文章格式为前端使用的格式
 */
function transformPost(raw: RawPost, content?: string): Post {
  const id = generatePostId(raw.filename);
  return {
    id,
    title: raw.title,
    year: raw.year || new Date().getFullYear(),
    date: formatDateForDisplay(raw.date),
    _sortDate: raw.date,
    description: raw.description || '',
    coverImage: raw.coverImage || '',
    categories: raw.categories || '',
    type: raw.type as 'tech' | 'life',
    tags: raw.tags || [],
    link: `/${raw.type}/${id}`,
    content: content || '',
  };
}

/**
 * 获取所有文章列表的 Hook
 */
export function usePosts() {
  const [posts, setPosts] = useState<Post[]>(postsCache || []);
  const [isLoading, setIsLoading] = useState(!postsCache);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async (force = false) => {
    // 检查缓存
    if (!force && postsCache && Date.now() - postsCacheTime < CACHE_DURATION) {
      setPosts(postsCache);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/posts');
      const data = await response.json();
      
      if (data.posts) {
        const transformedPosts = data.posts.map((raw: RawPost) => transformPost(raw));
        
        // 按年份和日期降序排序
        transformedPosts.sort((a: Post, b: Post) => {
          if (a.year !== b.year) {
            return b.year - a.year;
          }
          return new Date(b._sortDate).getTime() - new Date(a._sortDate).getTime();
        });
        
        // 更新缓存
        postsCache = transformedPosts;
        postsCacheTime = Date.now();
        
        setPosts(transformedPosts);
      }
    } catch (err) {
      setError('加载文章列表失败');
      console.error('Failed to fetch posts:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // 刷新函数（强制重新获取）
  const refresh = useCallback(() => {
    fetchPosts(true);
  }, [fetchPosts]);

  return { posts, isLoading, error, refresh };
}

/**
 * 获取单篇文章的 Hook
 */
export function usePost(type: string | undefined, id: string | undefined) {
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!type || !id) {
      setIsLoading(false);
      return;
    }

    const key = `${type}/${id}`;
    
    // 避免重复请求
    if (fetchedRef.current === key && post) {
      return;
    }

    setIsLoading(true);
    setError(null);
    fetchedRef.current = key;

    fetch(`/api/posts/${type}/${id}.md`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error('文章不存在');
        }
        return res.json();
      })
      .then((data) => {
        if (data.meta) {
          const transformedPost: Post = {
            id,
            title: data.meta.title || '',
            year: data.meta.year || new Date().getFullYear(),
            date: formatDateForDisplay(data.meta.date || ''),
            _sortDate: data.meta.date || '',
            description: data.meta.description || '',
            coverImage: data.meta.coverImage || '',
            categories: data.meta.categories || '',
            type: type as 'tech' | 'life',
            tags: data.meta.tags || [],
            link: `/${type}/${id}`,
            content: data.content || '',
          };
          setPost(transformedPost);
        }
      })
      .catch((err) => {
        setError(err.message || '加载文章失败');
        console.error('Failed to fetch post:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [type, id]);

  return { post, isLoading, error };
}

/**
 * 清除文章缓存（用于后台操作后刷新）
 */
export function clearPostsCache() {
  postsCache = null;
  postsCacheTime = 0;
}
