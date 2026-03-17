import React from 'react';
import { motion } from 'framer-motion';
import { Header } from '../components/Header';
import { useThemeMode } from '../hooks/useThemeMode';
import { usePageTitle } from '../hooks/usePageTitle';
import { getFrontendPageClass } from '../utils/theme';

export const MessagePage: React.FC = () => {
  const { darkMode } = useThemeMode();
  usePageTitle('写留言');

  const theme = {
    page: getFrontendPageClass(darkMode),
    subtitle: darkMode ? 'text-white/50' : 'text-gray-500',
    panel: darkMode ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200',
    title: darkMode ? 'text-white/90' : 'text-gray-900',
    text: darkMode ? 'text-white/70' : 'text-gray-600',
    muted: darkMode ? 'text-white/40' : 'text-gray-400',
    fakeInput: darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200',
    badge: darkMode ? 'bg-white/10 text-white/80' : 'bg-gray-100 text-gray-700',
  };

  return (
    <div className={`min-h-screen ${theme.page}`}>
      <div className={`fixed inset-0 pointer-events-none z-0 ${darkMode ? '' : 'bg-editions-gradient'}`} />

      <div className="relative z-10">
        <Header />

        <main className="pt-32 pb-20 px-6 max-w-3xl mx-auto">
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className={`rounded-2xl border backdrop-blur-md shadow-sm p-7 sm:p-9 ${theme.panel}`}
          >
            <h1 className={`text-3xl sm:text-4xl font-bold tracking-tight ${theme.title}`}>写留言</h1>
            <p className={`mt-3 text-sm sm:text-base leading-relaxed ${theme.subtitle}`}>
              这个页面是留言系统的占位模板，后续会接入真实提交与展示功能。
            </p>

            <div className="mt-7 space-y-4">
              <div className={`rounded-xl border px-4 py-3 text-sm ${theme.fakeInput}`}>
                <span className={theme.muted}>昵称</span>
              </div>
              <div className={`rounded-xl border px-4 py-3 text-sm ${theme.fakeInput}`}>
                <span className={theme.muted}>联系方式（可选）</span>
              </div>
              <div className={`rounded-xl border px-4 py-5 text-sm min-h-[120px] ${theme.fakeInput}`}>
                <span className={theme.muted}>留言内容</span>
              </div>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${theme.badge}`}>
                Template
              </span>
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${theme.badge}`}>
                Coming Soon
              </span>
            </div>

            <p className={`mt-6 text-xs sm:text-sm leading-relaxed ${theme.text}`}>
              计划补充：留言审核、反垃圾校验、分页展示、管理员回复。
            </p>
          </motion.section>
        </main>
      </div>
    </div>
  );
};
