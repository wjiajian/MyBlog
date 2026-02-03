import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Film, ChevronUp, ChevronDown } from "lucide-react";
import type { PhotoItem } from "./types";
import { PhotoCommentSection } from "../PhotoCommentSection";
import {
  formatFileSize,
  formatResolution,
  formatMegapixels,
} from "../../utils/format";

interface MobileDrawerProps {
  selectedImage: PhotoItem;
  fullDimensions: { w: number; h: number } | null;
  images: PhotoItem[];
  currentIndex: number;
  onNavigate: (index: number) => void;
}

/**
 * 移动端底部抽屉组件
 * 替代桌面端侧边栏，提供更好的移动端体验
 * 支持展开/折叠和手势操作
 */
export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  selectedImage,
  fullDimensions,
  images,
  currentIndex,
  onNavigate,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"info" | "rating">("info");
  const drawerRef = useRef<HTMLDivElement>(null);

  // 折叠态高度
  const COLLAPSED_HEIGHT = 100;
  // 展开态高度（屏幕高度的 60%）
  const EXPANDED_HEIGHT =
    typeof window !== "undefined" ? window.innerHeight * 0.6 : 400;

  // 处理点击展开/折叠
  const handleToggle = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    setIsExpanded((prev) => !prev);
  }, []);

  // 阻止触摸事件冒泡到父组件的滑动处理器
  const handleTouchEvent = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
  }, []);

  // 点击外部关闭展开状态
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        drawerRef.current &&
        !drawerRef.current.contains(event.target as Node)
      ) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isExpanded]);

  return (
    <motion.div
      ref={drawerRef}
      initial={{ y: 0 }}
      animate={{
        height: isExpanded ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT,
      }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-[#1a1a1a] rounded-t-2xl border-t border-white/10 overflow-hidden flex flex-col"
      onTouchStart={handleTouchEvent}
      onTouchMove={handleTouchEvent}
      onTouchEnd={handleTouchEvent}
    >
      {/* 点击手柄 - 上下箭头 */}
      <div
        className="flex justify-center py-2 cursor-pointer"
        onClick={handleToggle}
      >
        {isExpanded ? (
          <ChevronDown size={24} className="text-white/50" />
        ) : (
          <ChevronUp size={24} className="text-white/50" />
        )}
      </div>

      {/* 内容区域 */}
      <div className="px-4 flex-1 overflow-hidden flex flex-col">
        <AnimatePresence mode="wait">
          {!isExpanded ? (
            // 折叠态：简要信息
            <motion.div
              key="collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-between"
            >
              {/* 左侧：缩略图 + 基本信息 */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={
                      selectedImage.srcMedium ||
                      selectedImage.srcTiny ||
                      selectedImage.src
                    }
                    alt={selectedImage.alt}
                    className="w-full h-full object-cover"
                  />
                  {selectedImage.videoSrc && (
                    <div className="absolute top-1 left-1">
                      <Film size={10} className="text-white drop-shadow-lg" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate text-sm">
                    {selectedImage.filename.replace(
                      /\.(jpg|jpeg|png|webp|heic)$/i,
                      "",
                    )}
                  </p>
                  <p className="text-white/50 text-xs">
                    {(
                      selectedImage.format ||
                      selectedImage.filename.split(".").pop()
                    )?.toUpperCase()}{" "}
                    ·{" "}
                    {formatResolution(
                      fullDimensions?.w || selectedImage.width,
                      fullDimensions?.h || selectedImage.height,
                    )}
                  </p>
                </div>
              </div>
              {/* 右侧：照片索引 */}
              <div className="text-white/40 text-xs flex-shrink-0 ml-2">
                {currentIndex + 1} / {images.length}
              </div>
            </motion.div>
          ) : (
            // 展开态：完整信息
            <motion.div
              key="expanded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col flex-1 min-h-0"
            >
              {/* 标签切换 */}
              <div className="flex gap-2 mb-4 flex-shrink-0">
                <button
                  onClick={() => setActiveTab("info")}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors cursor-pointer
                    ${
                      activeTab === "info"
                        ? "bg-white/15 text-white"
                        : "bg-white/5 text-white/50"
                    }`}
                >
                  信息
                </button>
                <button
                  onClick={() => setActiveTab("rating")}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors cursor-pointer
                    ${
                      activeTab === "rating"
                        ? "bg-white/15 text-white"
                        : "bg-white/5 text-white/50"
                    }`}
                >
                  评价
                </button>
              </div>

              {activeTab === "info" ? (
                <div className="flex-1 flex flex-col min-h-0">
                  {/* 基本信息 - 可滚动区域 */}
                  <div className="flex-1 overflow-y-auto min-h-0">
                    <div>
                      <h3 className="text-white/50 text-xs uppercase tracking-wider mb-3">
                        基本信息
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-white/60 text-sm">文件名</span>
                          <span
                            className="text-white text-sm font-medium truncate max-w-[180px]"
                            title={selectedImage.filename}
                          >
                            {selectedImage.filename.replace(
                              /\.(jpg|jpeg|png|webp|heic)$/i,
                              "",
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60 text-sm">格式</span>
                          <span className="text-white text-sm uppercase">
                            {selectedImage.format ||
                              selectedImage.filename.split(".").pop()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60 text-sm">尺寸</span>
                          <span className="text-white text-sm">
                            {formatResolution(
                              fullDimensions?.w || selectedImage.width,
                              fullDimensions?.h || selectedImage.height,
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60 text-sm">
                            文件大小
                          </span>
                          <span className="text-white text-sm">
                            {formatFileSize(selectedImage.size)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60 text-sm">像素</span>
                          <span className="text-white text-sm">
                            {formatMegapixels(
                              fullDimensions?.w || selectedImage.width,
                              fullDimensions?.h || selectedImage.height,
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60 text-sm">
                            拍摄日期
                          </span>
                          <span className="text-white text-sm tabular-nums">
                            {selectedImage.date
                              ? selectedImage.date
                                  .split(" ")[0]
                                  .replace(/:/g, "-")
                              : "-"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* 快速预览 - 固定在底部 */}
                  <div className="flex-shrink-0 pt-3 border-t border-white/10">
                    <h3 className="text-white/50 text-xs uppercase tracking-wider mb-2">
                      快速预览
                    </h3>
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                      {images.map((image, i) => {
                        // 仅渲染当前索引前后 10 张缩略图以提升性能
                        if (Math.abs(i - currentIndex) > 10) return null;

                        const isActive = i === currentIndex;
                        return (
                          <div
                            key={image.src}
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigate(i);
                            }}
                            className={`
                              relative flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden cursor-pointer
                              transition-all duration-200 border-2
                              ${
                                isActive
                                  ? "border-white"
                                  : "border-transparent opacity-60 hover:opacity-100"
                              }
                            `}
                          >
                            <img
                              src={
                                image.srcMedium || image.srcTiny || image.src
                              }
                              alt={image.alt}
                              loading="lazy"
                              className="w-full h-full object-cover"
                            />
                            {image.videoSrc && (
                              <div className="absolute top-1 left-1">
                                <Film
                                  size={8}
                                  className="text-white drop-shadow-lg"
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                /* 评论标签内容 */
                <div className="flex-1 overflow-hidden">
                  <PhotoCommentSection photoId={selectedImage.filename} />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
