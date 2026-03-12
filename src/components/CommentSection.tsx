import React from 'react';

import { CommentSectionBase } from './CommentSectionBase';
import type { CommentVariant } from './CommentSectionBase';

interface CommentSectionProps {
  postId: string;
  variant?: CommentVariant;
}

export const CommentSection: React.FC<CommentSectionProps> = ({ postId, variant = 'light' }) => {
  return (
    <CommentSectionBase
      postId={postId}
      variant={variant}
      maxContentLength={1000}
      formId="comment-form"
      scrollToForm={true}
    />
  );
};
