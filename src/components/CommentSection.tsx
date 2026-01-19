import React, { useState, useEffect, useCallback } from 'react';
import { MessageCircle, Send, Reply, User, ChevronDown, ChevronUp } from 'lucide-react';

import type { Comment } from '../types';

interface CommentSectionProps {
  postId: string;
}

// 格式化时间
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  if (hours < 24) return `${hours} 小时前`;
  if (days < 30) return `${days} 天前`;
  
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// 单条评论组件
const CommentItem: React.FC<{
  comment: Comment;
  onReply: (parentId: number, nickname: string) => void;
  depth?: number;
}> = ({ comment, onReply, depth = 0 }) => {
  const [showReplies, setShowReplies] = useState(true);
  const hasReplies = comment.replies && comment.replies.length > 0;
  
  return (
    <div className={`${depth > 0 ? 'ml-6 pl-4 border-l-2 border-gray-100' : ''}`}>
      <div className="group py-4">
        {/* 评论头部 */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-medium shadow-sm">
            {comment.nickname.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <span className="font-medium text-gray-900 text-sm">{comment.nickname}</span>
            <span className="text-gray-400 text-xs ml-2">{formatDate(comment.created_at)}</span>
          </div>
        </div>
        
        {/* 评论内容 */}
        <div className="text-gray-700 text-sm leading-relaxed pl-11 whitespace-pre-wrap break-words">
          {comment.content}
        </div>
        
        {/* 操作按钮 */}
        <div className="pl-11 mt-2 flex items-center gap-4">
          <button
            onClick={() => onReply(comment.id, comment.nickname)}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-500 transition-colors cursor-pointer"
          >
            <Reply size={14} />
            <span>回复</span>
          </button>
          
          {hasReplies && (
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              {showReplies ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              <span>{showReplies ? '收起' : `展开 ${comment.replies!.length} 条回复`}</span>
            </button>
          )}
        </div>
      </div>
      
      {/* 递归渲染回复 */}
      {hasReplies && showReplies && (
        <div className="space-y-0">
          {comment.replies!.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onReply={onReply}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

import { safeGetItem, safeSetItem } from '../utils/storage';

// 评论表单组件
const CommentForm: React.FC<{
  postId: string;
  parentId: number | null;
  replyTo: string | null;
  onSubmit: (comment: Comment) => void;
  onCancel?: () => void;
}> = ({ postId, parentId, replyTo, onSubmit, onCancel }) => {
  const [nickname, setNickname] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 从 localStorage 读取上次使用的昵称
  useEffect(() => {
    const savedNickname = safeGetItem('comment_nickname');
    if (savedNickname) {
      setNickname(savedNickname);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nickname.trim() || !content.trim()) {
      setError('昵称和内容不能为空');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          parentId,
          nickname: nickname.trim(),
          content: content.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '提交失败');
      }

      // 保存昵称到 localStorage
      safeSetItem('comment_nickname', nickname.trim());
      
      onSubmit(data.comment);
      setContent('');
      if (parentId) {
        onCancel?.();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {replyTo && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Reply size={14} />
          <span>回复 <span className="font-medium text-gray-700">@{replyTo}</span></span>
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 ml-2 cursor-pointer"
          >
            取消
          </button>
        </div>
      )}
      
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 flex-shrink-0">
          <User size={16} />
        </div>
        
        <div className="flex-1 space-y-3">
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="昵称"
            maxLength={50}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white"
          />
          
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={replyTo ? `回复 @${replyTo}...` : '写下你的评论...'}
            rows={3}
            maxLength={1000}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none bg-white"
          />
          
          {error && (
            <p className="text-red-500 text-xs">{error}</p>
          )}
          
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">{content.length}/1000</span>
            <button
              type="submit"
              disabled={isSubmitting || !nickname.trim() || !content.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              {isSubmitting ? (
                <span className="animate-spin">⏳</span>
              ) : (
                <Send size={14} />
              )}
              <span>{isSubmitting ? '提交中...' : '发表'}</span>
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

// 主评论区组件
export const CommentSection: React.FC<CommentSectionProps> = ({ postId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [replyTo, setReplyTo] = useState<{ parentId: number; nickname: string } | null>(null);

  // 获取评论
  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/comments?postId=${postId}`);
      const data = await res.json();
      if (res.ok) {
        setComments(data.comments || []);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    } finally {
      setIsLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // 处理新评论提交
  const handleNewComment = (newComment: Comment) => {
    if (newComment.parent_id === null) {
      // 根评论：添加到列表开头
      setComments((prev) => [{ ...newComment, replies: [] }, ...prev]);
    } else {
      // 回复：找到父评论并添加
      setComments((prev) => {
        const addReply = (comments: Comment[]): Comment[] => {
          return comments.map((c) => {
            if (c.id === newComment.parent_id) {
              return {
                ...c,
                replies: [...(c.replies || []), { ...newComment, replies: [] }],
              };
            }
            if (c.replies && c.replies.length > 0) {
              return { ...c, replies: addReply(c.replies) };
            }
            return c;
          });
        };
        return addReply(prev);
      });
    }
    setTotal((prev) => prev + 1);
    setReplyTo(null);
  };

  // 处理回复按钮点击
  const handleReply = (parentId: number, nickname: string) => {
    setReplyTo({ parentId, nickname });
    // 滚动到表单位置
    document.getElementById('comment-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <section className="mt-16 pt-8 border-t border-gray-200">
      {/* 标题 */}
      <div className="flex items-center gap-2 mb-8">
        <MessageCircle size={20} className="text-gray-600" />
        <h2 className="text-lg font-bold text-gray-900">
          评论 {total > 0 && <span className="text-gray-400 font-normal">({total})</span>}
        </h2>
      </div>

      {/* 评论表单 */}
      <div id="comment-form" className="mb-8 p-4 bg-gray-50/50 rounded-xl border border-gray-100">
        <CommentForm
          postId={postId}
          parentId={replyTo?.parentId || null}
          replyTo={replyTo?.nickname || null}
          onSubmit={handleNewComment}
          onCancel={() => setReplyTo(null)}
        />
      </div>

      {/* 评论列表 */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-400">
          <div className="animate-spin inline-block w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full mb-2"></div>
          <p className="text-sm">加载评论中...</p>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <MessageCircle size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">暂无评论，来说两句吧～</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onReply={handleReply}
            />
          ))}
        </div>
      )}
    </section>
  );
};
