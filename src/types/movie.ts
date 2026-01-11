// Domain types for the movie search application
// These are the types used throughout the app after DTO transformation

export interface Genre {
  id: string;
  title: string;
}

export interface Movie {
  // Core identifiers
  id: string;
  title: string;

  // Content
  summary: string;
  genres: Genre[];
  genreNames: string; // "Action, Sci-Fi"

  // Media
  posterUrl: string | null;

  // Dates
  datePublished: string; // ISO string
  releaseYear: number; // 2024

  // Ratings
  rating: string; // Content rating like "14A", "PG", "R"
  ratingValue: number; // 0-10 score
  ratingDisplay: string; // "7.8/10"

  // Duration
  duration: string | null; // ISO duration like "PT1H43M"
  durationDisplay: string; // "1h 43m"

  // Credits
  directors: string[];
  mainActors: string[];
  writers: string[];
}

export interface MovieListItem {
  id: string;
  title: string;
  posterUrl: string | null;
  rating: string; // Content rating
}

export interface MovieSearchParams {
  search?: string;
  genre?: string;
  page?: number;
  limit?: number;
}

export interface MovieSearchResponse {
  results: MovieListItem[];
  totalPages: number;
  currentPage: number;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface FavoriteMovie {
  id: string;
  title: string;
  posterUrl: string | null;
  addedAt: number; // timestamp
}
