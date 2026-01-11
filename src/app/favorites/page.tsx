import { Suspense } from 'react';
import { FavoritesView } from './FavoritesView';
import { MovieGridSkeleton } from '@/components/movies';

export default function FavoritesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Your Favorites</h1>
        <p className="mt-2 text-muted-foreground">Movies you&apos;ve saved for later viewing.</p>
      </div>
      <Suspense fallback={<MovieGridSkeleton count={6} />}>
        <FavoritesView />
      </Suspense>
    </div>
  );
}
