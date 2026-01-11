'use client';

import { MovieDetail, MovieDetailSkeleton } from '@/components/movies/MovieDetail';
import { FavoriteButton } from '@/components/movies/FavoriteButton';
import { useMovieDetail } from '@/lib/hooks/useMovieDetail';

interface MovieDetailViewProps {
  id: string;
}

export function MovieDetailView({ id }: MovieDetailViewProps) {
  const { data: movie, isLoading, error } = useMovieDetail(id);

  if (isLoading) {
    return <MovieDetailSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-lg font-medium text-destructive">
          {error.message || 'Failed to load movie'}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">Please try again later</p>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-lg font-medium text-muted-foreground">Movie not found</p>
      </div>
    );
  }

  return <MovieDetail movie={movie} favoriteButton={<FavoriteButton movie={movie} />} />;
}
