import { Suspense } from 'react';
import { SearchResults } from '@/components/search';
import { MovieGridSkeleton } from '@/components/movies';

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Discover Movies</h1>
        <p className="mt-2 text-muted-foreground">
          Search our collection of movies to find your next favorite film.
        </p>
      </div>
      <Suspense fallback={<MovieGridSkeleton />}>
        <SearchResults />
      </Suspense>
    </div>
  );
}
