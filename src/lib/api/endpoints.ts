// API endpoint constants
export const API_BASE_URL = 'https://0kadddxyh3.execute-api.us-east-1.amazonaws.com';

export const ENDPOINTS = {
  AUTH_TOKEN: `${API_BASE_URL}/auth/token`,
  MOVIES: `${API_BASE_URL}/movies`,
  MOVIE_DETAIL: (id: string) => `${API_BASE_URL}/movies/${id}`,
  GENRES: `${API_BASE_URL}/genres/movies`,
} as const;

// Default pagination settings
export const DEFAULT_PAGE_SIZE = 25;
export const DEFAULT_PAGE = 1;
