import { createContext } from 'react';
import type { Dispatch, SetStateAction } from 'react';

export type ThemeContextValue = {
  darkMode: boolean;
  setDarkMode: Dispatch<SetStateAction<boolean>>;
  toggleDarkMode: () => void;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);
