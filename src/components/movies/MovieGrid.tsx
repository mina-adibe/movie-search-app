import { MovieCard } from './MovieCard';
import { cn } from '@/lib/utils';
import type { MovieListItem } from '@/types/movie';

interface MovieGridProps {
  movies: MovieListItem[];
  className?: string;
}

export function MovieGrid({ movies, className }: MovieGridProps) {
  if (movies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-lg font-medium text-muted-foreground">No movies found</p>
        <p className="mt-1 text-sm text-muted-foreground">Try adjusting your search criteria</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5',
        className
      )}
    >
      {movies.map((movie) => (
        <MovieCard key={movie.id} movie={movie} />
      ))}
    </div>
  );
}
