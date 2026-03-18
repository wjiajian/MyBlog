import React, { useCallback, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { safeGetItem, safeSetItem } from '../utils/storage';
import { ThemeContext } from './theme-context';

const THEME_STORAGE_KEY = 'blog-theme';
type ViewTransitionDocument = Document & {
  startViewTransition?: (updateCallback: () => void) => { finished: Promise<void> };
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = safeGetItem(THEME_STORAGE_KEY);
    return saved === 'dark';
  });
  const isTransitioningRef = useRef(false);

  useEffect(() => {
    safeSetItem(THEME_STORAGE_KEY, darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const toggleDarkMode = useCallback(() => {
    if (isTransitioningRef.current) {
      return;
    }

    if (typeof window === 'undefined') {
      setDarkMode((prev) => !prev);
      return;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const documentWithTransition = document as ViewTransitionDocument;
    const canUseViewTransition =
      !prefersReducedMotion && typeof documentWithTransition.startViewTransition === 'function';

    if (!canUseViewTransition) {
      setDarkMode((prev) => !prev);
      return;
    }

    isTransitioningRef.current = true;
    try {
      const transition = documentWithTransition.startViewTransition?.(() => {
        flushSync(() => {
          setDarkMode((prev) => !prev);
        });
      });

      if (!transition) {
        isTransitioningRef.current = false;
        setDarkMode((prev) => !prev);
        return;
      }

      transition.finished.finally(() => {
        isTransitioningRef.current = false;
      });
    } catch {
      isTransitioningRef.current = false;
      setDarkMode((prev) => !prev);
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ darkMode, setDarkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};
