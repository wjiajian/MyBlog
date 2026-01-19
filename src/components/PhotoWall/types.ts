export interface PhotoItem {
  src: string;           // Full resolution (original)
  srcMedium?: string;    // Medium thumbnail (400px) for grid
  srcTiny?: string;      // Tiny thumbnail (50px) for list
  alt: string;
  filename: string;
  format?: string;
  width?: number;
  height?: number;
  size?: number; // bytes
  videoSrc?: string; // Live Photo 视频源
  date?: string; // EXIF Shooting Date
}
