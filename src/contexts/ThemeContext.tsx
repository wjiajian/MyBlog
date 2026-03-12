import React, { useCallback, useEffect, useState } from 'react';
import { safeGetItem, safeSetItem } from '../utils/storage';
import { ThemeContext } from './theme-context';

const THEME_STORAGE_KEY = 'blog-theme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = safeGetItem(THEME_STORAGE_KEY);
    return saved === 'dark';
  });

  useEffect(() => {
    safeSetItem(THEME_STORAGE_KEY, darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => !prev);
  }, []);

  return (
    <ThemeContext.Provider value={{ darkMode, setDarkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};
