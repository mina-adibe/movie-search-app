import { fetchWithAuth } from './token';
import {
  MovieSearchResponseDTOSchema,
  MovieDetailDTOSchema,
  GenresResponseDTOSchema,
} from './schemas';
import {
  transformMovieSearchResponse,
  transformMovieDetail,
  transformGenreListItem,
} from './transformers';
import { ENDPOINTS, DEFAULT_PAGE_SIZE, DEFAULT_PAGE } from './endpoints';
import { ApiError, NetworkError, ValidationError } from './errors';
import type { MovieSearchParams, MovieSearchResponse, Movie, Genre } from '@/types/movie';

/**
 * Builds query string from search params
 */
function buildQueryString(params: MovieSearchParams): string {
  const searchParams = new URLSearchParams();

  if (params.search) {
    searchParams.set('search', params.search);
  }
  if (params.genre) {
    searchParams.set('genre', params.genre);
  }
  searchParams.set('page', String(params.page ?? DEFAULT_PAGE));
  searchParams.set('limit', String(params.limit ?? DEFAULT_PAGE_SIZE));

  return searchParams.toString();
}

/**
 * Search movies with optional filters
 */
export async function searchMovies(params: MovieSearchParams = {}): Promise<MovieSearchResponse> {
  const queryString = buildQueryString(params);
  const url = `${ENDPOINTS.MOVIES}?${queryString}`;

  try {
    const response = await fetchWithAuth(url);

    if (!response.ok) {
      throw new ApiError(
        `Failed to fetch movies: ${response.statusText}`,
        response.status,
        response.statusText
      );
    }

    const data = await response.json();
    const parsed = MovieSearchResponseDTOSchema.safeParse(data);

    if (!parsed.success) {
      throw new ValidationError('Invalid movie search response', parsed.error);
    }

    return transformMovieSearchResponse(parsed.data, params.page ?? DEFAULT_PAGE);
  } catch (error) {
    if (error instanceof ApiError || error instanceof ValidationError) {
      throw error;
    }
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new NetworkError();
    }
    throw error;
  }
}

/**
 * Get movie details by ID
 */
export async function getMovieById(id: string): Promise<Movie> {
  const url = ENDPOINTS.MOVIE_DETAIL(id);

  try {
    const response = await fetchWithAuth(url);

    if (!response.ok) {
      throw new ApiError(
        `Failed to fetch movie: ${response.statusText}`,
        response.status,
        response.statusText
      );
    }

    const data = await response.json();
    const parsed = MovieDetailDTOSchema.safeParse(data);

    if (!parsed.success) {
      throw new ValidationError('Invalid movie detail response', parsed.error);
    }

    return transformMovieDetail(parsed.data);
  } catch (error) {
    if (error instanceof ApiError || error instanceof ValidationError) {
      throw error;
    }
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new NetworkError();
    }
    throw error;
  }
}

/**
 * Get all genres
 */
export async function getGenres(): Promise<Genre[]> {
  try {
    const response = await fetchWithAuth(ENDPOINTS.GENRES);

    if (!response.ok) {
      throw new ApiError(
        `Failed to fetch genres: ${response.statusText}`,
        response.status,
        response.statusText
      );
    }

    const data = await response.json();
    const parsed = GenresResponseDTOSchema.safeParse(data);

    if (!parsed.success) {
      throw new ValidationError('Invalid genres response', parsed.error);
    }

    return parsed.data.data.map(transformGenreListItem);
  } catch (error) {
    if (error instanceof ApiError || error instanceof ValidationError) {
      throw error;
    }
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new NetworkError();
    }
    throw error;
  }
}
