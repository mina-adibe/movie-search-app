'use client';

import { useQuery } from '@tanstack/react-query';
import type { Genre } from '@/types/movie';

interface GenreResponse {
  id: string;
  title: string;
}

async function fetchGenres(): Promise<Genre[]> {
  const response = await fetch('/api/genres');

  if (!response.ok) {
    throw new Error('Failed to fetch genres');
  }

  const data = await response.json();
  return data.map((g: GenreResponse) => ({
    id: g.id,
    title: g.title,
  }));
}

export function useGenres() {
  return useQuery({
    queryKey: ['genres'],
    queryFn: fetchGenres,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}
