import { Suspense } from 'react';
import { MovieDetailSkeleton } from '@/components/movies/MovieDetail';
import { MovieDetailView } from './MovieDetailView';

interface MoviePageProps {
  params: Promise<{ id: string }>;
}

export default async function MoviePage({ params }: MoviePageProps) {
  const { id } = await params;

  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<MovieDetailSkeleton />}>
        <MovieDetailView id={id} />
      </Suspense>
    </div>
  );
}
