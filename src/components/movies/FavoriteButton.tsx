'use client';

import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useFavorites } from '@/lib/hooks/useFavorites';
import { useMounted } from '@/lib/hooks/useMounted';
import type { MovieListItem, Movie } from '@/types/movie';

interface FavoriteButtonProps {
  movie: MovieListItem | Movie;
  className?: string;
  variant?: 'default' | 'icon';
}

export function FavoriteButton({ movie, className, variant = 'default' }: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const mounted = useMounted();

  const favorite = mounted && isFavorite(movie.id);
  const label = favorite ? 'Remove from favorites' : 'Add to favorites';

  if (variant === 'icon') {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => toggleFavorite(movie)}
        aria-label={label}
        className={cn('h-9 w-9', className)}
      >
        <Heart
          className={cn('h-5 w-5 transition-colors', favorite && 'fill-red-500 text-red-500')}
        />
      </Button>
    );
  }

  return (
    <Button
      variant={favorite ? 'default' : 'outline'}
      onClick={() => toggleFavorite(movie)}
      className={className}
    >
      <Heart className={cn('mr-2 h-4 w-4', favorite && 'fill-current')} />
      {favorite ? 'Remove from Favorites' : 'Add to Favorites'}
    </Button>
  );
}
