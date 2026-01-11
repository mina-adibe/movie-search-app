'use client';

import { useQuery } from '@tanstack/react-query';
import type { Movie } from '@/types/movie';

async function fetchMovieDetail(id: string): Promise<Movie> {
  const response = await fetch(`/api/movies/${id}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Movie not found');
    }
    throw new Error('Failed to fetch movie details');
  }

  return response.json();
}

export function useMovieDetail(id: string) {
  return useQuery({
    queryKey: ['movie', id],
    queryFn: () => fetchMovieDetail(id),
    staleTime: 1000 * 60 * 10, // 10 minutes
    enabled: !!id,
  });
}
