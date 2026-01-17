import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Github,
  Mail,
  BookOpen,
  Gamepad2,
  Tv,
  Code,
  Brain,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import "github-markdown-css/github-markdown-dark.css";

// 技能标签数据
const focusAreas = [
  { icon: Code, label: "Python 开发", color: "from-blue-500 to-cyan-500" },
  { icon: Brain, label: "AI 应用", color: "from-purple-500 to-pink-500" },
  {
    icon: Sparkles,
    label: "自动化工具",
    color: "from-amber-500 to-orange-500",
  },
];

const techStack = [
  "Python",
  "MySQL",
  "Claude",
  "Gemini",
];

const interests = [
  {
    icon: Gamepad2,
    label: "游戏宅",
    link: "https://github.com/wjiajian/wjiajian/blob/main/GameLife/GameLife.md",
  },
  {
    icon: Tv,
    label: "追剧狂",
    link: "https://github.com/wjiajian/wjiajian/blob/main/FilmeSeriesLife/ScreenLife.md",
  },
  { icon: BookOpen, label: "二次元", link: null },
];

// 简化的 Markdown 内容（移除已在组件中展示的部分）
const simplifiedAboutMd = `
励志成为 **3A** 编程糕手。

什么是 **3A** 编程？**AI** Code，**AI** Review，**AI** Commit。

—— 谦虚、努力。
`;

const quoteText =
  "Everything I've built, written, and learned. Archived in time.";

export const About: React.FC = () => {
  // 动画变体
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

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
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* 头像区域 */}
            <motion.div variants={itemVariants} className="text-center mb-12">
              {/* 带光晕的头像 */}
              <div className="relative w-36 h-36 mx-auto mb-6">
                {/* 光晕动画 */}
                <motion.div
                  className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 blur-xl opacity-60"
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.4, 0.6, 0.4],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                {/* 主头像 */}
                <img 
                  src="/resources/touxiang.jpg" 
                  alt="JiaJian's Avatar"
                  className="relative w-full h-full rounded-full object-cover shadow-lg border-4 border-white"
                />
              </div>

              {/* 名字 */}
              <motion.h1
                variants={itemVariants}
                className="text-3xl font-bold text-gray-900 mb-2"
              >
                Hi！这里是 JiaJian
              </motion.h1>
            </motion.div>

            {/* 简介卡片 */}
            <motion.div
              variants={itemVariants}
              className="bg-white/80 backdrop-blur-md rounded-2xl border border-gray-200 shadow-sm p-8 mb-8"
            >
              <article className="markdown-body !bg-transparent !font-sans">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight, rehypeSlug]}
                >
                  {simplifiedAboutMd}
                </ReactMarkdown>
              </article>
            </motion.div>

            {/* 专注领域 */}
            <motion.div
              variants={itemVariants}
              className="bg-white/80 backdrop-blur-md rounded-2xl border border-gray-200 shadow-sm p-6 mb-8"
            >
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-xl">🎯</span> 专注领域
              </h2>
              <div className="flex flex-wrap gap-3">
                {focusAreas.map((area, index) => (
                  <motion.div
                    key={area.label}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r ${area.color} text-white shadow-sm hover:shadow-md transition-shadow cursor-default`}
                  >
                    <area.icon size={18} />
                    <span className="font-medium text-sm">{area.label}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* 技术栈 */}
            <motion.div
              variants={itemVariants}
              className="bg-white/80 backdrop-blur-md rounded-2xl border border-gray-200 shadow-sm p-6 mb-8"
            >
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-xl">🛠️</span> 技术栈
              </h2>
              <div className="flex flex-wrap gap-2">
                {techStack.map((tech, index) => (
                  <motion.span
                    key={tech}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.05 }}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-mono hover:bg-gray-200 transition-colors cursor-default"
                  >
                    {tech}
                  </motion.span>
                ))}
              </div>
            </motion.div>

            {/* 兴趣爱好 */}
            <motion.div
              variants={itemVariants}
              className="bg-white/80 backdrop-blur-md rounded-2xl border border-gray-200 shadow-sm p-6 mb-8"
            >
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-xl">✨</span> 兴趣爱好
              </h2>
              <div className="grid grid-cols-3 gap-3">
                {interests.map((interest, index) => (
                  <motion.div
                    key={interest.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                  >
                    {interest.link ? (
                      <a
                        href={interest.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 hover:shadow-sm transition-all cursor-pointer group"
                      >
                        <interest.icon
                          size={24}
                          className="text-gray-600 group-hover:text-blue-600 transition-colors"
                        />
                        <span className="text-sm text-gray-700 group-hover:text-gray-900">
                          {interest.label}
                        </span>
                      </a>
                    ) : (
                      <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-50 cursor-default">
                        <interest.icon size={24} className="text-gray-600" />
                        <span className="text-sm text-gray-700">
                          {interest.label}
                        </span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* 联系方式 */}
            <motion.div
              variants={itemVariants}
              className="bg-white/80 backdrop-blur-md rounded-2xl border border-gray-200 shadow-sm p-6 mb-8"
            >
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-xl">📬</span> 联系方式
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a
                  href="https://github.com/wjiajian"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 rounded-xl bg-gray-900 text-white hover:bg-gray-800 transition-colors cursor-pointer group"
                >
                  <Github size={20} />
                  <div>
                    <div className="font-medium text-sm">GitHub</div>
                    <div className="text-xs text-gray-400 group-hover:text-gray-300">
                      @wjiajian
                    </div>
                  </div>
                </a>
                <a
                  href="mailto:jiajian2233@gmail.com"
                  className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all cursor-pointer group"
                >
                  <Mail size={20} />
                  <div>
                    <div className="font-medium text-sm">Email</div>
                    <div className="text-xs text-blue-200 group-hover:text-blue-100">
                      jiajian2233@gmail.com
                    </div>
                  </div>
                </a>
              </div>
            </motion.div>

            {/* 底部引用 */}
            <motion.div variants={itemVariants} className="text-center">
              <div className="inline-block relative">
                <span className="absolute -left-4 -top-2 text-4xl text-blue-200 font-serif">
                  "
                </span>
                <p className="text-gray-500 italic text-sm px-6">{quoteText}</p>
                <span className="absolute -right-4 -bottom-2 text-4xl text-blue-200 font-serif">
                  "
                </span>
              </div>
            </motion.div>
          </motion.div>
        </main>
      </div>
    </div>
  );
};
