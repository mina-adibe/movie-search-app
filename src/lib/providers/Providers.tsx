'use client';

import type { ReactNode } from 'react';
import { QueryProvider } from './QueryProvider';
import { ThemeProvider } from './ThemeProvider';
import { NuqsProvider } from './NuqsProvider';
import { Toaster } from 'sonner';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryProvider>
      <ThemeProvider defaultTheme="system">
        <NuqsProvider>
          {children}
          <Toaster position="bottom-right" richColors closeButton />
        </NuqsProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}
