/**
 * posts.ts - 动态加载 Markdown 文章
 *
 * 使用 Vite 的 import.meta.glob 功能自动扫描并解析
 * src/content 目录下的所有 Markdown 文件。
 * Frontmatter 元数据通过 gray-matter 解析。
 */
import matter from 'gray-matter';

// 定义文章元数据类型
export interface PostMeta {
  id: string;
  title: string;
  year: number;
  date: string; // 显示格式: "Jan 07"
  description: string;
  coverImage: string;
  categories: string;
  type: 'tech' | 'life';
  tags?: string[];
  link: string; // 文章链接
}

// 定义完整文章类型
export interface Post extends PostMeta {
  content: string;
}

// 使用 Vite 的 import.meta.glob 同步导入所有 Markdown 文件
// 使用相对路径以避免潜在的路径解析问题
const techMarkdownFiles = import.meta.glob<string>(
  '../content/tech/*.md',
  { eager: true, query: '?raw', import: 'default' }
);

const lifeMarkdownFiles = import.meta.glob<string>(
  '../content/life/*.md',
  { eager: true, query: '?raw', import: 'default' }
);

/**
 * 将 ISO 日期格式 (YYYY-MM-DD) 转换为显示格式 (Jan 07)
 */
function formatDateForDisplay(isoDate: string): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const date = new Date(isoDate);
  if (isNaN(date.getTime())) {
    return 'Jan 01'; // 默认值
  }
  const month = months[date.getMonth()];
  const day = String(date.getDate()).padStart(2, '0');
  return `${month} ${day}`;
}

/**
 * 生成文章链接
 */
function generatePostLink(id: string, type: 'tech' | 'life'): string {
  return `/${type}/${id}`;
}

/**
 * 解析单个 Markdown 文件
 */
function parseMarkdownFile(rawContent: string, filePath: string): Post | null {
  try {
    const { data, content } = matter(rawContent);

    // 兼容 id 或 slug 字段 (TinaCMS 使用 slug，旧数据可能使用 id)
    const id = data.slug || data.id;

    // 确保必需字段存在
    if (!id || !data.title) {
      console.warn(`Markdown file ${filePath} is missing required fields (slug/id, title)`);
      return null;
    }

    const postType = data.type || 'tech';
    
    // date 可能是 Date 对象或字符串
    let isoDate = data.date;
    if (isoDate instanceof Date) {
      isoDate = isoDate.toISOString().split('T')[0];
    } else if (!isoDate) {
      isoDate = new Date().toISOString().split('T')[0];
    }

    return {
      id: id,
      title: data.title,
      year: data.year || new Date().getFullYear(),
      date: formatDateForDisplay(isoDate),
      description: data.description || '',
      coverImage: data.coverImage || '',
      categories: data.categories || '',
      type: postType,
      tags: data.tags || [],
      link: generatePostLink(id, postType),
      content: content.trim(),
    };
  } catch (error) {
    console.error(`Failed to parse Markdown file ${filePath}:`, error);
    return null;
  }
}

/**
 * 加载所有文章
 */
function loadAllPosts(): Post[] {
  const posts: Post[] = [];

  // 处理 tech 文章
  for (const [filePath, rawContent] of Object.entries(techMarkdownFiles)) {
    const post = parseMarkdownFile(rawContent, filePath);
    if (post) {
      posts.push(post);
    }
  }

  // 处理 life 文章
  for (const [filePath, rawContent] of Object.entries(lifeMarkdownFiles)) {
    const post = parseMarkdownFile(rawContent, filePath);
    if (post) {
      posts.push(post);
    }
  }

  // 按日期降序排序
  posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return posts;
}

// 导出所有文章
export const posts: Post[] = loadAllPosts();

// 便捷函数：按 ID 获取文章
export function getPostById(id: string): Post | undefined {
  return posts.find((post) => post.id === id);
}

// 便捷函数：按类型获取文章
export function getPostsByType(type: 'tech' | 'life'): Post[] {
  return posts.filter((post) => post.type === type);
}

// 便捷函数：按年份获取文章
export function getPostsByYear(year: number): Post[] {
  return posts.filter((post) => post.year === year);
}

// 便捷函数：获取所有年份
export function getAllYears(): number[] {
  const years = [...new Set(posts.map((post) => post.year))];
  return years.sort((a, b) => b - a); // 降序
}

// 便捷函数：获取所有分类
export function getAllCategories(): string[] {
  return [...new Set(posts.map((post) => post.categories).filter(Boolean))];
}

// 便捷函数：获取所有标签
export function getAllTags(): string[] {
  const allTags = posts.flatMap((post) => post.tags || []);
  return [...new Set(allTags)];
}
