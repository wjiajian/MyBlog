import React from 'react';

import { CommentSectionBase } from './CommentSectionBase';

interface CommentSectionProps {
  postId: string;
}

export const CommentSection: React.FC<CommentSectionProps> = ({ postId }) => {
  return (
    <CommentSectionBase
      postId={postId}
      variant="light"
      maxContentLength={1000}
      formId="comment-form"
      scrollToForm={true}
    />
  );
};
