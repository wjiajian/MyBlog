import React from 'react';

import { CommentSectionBase } from './CommentSectionBase';

interface PhotoCommentSectionProps {
  photoId: string;
}

export const PhotoCommentSection: React.FC<PhotoCommentSectionProps> = ({ photoId }) => {
  return (
    <CommentSectionBase
      postId={`photo:${photoId}`}
      variant="dark"
      maxContentLength={500}
    />
  );
};
