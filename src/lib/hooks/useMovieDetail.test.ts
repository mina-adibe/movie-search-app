import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { useMovieDetail } from './useMovieDetail';
import type { Movie } from '@/types/movie';

const mockMovie: Movie = {
  id: '1',
  title: 'Inception',
  summary: 'A mind-bending thriller',
  genres: [{ id: '1', title: 'Sci-Fi' }],
  genreNames: 'Sci-Fi',
  posterUrl: 'https://example.com/poster.jpg',
  datePublished: '2010-07-16',
  releaseYear: 2010,
  rating: 'PG-13',
  ratingValue: 8.8,
  ratingDisplay: '8.8/10',
  duration: 'PT2H28M',
  durationDisplay: '2h 28m',
  directors: ['Christopher Nolan'],
  mainActors: ['Leonardo DiCaprio', 'Marion Cotillard'],
  writers: ['Christopher Nolan'],
};

describe('useMovieDetail', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.restoreAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);

  it('fetches movie details successfully', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockMovie),
    } as Response);

    const { result } = renderHook(() => useMovieDetail('1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockMovie);
    expect(global.fetch).toHaveBeenCalledWith('/api/movies/1');
  });

  it('handles 404 error', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 404,
    } as Response);

    const { result } = renderHook(() => useMovieDetail('999'), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('Movie not found');
  });

  it('handles server error', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);

    const { result } = renderHook(() => useMovieDetail('1'), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('Failed to fetch movie details');
  });

  it('does not fetch when id is empty', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch');

    renderHook(() => useMovieDetail(''), { wrapper });

    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
