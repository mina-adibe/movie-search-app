'use client';

import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import type { FavoriteMovie, MovieListItem, Movie } from '@/types/movie';

const FAVORITES_KEY = 'buffalo-movie-favorites';

export function useFavorites() {
  const [favorites, setFavorites] = useLocalStorage<FavoriteMovie[]>(FAVORITES_KEY, []);

  const addFavorite = useCallback(
    (movie: MovieListItem | Movie) => {
      setFavorites((prev) => {
        if (prev.some((f) => f.id === movie.id)) {
          return prev;
        }
        return [
          ...prev,
          {
            id: movie.id,
            title: movie.title,
            posterUrl: movie.posterUrl,
            addedAt: Date.now(),
          },
        ];
      });
    },
    [setFavorites]
  );

  const removeFavorite = useCallback(
    (movieId: string) => {
      setFavorites((prev) => prev.filter((f) => f.id !== movieId));
    },
    [setFavorites]
  );

  const isFavorite = useCallback(
    (movieId: string) => {
      return favorites.some((f) => f.id === movieId);
    },
    [favorites]
  );

  const toggleFavorite = useCallback(
    (movie: MovieListItem | Movie) => {
      if (isFavorite(movie.id)) {
        removeFavorite(movie.id);
      } else {
        addFavorite(movie);
      }
    },
    [isFavorite, removeFavorite, addFavorite]
  );

  return {
    favorites,
    addFavorite,
    removeFavorite,
    isFavorite,
    toggleFavorite,
    count: favorites.length,
  };
}
