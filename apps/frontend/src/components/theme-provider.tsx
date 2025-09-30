import { ReactNode, useEffect, useState } from 'react';

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: string;
  storageKey?: string;
}

function ThemeProvider({
  children,
  defaultTheme = 'light',
  storageKey = 'app-theme',
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<string>(defaultTheme);
  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) setTheme(stored);
  }, [storageKey]);
  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    localStorage.setItem(storageKey, theme);
  }, [theme, storageKey]);
  return <>{children}</>;
}

export { ThemeProvider };
