import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFavorites } from './useFavorites';
import type { FavoriteMovie, MovieListItem } from '@/types/movie';

const mockMovie: MovieListItem = {
  id: '1',
  title: 'Inception',
  posterUrl: 'https://example.com/poster.jpg',
  rating: 'PG-13',
};

let mockFavorites: FavoriteMovie[] = [];
const mockSetFavorites = vi.fn(
  (fn: FavoriteMovie[] | ((prev: FavoriteMovie[]) => FavoriteMovie[])) => {
    if (typeof fn === 'function') {
      mockFavorites = fn(mockFavorites);
    } else {
      mockFavorites = fn;
    }
  }
);

vi.mock('./useLocalStorage', () => ({
  useLocalStorage: () => [mockFavorites, mockSetFavorites, vi.fn()],
}));

describe('useFavorites', () => {
  beforeEach(() => {
    mockFavorites = [];
    vi.clearAllMocks();
    vi.spyOn(Date, 'now').mockReturnValue(1000);
  });

  it('starts with empty favorites', () => {
    const { result } = renderHook(() => useFavorites());
    expect(result.current.favorites).toEqual([]);
    expect(result.current.count).toBe(0);
  });

  it('adds a movie to favorites', () => {
    const { result } = renderHook(() => useFavorites());

    act(() => {
      result.current.addFavorite(mockMovie);
    });

    expect(mockSetFavorites).toHaveBeenCalled();
    expect(mockFavorites).toHaveLength(1);
    expect(mockFavorites[0]).toEqual({
      id: '1',
      title: 'Inception',
      posterUrl: 'https://example.com/poster.jpg',
      addedAt: 1000,
    });
  });

  it('does not add duplicate favorites', () => {
    mockFavorites = [
      { id: '1', title: 'Inception', posterUrl: 'https://example.com/poster.jpg', addedAt: 1000 },
    ];

    const { result } = renderHook(() => useFavorites());

    act(() => {
      result.current.addFavorite(mockMovie);
    });

    // Should not add duplicate
    expect(mockFavorites).toHaveLength(1);
  });

  it('removes a movie from favorites', () => {
    mockFavorites = [
      { id: '1', title: 'Inception', posterUrl: 'https://example.com/poster.jpg', addedAt: 1000 },
      { id: '2', title: 'The Matrix', posterUrl: null, addedAt: 1001 },
    ];

    const { result } = renderHook(() => useFavorites());

    act(() => {
      result.current.removeFavorite('1');
    });

    expect(mockFavorites).toHaveLength(1);
    expect(mockFavorites[0].id).toBe('2');
  });

  it('checks if a movie is a favorite', () => {
    mockFavorites = [
      { id: '1', title: 'Inception', posterUrl: 'https://example.com/poster.jpg', addedAt: 1000 },
    ];

    const { result } = renderHook(() => useFavorites());

    expect(result.current.isFavorite('1')).toBe(true);
    expect(result.current.isFavorite('2')).toBe(false);
  });

  it('toggles favorite status - adds when not favorite', () => {
    mockFavorites = [];

    const { result } = renderHook(() => useFavorites());

    act(() => {
      result.current.toggleFavorite(mockMovie);
    });

    expect(mockFavorites).toHaveLength(1);
    expect(mockFavorites[0].id).toBe('1');
  });

  it('toggles favorite status - removes when already favorite', () => {
    mockFavorites = [
      { id: '1', title: 'Inception', posterUrl: 'https://example.com/poster.jpg', addedAt: 1000 },
    ];

    const { result } = renderHook(() => useFavorites());

    act(() => {
      result.current.toggleFavorite(mockMovie);
    });

    expect(mockFavorites).toHaveLength(0);
  });

  it('returns correct count', () => {
    mockFavorites = [
      { id: '1', title: 'Inception', posterUrl: 'https://example.com/poster.jpg', addedAt: 1000 },
      { id: '2', title: 'The Matrix', posterUrl: null, addedAt: 1001 },
    ];

    const { result } = renderHook(() => useFavorites());

    expect(result.current.count).toBe(2);
  });
});
