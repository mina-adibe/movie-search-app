'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import type { MovieSearchParams, MovieSearchResponse } from '@/types/movie';

async function searchMovies(params: MovieSearchParams): Promise<MovieSearchResponse> {
  const searchParams = new URLSearchParams();

  if (params.search) {
    searchParams.set('search', params.search);
  }
  if (params.genre) {
    searchParams.set('genre', params.genre);
  }
  if (params.page) {
    searchParams.set('page', params.page.toString());
  }
  if (params.limit) {
    searchParams.set('limit', params.limit.toString());
  }

  const response = await fetch(`/api/movies?${searchParams.toString()}`);

  if (!response.ok) {
    throw new Error('Failed to fetch movies');
  }

  return response.json();
}

export function useMovieSearch(params: MovieSearchParams) {
  return useQuery({
    queryKey: ['movies', params],
    queryFn: () => searchMovies(params),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
