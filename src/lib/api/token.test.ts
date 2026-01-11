import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getToken,
  invalidateToken,
  fetchWithAuth,
  _resetTokenCache,
  _setTokenCache,
} from './token';

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('Token Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _resetTokenCache();
  });

  afterEach(() => {
    _resetTokenCache();
  });

  describe('getToken', () => {
    it('fetches a new token when cache is empty', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ token: 'test-token-123' }),
      });

      const token = await getToken();

      expect(token).toBe('test-token-123');
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://0kadddxyh3.execute-api.us-east-1.amazonaws.com/auth/token'
      );
    });

    it('returns cached token when valid', async () => {
      // Set a valid cached token (expires in 10 minutes)
      _setTokenCache('cached-token', Date.now() + 10 * 60 * 1000);

      const token = await getToken();

      expect(token).toBe('cached-token');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('fetches new token when cache is expired', async () => {
      // Set an expired cached token
      _setTokenCache('expired-token', Date.now() - 1000);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ token: 'new-token' }),
      });

      const token = await getToken();

      expect(token).toBe('new-token');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('fetches new token when cache is within expiry buffer', async () => {
      // Set a token that expires in 4 minutes (within 5 min buffer)
      _setTokenCache('soon-expiring-token', Date.now() + 4 * 60 * 1000);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ token: 'refreshed-token' }),
      });

      const token = await getToken();

      expect(token).toBe('refreshed-token');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('throws error when fetch fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(getToken()).rejects.toThrow('Failed to fetch token: 500 Internal Server Error');
    });
  });

  describe('invalidateToken', () => {
    it('clears the cached token', async () => {
      _setTokenCache('token-to-clear', Date.now() + 60 * 60 * 1000);

      invalidateToken();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ token: 'new-token-after-invalidate' }),
      });

      const token = await getToken();

      expect(token).toBe('new-token-after-invalidate');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('fetchWithAuth', () => {
    it('makes authenticated request', async () => {
      _setTokenCache('auth-token', Date.now() + 60 * 60 * 1000);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: 'test' }),
      });

      const response = await fetchWithAuth('https://api.example.com/test');

      expect(response.ok).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/test', {
        headers: {
          Authorization: 'Bearer auth-token',
        },
      });
    });

    it('retries with new token on 401', async () => {
      _setTokenCache('expired-auth-token', Date.now() + 60 * 60 * 1000);

      // First request returns 401
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
        })
        // Token refresh request
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ token: 'refreshed-auth-token' }),
        })
        // Retry request with new token
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
        });

      const response = await fetchWithAuth('https://api.example.com/test');

      expect(response.ok).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(3);

      // Verify the retry was made with the new token
      expect(mockFetch).toHaveBeenLastCalledWith('https://api.example.com/test', {
        headers: {
          Authorization: 'Bearer refreshed-auth-token',
        },
      });
    });

    it('passes through request options', async () => {
      _setTokenCache('auth-token', Date.now() + 60 * 60 * 1000);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

      await fetchWithAuth('https://api.example.com/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: 'test' }),
      });

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer auth-token',
        },
        body: JSON.stringify({ data: 'test' }),
      });
    });
  });
});
