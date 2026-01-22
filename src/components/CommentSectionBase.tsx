import React, { useState, useEffect, useCallback } from 'react';
import { MessageCircle, Send, Reply, User, ChevronDown, ChevronUp } from 'lucide-react';

import type { Comment } from '../types';
import { safeGetItem, safeSetItem } from '../utils/storage';

export type CommentVariant = 'light' | 'dark';

interface CommentSectionBaseProps {
  postId: string;
  variant: CommentVariant;
  maxContentLength: number;
  scrollToForm?: boolean;
  formId?: string;
}

interface CommentItemStyles {
  indentClass: string;
  rowClass: string;
  headerClass: string;
  avatarClass: string;
  nameClass: string;
  timeClass: string;
  contentClass: string;
  actionsClass: string;
  replyButtonClass: string;
  replyIconSize: number;
  toggleButtonClass: string;
  toggleIconSize: number;
  toggleText: (showReplies: boolean, count: number) => string;
}

interface CommentFormStyles {
  formClass: string;
  replyInfoClass: string;
  replyNameClass: string;
  replyCancelClass: string;
  replyIconSize: number;
  userIconSize: number;
  rowClass: string;
  fieldGroupClass: string;
  avatarClass: string;
  inputClass: string;
  textareaClass: string;
  errorClass: string;
  counterClass: string;
  submitButtonClass: string;
  submitIconSize: number;
  submitTextIdle: string;
  submitTextLoading: string;
  submitSpinner: React.ReactNode;
}

interface LoadingStyles {
  containerClass: string;
  spinnerClass: string;
  textClass: string;
}

interface EmptyStyles {
  containerClass: string;
  iconSize: number;
  iconClass: string;
  textClass: string;
}

interface CommentSectionStyles {
  containerClass: string;
  headerClass: string;
  headerIconSize: number;
  headerIconClass: string;
  headerTitleClass: string;
  headerCountClass: string;
  formWrapperClass: string;
  listContainerClass: string;
  listClass: string;
  item: CommentItemStyles;
  form: CommentFormStyles;
  loading: LoadingStyles;
  empty: EmptyStyles;
}

const STYLES: Record<CommentVariant, CommentSectionStyles> = {
  light: {
    containerClass: 'mt-16 pt-8 border-t border-gray-200',
    headerClass: 'flex items-center gap-2 mb-8',
    headerIconSize: 20,
    headerIconClass: 'text-gray-600',
    headerTitleClass: 'text-lg font-bold text-gray-900',
    headerCountClass: 'text-gray-400 font-normal',
    formWrapperClass: 'mb-8 p-4 bg-gray-50/50 rounded-xl border border-gray-100',
    listContainerClass: '',
    listClass: 'divide-y divide-gray-100',
    item: {
      indentClass: 'ml-6 pl-4 border-l-2 border-gray-100',
      rowClass: 'group py-4',
      headerClass: 'flex items-center gap-3 mb-2',
      avatarClass: 'w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-medium shadow-sm',
      nameClass: 'font-medium text-gray-900 text-sm',
      timeClass: 'text-gray-400 text-xs ml-2',
      contentClass: 'text-gray-700 text-sm leading-relaxed pl-11 whitespace-pre-wrap break-words',
      actionsClass: 'pl-11 mt-2 flex items-center gap-4',
      replyButtonClass: 'flex items-center gap-1 text-xs text-gray-400 hover:text-blue-500 transition-colors cursor-pointer',
      replyIconSize: 14,
      toggleButtonClass: 'flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors cursor-pointer',
      toggleIconSize: 14,
      toggleText: (showReplies, count) => (showReplies ? '收起' : `展开 ${count} 条回复`),
    },
    form: {
      formClass: 'space-y-4',
      replyInfoClass: 'flex items-center gap-2 text-sm text-gray-500',
      replyNameClass: 'font-medium text-gray-700',
      replyCancelClass: 'text-gray-400 hover:text-gray-600 ml-2 cursor-pointer',
      replyIconSize: 14,
      userIconSize: 16,
      rowClass: 'flex gap-3',
      fieldGroupClass: 'flex-1 space-y-3',
      avatarClass: 'w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 flex-shrink-0',
      inputClass: 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white',
      textareaClass: 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none bg-white',
      errorClass: 'text-red-500 text-xs',
      counterClass: 'text-xs text-gray-400',
      submitButtonClass: 'flex items-center gap-2 px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer',
      submitIconSize: 14,
      submitTextIdle: '发表',
      submitTextLoading: '提交中...',
      submitSpinner: <span className="animate-spin">⏳</span>,
    },
    loading: {
      containerClass: 'text-center py-12 text-gray-400',
      spinnerClass: 'animate-spin inline-block w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full mb-2',
      textClass: 'text-sm',
    },
    empty: {
      containerClass: 'text-center py-12 text-gray-400',
      iconSize: 32,
      iconClass: 'mx-auto mb-2 opacity-50',
      textClass: 'text-sm',
    },
  },
  dark: {
    containerClass: 'flex flex-col h-full',
    headerClass: 'flex items-center gap-2 mb-3 px-1',
    headerIconSize: 16,
    headerIconClass: 'text-white/60',
    headerTitleClass: 'text-sm font-medium text-white',
    headerCountClass: 'text-white/40 font-normal',
    formWrapperClass: 'mb-4 p-3 bg-white/5 rounded-xl border border-white/5',
    listContainerClass: 'flex-1 overflow-y-auto scrollbar-hide',
    listClass: 'divide-y divide-white/5',
    item: {
      indentClass: 'ml-4 pl-3 border-l border-white/10',
      rowClass: 'group py-3',
      headerClass: 'flex items-center gap-2 mb-1.5',
      avatarClass: 'w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center text-white text-xs font-medium shadow-sm flex-shrink-0',
      nameClass: 'font-medium text-white text-sm',
      timeClass: 'text-white/40 text-xs ml-2',
      contentClass: 'text-white/80 text-sm leading-relaxed pl-9 whitespace-pre-wrap break-words',
      actionsClass: 'pl-9 mt-1.5 flex items-center gap-3',
      replyButtonClass: 'flex items-center gap-1 text-xs text-white/40 hover:text-blue-400 transition-colors cursor-pointer',
      replyIconSize: 12,
      toggleButtonClass: 'flex items-center gap-1 text-xs text-white/40 hover:text-white/60 transition-colors cursor-pointer',
      toggleIconSize: 12,
      toggleText: (showReplies, count) => (showReplies ? '收起' : `${count} 条回复`),
    },
    form: {
      formClass: 'space-y-3',
      replyInfoClass: 'flex items-center gap-2 text-sm text-white/50',
      replyNameClass: 'font-medium text-white/70',
      replyCancelClass: 'text-white/40 hover:text-white/60 ml-1 cursor-pointer',
      replyIconSize: 12,
      userIconSize: 14,
      rowClass: 'flex gap-2',
      fieldGroupClass: 'flex-1 space-y-2',
      avatarClass: 'w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/40 flex-shrink-0',
      inputClass: 'w-full px-3 py-1.5 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all',
      textareaClass: 'w-full px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all resize-none',
      errorClass: 'text-red-400 text-xs',
      counterClass: 'text-xs text-white/30',
      submitButtonClass: 'flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer',
      submitIconSize: 12,
      submitTextIdle: '发送',
      submitTextLoading: '发送中',
      submitSpinner: <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />,
    },
    loading: {
      containerClass: 'flex flex-col items-center justify-center py-8 text-white/40',
      spinnerClass: 'w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin mb-2',
      textClass: 'text-xs',
    },
    empty: {
      containerClass: 'flex flex-col items-center justify-center py-8 text-white/40',
      iconSize: 24,
      iconClass: 'mb-2 opacity-50',
      textClass: 'text-xs',
    },
  },
};

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

const CommentItem: React.FC<{
  comment: Comment;
  onReply: (parentId: number, nickname: string) => void;
  styles: CommentItemStyles;
  depth?: number;
}> = ({ comment, onReply, styles, depth = 0 }) => {
  const [showReplies, setShowReplies] = useState(true);
  const hasReplies = comment.replies && comment.replies.length > 0;

  return (
    <div className={depth > 0 ? styles.indentClass : ''}>
      <div className={styles.rowClass}>
        {/* 评论头部 */}
        <div className={styles.headerClass}>
          <div className={styles.avatarClass}>
            {comment.nickname.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <span className={styles.nameClass}>{comment.nickname}</span>
            <span className={styles.timeClass}>{formatDate(comment.created_at)}</span>
          </div>
        </div>

        {/* 评论内容 */}
        <div className={styles.contentClass}>{comment.content}</div>

        {/* 操作按钮 */}
        <div className={styles.actionsClass}>
          <button
            onClick={() => onReply(comment.id, comment.nickname)}
            className={styles.replyButtonClass}
          >
            <Reply size={styles.replyIconSize} />
            <span>回复</span>
          </button>

          {hasReplies && (
            <button
              onClick={() => setShowReplies(!showReplies)}
              className={styles.toggleButtonClass}
            >
              {showReplies ? <ChevronUp size={styles.toggleIconSize} /> : <ChevronDown size={styles.toggleIconSize} />}
              <span>{styles.toggleText(showReplies, comment.replies!.length)}</span>
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
              styles={styles}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const CommentForm: React.FC<{
  postId: string;
  parentId: number | null;
  replyTo: string | null;
  onSubmit: (comment: Comment) => void;
  onCancel?: () => void;
  maxContentLength: number;
  styles: CommentFormStyles;
}> = ({ postId, parentId, replyTo, onSubmit, onCancel, maxContentLength, styles }) => {
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
    <form onSubmit={handleSubmit} className={styles.formClass}>
      {replyTo && (
        <div className={styles.replyInfoClass}>
          <Reply size={styles.replyIconSize} />
          <span>
            回复 <span className={styles.replyNameClass}>@{replyTo}</span>
          </span>
          <button
            type="button"
            onClick={onCancel}
            className={styles.replyCancelClass}
          >
            取消
          </button>
        </div>
      )}

      <div className={styles.rowClass}>
        <div className={styles.avatarClass}>
          <User size={styles.userIconSize} />
        </div>

        <div className={styles.fieldGroupClass}>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="昵称"
            maxLength={50}
            className={styles.inputClass}
          />

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={replyTo ? `回复 @${replyTo}...` : '写下你的评论...'}
            rows={3}
            maxLength={maxContentLength}
            className={styles.textareaClass}
          />

          {error && <p className={styles.errorClass}>{error}</p>}

          <div className="flex justify-between items-center">
            <span className={styles.counterClass}>{content.length}/{maxContentLength}</span>
            <button
              type="submit"
              disabled={isSubmitting || !nickname.trim() || !content.trim()}
              className={styles.submitButtonClass}
            >
              {isSubmitting ? styles.submitSpinner : <Send size={styles.submitIconSize} />}
              <span>{isSubmitting ? styles.submitTextLoading : styles.submitTextIdle}</span>
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

const addReply = (comments: Comment[], newComment: Comment): Comment[] => {
  return comments.map((comment) => {
    if (comment.id === newComment.parent_id) {
      return {
        ...comment,
        replies: [...(comment.replies || []), { ...newComment, replies: [] }],
      };
    }
    if (comment.replies && comment.replies.length > 0) {
      return { ...comment, replies: addReply(comment.replies, newComment) };
    }
    return comment;
  });
};

export const CommentSectionBase: React.FC<CommentSectionBaseProps> = ({
  postId,
  variant,
  maxContentLength,
  scrollToForm = false,
  formId,
}) => {
  const styles = STYLES[variant];
  const [comments, setComments] = useState<Comment[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [replyTo, setReplyTo] = useState<{ parentId: number; nickname: string } | null>(null);

  // 获取评论
  const fetchComments = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/comments?postId=${encodeURIComponent(postId)}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch comments');
      }
      setComments(data.comments || []);
      setTotal(data.total || 0);
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
      setComments((prev) => addReply(prev, newComment));
    }
    setTotal((prev) => prev + 1);
    setReplyTo(null);
  };

  // 处理回复按钮点击
  const handleReply = (parentId: number, nickname: string) => {
    setReplyTo({ parentId, nickname });
    if (scrollToForm && formId) {
      document.getElementById(formId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <section className={styles.containerClass}>
      {/* 标题 */}
      <div className={styles.headerClass}>
        <MessageCircle size={styles.headerIconSize} className={styles.headerIconClass} />
        <h2 className={styles.headerTitleClass}>
          评论 {total > 0 && <span className={styles.headerCountClass}>({total})</span>}
        </h2>
      </div>

      {/* 评论表单 */}
      <div id={formId} className={styles.formWrapperClass}>
        <CommentForm
          postId={postId}
          parentId={replyTo?.parentId || null}
          replyTo={replyTo?.nickname || null}
          onSubmit={handleNewComment}
          onCancel={() => setReplyTo(null)}
          maxContentLength={maxContentLength}
          styles={styles.form}
        />
      </div>

      {/* 评论列表 */}
      <div className={styles.listContainerClass}>
        {isLoading ? (
          <div className={styles.loading.containerClass}>
            <div className={styles.loading.spinnerClass} />
            <p className={styles.loading.textClass}>加载评论中...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className={styles.empty.containerClass}>
            <MessageCircle size={styles.empty.iconSize} className={styles.empty.iconClass} />
            <p className={styles.empty.textClass}>暂无评论，来说两句吧～</p>
          </div>
        ) : (
          <div className={styles.listClass}>
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                onReply={handleReply}
                styles={styles.item}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
