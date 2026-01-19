import React, { useState, useEffect, useCallback } from 'react';
import { MessageCircle, Send, Reply, User, ChevronDown, ChevronUp } from 'lucide-react';

// 评论数据类型
interface Comment {
  id: number;
  post_id: string;
  parent_id: number | null;
  nickname: string;
  content: string;
  created_at: string;
  replies?: Comment[];
}

interface PhotoCommentSectionProps {
  photoId: string;
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

// 单条评论组件 - 暗色主题
const PhotoCommentItem: React.FC<{
  comment: Comment;
  onReply: (parentId: number, nickname: string) => void;
  depth?: number;
}> = ({ comment, onReply, depth = 0 }) => {
  const [showReplies, setShowReplies] = useState(true);
  const hasReplies = comment.replies && comment.replies.length > 0;
  
  return (
    <div className={`${depth > 0 ? 'ml-4 pl-3 border-l border-white/10' : ''}`}>
      <div className="group py-3">
        {/* 评论头部 */}
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center text-white text-xs font-medium shadow-sm flex-shrink-0">
            {comment.nickname.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <span className="font-medium text-white text-sm">{comment.nickname}</span>
            <span className="text-white/40 text-xs ml-2">{formatDate(comment.created_at)}</span>
          </div>
        </div>
        
        {/* 评论内容 */}
        <div className="text-white/80 text-sm leading-relaxed pl-9 whitespace-pre-wrap break-words">
          {comment.content}
        </div>
        
        {/* 操作按钮 */}
        <div className="pl-9 mt-1.5 flex items-center gap-3">
          <button
            onClick={() => onReply(comment.id, comment.nickname)}
            className="flex items-center gap-1 text-xs text-white/40 hover:text-blue-400 transition-colors cursor-pointer"
          >
            <Reply size={12} />
            <span>回复</span>
          </button>
          
          {hasReplies && (
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="flex items-center gap-1 text-xs text-white/40 hover:text-white/60 transition-colors cursor-pointer"
            >
              {showReplies ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              <span>{showReplies ? '收起' : `${comment.replies!.length} 条回复`}</span>
            </button>
          )}
        </div>
      </div>
      
      {/* 递归渲染回复 */}
      {hasReplies && showReplies && (
        <div className="space-y-0">
          {comment.replies!.map((reply) => (
            <PhotoCommentItem
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

// 评论表单组件 - 暗色主题
const PhotoCommentForm: React.FC<{
  photoId: string;
  parentId: number | null;
  replyTo: string | null;
  onSubmit: (comment: Comment) => void;
  onCancel?: () => void;
}> = ({ photoId, parentId, replyTo, onSubmit, onCancel }) => {
  const [nickname, setNickname] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 从 localStorage 读取上次使用的昵称
  useEffect(() => {
    const savedNickname = localStorage.getItem('comment_nickname');
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
          postId: `photo:${photoId}`,
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
      localStorage.setItem('comment_nickname', nickname.trim());
      
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
    <form onSubmit={handleSubmit} className="space-y-3">
      {replyTo && (
        <div className="flex items-center gap-2 text-sm text-white/50">
          <Reply size={12} />
          <span>回复 <span className="font-medium text-white/70">@{replyTo}</span></span>
          <button
            type="button"
            onClick={onCancel}
            className="text-white/40 hover:text-white/60 ml-1 cursor-pointer"
          >
            取消
          </button>
        </div>
      )}
      
      <div className="flex gap-2">
        <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/40 flex-shrink-0">
          <User size={14} />
        </div>
        
        <div className="flex-1 space-y-2">
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="昵称"
            maxLength={50}
            className="w-full px-3 py-1.5 text-sm bg-white/5 border border-white/10 rounded-lg 
                       text-white placeholder:text-white/30
                       focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 
                       transition-all"
          />
          
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={replyTo ? `回复 @${replyTo}...` : '写下你的评论...'}
            rows={3}
            maxLength={500}
            className="w-full px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg 
                       text-white placeholder:text-white/30
                       focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 
                       transition-all resize-none"
          />
          
          {error && (
            <p className="text-red-400 text-xs">{error}</p>
          )}
          
          <div className="flex justify-between items-center">
            <span className="text-xs text-white/30">{content.length}/500</span>
            <button
              type="submit"
              disabled={isSubmitting || !nickname.trim() || !content.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white text-sm font-medium rounded-lg 
                         hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed 
                         transition-colors cursor-pointer"
            >
              {isSubmitting ? (
                <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send size={12} />
              )}
              <span>{isSubmitting ? '发送中' : '发送'}</span>
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

// 主评论区组件 - 暗色主题
export const PhotoCommentSection: React.FC<PhotoCommentSectionProps> = ({ photoId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [replyTo, setReplyTo] = useState<{ parentId: number; nickname: string } | null>(null);

  // 获取评论
  const fetchComments = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/comments?postId=photo:${photoId}`);
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
  }, [photoId]);

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
  };

  return (
    <div className="flex flex-col h-full">
      {/* 标题 */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <MessageCircle size={16} className="text-white/60" />
        <h3 className="text-sm font-medium text-white">
          评论 {total > 0 && <span className="text-white/40 font-normal">({total})</span>}
        </h3>
      </div>

      {/* 评论表单 */}
      <div className="mb-4 p-3 bg-white/5 rounded-xl border border-white/5">
        <PhotoCommentForm
          photoId={photoId}
          parentId={replyTo?.parentId || null}
          replyTo={replyTo?.nickname || null}
          onSubmit={handleNewComment}
          onCancel={() => setReplyTo(null)}
        />
      </div>

      {/* 评论列表 */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 text-white/40">
            <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin mb-2" />
            <p className="text-xs">加载评论中...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-white/40">
            <MessageCircle size={24} className="mb-2 opacity-50" />
            <p className="text-xs">暂无评论，来说两句吧～</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {comments.map((comment) => (
              <PhotoCommentItem
                key={comment.id}
                comment={comment}
                onReply={handleReply}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
