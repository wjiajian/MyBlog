import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { Post } from '../data/posts';
import { ArrowUpRight, X } from 'lucide-react';
import clsx from 'clsx';

interface AlbumProps {
  post: Post;
  isExpanded?: boolean;
  onExpand?: () => void;
  onClose?: () => void;
}

export const Album: React.FC<AlbumProps> = ({ 
  post, 
  isExpanded = false, 
  onExpand, 
  onClose,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!isExpanded) setIsFlipped(false);
  }, [isExpanded]);

  const handleContainerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isExpanded) {
      setIsFlipped(!isFlipped);
    } else if (onExpand) {
      onExpand();
    }
  };

  // Dynamic font size calculation based on title length
  const getTitleSize = (expanded: boolean) => {
    if (expanded) return 'text-4xl md:text-6xl';
    return 'text-2xl md:text-3xl';
  };

  return (
    <motion.div 
      layoutId={`album-wrapper-${post.id}`}
      className={clsx(
        "relative perspective-1000 z-10 w-full",
        isExpanded 
          ? "h-auto aspect-[4/3]" // Expanded size ratio
          : "aspect-square cursor-pointer" // Grid Item size ratio
      )}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => !isExpanded && setIsHovered(false)}
      onClick={handleContainerClick}
    >
      <motion.div
        layoutId={`album-container-${post.id}`}
        className="w-full h-full relative preserve-3d"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      >
        {/* === FRONT SIDE === */}
        <div className="absolute w-full h-full backface-hidden shadow-2xl rounded-2xl overflow-hidden bg-[#111] group border border-white/10">
          {/* Cover Image */}
          <div className="absolute inset-0">
             <img 
               src={post.coverImage} 
               alt={post.title} 
               className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-all duration-700 ease-out group-hover:scale-105 transform grayscale-[20%] group-hover:grayscale-0" 
             />
             <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/90" />
          </div>

          {/* Content Wrapper */}
          <div className="absolute inset-0 flex flex-col justify-between p-6 md:p-8">
            <motion.div layoutId={`album-header-${post.id}`} className="flex justify-between items-start">
               <span className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-white/20 text-white/50 text-xs hover:bg-white hover:text-black transition-colors">
                  {post.year.toString().slice(-2)}
               </span>
            </motion.div>
            
            <div className="flex flex-col gap-2">
              <span className="text-white/60 font-mono text-xs uppercase tracking-widest">{post.date}</span>
              <motion.h2 
                layoutId={`album-title-${post.id}`} 
                className={clsx(
                  "font-bold text-white tracking-tighter leading-none",
                  getTitleSize(isExpanded)
                )}
              >
                {post.title}
              </motion.h2>
            </div>
          </div>

          {/* Hover Overlay (Only when NOT expanded) */}
          {!isExpanded && (
            <motion.div 
              className="absolute top-6 right-6"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: isHovered ? 1 : 0, scale: isHovered ? 1 : 0.8 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-white text-black p-3 rounded-full">
                <ArrowUpRight size={20} />
              </div>
            </motion.div>
          )}

           {/* Tap Hint (Only when Expanded) */}
           {isExpanded && !isFlipped && (
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ delay: 0.5 }}
               className="absolute bottom-8 right-8 text-white/50 text-sm font-mono pointer-events-none flex items-center gap-2"
             >
               <span>Flip for details</span> 
               <span className="w-4 h-4 rounded-full border border-white/30" />
             </motion.div>
           )}
        </div>

        {/* === BACK SIDE === */}
        <div 
          className="absolute w-full h-full backface-hidden rotate-y-180 bg-[#111] shadow-2xl rounded-2xl p-8 md:p-12 flex flex-col justify-between border border-white/10"
        >
          <div className="relative z-10">
            <div className="mb-8 pb-4 border-b border-white/10">
              <h3 className="text-3xl md:text-5xl font-bold text-white tracking-tighter">{post.title}</h3>
            </div>

            <p className="text-gray-400 text-lg md:text-xl font-light leading-relaxed max-w-2xl">
              {post.description}
            </p>
          </div>

          <div className="relative z-10 pt-6">
            <button 
              onClick={(e) => { e.stopPropagation(); window.location.href = post.link; }}
              className="group inline-flex items-center gap-3 text-white text-lg font-medium hover:text-gray-300 transition-colors"
            >
              <span className="border-b border-white pb-1 group-hover:border-gray-300">Read the article</span>
              <ArrowUpRight className="group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          
           {/* Decorative Grid on Back */}
           <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:2rem_2rem] pointer-events-none" />
        </div>
      </motion.div>

      {/* Close Button (Only when Expanded) */}
      {isExpanded && (
        <motion.button
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={(e) => { e.stopPropagation(); onClose && onClose(); }}
          className="fixed top-8 right-8 text-white bg-white/10 hover:bg-white/20 p-4 rounded-full backdrop-blur-md transition-colors border border-white/10 z-50 pointer-events-auto"
        >
          <X size={24} />
        </motion.button>
      )}
    </motion.div>
  );
};
