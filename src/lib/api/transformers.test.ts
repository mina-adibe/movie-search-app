import { describe, it, expect } from 'vitest';
import {
  parseDuration,
  formatDuration,
  formatIsoDuration,
  extractYear,
  formatRating,
  transformMovieListItem,
  transformMovieDetail,
  transformMovieSearchResponse,
  transformGenreListItem,
} from './transformers';
import type { MovieListItemDTO, MovieDetailDTO } from './schemas';

describe('parseDuration', () => {
  it('parses hours and minutes', () => {
    expect(parseDuration('PT1H43M')).toBe(103);
  });

  it('parses hours only', () => {
    expect(parseDuration('PT2H')).toBe(120);
  });

  it('parses minutes only', () => {
    expect(parseDuration('PT45M')).toBe(45);
  });

  it('returns null for null input', () => {
    expect(parseDuration(null)).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(parseDuration(undefined)).toBeNull();
  });

  it('returns null for invalid format', () => {
    expect(parseDuration('invalid')).toBeNull();
  });

  it('parses zero duration', () => {
    expect(parseDuration('PT0H0M')).toBe(0);
  });
});

describe('formatDuration', () => {
  it('formats hours and minutes', () => {
    expect(formatDuration(103)).toBe('1h 43m');
  });

  it('formats hours only', () => {
    expect(formatDuration(120)).toBe('2h');
  });

  it('formats minutes only', () => {
    expect(formatDuration(45)).toBe('45m');
  });

  it('returns N/A for null', () => {
    expect(formatDuration(null)).toBe('N/A');
  });

  it('returns N/A for zero', () => {
    expect(formatDuration(0)).toBe('N/A');
  });

  it('returns N/A for negative', () => {
    expect(formatDuration(-10)).toBe('N/A');
  });
});

describe('formatIsoDuration', () => {
  it('formats ISO duration to display string', () => {
    expect(formatIsoDuration('PT1H43M')).toBe('1h 43m');
  });

  it('returns N/A for null', () => {
    expect(formatIsoDuration(null)).toBe('N/A');
  });

  it('returns N/A for undefined', () => {
    expect(formatIsoDuration(undefined)).toBe('N/A');
  });
});

describe('extractYear', () => {
  it('extracts year from date string', () => {
    expect(extractYear('2016-03-11')).toBe(2016);
  });

  it('returns 0 for undefined', () => {
    expect(extractYear(undefined)).toBe(0);
  });

  it('returns 0 for empty string', () => {
    expect(extractYear('')).toBe(0);
  });

  it('returns 0 for invalid date', () => {
    expect(extractYear('invalid')).toBe(0);
  });
});

describe('formatRating', () => {
  it('formats rating with one decimal', () => {
    expect(formatRating(7.2)).toBe('7.2/10');
  });

  it('formats perfect rating', () => {
    expect(formatRating(10)).toBe('10.0/10');
  });

  it('returns N/A for zero', () => {
    expect(formatRating(0)).toBe('N/A');
  });

  it('returns N/A for undefined', () => {
    expect(formatRating(undefined)).toBe('N/A');
  });
});

describe('transformMovieListItem', () => {
  it('transforms complete movie list item', () => {
    const dto = {
      id: '5QMbuAa6H8uMAEbR2agDbe',
      title: '10 Cloverfield Lane',
      posterUrl: 'https://example.com/poster.jpg',
      rating: '14A',
    };

    const result = transformMovieListItem(dto);

    expect(result.id).toBe('5QMbuAa6H8uMAEbR2agDbe');
    expect(result.title).toBe('10 Cloverfield Lane');
    expect(result.posterUrl).toBe('https://example.com/poster.jpg');
    expect(result.rating).toBe('14A');
  });

  it('handles missing posterUrl', () => {
    const dto = {
      id: '123',
      title: 'Test Movie',
      rating: 'PG',
    };

    const result = transformMovieListItem(dto);

    expect(result.posterUrl).toBeNull();
  });

  it('defaults rating to NR', () => {
    const dto = {
      id: '123',
      title: 'Test Movie',
    } as MovieListItemDTO;

    const result = transformMovieListItem(dto);

    expect(result.rating).toBe('NR');
  });
});

describe('transformMovieDetail', () => {
  it('transforms complete movie detail', () => {
    const dto = {
      id: '5QMbuAa6H8uMAEbR2agDbe',
      title: '10 Cloverfield Lane',
      posterUrl: 'https://example.com/poster.jpg',
      rating: '14A',
      summary: 'A young woman is held in an underground bunker...',
      duration: 'PT1H43M',
      directors: ['Dan Trachtenberg'],
      mainActors: ['John Goodman', 'Mary Elizabeth Winstead'],
      datePublished: '2016-03-11',
      ratingValue: 7.2,
      bestRating: 10,
      worstRating: 1,
      writers: ['Josh Campbell'],
      genres: [
        { id: 'drama', title: 'Drama' },
        { id: 'horror', title: 'Horror' },
      ],
    };

    const result = transformMovieDetail(dto);

    expect(result.id).toBe('5QMbuAa6H8uMAEbR2agDbe');
    expect(result.title).toBe('10 Cloverfield Lane');
    expect(result.posterUrl).toBe('https://example.com/poster.jpg');
    expect(result.rating).toBe('14A');
    expect(result.summary).toBe('A young woman is held in an underground bunker...');
    expect(result.durationDisplay).toBe('1h 43m');
    expect(result.directors).toEqual(['Dan Trachtenberg']);
    expect(result.mainActors).toEqual(['John Goodman', 'Mary Elizabeth Winstead']);
    expect(result.releaseYear).toBe(2016);
    expect(result.ratingValue).toBe(7.2);
    expect(result.ratingDisplay).toBe('7.2/10');
    expect(result.genres).toHaveLength(2);
    expect(result.genreNames).toBe('Drama, Horror');
  });

  it('handles minimal movie detail', () => {
    const dto = {
      id: '123',
      title: 'Test Movie',
    } as MovieDetailDTO;

    const result = transformMovieDetail(dto);

    expect(result.id).toBe('123');
    expect(result.title).toBe('Test Movie');
    expect(result.summary).toBe('No summary available.');
    expect(result.posterUrl).toBeNull();
    expect(result.durationDisplay).toBe('N/A');
    expect(result.directors).toEqual([]);
    expect(result.genres).toEqual([]);
    expect(result.genreNames).toBe('Unknown');
    expect(result.releaseYear).toBe(0);
    expect(result.ratingDisplay).toBe('N/A');
  });
});

describe('transformMovieSearchResponse', () => {
  it('transforms search response', () => {
    const dto = {
      data: [
        { id: '1', title: 'Movie 1', posterUrl: 'https://example.com/1.jpg', rating: 'PG' },
        { id: '2', title: 'Movie 2', posterUrl: null, rating: 'R' },
      ],
      totalPages: 10,
    };

    const result = transformMovieSearchResponse(dto, 2);

    expect(result.results).toHaveLength(2);
    expect(result.results[0].id).toBe('1');
    expect(result.results[1].posterUrl).toBeNull();
    expect(result.totalPages).toBe(10);
    expect(result.currentPage).toBe(2);
  });

  it('uses default page 1', () => {
    const dto = {
      data: [],
      totalPages: 0,
    };

    const result = transformMovieSearchResponse(dto);

    expect(result.currentPage).toBe(1);
  });
});

describe('transformGenreListItem', () => {
  it('transforms genre list item', () => {
    const dto = {
      id: 'action',
      title: 'Action',
      movies: [{ id: '1' }, { id: '2' }],
    };

    const result = transformGenreListItem(dto);

    expect(result.id).toBe('action');
    expect(result.title).toBe('Action');
  });
});
