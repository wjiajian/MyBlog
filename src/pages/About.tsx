import React from "react";
import {
  Github,
  Mail,
  BookOpen,
  Gamepad2,
  Tv,
  Code,
  Brain,
  Sparkles,
  Target,
  Wrench,
  Heart,
  Send,
} from "lucide-react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import "github-markdown-css/github-markdown-light.css";
import { Header } from "../components/Header";
import { useThemeMode } from "../hooks/useThemeMode";
import { usePageTitle } from "../hooks/usePageTitle";
import { getFrontendPageClass } from "../utils/theme";

// 技能标签数据
const focusAreas = [
  { icon: Code, label: "Python 开发" },
  { icon: Brain, label: "AI 应用" },
  { icon: Sparkles, label: "自动化工具" },
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
  "已识乾坤大，犹怜草木青";

export const About: React.FC = () => {
  const { darkMode } = useThemeMode();
  usePageTitle("关于");

  const theme = {
    page: getFrontendPageClass(darkMode),
    panel: darkMode
      ? "bg-white/5 border-white/10"
      : "bg-white/80 border-gray-200",
    heading: darkMode ? "text-white" : "text-gray-900",
    icon: darkMode ? "text-white/60" : "text-gray-600",
    glow: darkMode ? "bg-white/20" : "bg-gray-300",
    avatarBorder: darkMode ? "border-white/20" : "border-white",
    focusCard: darkMode
      ? "bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:border-white/20"
      : "bg-white border-gray-200 text-gray-700 hover:shadow-md hover:border-gray-300",
    focusIcon: darkMode ? "text-white/60" : "text-gray-500",
    techBadge: darkMode
      ? "bg-white/10 text-white/80 hover:bg-white/15"
      : "bg-gray-100 text-gray-700 hover:bg-gray-200",
    interestLink: darkMode
      ? "bg-white/5 hover:bg-white/10 hover:shadow-sm"
      : "bg-gray-50 hover:bg-gray-100 hover:shadow-sm",
    interestLinkIcon: darkMode
      ? "text-white/70 group-hover:text-white"
      : "text-gray-600 group-hover:text-blue-600",
    interestLinkText: darkMode
      ? "text-white/80 group-hover:text-white"
      : "text-gray-700 group-hover:text-gray-900",
    interestStatic: darkMode ? "bg-white/5" : "bg-gray-50",
    interestStaticIcon: darkMode ? "text-white/60" : "text-gray-600",
    interestStaticText: darkMode ? "text-white/75" : "text-gray-700",
    emailCard: darkMode
      ? "bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:border-white/20"
      : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300",
    emailIcon: darkMode ? "text-white/60" : "text-gray-600",
    emailSubtext: darkMode
      ? "text-white/50 group-hover:text-white/70"
      : "text-gray-500 group-hover:text-gray-600",
    quote: darkMode ? "text-white/50" : "text-gray-500",
    quoteMark: darkMode ? "text-white/25" : "text-gray-300",
  };

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
    <div className={`min-h-screen ${theme.page}`}>
      <div className={`fixed inset-0 pointer-events-none z-0 ${darkMode ? "" : "bg-editions-gradient"}`} />

      <div className="relative z-10">
        <Header />

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
                  className={`absolute inset-0 rounded-full blur-xl opacity-40 ${theme.glow}`}
                  animate={{
                    scale: [1, 1.05, 1],
                    opacity: [0.3, 0.5, 0.3],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                {/* 主头像 */}
                <img 
                  src="/resources/touxiang.jpg" 
                  alt="JiaJian's Avatar"
                  className={`relative w-full h-full rounded-full object-cover shadow-lg border-4 ${theme.avatarBorder}`}
                />
              </div>

              {/* 名字 */}
              <motion.h1
                variants={itemVariants}
                className={`text-3xl font-bold mb-2 ${theme.heading}`}
              >
                Hi！这里是 JiaJian
              </motion.h1>
            </motion.div>

            {/* 简介卡片 */}
            <motion.div
              variants={itemVariants}
              className={`backdrop-blur-md rounded-2xl border shadow-sm p-8 mb-8 ${theme.panel}`}
            >
              <article className={`markdown-body !bg-transparent !font-sans ${darkMode ? "dark-markdown" : ""}`}>
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
              className={`backdrop-blur-md rounded-2xl border shadow-sm p-6 mb-8 ${theme.panel}`}
            >
              <h2 className={`text-lg font-bold mb-4 flex items-center gap-2 ${theme.heading}`}>
                <Target size={20} className={theme.icon} /> 专注领域
              </h2>
              <div className="flex flex-wrap gap-3">
                {focusAreas.map((area, index) => (
                  <motion.div
                    key={area.label}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border shadow-sm transition-all cursor-default ${theme.focusCard}`}
                  >
                    <area.icon size={18} className={theme.focusIcon} />
                    <span className="font-medium text-sm">{area.label}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* 技术栈 */}
            <motion.div
              variants={itemVariants}
              className={`backdrop-blur-md rounded-2xl border shadow-sm p-6 mb-8 ${theme.panel}`}
            >
              <h2 className={`text-lg font-bold mb-4 flex items-center gap-2 ${theme.heading}`}>
                <Wrench size={20} className={theme.icon} /> 技术栈
              </h2>
              <div className="flex flex-wrap gap-2">
                {techStack.map((tech, index) => (
                  <motion.span
                    key={tech}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.05 }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-mono transition-colors cursor-default ${theme.techBadge}`}
                  >
                    {tech}
                  </motion.span>
                ))}
              </div>
            </motion.div>

            {/* 兴趣爱好 */}
            <motion.div
              variants={itemVariants}
              className={`backdrop-blur-md rounded-2xl border shadow-sm p-6 mb-8 ${theme.panel}`}
            >
              <h2 className={`text-lg font-bold mb-4 flex items-center gap-2 ${theme.heading}`}>
                <Heart size={20} className={theme.icon} /> 兴趣爱好
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
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all cursor-pointer group ${theme.interestLink}`}
                      >
                        <interest.icon
                          size={24}
                          className={`transition-colors ${theme.interestLinkIcon}`}
                        />
                        <span className={`text-sm ${theme.interestLinkText}`}>
                          {interest.label}
                        </span>
                      </a>
                    ) : (
                      <div className={`flex flex-col items-center gap-2 p-4 rounded-xl cursor-default ${theme.interestStatic}`}>
                        <interest.icon size={24} className={theme.interestStaticIcon} />
                        <span className={`text-sm ${theme.interestStaticText}`}>
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
              className={`backdrop-blur-md rounded-2xl border shadow-sm p-6 mb-8 ${theme.panel}`}
            >
              <h2 className={`text-lg font-bold mb-4 flex items-center gap-2 ${theme.heading}`}>
                <Send size={20} className={theme.icon} /> 联系方式
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
                  className={`flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer group ${theme.emailCard}`}
                >
                  <Mail size={20} className={theme.emailIcon} />
                  <div>
                    <div className="font-medium text-sm">Email</div>
                    <div className={`text-xs ${theme.emailSubtext}`}>
                      jiajian2233@gmail.com
                    </div>
                  </div>
                </a>
              </div>
            </motion.div>

            {/* 底部引用 */}
            <motion.div variants={itemVariants} className="text-center">
              <div className="inline-block relative">
                <span className={`absolute -left-4 -top-2 text-4xl font-serif ${theme.quoteMark}`}>
                  "
                </span>
                <p className={`italic text-sm px-6 ${theme.quote}`}>{quoteText}</p>
                <span className={`absolute -right-4 -bottom-2 text-4xl font-serif ${theme.quoteMark}`}>
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
