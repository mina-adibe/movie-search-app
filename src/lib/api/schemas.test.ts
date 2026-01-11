import { describe, it, expect } from 'vitest';
import {
  TokenResponseSchema,
  MovieListItemDTOSchema,
  MovieSearchResponseDTOSchema,
  MovieDetailDTOSchema,
  GenresResponseDTOSchema,
} from './schemas';

describe('TokenResponseSchema', () => {
  it('validates correct token response', () => {
    const validResponse = { token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' };
    expect(() => TokenResponseSchema.parse(validResponse)).not.toThrow();
  });

  it('rejects response without token', () => {
    const invalidResponse = {};
    expect(() => TokenResponseSchema.parse(invalidResponse)).toThrow();
  });
});

describe('MovieListItemDTOSchema', () => {
  it('validates movie with all fields', () => {
    const movie = {
      id: '5QMbuAa6H8uMAEbR2agDbe',
      title: '10 Cloverfield Lane',
      posterUrl: 'https://example.com/poster.jpg',
      rating: '14A',
    };
    const result = MovieListItemDTOSchema.parse(movie);
    expect(result.id).toBe(movie.id);
    expect(result.title).toBe(movie.title);
    expect(result.posterUrl).toBe(movie.posterUrl);
    expect(result.rating).toBe(movie.rating);
  });

  it('validates movie with optional fields missing', () => {
    const movie = {
      id: '123',
      title: 'Test Movie',
    };
    const result = MovieListItemDTOSchema.parse(movie);
    expect(result.id).toBe('123');
    expect(result.title).toBe('Test Movie');
    expect(result.rating).toBe('NR');
  });

  it('handles null posterUrl', () => {
    const movie = {
      id: '123',
      title: 'Test Movie',
      posterUrl: null,
    };
    const result = MovieListItemDTOSchema.parse(movie);
    expect(result.posterUrl).toBeNull();
  });

  it('rejects movie without id', () => {
    const movie = { title: 'Test Movie' };
    expect(() => MovieListItemDTOSchema.parse(movie)).toThrow();
  });

  it('rejects movie without title', () => {
    const movie = { id: '123' };
    expect(() => MovieListItemDTOSchema.parse(movie)).toThrow();
  });
});

describe('MovieSearchResponseDTOSchema', () => {
  it('validates correct search response', () => {
    const response = {
      data: [
        { id: '1', title: 'Movie 1', posterUrl: 'https://example.com/1.jpg', rating: 'PG' },
        { id: '2', title: 'Movie 2', posterUrl: null, rating: 'R' },
      ],
      totalPages: 10,
    };
    const result = MovieSearchResponseDTOSchema.parse(response);
    expect(result.data).toHaveLength(2);
    expect(result.totalPages).toBe(10);
  });

  it('validates empty results', () => {
    const response = {
      data: [],
      totalPages: 0,
    };
    const result = MovieSearchResponseDTOSchema.parse(response);
    expect(result.data).toHaveLength(0);
    expect(result.totalPages).toBe(0);
  });

  it('rejects response without totalPages', () => {
    const response = { data: [] };
    expect(() => MovieSearchResponseDTOSchema.parse(response)).toThrow();
  });
});

describe('MovieDetailDTOSchema', () => {
  it('validates full movie details', () => {
    const movie = {
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
      writers: ['Josh Campbell', 'Matt Stuecken'],
      genres: [
        { id: 'drama', title: 'Drama' },
        { id: 'horror', title: 'Horror' },
      ],
    };
    const result = MovieDetailDTOSchema.parse(movie);
    expect(result.id).toBe(movie.id);
    expect(result.title).toBe(movie.title);
    expect(result.directors).toEqual(movie.directors);
    expect(result.genres).toHaveLength(2);
  });

  it('validates movie with minimal fields', () => {
    const movie = {
      id: '123',
      title: 'Test Movie',
    };
    const result = MovieDetailDTOSchema.parse(movie);
    expect(result.id).toBe('123');
    expect(result.title).toBe('Test Movie');
    expect(result.summary).toBe('No summary available.');
    expect(result.directors).toEqual([]);
    expect(result.genres).toEqual([]);
    expect(result.ratingValue).toBe(0);
  });
});

describe('GenresResponseDTOSchema', () => {
  it('validates genres response', () => {
    const response = {
      data: [
        { id: 'action', title: 'Action' },
        { id: 'comedy', title: 'Comedy' },
      ],
    };
    const result = GenresResponseDTOSchema.parse(response);
    expect(result.data).toHaveLength(2);
    expect(result.data[0].title).toBe('Action');
  });

  it('validates genres with movie references', () => {
    const response = {
      data: [
        {
          id: 'action',
          title: 'Action',
          movies: [{ id: 'movie1' }, { id: 'movie2' }],
        },
      ],
    };
    const result = GenresResponseDTOSchema.parse(response);
    expect(result.data[0].movies).toHaveLength(2);
  });

  it('validates empty genres list', () => {
    const response = { data: [] };
    const result = GenresResponseDTOSchema.parse(response);
    expect(result.data).toHaveLength(0);
  });
});
