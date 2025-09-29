import React from 'react';
import { AppRoutes } from '../routes';
import { RetroModeSwitcher } from '@/components/ui/retro-mode-switcher';
import { ThemeProvider } from '@/components/theme-provider';
import { Card } from '@/components/ui/8bit/card';

export function App(): React.ReactElement {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <div className="sm:mx-4 h-screen lg:m-auto lg:w-5/6">
        <Card className="flex flex-row-reverse">
          <div className="mr-4">
            <RetroModeSwitcher />
          </div>
        </Card>
        <AppRoutes />
      </div>
    </ThemeProvider>
  );
}
