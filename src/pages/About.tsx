import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import aboutMd from '../content/about.md';

export const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#f8f9fa] text-gray-900">
      <div className="fixed inset-0 bg-editions-gradient pointer-events-none z-0" />
      
      <div className="relative z-10">
        {/* 返回按钮 */}
        <div className="fixed top-8 left-8 z-50">
          <Link
            to="/"
            className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-md rounded-xl border border-gray-200 shadow-sm text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
          >
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">返回首页</span>
          </Link>
        </div>

        <main className="pt-32 pb-20 px-6 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* 头像 */}
            <div className="text-center mb-12">
              <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center shadow-lg">
                <span className="text-5xl font-bold text-white">J</span>
              </div>
            </div>

            {/* Markdown 内容 */}
            <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-gray-200 shadow-sm p-8">
              <article className="about-markdown prose prose-gray max-w-none
                prose-headings:text-gray-900 prose-headings:font-semibold
                prose-h1:text-3xl prose-h1:mb-6
                prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4
                prose-p:text-gray-600 prose-p:leading-relaxed
                prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
                prose-strong:text-gray-900
                prose-ul:text-gray-600
                prose-li:text-gray-600
                prose-table:text-sm
                prose-th:bg-gray-100 prose-th:text-gray-700 prose-th:font-medium prose-th:px-4 prose-th:py-2
                prose-td:px-4 prose-td:py-2 prose-td:border-t prose-td:border-gray-200
                prose-blockquote:border-l-4 prose-blockquote:border-blue-400 prose-blockquote:bg-blue-50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:italic prose-blockquote:text-gray-600
                prose-hr:border-gray-200
              ">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {aboutMd}
                </ReactMarkdown>
              </article>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

