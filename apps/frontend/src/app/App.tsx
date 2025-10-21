import React from 'react';
import { AppRoutes } from '../routes';
import { ThemeProvider } from '@/components/theme-provider';
import { Navbar } from '@/components/Navbar';

export function App(): React.ReactElement {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <div className="sm:mx-4 h-screen lg:m-auto lg:w-5/6">
        <Navbar />
        <AppRoutes />
      </div>
    </ThemeProvider>
  );
}
