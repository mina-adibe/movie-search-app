'use client';

import Link from 'next/link';
import { Heart } from 'lucide-react';
import { MovieGrid } from '@/components/movies';
import { Button } from '@/components/ui/button';
import { useFavorites } from '@/lib/hooks/useFavorites';
import { useMounted } from '@/lib/hooks/useMounted';
import type { MovieListItem } from '@/types/movie';

export function FavoritesView() {
  const { favorites } = useFavorites();
  const mounted = useMounted();

  if (!mounted) {
    return null;
  }

  if (favorites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Heart className="mb-4 h-16 w-16 text-muted-foreground" />
        <p className="text-lg font-medium text-muted-foreground">No favorites yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Start adding movies to your favorites and they&apos;ll appear here.
        </p>
        <Button asChild className="mt-6">
          <Link href="/">Browse Movies</Link>
        </Button>
      </div>
    );
  }

  // Convert FavoriteMovie to MovieListItem for MovieGrid
  const movies: MovieListItem[] = favorites.map((fav) => ({
    id: fav.id,
    title: fav.title,
    posterUrl: fav.posterUrl,
    rating: 'NR', // Rating not stored in favorites
  }));

  return <MovieGrid movies={movies} />;
}
