import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import 'github-markdown-css/github-markdown-dark.css';
import { posts } from '../data/posts';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export const BlogPost: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const post = posts.find(p => p.id === id);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Post not found</h1>
          <Link to="/" className="text-gray-400 hover:text-white transition-colors underline">Return Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-20 selection:bg-white/20">
      {/* Header Image with Title */}
      <div className="relative h-[60vh] w-full overflow-hidden">
        <img 
          src={post.coverImage} 
          alt={post.title} 
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black" />
        
        <div className="absolute inset-0 flex flex-col justify-center items-center px-4 mt-10">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-bold text-white text-center max-w-5xl leading-tight mb-6 tracking-tighter"
          >
            {post.title}
          </motion.h1>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex gap-4 text-white/60 font-mono text-sm uppercase tracking-widest border border-white/10 px-4 py-2 rounded-full backdrop-blur-sm"
          >
            <span>{post.date}, {post.year}</span>
          </motion.div>
        </div>

        {/* Back Button */}
        <Link 
          to="/" 
          className="absolute top-8 left-8 text-white bg-white/5 hover:bg-white/10 backdrop-blur-md p-3 rounded-full transition-all border border-white/10 hover:scale-105 z-20 group"
        >
          <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Content */}
      <motion.article 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="max-w-3xl mx-auto -mt-32 relative z-10 bg-[#0a0a0a] border border-white/5 p-8 md:p-16 rounded-t-3xl shadow-2xl min-h-[50vh]"
      >
        <div className="markdown-body !bg-transparent !font-sans !text-gray-300">
          {post.content ? (
            <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
              {post.content}
            </ReactMarkdown>
          ) : (
            <p className="text-gray-600 italic text-center py-10">
              Content placeholder. Add markdown content to posts.ts to see it here.
            </p>
          )}
        </div>
      </motion.article>
    </div>
  );
};
