import { TokenResponseSchema } from './schemas';

const API_BASE_URL = 'https://0kadddxyh3.execute-api.us-east-1.amazonaws.com';

interface CachedToken {
  value: string;
  expiresAt: number;
}

// In-memory token cache
let cachedToken: CachedToken | null = null;

// Token expiry buffer (5 minutes before actual expiry)
const EXPIRY_BUFFER_MS = 5 * 60 * 1000;

// Assumed token lifetime (55 minutes - conservative estimate)
const TOKEN_LIFETIME_MS = 55 * 60 * 1000;

/**
 * Checks if the cached token is still valid
 */
function isTokenValid(): boolean {
  if (!cachedToken) return false;
  return cachedToken.expiresAt > Date.now() + EXPIRY_BUFFER_MS;
}

/**
 * Fetches a new token from the API
 */
async function fetchNewToken(): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/auth/token`);

  if (!response.ok) {
    throw new Error(`Failed to fetch token: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const parsed = TokenResponseSchema.parse(data);

  // Cache the token with expiry time
  cachedToken = {
    value: parsed.token,
    expiresAt: Date.now() + TOKEN_LIFETIME_MS,
  };

  return parsed.token;
}

/**
 * Gets a valid token, fetching a new one if necessary
 */
export async function getToken(): Promise<string> {
  if (isTokenValid() && cachedToken) {
    return cachedToken.value;
  }

  return fetchNewToken();
}

/**
 * Invalidates the cached token
 */
export function invalidateToken(): void {
  cachedToken = null;
}

/**
 * Makes an authenticated fetch request with automatic token refresh on 401
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const token = await getToken();

  let response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });

  // If 401, token might be expired - refresh and retry ONCE
  if (response.status === 401) {
    invalidateToken();
    const newToken = await getToken();

    response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${newToken}`,
      },
    });
  }

  return response;
}

// For testing purposes
export function _resetTokenCache(): void {
  cachedToken = null;
}

export function _setTokenCache(token: string, expiresAt: number): void {
  cachedToken = { value: token, expiresAt };
}
