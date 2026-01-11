'use client';

import Link from 'next/link';
import { Film, Heart } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { Badge } from '@/components/ui/badge';
import { useMounted } from '@/lib/hooks';

interface HeaderProps {
  favoritesCount?: number;
}

export function Header({ favoritesCount = 0 }: HeaderProps) {
  const mounted = useMounted();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Film className="h-6 w-6" />
          <span className="hidden sm:inline">Buffalo Movie Search</span>
          <span className="sm:hidden">Movies</span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-4">
          <Link
            href="/"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Home
          </Link>
          <Link
            href="/favorites"
            className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            <Heart className="h-4 w-4" />
            <span>Favorites</span>
            {mounted && favoritesCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5 text-xs">
                {favoritesCount}
              </Badge>
            )}
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
