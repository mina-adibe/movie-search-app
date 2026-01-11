import type {
  MovieDetailDTO,
  MovieListItemDTO,
  MovieSearchResponseDTO,
  GenreListItemDTO,
} from './schemas';
import type { Movie, MovieListItem, MovieSearchResponse, Genre } from '@/types/movie';

/**
 * Parses ISO 8601 duration (e.g., "PT1H43M") to minutes
 */
export function parseDuration(isoDuration: string | null | undefined): number | null {
  if (!isoDuration) return null;

  // Match hours and minutes from ISO duration format
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return null;

  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);

  return hours * 60 + minutes;
}

/**
 * Formats minutes to display string (e.g., "1h 43m")
 */
export function formatDuration(minutes: number | null): string {
  if (minutes === null || minutes <= 0) return 'N/A';

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

/**
 * Formats ISO duration directly to display string
 */
export function formatIsoDuration(isoDuration: string | null | undefined): string {
  const minutes = parseDuration(isoDuration);
  return formatDuration(minutes);
}

/**
 * Extracts year from date string
 */
export function extractYear(dateString: string | undefined): number {
  if (!dateString) return 0;
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? 0 : date.getFullYear();
}

/**
 * Formats rating value to display string
 */
export function formatRating(value: number | undefined): string {
  if (value === undefined || value === 0) return 'N/A';
  return `${value.toFixed(1)}/10`;
}

/**
 * Transforms a movie list item DTO to domain model
 */
export function transformMovieListItem(dto: MovieListItemDTO): MovieListItem {
  return {
    id: dto.id,
    title: dto.title,
    posterUrl: dto.posterUrl ?? null,
    rating: dto.rating ?? 'NR',
  };
}

/**
 * Transforms a full movie detail DTO to domain model
 */
export function transformMovieDetail(dto: MovieDetailDTO): Movie {
  const genres: Genre[] = (dto.genres ?? []).map((g) => ({
    id: g.id,
    title: g.title,
  }));

  return {
    id: dto.id,
    title: dto.title,
    summary: dto.summary ?? 'No summary available.',
    genres,
    genreNames: genres.map((g) => g.title).join(', ') || 'Unknown',
    posterUrl: dto.posterUrl ?? null,
    datePublished: dto.datePublished ?? '',
    releaseYear: extractYear(dto.datePublished),
    rating: dto.rating ?? 'NR',
    ratingValue: dto.ratingValue ?? 0,
    ratingDisplay: formatRating(dto.ratingValue),
    duration: dto.duration ?? null,
    durationDisplay: formatIsoDuration(dto.duration),
    directors: dto.directors ?? [],
    mainActors: dto.mainActors ?? [],
    writers: dto.writers ?? [],
  };
}

/**
 * Transforms search response DTO to domain model
 */
export function transformMovieSearchResponse(
  dto: MovieSearchResponseDTO,
  currentPage: number = 1
): MovieSearchResponse {
  return {
    results: dto.data.map(transformMovieListItem),
    totalPages: dto.totalPages,
    currentPage,
  };
}

/**
 * Transforms genre list item to simple genre
 */
export function transformGenreListItem(dto: GenreListItemDTO): Genre {
  return {
    id: dto.id,
    title: dto.title,
  };
}
