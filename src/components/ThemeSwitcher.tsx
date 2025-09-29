import React, { useEffect, useState } from 'react';

const THEME_STORAGE_KEY = 'uiThemeMode';

type ThemeMode = 'light' | 'dark';

function getInitialMode(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
  if (stored === 'light' || stored === 'dark') return stored;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
}

export function ThemeSwitcher(): React.ReactElement {
  const [mode, setMode] = useState<ThemeMode>(getInitialMode);

  useEffect(() => {
    document.documentElement.dataset.theme = mode;
    window.localStorage.setItem(THEME_STORAGE_KEY, mode);
  }, [mode]);

  function toggleMode() {
    setMode(current => (current === 'light' ? 'dark' : 'light'));
  }

  const isDark = mode === 'dark';
  return (
    <button type="button" aria-label={isDark ? 'Activate light theme' : 'Activate dark theme'} onClick={toggleMode} className="theme-switcher-button">
      <span className="theme-switcher-icon" data-mode={mode}>{isDark ? '🌙' : '☀️'}</span>
    </button>
  );
}
