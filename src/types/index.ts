export interface ImageMetadata {
  filename: string;
  format?: string;
  width: number;
  height: number;
  size: number;
  src: string;
  srcMedium?: string;
  srcTiny?: string;
  videoSrc?: string;
  date?: string;
}

export interface Comment {
  id: number;
  post_id: string;
  parent_id: number | null;
  nickname: string;
  content: string;
  created_at: string;
  replies?: Comment[];
}
