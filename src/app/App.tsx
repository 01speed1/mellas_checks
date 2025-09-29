import React from 'react';
import { AppRoutes } from '../routes';
import { RetroModeSwitcher } from '@/components/ui/retro-mode-switcher';
import { ThemeProvider } from '@/components/theme-provider';

export function App(): React.ReactElement {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <div className="fixed top-2 left-2 z-50">
        <RetroModeSwitcher />
      </div>
      <AppRoutes />
    </ThemeProvider>
  );
}
