import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { searchMovies, getMovieById, getGenres } from './client';
import { ApiError, ValidationError } from './errors';
import { _resetTokenCache, _setTokenCache } from './token';

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _resetTokenCache();
    // Set a valid token to avoid token fetch calls
    _setTokenCache('test-token', Date.now() + 60 * 60 * 1000);
  });

  afterEach(() => {
    _resetTokenCache();
  });

  describe('searchMovies', () => {
    it('fetches movies with default params', async () => {
      const mockResponse = {
        data: [
          { id: '1', title: 'Movie 1', posterUrl: 'https://example.com/1.jpg', rating: 'PG' },
          { id: '2', title: 'Movie 2', posterUrl: null, rating: 'R' },
        ],
        totalPages: 10,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await searchMovies();

      expect(result.results).toHaveLength(2);
      expect(result.totalPages).toBe(10);
      expect(result.currentPage).toBe(1);
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('page=1'), expect.any(Object));
    });

    it('fetches movies with search param', async () => {
      const mockResponse = {
        data: [{ id: '1', title: 'Batman', posterUrl: null, rating: 'PG' }],
        totalPages: 1,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await searchMovies({ search: 'batman' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('search=batman'),
        expect.any(Object)
      );
    });

    it('fetches movies with genre filter', async () => {
      const mockResponse = {
        data: [],
        totalPages: 0,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await searchMovies({ genre: 'Action' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('genre=Action'),
        expect.any(Object)
      );
    });

    it('fetches movies with pagination', async () => {
      const mockResponse = {
        data: [],
        totalPages: 5,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await searchMovies({ page: 3 });

      expect(result.currentPage).toBe(3);
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('page=3'), expect.any(Object));
    });

    it('throws ApiError on non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(searchMovies()).rejects.toThrow(ApiError);
    });

    it('throws ValidationError on invalid response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ invalid: 'response' }),
      });

      await expect(searchMovies()).rejects.toThrow(ValidationError);
    });
  });

  describe('getMovieById', () => {
    it('fetches movie details', async () => {
      const mockResponse = {
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
        genres: [{ id: 'drama', title: 'Drama' }],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await getMovieById('5QMbuAa6H8uMAEbR2agDbe');

      expect(result.id).toBe('5QMbuAa6H8uMAEbR2agDbe');
      expect(result.title).toBe('10 Cloverfield Lane');
      expect(result.durationDisplay).toBe('1h 43m');
      expect(result.ratingDisplay).toBe('7.2/10');
      expect(result.genres).toHaveLength(1);
    });

    it('throws ApiError on 404', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(getMovieById('nonexistent')).rejects.toThrow(ApiError);
    });
  });

  describe('getGenres', () => {
    it('fetches and transforms genres', async () => {
      const mockResponse = {
        data: [
          { id: 'action', title: 'Action' },
          { id: 'comedy', title: 'Comedy' },
          { id: 'drama', title: 'Drama' },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await getGenres();

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ id: 'action', title: 'Action' });
      expect(result[1]).toEqual({ id: 'comedy', title: 'Comedy' });
    });

    it('throws ApiError on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(getGenres()).rejects.toThrow(ApiError);
    });
  });
});
