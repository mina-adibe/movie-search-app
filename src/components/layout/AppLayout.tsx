'use client';

import { Header } from './Header';
import { Footer } from './Footer';
import { useFavorites } from '@/lib/hooks/useFavorites';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { count } = useFavorites();

  return (
    <div className="flex min-h-screen flex-col">
      <Header favoritesCount={count} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
