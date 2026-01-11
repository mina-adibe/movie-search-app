# 🎬 Buffalo Movie Search - Complete Project Plan

> **Project Type:** Take-Home Exercise  
> **Framework:** Next.js 15 (App Router)  
> **Estimated Time:** 5 Days  
> **Deployment:** Vercel

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Technical Decisions & Justifications](#2-technical-decisions--justifications)
3. [Architecture Overview](#3-architecture-overview)
4. [API Documentation](#4-api-documentation)
5. [Type Definitions & Schemas](#5-type-definitions--schemas)
6. [Project Structure](#6-project-structure)
7. [Component Specifications](#7-component-specifications)
8. [Feature Specifications](#8-feature-specifications)
9. [Testing Strategy](#9-testing-strategy)
10. [Implementation Phases](#10-implementation-phases)
11. [DevOps & CI/CD](#11-devops--cicd)
12. [README Template](#12-readme-template)

---

## 1. Executive Summary

### 1.1 Project Overview

Build a movie search application that allows users to:

- Search for movies with paginated results
- Filter search results by genre
- Navigate through paginated results
- View total count of search results
- See detailed information for each movie (summary, poster, duration, rating)

### 1.2 Tech Stack

| Category            | Technology                | Version |
| ------------------- | ------------------------- | ------- |
| Framework           | Next.js (App Router)      | 15.x    |
| Runtime             | React                     | 19.x    |
| Language            | TypeScript                | 5.x     |
| Styling             | Tailwind CSS              | 3.x     |
| UI Components       | shadcn/ui                 | latest  |
| Data Fetching       | TanStack React Query      | 5.x     |
| URL State           | nuqs                      | 2.x     |
| Validation          | Zod                       | 3.x     |
| Testing (Unit)      | Vitest                    | 2.x     |
| Testing (Component) | Testing Library           | 16.x    |
| Testing (E2E)       | Playwright                | 1.x     |
| Mocking             | MSW                       | 2.x     |
| Toast Notifications | Sonner                    | 1.x     |
| Deployment          | Vercel                    | -       |
| CI/CD               | GitHub Actions            | -       |
| Code Quality        | ESLint + Prettier + Husky | -       |

### 1.3 All Decisions Summary

| Decision Area        | Choice                                  |
| -------------------- | --------------------------------------- |
| State Management     | React Query + Server Components         |
| Token Storage        | Server-side memory (API route)          |
| Genre Filter         | Single select                           |
| API Validation       | Zod + DTO transformation                |
| Genres Fetch         | Server Component + 24h cache            |
| Favorites Storage    | Custom hook + localStorage              |
| Search Trigger       | Debounced instant (500ms)               |
| Minimum Search Chars | 2                                       |
| Recent Searches      | 10 items, dropdown on focus             |
| Movie Detail         | Full page (/movie/[id])                 |
| Dark Mode            | System preference, localStorage persist |
| Loading States       | Pulse skeleton, full grid               |
| Pagination           | Traditional (not infinite scroll)       |
| Image Loading        | Next.js Image + blur shimmer            |
| Initial Page State   | Browse Movies (default listing)         |
| Movie Detail URL     | `/movie/[id]`                           |
| Favorites Page       | Separate page (`/favorites`)            |

---

## 2. Technical Decisions & Justifications

### 2.1 Why React Query with Next.js?

#### Bundle Size Trade-off

| Approach      | Bundle Size     | Boilerplate Code |
| ------------- | --------------- | ---------------- |
| React Context | 0 KB (built-in) | ~400-500 lines   |
| React Query   | ~13 KB gzipped  | ~100-150 lines   |

**Decision:** The 13 KB trade-off is justified by:

- 3-4x reduction in code
- Significantly faster development
- Production-ready patterns
- Excellent developer experience

**Philosophy:** Productivity over micro-optimizations. Shipping a well-tested, maintainable app is more valuable than saving 13 KB.

#### Feature Comparison

| Feature                | Manual (Context)         | React Query                  |
| ---------------------- | ------------------------ | ---------------------------- |
| Loading State          | `useState` + manual      | ✅ `isLoading`, `isFetching` |
| Error State            | `try/catch` + `useState` | ✅ `error`, `isError`        |
| Caching                | Manual Map/object        | ✅ Automatic + configurable  |
| Request Deduplication  | Manual tracking          | ✅ Automatic                 |
| Background Refetch     | `setInterval` + logic    | ✅ `refetchOnWindowFocus`    |
| Stale-While-Revalidate | 50+ lines custom         | ✅ `placeholderData`         |
| Retry on Failure       | Manual retry logic       | ✅ `retry: 3`                |
| Prefetching            | Manual fetch + store     | ✅ `prefetchQuery()`         |
| Optimistic Updates     | Manual rollback          | ✅ `onMutate` + rollback     |
| Pagination State       | Manual handling          | ✅ `keepPreviousData`        |
| DevTools               | None                     | ✅ React Query DevTools      |

### 2.2 Why Both Next.js Cache AND React Query?

They serve **different purposes**:

| Cache Type    | Location       | Scope          | Purpose                          |
| ------------- | -------------- | -------------- | -------------------------------- |
| Next.js Cache | Server/CDN     | All users      | Initial load, SEO, shared data   |
| React Query   | Browser memory | Single session | Interactions, instant navigation |

**Usage in this app:**

- **Server-side:** Initial search results, genres list
- **React Query:** Pagination, filter changes, prefetching

### 2.3 Prefetching Strategy

| User Action        | Method                      | Reason                    |
| ------------------ | --------------------------- | ------------------------- |
| Hover "Next Page"  | React Query `prefetchQuery` | Same page, different data |
| Hover genre option | React Query `prefetchQuery` | Same page, different data |
| Hover movie card   | Next.js `<Link prefetch>`   | Different page            |

### 2.4 Why Not XState?

XState is excellent for complex state machines, but for this project:

| Factor      | Analysis                         |
| ----------- | -------------------------------- |
| Complexity  | Search flow is straightforward   |
| Time        | Better spent on testing & polish |
| React Query | Already handles async state well |
| Benefit     | Marginal for this use case       |

**If used:** Would only manage UI state (not data fetching), adding complexity without proportional benefit.

### 2.5 Next.js 15 Breaking Changes & Migration

Next.js 15 introduces several breaking changes from v14. Here's how we handle them:

#### 2.5.1 Async Request APIs

**Breaking Change:** `params` and `searchParams` are now Promises.

```typescript
// ❌ Next.js 14 (OLD - won't work)
export default function MoviePage({ params }: { params: { id: string } }) {
  const id = params.id;
}

// ✅ Next.js 15 (NEW - required)
export default async function MoviePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
}
```

**Our Implementation:**

```typescript
// app/movie/[id]/page.tsx
interface MoviePageProps {
  params: Promise<{ id: string }>;
}

export default async function MoviePage({ params }: MoviePageProps) {
  const { id } = await params;

  // Fetch movie data...
  return <MovieDetails movieId={id} />;
}

// For searchParams in search page
interface SearchPageProps {
  searchParams: Promise<{ search?: string; genre?: string; page?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { search, genre, page } = await searchParams;

  // Use params...
}
```

#### 2.5.2 Caching Defaults Changed

**Breaking Change:** `fetch` requests are no longer cached by default.

```typescript
// ❌ Next.js 14 - cached by default
fetch('https://api.example.com/data');

// ✅ Next.js 15 - must explicitly opt-in to caching
fetch('https://api.example.com/data', { cache: 'force-cache' });

// Or use Next.js cache config
fetch('https://api.example.com/data', {
  next: { revalidate: 3600 }, // Cache for 1 hour
});
```

**Our Implementation:**

```typescript
// For genres (rarely change) - cache for 24 hours
async function getGenres() {
  const response = await fetch(`${API_URL}/api/genres`, {
    next: { revalidate: 86400 },
  });
  return response.json();
}

// For movie search - no cache (real-time results)
async function searchMovies(params: MovieSearchParams) {
  const response = await fetch(`${API_URL}/api/movies?${queryString}`, {
    cache: 'no-store',
  });
  return response.json();
}
```

#### 2.5.3 React 19 Requirement

Next.js 15 requires React 19. Key changes:

| Feature            | Change                                               |
| ------------------ | ---------------------------------------------------- |
| `ref` prop         | Now passed as regular prop, `forwardRef` less needed |
| `use()` hook       | New hook for reading promises/context                |
| Improved hydration | Better error messages                                |

```json
// package.json
{
  "dependencies": {
    "next": "15.1.0",
    "react": "19.0.0",
    "react-dom": "19.0.0"
  }
}
```

#### 2.5.4 Other Breaking Changes

| Change                   | Our Handling                                    |
| ------------------------ | ----------------------------------------------- |
| `runtime` config         | Use `export const runtime = 'nodejs'`           |
| `serverExternalPackages` | Renamed from `serverComponentsExternalPackages` |
| ESLint 9 support         | Updated `.eslintrc` config                      |
| Turbopack stable         | Use `next dev --turbo` for faster dev           |

---

## 3. Architecture Overview

### 3.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         NEXT.JS APP                             │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    SERVER LAYER                          │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │   │
│  │  │   Layout    │  │    Page     │  │   API Routes    │  │   │
│  │  │   (RSC)     │  │   (RSC)     │  │  /api/movies    │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘  │   │
│  │         │                │                  │            │   │
│  │         ▼                ▼                  ▼            │   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │           SERVER-SIDE TOKEN MANAGEMENT           │    │   │
│  │  │  - Token cached in memory                        │    │   │
│  │  │  - Auto-refresh on expiry                        │    │   │
│  │  │  - Never exposed to client                       │    │   │
│  │  └─────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    CLIENT LAYER                          │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │   │
│  │  │  SearchBar  │  │  MovieGrid  │  │   Pagination    │  │   │
│  │  │  (Client)   │  │  (Client)   │  │    (Client)     │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘  │   │
│  │         │                │                  │            │   │
│  │         ▼                ▼                  ▼            │   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │                 REACT QUERY                      │    │   │
│  │  │  - Client-side caching                          │    │   │
│  │  │  - Prefetching on hover                         │    │   │
│  │  │  - keepPreviousData for pagination              │    │   │
│  │  └─────────────────────────────────────────────────┘    │   │
│  │                          │                               │   │
│  │         ┌────────────────┼────────────────┐             │   │
│  │         ▼                ▼                ▼             │   │
│  │  ┌───────────┐   ┌─────────────┐   ┌──────────────┐    │   │
│  │  │   nuqs    │   │ localStorage│   │    Sonner    │    │   │
│  │  │ URL State │   │  Favorites  │   │   Toasts     │    │   │
│  │  └───────────┘   │  Recents    │   └──────────────┘    │   │
│  │                  └─────────────┘                        │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        MOVIES API                               │
│      https://0kadddxyh3.execute-api.us-east-1.amazonaws.com    │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Data Flow

```
User submits search "Batman"
        │
        ▼
┌───────────────────┐
│  Validate Input   │  ◄── Minimum 2 characters
│  (Client)         │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│   nuqs updates    │  ◄── URL: ?search=batman&page=1
│   URL params      │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│   React Query     │  ◄── queryKey: ['movies', { search, page, genre }]
│   useQuery()      │
└─────────┬─────────┘
          │
    Cache hit? ──Yes──► Return cached, show results
          │
         No
          │
          ▼
┌───────────────────┐
│   /api/movies     │  ◄── Internal API route (handles token)
│   (Next.js)       │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│   Get/Refresh     │  ◄── Token cached in server memory
│   Bearer Token    │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│   External API    │  ◄── With Authorization header
│   /movies         │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│   Zod Validation  │  ◄── Validate response shape
│   + DTO Transform │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│   Cache Response  │  ◄── Next.js cache + React Query cache
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│   Update UI       │
│   - Results       │
│   - Pagination    │
│   - Total count   │
│   - Save to recent│
└───────────────────┘
```

### 3.3 Token Management Flow

```
API Request from Client
        │
        ▼
┌───────────────────┐
│  /api/movies      │
│  (API Route)      │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│  Check Token      │
│  in Memory        │
└─────────┬─────────┘
          │
    Valid? ───Yes───► Use existing token ─────┐
          │                                    │
         No                                    │
          │                                    │
          ▼                                    ▼
┌───────────────────┐                ┌───────────────────┐
│  GET /auth/token  │                │  Make API Call    │
│  (External API)   │                │  with Bearer      │
└─────────┬─────────┘                └─────────┬─────────┘
          │                                    │
          ▼                              401 Error?
┌───────────────────┐                         │
│  Cache in Memory  │                   Yes ──┤
│  (with expiry)    │                         │
└─────────┬─────────┘                         ▼
          │                          ┌───────────────────┐
          └──────────────────────────│  Invalidate Token │
                                     │  Retry Once       │
                                     └───────────────────┘
```

#### ⚠️ Serverless Token Caching Limitations

**Important:** In serverless environments (Vercel, AWS Lambda), in-memory caching is **not reliable**:

| Issue              | Impact                      |
| ------------------ | --------------------------- |
| Cold starts        | Memory resets, token lost   |
| Multiple instances | Each instance has own cache |
| Function spin-down | Cache cleared on idle       |

**Mitigation Strategy:**

```typescript
// lib/api/token.ts

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getToken(): Promise<string> {
  // Check if cached token is still valid (with 5 min buffer)
  if (cachedToken && cachedToken.expiresAt > Date.now() + 5 * 60 * 1000) {
    return cachedToken.value;
  }

  // Fetch new token
  const response = await fetch(`${API_BASE_URL}/auth/token`);
  const data = await response.json();

  cachedToken = {
    value: data.token,
    expiresAt: Date.now() + 55 * 60 * 1000, // Assume ~1 hour expiry, refresh at 55 min
  };

  return cachedToken.value;
}

// Retry-on-401 wrapper for self-healing
async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
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
    cachedToken = null; // Invalidate cache
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
```

> **Note:** In a production serverless environment, this token should be stored in Redis/KV store. For this demo, in-memory caching is used with retry-on-401 for self-healing. Cold starts will reset the cache but the app remains functional.

### 3.4 SSR Considerations & Hydration

#### React Query Hydration Strategy

When using React Query with Next.js SSR, proper hydration is required:

```typescript
// lib/providers/QueryProvider.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        refetchOnWindowFocus: false,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return makeQueryClient();
  } else {
    // Browser: make a new client if we don't already have one
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

#### localStorage Hydration Mismatch Prevention

**The Problem:** Next.js SSR cannot access localStorage, causing hydration mismatches:

- Server renders: "0 Favorites" (no localStorage)
- Client hydrates: "3 Favorites" (has localStorage)
- Result: React hydration error

**The Solution:** Use a `useMounted` hook to defer localStorage-dependent rendering:

```typescript
// lib/hooks/useMounted.ts
import { useState, useEffect } from 'react';

export function useMounted() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}
```

**Usage in Components:**

```typescript
// components/layout/FavoritesLink.tsx
'use client';

import { useMounted } from '@/lib/hooks/useMounted';
import { useFavorites } from '@/features/favorites/hooks/useFavorites';

export function FavoritesLink() {
  const mounted = useMounted();
  const { count } = useFavorites();

  // Render skeleton/placeholder until client-side mounted
  if (!mounted) {
    return <FavoritesLinkSkeleton />;
  }

  return (
    <Link href="/favorites">
      Favorites {count > 0 && <Badge>{count}</Badge>}
    </Link>
  );
}
```

**Apply this pattern to:**

- FavoritesLink (header badge count)
- FavoritesList (favorites page)
- RecentSearches (dropdown)
- Any component reading from localStorage

#### next.config.ts Configuration (Next.js 15)

```typescript
// next.config.ts (Next.js 15 supports TypeScript config)
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Enable Turbopack for faster development
  // Run with: next dev --turbo

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
        // Update after inspecting actual API image URLs
      },
      // Add specific domains as needed based on actual API response
    ],
  },

  // Next.js 15: experimental features (if needed)
  experimental: {
    // Enable if using Server Actions extensively
    // serverActions: { bodySizeLimit: '2mb' },
  },
};

export default nextConfig;
```

> **Note:** After inspecting the actual API responses, update `remotePatterns` with the exact image domain(s) used by the API.

---

## 4. API Documentation

### 4.1 External API (Movies API)

**Base URL:** `https://0kadddxyh3.execute-api.us-east-1.amazonaws.com`

#### Endpoints

| Endpoint         | Method | Description        | Auth |
| ---------------- | ------ | ------------------ | ---- |
| `/auth/token`    | GET    | Get bearer token   | No   |
| `/movies`        | GET    | Search/list movies | Yes  |
| `/movies/{id}`   | GET    | Get movie details  | Yes  |
| `/genres/movies` | GET    | Movies by genre    | Yes  |

#### Query Parameters for `/movies`

| Parameter | Type   | Default | Description                   |
| --------- | ------ | ------- | ----------------------------- |
| `page`    | number | 1       | Page number (starts at 1)     |
| `limit`   | number | 25      | Items per page                |
| `search`  | string | -       | Search term (title match)     |
| `genre`   | string | -       | Filter by genre (exact match) |

### 4.2 Internal API Routes

#### `GET /api/movies`

Proxies to external API with token management.

```typescript
// Request
GET /api/movies?search=batman&genre=Action&page=1&limit=25

// Response
{
  "results": [...],
  "page": 1,
  "totalPages": 10,
  "totalResults": 245
}
```

#### `GET /api/movies/[id]`

Fetches single movie details.

```typescript
// Request
GET /api/movies/123

// Response
{
  "id": "123",
  "title": "Batman Begins",
  ...
}
```

#### `GET /api/genres`

Returns cached genre list.

```typescript
// Response
{
  "genres": [
    { "id": 1, "name": "Action" },
    { "id": 2, "name": "Comedy" },
    ...
  ]
}
```

---

## 5. Type Definitions & Schemas

### 5.1 API Response Types (DTO)

```typescript
// types/api.ts

import { z } from 'zod';

// ══════════════════════════════════════════════════════════════
// ⚠️ IMPORTANT: PLACEHOLDER SCHEMAS - MUST VERIFY WITH ACTUAL API
// ══════════════════════════════════════════════════════════════
// These schemas are PLACEHOLDERS based on common patterns.
// FIRST IMPLEMENTATION STEP: Inspect actual API responses from:
//   - GET /movies?page=1&limit=10
//   - GET /movies/{id}
//   - GET /genres/movies
// Then rewrite these schemas to match the exact API response structure.
// ══════════════════════════════════════════════════════════════

export const GenreSchema = z.object({
  id: z.number(),
  name: z.string(),
});

// TODO: Update field names to match actual API response
// These field names (poster_path, vote_average, etc.) may differ
export const MovieDTOSchema = z.object({
  id: z.string(),
  title: z.string(),
  overview: z.string().nullable().default(''),
  poster_path: z.string().nullable(), // May be different in actual API
  backdrop_path: z.string().nullable(), // May be different in actual API
  release_date: z.string(),
  vote_average: z.number(), // May be different in actual API
  vote_count: z.number(),
  runtime: z.number().nullable(),
  genres: z.array(GenreSchema).default([]),
  popularity: z.number().default(0),
});

export const MovieSearchResponseSchema = z.object({
  results: z.array(MovieDTOSchema),
  page: z.number(),
  total_pages: z.number(), // May be totalPages in actual API
  total_results: z.number(), // May be totalResults in actual API
});

export const GenresResponseSchema = z.object({
  genres: z.array(GenreSchema),
});

export const TokenResponseSchema = z.object({
  token: z.string(),
});

// Inferred types
export type MovieDTO = z.infer<typeof MovieDTOSchema>;
export type Genre = z.infer<typeof GenreSchema>;
export type MovieSearchResponseDTO = z.infer<typeof MovieSearchResponseSchema>;
```

### 5.2 Domain Types

```typescript
// types/movie.ts

export interface Movie {
  // Core identifiers
  id: string;
  title: string;

  // Content
  overview: string;
  genres: Genre[];
  genreNames: string; // "Action, Sci-Fi"

  // Media
  posterUrl: string | null;
  backdropUrl: string | null;

  // Dates
  releaseDate: string; // ISO string
  releaseYear: number; // 2024

  // Ratings
  rating: number; // 0-10
  ratingDisplay: string; // "7.8/10"
  voteCount: number;

  // Duration
  runtime: number | null; // minutes
  runtimeDisplay: string; // "2h 22m"
}

export interface Genre {
  id: number;
  name: string;
}

export interface MovieSearchParams {
  search?: string;
  genre?: string;
  page?: number;
  limit?: number;
}

export interface MovieSearchResponse {
  results: Movie[];
  page: number;
  totalPages: number;
  totalResults: number;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalResults: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}
```

### 5.3 DTO Transformer

```typescript
// lib/api/transformers.ts

import { MovieDTO, Movie } from '@/types';

// ══════════════════════════════════════════════════════════════
// ⚠️ IMAGE URL HANDLING - VERIFY WITH ACTUAL API
// ══════════════════════════════════════════════════════════════
// Check if the API returns:
//   A) Full URLs (use directly)
//   B) Relative paths (need base URL)
// Update this logic after inspecting actual API responses.
// ══════════════════════════════════════════════════════════════

// TODO: Update or remove based on actual API response format
const IMAGE_BASE_URL = ''; // Set after inspecting API, or remove if API returns full URLs

function buildImageUrl(path: string | null): string | null {
  if (!path) return null;
  // If API returns full URLs, just return the path
  if (path.startsWith('http')) return path;
  // If API returns relative paths, prepend base URL
  return IMAGE_BASE_URL ? `${IMAGE_BASE_URL}${path}` : path;
}

export function formatRuntime(minutes: number | null): string {
  if (!minutes) return 'N/A';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export function transformMovie(dto: MovieDTO): Movie {
  const releaseYear = dto.release_date ? new Date(dto.release_date).getFullYear() : 0;

  return {
    id: dto.id,
    title: dto.title,
    overview: dto.overview || 'No overview available.',
    genres: dto.genres,
    genreNames: dto.genres.map((g) => g.name).join(', ') || 'Unknown',
    posterUrl: buildImageUrl(dto.poster_path),
    backdropUrl: buildImageUrl(dto.backdrop_path),
    releaseDate: dto.release_date,
    releaseYear,
    rating: dto.vote_average,
    ratingDisplay: `${dto.vote_average.toFixed(1)}/10`,
    voteCount: dto.vote_count,
    runtime: dto.runtime,
    runtimeDisplay: formatRuntime(dto.runtime),
  };
}

export function transformMovieSearchResponse(dto: MovieSearchResponseDTO): MovieSearchResponse {
  return {
    results: dto.results.map(transformMovie),
    page: dto.page,
    totalPages: dto.total_pages,
    totalResults: dto.total_results,
  };
}
```

---

## 6. Project Structure

```
buffalo-movie-search/
│
├── app/
│   ├── layout.tsx                    # Root layout + providers
│   ├── page.tsx                      # Home/Search page (RSC) - async searchParams
│   ├── loading.tsx                   # Global loading UI
│   ├── error.tsx                     # Global error boundary
│   ├── not-found.tsx                 # 404 page
│   │
│   ├── movie/
│   │   └── [id]/
│   │       ├── page.tsx              # Movie detail (RSC) - async params
│   │       ├── loading.tsx           # Detail skeleton
│   │       └── error.tsx             # Detail error
│   │
│   ├── favorites/
│   │   ├── page.tsx                  # Favorites page
│   │   └── loading.tsx               # Favorites skeleton
│   │
│   ├── api/
│   │   ├── movies/
│   │   │   ├── route.ts              # GET /api/movies
│   │   │   └── [id]/
│   │   │       └── route.ts          # GET /api/movies/[id]
│   │   └── genres/
│   │       └── route.ts              # GET /api/genres
│   │
│   ├── globals.css                   # Global styles
│   └── favicon.ico
│
├── components/
│   ├── ui/                           # shadcn components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── skeleton.tsx
│   │   ├── badge.tsx
│   │   ├── card.tsx
│   │   ├── select.tsx
│   │   ├── dialog.tsx
│   │   └── sonner.tsx                # Toast
│   │
│   ├── search/
│   │   ├── SearchBar.tsx             # Search input + submit
│   │   ├── SearchBar.test.tsx
│   │   ├── SearchResults.tsx         # Results container
│   │   ├── SearchResults.test.tsx
│   │   ├── SearchFilters.tsx         # Genre dropdown (single)
│   │   ├── SearchFilters.test.tsx
│   │   ├── SearchPagination.tsx      # Pagination controls
│   │   ├── SearchPagination.test.tsx
│   │   ├── SearchSummary.tsx         # "X results for Y"
│   │   ├── RecentSearches.tsx        # Recent searches dropdown
│   │   └── RecentSearches.test.tsx
│   │
│   ├── movie/
│   │   ├── MovieCard.tsx             # Movie card in grid
│   │   ├── MovieCard.test.tsx
│   │   ├── MovieGrid.tsx             # Responsive grid
│   │   ├── MovieGrid.test.tsx
│   │   ├── MovieGridSkeleton.tsx     # Loading skeleton
│   │   ├── MoviePoster.tsx           # Image + blur
│   │   ├── MoviePoster.test.tsx
│   │   ├── MovieDetails.tsx          # Full detail view
│   │   ├── MovieDetails.test.tsx
│   │   ├── MovieRating.tsx           # Star rating
│   │   └── FavoriteButton.tsx        # Heart toggle
│   │
│   ├── layout/
│   │   ├── Header.tsx                # App header
│   │   ├── Header.test.tsx
│   │   ├── Footer.tsx                # App footer
│   │   ├── ThemeToggle.tsx           # Dark mode switch
│   │   ├── FavoritesLink.tsx         # Link to /favorites with badge
│   │   └── SkipLink.tsx              # Accessibility
│   │
│   ├── favorites/
│   │   ├── FavoritesList.tsx         # Grid of favorite movies
│   │   ├── FavoritesList.test.tsx
│   │   └── EmptyFavorites.tsx        # Empty state for favorites
│   │
│   └── shared/
│       ├── EmptyState.tsx            # No results
│       ├── ErrorMessage.tsx          # Error display
│       ├── OfflineBanner.tsx         # Offline indicator
│       └── LoadingSpinner.tsx        # Inline spinner
│
├── features/
│   ├── search/
│   │   ├── hooks/
│   │   │   ├── useMovieSearch.ts     # React Query search
│   │   │   └── useMovieSearch.test.ts
│   │   ├── api/
│   │   │   ├── searchMovies.ts       # API function
│   │   │   └── searchMovies.test.ts
│   │   └── types/
│   │       └── search.types.ts
│   │
│   ├── movie/
│   │   ├── hooks/
│   │   │   ├── useMovie.ts           # Single movie query
│   │   │   └── useMovie.test.ts
│   │   └── api/
│   │       └── fetchMovie.ts
│   │
│   ├── favorites/
│   │   ├── hooks/
│   │   │   ├── useFavorites.ts       # Favorites logic
│   │   │   └── useFavorites.test.ts
│   │   └── types/
│   │       └── favorites.types.ts
│   │
│   └── recent-searches/
│       ├── hooks/
│       │   ├── useRecentSearches.ts
│       │   └── useRecentSearches.test.ts
│       └── types/
│           └── recent.types.ts
│
├── lib/
│   ├── api/
│   │   ├── client.ts                 # API client
│   │   ├── client.test.ts
│   │   ├── token.ts                  # Token management
│   │   ├── token.test.ts
│   │   ├── endpoints.ts              # API constants
│   │   ├── errors.ts                 # Error classes
│   │   ├── schemas.ts                # Zod schemas
│   │   └── transformers.ts           # DTO → Domain
│   │
│   ├── hooks/
│   │   ├── useLocalStorage.ts
│   │   ├── useLocalStorage.test.ts
│   │   ├── useMounted.ts              # SSR hydration safety
│   │   ├── useDebounce.ts             # Debounced search
│   │   ├── useDebounce.test.ts
│   │   ├── useMediaQuery.ts
│   │   ├── useOnlineStatus.ts
│   │   └── useKeyboardNavigation.ts
│   │
│   ├── utils/
│   │   ├── cn.ts                     # Tailwind merge
│   │   ├── formatters.ts
│   │   ├── formatters.test.ts
│   │   └── constants.ts
│   │
│   └── providers/
│       ├── Providers.tsx             # All providers
│       ├── QueryProvider.tsx         # React Query
│       ├── ThemeProvider.tsx         # Dark mode
│       └── NuqsProvider.tsx          # URL state
│
├── types/
│   ├── movie.ts                      # Movie types
│   ├── api.ts                        # API types + schemas
│   └── index.ts                      # Re-exports
│
├── __tests__/
│   ├── integration/
│   │   ├── search-flow.test.tsx
│   │   ├── pagination-flow.test.tsx
│   │   └── favorites-flow.test.tsx
│   └── e2e/
│       ├── search.spec.ts
│       ├── movie-detail.spec.ts
│       ├── pagination.spec.ts
│       ├── favorites.spec.ts
│       ├── keyboard-nav.spec.ts
│       └── accessibility.spec.ts
│
├── __mocks__/
│   ├── handlers.ts                   # MSW handlers
│   ├── server.ts                     # MSW setup
│   └── data/
│       ├── movies.ts                 # Mock data
│       └── genres.ts
│
├── public/
│   ├── placeholder-movie.svg         # Fallback image
│   ├── og-image.png                  # Open Graph
│   └── icons/
│
├── .github/
│   └── workflows/
│       ├── ci.yml                    # Test + lint
│       └── deploy.yml                # Vercel deploy
│
├── .husky/
│   ├── pre-commit                    # Lint + format
│   └── pre-push                      # Type check
│
├── next.config.ts                    # Next.js 15 config (TypeScript)
├── tailwind.config.ts
├── tsconfig.json
├── vitest.config.ts
├── vitest.setup.ts
├── playwright.config.ts
├── .eslintrc.json
├── .prettierrc
├── components.json                   # shadcn config
├── .env.local                        # Environment vars
├── .env.example
└── README.md
```

---

## 7. Component Specifications

### 7.1 SearchBar

```typescript
// components/search/SearchBar.tsx

interface SearchBarProps {
  defaultValue?: string;
  onSearchChange: (query: string) => void;
  isLoading?: boolean;
  recentSearches?: string[];
  onSelectRecent?: (query: string) => void;
  onClearRecent?: () => void;
}

/**
 * Features:
 * - Debounced instant search (500ms delay)
 * - Search button for immediate submit (bypasses debounce)
 * - Minimum 2 characters before search triggers
 * - Recent searches dropdown on focus
 * - Accessible with ARIA labels
 * - Keyboard: Enter for immediate submit, Escape to close dropdown
 */
```

**States:**

- Default: Empty input with placeholder
- Typing: Shows input, debounce timer active
- With text < 2 chars: No search triggered
- Loading: Shows spinner indicator
- With recent: Dropdown visible on focus

### 7.2 MovieCard

```typescript
// components/movie/MovieCard.tsx

interface MovieCardProps {
  movie: Movie;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  priority?: boolean; // For above-fold images
  onKeyboardSelect?: () => void;
}

/**
 * Features:
 * - Blur placeholder image loading
 * - Hover effect with scale
 * - Favorite heart button (top-right)
 * - Rating badge (bottom-left)
 * - Title, year, runtime, genres
 * - Link to detail page (prefetched)
 * - Keyboard accessible
 * - Focus ring for keyboard navigation
 */
```

**Layout:**

```
┌────────────────────────┐
│  [Poster Image]    ❤️  │
│                        │
│                        │
│              ⭐ 7.8    │
├────────────────────────┤
│  Movie Title           │
│  2024 • 2h 22m         │
│  Action, Sci-Fi        │
└────────────────────────┘
```

### 7.3 MovieGrid

```typescript
// components/movie/MovieGrid.tsx

interface MovieGridProps {
  movies: Movie[];
  isLoading?: boolean;
  onMovieKeyboardSelect?: (movieId: string) => void;
}

/**
 * Responsive columns:
 * - Mobile (< 640px): 2 columns
 * - Small (≥ 640px): 3 columns
 * - Medium (≥ 768px): 4 columns
 * - Large (≥ 1024px): 5 columns
 * - XL (≥ 1280px): 6 columns
 *
 * Features:
 * - Arrow key navigation between cards
 * - Focus management
 * - Skeleton loading state
 */
```

### 7.4 SearchPagination

```typescript
// components/search/SearchPagination.tsx

interface SearchPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPrefetch?: (page: number) => void;
  isLoading?: boolean;
}

/**
 * Features:
 * - Previous/Next buttons
 * - Page numbers: 1 2 3 ... 10
 * - Disabled states at boundaries
 * - Prefetch on hover (next/prev)
 * - Shows current page of total
 * - Keyboard accessible
 */
```

**Layout:**

```
◄ Previous  [1] [2] [3] ... [10]  Next ►
            Page 2 of 10
```

### 7.5 MovieDetails

```typescript
// components/movie/MovieDetails.tsx

interface MovieDetailsProps {
  movie: Movie;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

/**
 * Full page layout:
 * - Large backdrop image (if available)
 * - Poster + details side by side
 * - Title, year, runtime, rating
 * - Genres as badges
 * - Full overview text
 * - Favorite button
 * - Back navigation (browser back)
 */
```

### 7.6 Header

```typescript
// components/layout/Header.tsx

interface HeaderProps {
  favoritesCount?: number;
}

/**
 * Contents:
 * - Logo: "Buffalo Movie Search"
 * - Navigation: Home, Favorites
 * - Favorites link with count badge
 * - Theme toggle (dark/light)
 *
 * Features:
 * - Sticky header
 * - Mobile responsive
 */
```

**Layout:**

```
┌──────────────────────────────────────────────────────────┐
│  🎬 Buffalo Movie Search     Home   Favorites(3)   🌙   │
└──────────────────────────────────────────────────────────┘
```

### 7.7 FavoritesPage

```typescript
// app/favorites/page.tsx

/**
 * Dedicated favorites page at /favorites
 *
 * Features:
 * - Grid of favorite movies (same as search results)
 * - Remove from favorites button on each card
 * - Empty state when no favorites
 * - Link back to search
 * - Movie cards link to detail page
 */
```

### 7.8 FavoritesList

```typescript
// components/favorites/FavoritesList.tsx

interface FavoritesListProps {
  favorites: FavoriteMovie[];
  onRemove: (id: string) => void;
}

/**
 * Features:
 * - Responsive grid layout
 * - Movie cards with remove button
 * - Shows when added (relative time)
 * - Links to movie detail
 */
```

### 7.8 RecentSearches

```typescript
// components/search/RecentSearches.tsx

interface RecentSearchesProps {
  searches: string[];
  onSelect: (query: string) => void;
  onClear: () => void;
  isOpen: boolean;
}

/**
 * Features:
 * - Shows on input focus
 * - List of recent search terms
 * - Click to search
 * - "Clear all" button
 * - Max 10 items
 * - Keyboard navigation
 */
```

---

## 8. Feature Specifications

### 8.1 Search Feature

| Aspect             | Specification                                |
| ------------------ | -------------------------------------------- |
| Trigger            | Debounced instant search (as user types)     |
| Debounce delay     | 500ms                                        |
| Minimum characters | 2                                            |
| URL sync           | `?search=batman`                             |
| Recent searches    | Save to localStorage                         |
| Search button      | Yes (for explicit submit, bypasses debounce) |

**User Flow:**

1. User types in search box
2. After 500ms pause, search triggers automatically
3. If < 2 chars, no search (wait for more input)
4. URL updates with search param
5. React Query fetches results
6. Results display in grid
7. Search term saved to recent searches

**Implementation:**

```typescript
// hooks/useDebounce.ts
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// Usage in SearchBar
const [inputValue, setInputValue] = useState('');
const debouncedSearch = useDebounce(inputValue, 500);

useEffect(() => {
  if (debouncedSearch.length >= 2) {
    setSearchParams({ search: debouncedSearch, page: 1 });
  }
}, [debouncedSearch]);
```

### 8.2 Genre Filter

| Aspect   | Specification          |
| -------- | ---------------------- |
| Type     | Single select dropdown |
| Default  | "All Genres"           |
| URL sync | `?genre=Action`        |
| Behavior | Resets page to 1       |

### 8.3 Pagination

| Aspect            | Specification              |
| ----------------- | -------------------------- |
| Default page size | 25 (API default)           |
| URL sync          | `?page=2`                  |
| Prefetch          | Next page on button hover  |
| Loading           | Keep previous data visible |

### 8.3.1 URL State Management (nuqs)

**History Strategy for Back Button:**

Different URL params should use different history strategies to avoid clogging the browser history:

```typescript
// lib/hooks/useSearchParams.ts
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';

export function useSearchParams() {
  return useQueryStates({
    // Search term: push (creates history entry)
    // User expects Back button to undo search changes
    search: parseAsString.withDefault('').withOptions({
      history: 'push',
    }),

    // Genre: push (creates history entry)
    // User expects Back button to undo filter changes
    genre: parseAsString.withDefault('').withOptions({
      history: 'push',
    }),

    // Page: replace (no history entry)
    // Avoids "Back button trap" of 20 page changes
    page: parseAsInteger.withDefault(1).withOptions({
      history: 'replace',
    }),
  });
}
```

**Behavior:**

| Action              | History Mode | Back Button Behavior       |
| ------------------- | ------------ | -------------------------- |
| Change search term  | `push`       | Returns to previous search |
| Change genre filter | `push`       | Returns to previous filter |
| Change page         | `replace`    | Skips page changes         |

> **Test This:** Navigate search → page 2 → page 3 → new search → Back button should go to first search (skipping pages).

### 8.4 Favorites

| Aspect      | Specification                 |
| ----------- | ----------------------------- |
| Storage     | localStorage                  |
| Max items   | Unlimited                     |
| Persist     | Cross-session                 |
| Data stored | id, title, posterUrl, addedAt |
| Access      | Separate page (`/favorites`)  |
| Header      | Link with count badge         |

### 8.5 Initial Page State (Browse Movies)

| Aspect      | Specification                                  |
| ----------- | ---------------------------------------------- |
| Trigger     | First visit (no search params)                 |
| Data source | API call without search term (default listing) |
| Display     | Same grid as search results                    |
| Title       | "Browse Movies"                                |
| Pagination  | Yes                                            |
| Cache       | Server-side + React Query                      |

> **Note:** We use "Browse Movies" instead of "Trending" because the API doesn't guarantee trending/popularity sorting. The default listing is simply movies without a search filter.

**User Flow:**

1. User visits homepage (no URL params)
2. Server fetches default movie listing
3. Movies display in grid
4. User can browse, paginate, or start searching
5. Search replaces browse results with search results

### 8.6 Recent Searches

| Aspect    | Specification           |
| --------- | ----------------------- |
| Storage   | localStorage            |
| Max items | 10                      |
| Display   | Dropdown on input focus |
| Clear     | "Clear all" button      |

### 8.7 Favorites Page

| Aspect      | Specification                          |
| ----------- | -------------------------------------- |
| Route       | `/favorites`                           |
| Content     | Grid of saved favorite movies          |
| Actions     | Remove from favorites, view details    |
| Empty state | "No favorites yet" with link to search |
| Navigation  | Back to home, link to movie details    |

### 8.8 Dark Mode

| Aspect     | Specification           |
| ---------- | ----------------------- |
| Default    | System preference       |
| Persist    | localStorage            |
| Toggle     | Header icon button      |
| Transition | Smooth color transition |

### 8.9 Keyboard Navigation

**Essential (Must Have):**

| Key             | Action                              |
| --------------- | ----------------------------------- |
| `Tab`           | Standard focus navigation           |
| `Enter`         | Submit search / Select focused item |
| `Escape`        | Close dropdowns / Clear focus       |
| `Arrow Up/Down` | Navigate recent searches dropdown   |

**Nice to Have (If Time Permits):**

| Key          | Action                                 |
| ------------ | -------------------------------------- |
| `/`          | Focus search input (keyboard shortcut) |
| `Arrow Keys` | Navigate movie grid                    |

> **Note:** Arrow-key grid navigation is impressive but time-consuming and brittle in tests. Prioritize essential accessibility features first.

### 8.10 Accessibility

| Feature          | Implementation                   |
| ---------------- | -------------------------------- |
| Skip link        | "Skip to main content"           |
| Focus management | Focus first result after search  |
| Announcements    | `aria-live` for result count     |
| Labels           | All interactive elements labeled |
| Contrast         | WCAG AA compliant                |
| Keyboard         | Full keyboard navigation         |

### 8.11 SEO

| Page      | Title                                  | Description                     |
| --------- | -------------------------------------- | ------------------------------- |
| Home      | "Buffalo Movie Search"                 | "Search thousands of movies..." |
| Search    | "Batman - Buffalo Movie Search"        | "Search results for Batman..."  |
| Detail    | "Batman Begins - Buffalo Movie Search" | Movie overview text             |
| Favorites | "My Favorites - Buffalo Movie Search"  | "Your saved favorite movies"    |

### 8.12 Error Handling

| Error Type      | Handling                  |
| --------------- | ------------------------- |
| Network error   | Toast + retry button      |
| API error (4xx) | Error message in UI       |
| API error (5xx) | Toast + "try again later" |
| Empty results   | Empty state component     |
| Invalid params  | Reset to defaults         |
| Offline         | Banner + cached data      |

---

## 9. Testing Strategy

### 9.1 Test Pyramid

```
        ┌─────┐
        │ E2E │  ◄── 5-10 critical flows
       ─┴─────┴─
      ┌─────────┐
      │  Integ  │  ◄── Component interactions
     ─┴─────────┴─
    ┌─────────────┐
    │    Unit     │  ◄── Hooks, utils, transformers
   ─┴─────────────┴─
```

### 9.2 Unit Tests (Vitest)

**Target:** Individual functions, hooks, utilities

```typescript
// lib/api/transformers.test.ts
describe('transformMovie', () => {
  it('transforms DTO to domain model');
  it('handles null poster_path');
  it('handles null runtime');
  it('formats runtime correctly');
  it('extracts release year');
});

// lib/hooks/useLocalStorage.test.ts
describe('useLocalStorage', () => {
  it('returns initial value when empty');
  it('persists value to localStorage');
  it('syncs across hook instances');
  it('handles JSON parse errors');
});

// features/search/api/searchMovies.test.ts
describe('searchMovies', () => {
  it('builds correct query params');
  it('validates response with Zod');
  it('transforms response to domain');
  it('throws ApiError on failure');
});
```

### 9.3 Component Tests (Testing Library)

**Target:** Component rendering, interactions

```typescript
// components/search/SearchBar.test.tsx
describe('SearchBar', () => {
  it('renders with placeholder');
  it('shows validation error for < 2 chars');
  it('calls onSearch on Enter');
  it('calls onSearch on button click');
  it('shows recent searches dropdown on focus');
  it('selects recent search on click');
  it('clears recent searches');
});

// components/movie/MovieCard.test.tsx
describe('MovieCard', () => {
  it('renders movie information');
  it('shows favorite button on hover');
  it('toggles favorite on click');
  it('navigates to detail on click');
  it('handles missing poster');
});
```

### 9.4 Integration Tests (Testing Library + MSW)

**Target:** Feature flows with mocked API

```typescript
// __tests__/integration/search-flow.test.tsx
describe('Search Flow', () => {
  it('searches and displays results');
  it('filters by genre');
  it('paginates results');
  it('updates URL on search');
  it('restores search from URL');
  it('shows empty state for no results');
  it('shows error on API failure');
  it('shows browse movies on initial load');
});

// __tests__/integration/favorites-flow.test.tsx
describe('Favorites Flow', () => {
  it('adds movie to favorites');
  it('removes movie from favorites');
  it('persists favorites in localStorage');
  it('navigates to favorites page');
  it('displays favorites on favorites page');
  it('removes favorite from favorites page');
});
```

### 9.5 E2E Tests (Playwright)

**Target:** Critical user journeys

```typescript
// __tests__/e2e/search.spec.ts
test.describe('Search', () => {
  test('user can search for movies');
  test('user can filter by genre');
  test('user can paginate results');
  test('search state persists in URL');
  test('back button preserves search');
  test('homepage shows browse movies');
});

// __tests__/e2e/movie-detail.spec.ts
test.describe('Movie Detail', () => {
  test('user can view movie details');
  test('user can add to favorites');
  test('user can navigate back');
});

// __tests__/e2e/favorites.spec.ts
test.describe('Favorites Page', () => {
  test('user can navigate to favorites page');
  test('user can see list of favorites');
  test('user can remove from favorites');
  test('shows empty state when no favorites');
  test('can navigate to movie detail from favorites');
});

// __tests__/e2e/accessibility.spec.ts
test.describe('Accessibility', () => {
  test('skip link works');
  test('keyboard navigation works');
  test('screen reader announcements');
  test('focus management after search');
});
```

### 9.6 MSW Handlers

```typescript
// __mocks__/handlers.ts
import { http, HttpResponse } from 'msw';

// ══════════════════════════════════════════════════════════════
// MSW mocks our INTERNAL API routes (not the external Movies API)
// Token handling is internal to /api/movies, no need to mock it
// ══════════════════════════════════════════════════════════════

export const handlers = [
  // Movie search (our internal proxy route)
  http.get('/api/movies', ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get('search');
    const page = Number(url.searchParams.get('page')) || 1;

    // Filter mock data if search term provided
    let results = mockMovies;
    if (search) {
      results = mockMovies.filter((m) => m.title.toLowerCase().includes(search.toLowerCase()));
    }

    // Paginate
    const startIndex = (page - 1) * 25;
    const paginatedResults = results.slice(startIndex, startIndex + 25);

    return HttpResponse.json({
      results: paginatedResults,
      page,
      total_pages: Math.ceil(results.length / 25),
      total_results: results.length,
    });
  }),

  // Single movie (our internal proxy route)
  http.get('/api/movies/:id', ({ params }) => {
    const movie = mockMovies.find((m) => m.id === params.id);
    if (!movie) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json(movie);
  }),

  // Genres
  http.get('/api/genres', () => {
    return HttpResponse.json({ genres: mockGenres });
  }),
];
```

---

## 10. Development Workflow

### 10.1 Core Principles

Every task follows this **strict workflow**:

```
┌─────────────────────────────────────────────────────────────┐
│                    DEVELOPMENT CYCLE                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   1. IMPLEMENT (small, focused change)                      │
│              │                                              │
│              ▼                                              │
│   2. WRITE TESTS (unit/integration as needed)               │
│              │                                              │
│              ▼                                              │
│   3. VERIFY ALL CHECKS PASS                                 │
│      ├── npm run type-check  ✓                              │
│      ├── npm run lint        ✓                              │
│      └── npm run test        ✓                              │
│              │                                              │
│              ▼                                              │
│   4. COMMIT (with conventional commit message)              │
│              │                                              │
│              ▼                                              │
│   5. REPEAT for next small step                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 10.2 Verification Commands

Run these after **every** implementation step:

```bash
# Type checking (must pass)
npm run type-check

# Linting (must pass)
npm run lint

# Fix lint issues automatically
npm run lint:fix

# Run tests (must pass)
npm run test

# Run all checks together
npm run verify
```

**package.json scripts:**

```json
{
  "scripts": {
    "dev": "next dev --turbo",
    "build": "next build",
    "start": "next start",
    "type-check": "tsc --noEmit",
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "format": "prettier --write .",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "verify": "npm run type-check && npm run lint && npm run test"
  }
}
```

### 10.3 Commit Message Convention

Use **Conventional Commits** format:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**

| Type       | Description                | Example                                       |
| ---------- | -------------------------- | --------------------------------------------- |
| `feat`     | New feature                | `feat(search): add debounced search input`    |
| `fix`      | Bug fix                    | `fix(auth): handle token refresh on 401`      |
| `test`     | Adding/updating tests      | `test(api): add unit tests for transformers`  |
| `refactor` | Code refactoring           | `refactor(hooks): extract useDebounce logic`  |
| `style`    | Formatting, no code change | `style: format with prettier`                 |
| `docs`     | Documentation              | `docs: update README with setup instructions` |
| `chore`    | Maintenance                | `chore: update dependencies`                  |
| `ci`       | CI/CD changes              | `ci: add GitHub Actions workflow`             |

**Scopes:**

| Scope       | Description                          |
| ----------- | ------------------------------------ |
| `api`       | API routes, client, token management |
| `search`    | Search feature components/hooks      |
| `movie`     | Movie detail feature                 |
| `favorites` | Favorites feature                    |
| `ui`        | Shared UI components                 |
| `hooks`     | Custom hooks                         |
| `types`     | Type definitions                     |
| `config`    | Configuration files                  |

**Examples:**

```bash
# Feature commits
git commit -m "feat(api): add token management with retry-on-401"
git commit -m "feat(search): implement SearchBar with debounce"
git commit -m "feat(movie): add MovieCard component"

# Test commits
git commit -m "test(api): add unit tests for token refresh logic"
git commit -m "test(search): add SearchBar component tests"

# Fix commits
git commit -m "fix(search): handle empty search query edge case"

# Refactor commits
git commit -m "refactor(types): extract Movie interface to separate file"
```

### 10.4 Test-First Approach

For each component/function, follow this order:

```
1. Create file with basic structure (empty/stub)
2. Write test file with expected behavior
3. Run test (should fail - RED)
4. Implement the functionality
5. Run test (should pass - GREEN)
6. Refactor if needed
7. Verify all checks pass
8. Commit
```

**Example - Creating useDebounce hook:**

```bash
# Step 1: Create stub
# lib/hooks/useDebounce.ts (empty export)

# Step 2: Write test
# lib/hooks/useDebounce.test.ts

# Step 3: Run test (fails)
npm run test -- useDebounce

# Step 4: Implement hook
# lib/hooks/useDebounce.ts (full implementation)

# Step 5: Run test (passes)
npm run test -- useDebounce

# Step 6: Verify all checks
npm run verify

# Step 7: Commit
git add .
git commit -m "feat(hooks): add useDebounce hook with tests"
```

### 10.5 Small Steps Rule

**Each commit should be:**

- ✅ **Small** — One logical change
- ✅ **Complete** — Tests pass, types check, lint clean
- ✅ **Focused** — Single responsibility
- ✅ **Buildable** — App still compiles

**Bad Example (too large):**

```bash
git commit -m "feat: add search functionality"  # ❌ Too vague, too large
```

**Good Example (small steps):**

```bash
git commit -m "feat(types): add Movie and Genre type definitions"
git commit -m "feat(api): add Zod schemas for API validation"
git commit -m "test(api): add schema validation tests"
git commit -m "feat(api): add transformMovie function"
git commit -m "test(api): add transformer unit tests"
git commit -m "feat(search): add SearchBar component structure"
git commit -m "test(search): add SearchBar render tests"
git commit -m "feat(search): implement debounced search logic"
git commit -m "test(search): add debounce behavior tests"
```

---

## 11. Master TODO Checklist

> **Workflow for EVERY item:** Implement → Run Tests → Run Lint → Run Type Check → Suggest Commit → Get Approval → Push

### Pre-Implementation Workflow

```bash
# After implementing each TODO item, run:
npm run verify          # Runs: type-check + lint + test

# If all pass, stage files:
git add .

# Review staged changes:
git status
git diff --staged

# Wait for approval, then commit and push:
git commit -m "<suggested commit message>"
git push
```

---

### Phase 1: Foundation

| #    | TODO                                                       | Status | Commit Message                                                      |
| ---- | ---------------------------------------------------------- | ------ | ------------------------------------------------------------------- |
| 1.0  | Inspect actual API responses and document structure        | ⬜     | `docs: document API response structure`                             |
| 1.1  | Create Next.js 15 project with TypeScript                  | ⬜     | `chore: initialize Next.js 15 project with TypeScript and Tailwind` |
| 1.2  | Install core dependencies (react-query, nuqs, zod, vitest) | ⬜     | `chore: install core dependencies`                                  |
| 1.3  | Configure Vitest with React Testing Library                | ⬜     | `chore(config): configure Vitest with React Testing Library`        |
| 1.4  | Configure ESLint + Prettier                                | ⬜     | `chore(config): configure ESLint and Prettier`                      |
| 1.5  | Set up Husky pre-commit hooks                              | ⬜     | `chore(config): add Husky pre-commit hooks with lint-staged`        |
| 1.6  | Create project folder structure                            | ⬜     | `chore: create project folder structure`                            |
| 1.7  | Create type definitions (Movie, Genre, API types)          | ⬜     | `feat(types): add Movie, Genre, and API type definitions`           |
| 1.8  | Create Zod schemas + validation tests                      | ⬜     | `feat(api): add Zod schemas with validation tests`                  |
| 1.9  | Create DTO transformers + unit tests                       | ⬜     | `feat(api): add DTO transformers with unit tests`                   |
| 1.10 | Create token management + tests                            | ⬜     | `feat(api): add token management with retry-on-401 and tests`       |
| 1.11 | Create API client + tests                                  | ⬜     | `feat(api): add API client with error handling and tests`           |
| 1.12 | Create React Query provider (SSR-safe)                     | ⬜     | `feat(providers): add React Query provider with SSR hydration`      |
| 1.13 | Create Theme provider (dark mode)                          | ⬜     | `feat(providers): add theme provider for dark mode`                 |
| 1.14 | Create Nuqs provider (URL state)                           | ⬜     | `feat(providers): add nuqs provider for URL state`                  |
| 1.15 | Create root Providers component + update layout            | ⬜     | `feat(providers): combine all providers in root layout`             |
| 1.16 | Create /api/movies route                                   | ⬜     | `feat(api): add /api/movies route with token proxy`                 |
| 1.17 | Create /api/genres route                                   | ⬜     | `feat(api): add /api/genres route`                                  |
| 1.18 | Install and configure shadcn/ui                            | ⬜     | `chore(ui): install and configure shadcn/ui components`             |

**Phase 1 Verification:**

```bash
npm run verify  # Must pass before moving to Phase 2
```

---

### Phase 2: Core Features

| #    | TODO                                      | Status | Commit Message                                                     |
| ---- | ----------------------------------------- | ------ | ------------------------------------------------------------------ |
| 2.1  | Create useMounted hook + tests            | ⬜     | `feat(hooks): add useMounted hook for SSR hydration safety`        |
| 2.2  | Create useDebounce hook + tests           | ⬜     | `feat(hooks): add useDebounce hook with tests`                     |
| 2.3  | Build Header component + tests            | ⬜     | `feat(layout): add Header component with tests`                    |
| 2.4  | Build Footer component                    | ⬜     | `feat(layout): add Footer component`                               |
| 2.5  | Build ThemeToggle component + tests       | ⬜     | `feat(layout): add ThemeToggle component with tests`               |
| 2.6  | Build SearchBar component + tests         | ⬜     | `feat(search): add SearchBar component with debounce and tests`    |
| 2.7  | Build SearchFilters component + tests     | ⬜     | `feat(search): add SearchFilters component with tests`             |
| 2.8  | Build MoviePoster component + tests       | ⬜     | `feat(movie): add MoviePoster component with tests`                |
| 2.9  | Build MovieCard component + tests         | ⬜     | `feat(movie): add MovieCard component with tests`                  |
| 2.10 | Build MovieGrid component + tests         | ⬜     | `feat(movie): add MovieGrid component with tests`                  |
| 2.11 | Build MovieGridSkeleton component         | ⬜     | `feat(movie): add MovieGridSkeleton loading component`             |
| 2.12 | Create useMovieSearch hook + tests        | ⬜     | `feat(search): add useMovieSearch hook with React Query and tests` |
| 2.13 | Build SearchPagination component + tests  | ⬜     | `feat(search): add SearchPagination component with tests`          |
| 2.14 | Build SearchSummary component             | ⬜     | `feat(search): add SearchSummary component`                        |
| 2.15 | Build EmptyState component                | ⬜     | `feat(shared): add EmptyState component`                           |
| 2.16 | Build SearchResults container             | ⬜     | `feat(search): add SearchResults container component`              |
| 2.17 | Create useSearchParams hook (nuqs)        | ⬜     | `feat(hooks): add useSearchParams with nuqs URL sync`              |
| 2.18 | Build Home page with search functionality | ⬜     | `feat(pages): implement home page with search functionality`       |

**Phase 2 Verification:**

```bash
npm run verify  # Must pass before moving to Phase 3
npm run dev     # Manual test: search flow works
```

---

### Phase 3: Enhanced Features

| #    | TODO                                    | Status | Commit Message                                                      |
| ---- | --------------------------------------- | ------ | ------------------------------------------------------------------- |
| 3.1  | Create useMovie hook + tests            | ⬜     | `feat(movie): add useMovie hook with React Query and tests`         |
| 3.2  | Build MovieDetails component + tests    | ⬜     | `feat(movie): add MovieDetails component with tests`                |
| 3.3  | Build Movie detail page (async params)  | ⬜     | `feat(pages): add movie detail page with async params (Next.js 15)` |
| 3.4  | Create useLocalStorage hook + tests     | ⬜     | `feat(hooks): add useLocalStorage hook with SSR safety and tests`   |
| 3.5  | Create useFavorites hook + tests        | ⬜     | `feat(favorites): add useFavorites hook with persistence and tests` |
| 3.6  | Build FavoriteButton component + tests  | ⬜     | `feat(movie): add FavoriteButton component with tests`              |
| 3.7  | Build FavoritesList component + tests   | ⬜     | `feat(favorites): add FavoritesList component with tests`           |
| 3.8  | Build EmptyFavorites component          | ⬜     | `feat(favorites): add EmptyFavorites component`                     |
| 3.9  | Build Favorites page                    | ⬜     | `feat(pages): add favorites page`                                   |
| 3.10 | Build FavoritesLink component + tests   | ⬜     | `feat(layout): add FavoritesLink with count badge and tests`        |
| 3.11 | Update Header with FavoritesLink        | ⬜     | `feat(layout): integrate FavoritesLink into Header`                 |
| 3.12 | Create useRecentSearches hook + tests   | ⬜     | `feat(search): add useRecentSearches hook with tests`               |
| 3.13 | Build RecentSearches component + tests  | ⬜     | `feat(search): add RecentSearches dropdown component with tests`    |
| 3.14 | Integrate RecentSearches into SearchBar | ⬜     | `feat(search): integrate RecentSearches into SearchBar`             |
| 3.15 | Implement prefetching for pagination    | ⬜     | `feat(search): add prefetching on pagination hover`                 |
| 3.16 | Build ErrorMessage component            | ⬜     | `feat(shared): add ErrorMessage component`                          |
| 3.17 | Build error boundaries (global)         | ⬜     | `feat(pages): add global error boundary`                            |
| 3.18 | Set up toast notifications (Sonner)     | ⬜     | `feat(ui): add toast notifications with Sonner`                     |
| 3.19 | Add toasts to favorites actions         | ⬜     | `feat(favorites): add toast notifications for favorite actions`     |

**Phase 3 Verification:**

```bash
npm run verify  # Must pass before moving to Phase 4
npm run dev     # Manual test: movie detail, favorites, recent searches
```

---

### Phase 4: Polish & Accessibility

| #    | TODO                                    | Status | Commit Message                                                   |
| ---- | --------------------------------------- | ------ | ---------------------------------------------------------------- |
| 4.1  | Build SkipLink component + tests        | ⬜     | `feat(a11y): add SkipLink component with tests`                  |
| 4.2  | Add SkipLink to layout                  | ⬜     | `feat(a11y): integrate SkipLink into layout`                     |
| 4.3  | Add aria-live announcements             | ⬜     | `feat(a11y): add aria-live announcements for search results`     |
| 4.4  | Implement focus management after search | ⬜     | `feat(a11y): add focus management after search`                  |
| 4.5  | Add all ARIA labels                     | ⬜     | `feat(a11y): add comprehensive ARIA labels to all components`    |
| 4.6  | Implement basic keyboard navigation     | ⬜     | `feat(a11y): add keyboard navigation for essential interactions` |
| 4.7  | Implement SEO metadata                  | ⬜     | `feat(seo): add dynamic metadata for all pages`                  |
| 4.8  | Add Open Graph images                   | ⬜     | `feat(seo): add Open Graph image generation`                     |
| 4.9  | Polish responsive design                | ⬜     | `style: polish responsive design for all breakpoints`            |
| 4.10 | Add animations and transitions          | ⬜     | `style: add subtle animations and transitions`                   |

**Phase 4 Verification:**

```bash
npm run verify  # Must pass before moving to Phase 5
npm run dev     # Manual test: keyboard nav, screen reader, mobile
```

---

### Phase 5: Testing & E2E

| #    | TODO                                    | Status | Commit Message                                             |
| ---- | --------------------------------------- | ------ | ---------------------------------------------------------- |
| 5.1  | Review test coverage and identify gaps  | ⬜     | `test: add coverage reporting configuration`               |
| 5.2  | Set up MSW for integration tests        | ⬜     | `test: configure MSW server for integration tests`         |
| 5.3  | Create comprehensive mock data          | ⬜     | `test: add comprehensive mock data for testing`            |
| 5.4  | Write search flow integration tests     | ⬜     | `test(integration): add search flow integration tests`     |
| 5.5  | Write pagination flow integration tests | ⬜     | `test(integration): add pagination flow integration tests` |
| 5.6  | Write favorites flow integration tests  | ⬜     | `test(integration): add favorites flow integration tests`  |
| 5.7  | Set up Playwright                       | ⬜     | `test: configure Playwright for E2E testing`               |
| 5.8  | Write search flow E2E tests             | ⬜     | `test(e2e): add search flow E2E tests`                     |
| 5.9  | Write movie detail E2E tests            | ⬜     | `test(e2e): add movie detail E2E tests`                    |
| 5.10 | Write favorites E2E tests               | ⬜     | `test(e2e): add favorites E2E tests`                       |
| 5.11 | Write accessibility E2E tests (axe)     | ⬜     | `test(e2e): add accessibility E2E tests with axe-core`     |
| 5.12 | Fill coverage gaps                      | ⬜     | `test: fill coverage gaps and improve edge case testing`   |

**Phase 5 Verification:**

```bash
npm run verify          # Unit + integration tests
npm run test:e2e        # E2E tests
npm run test:coverage   # Coverage > 80%
```

---

### Phase 6: DevOps & Documentation

| #    | TODO                              | Status | Commit Message                                              |
| ---- | --------------------------------- | ------ | ----------------------------------------------------------- |
| 6.1  | Create GitHub repository          | ⬜     | `chore: initialize git repository`                          |
| 6.2  | Set up GitHub Actions CI          | ⬜     | `ci: add GitHub Actions workflow for lint, test, and build` |
| 6.3  | Set up branch protection rules    | ⬜     | _(no commit - GitHub UI)_                                   |
| 6.4  | Configure Vercel deployment       | ⬜     | `ci: configure Vercel deployment`                           |
| 6.5  | Set up environment variables      | ⬜     | `chore: add environment variable configuration`             |
| 6.6  | Write comprehensive README        | ⬜     | `docs: add comprehensive README`                            |
| 6.7  | Create architecture documentation | ⬜     | `docs: add architecture documentation`                      |
| 6.8  | Final testing and bug fixes       | ⬜     | `fix: address final bug fixes and edge cases`               |
| 6.9  | Performance audit (Lighthouse)    | ⬜     | `perf: optimize bundle size and performance`                |
| 6.10 | Accessibility audit (axe)         | ⬜     | `fix(a11y): address accessibility audit findings`           |
| 6.11 | Final deploy to production        | ⬜     | `chore: prepare for production release`                     |

**Phase 6 Verification:**

```bash
npm run verify          # All checks pass
npm run build           # Production build succeeds
npm run test:e2e        # E2E tests pass
vercel --prod           # Deploy to production
```

---

### Quick Reference: Status Legend

| Symbol | Meaning       |
| ------ | ------------- |
| ⬜     | Not started   |
| 🟡     | In progress   |
| ✅     | Completed     |
| ❌     | Blocked/Issue |

---

### Workflow Commands Cheat Sheet

```bash
# After implementing each TODO item:

# 1. Run all checks
npm run verify

# 2. If tests don't exist yet for this item, that's okay
#    If tests exist, they must pass

# 3. Stage files
git add .

# 4. Show what will be committed
git status

# 5. Wait for approval, then:
git commit -m "<commit message from table>"
git push

# === Individual commands if needed ===
npm run type-check      # TypeScript only
npm run lint            # ESLint only
npm run lint:fix        # Auto-fix lint issues
npm run test            # Unit tests only
npm run test:watch      # Tests in watch mode
npm run test:e2e        # E2E tests only
```

---

## 12. Implementation Phases (Detailed)

### Phase 1: Foundation (Day 1)

#### Step 1.0: Inspect Actual API Responses ⚠️ CRITICAL FIRST STEP

```bash
# Get token
curl https://0kadddxyh3.execute-api.us-east-1.amazonaws.com/auth/token

# Test movies endpoint
curl -H "Authorization: Bearer <token>" \
     "https://0kadddxyh3.execute-api.us-east-1.amazonaws.com/movies?page=1&limit=5"

# Test single movie
curl -H "Authorization: Bearer <token>" \
     "https://0kadddxyh3.execute-api.us-east-1.amazonaws.com/movies/1"

# Test genres
curl -H "Authorization: Bearer <token>" \
     "https://0kadddxyh3.execute-api.us-east-1.amazonaws.com/genres/movies"
```

**Document the actual response shapes before proceeding!**

---

#### Step 1.1: Create Next.js 15 Project

```bash
npx create-next-app@latest buffalo-movie-search \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --turbopack

cd buffalo-movie-search
```

✅ **Verify:** `npm run dev` starts without errors
📝 **Commit:** `chore: initialize Next.js 15 project with TypeScript and Tailwind`

---

#### Step 1.2: Install Core Dependencies

```bash
npm install @tanstack/react-query @tanstack/react-query-devtools
npm install nuqs zod sonner
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
npm install -D @vitejs/plugin-react msw
```

✅ **Verify:** `npm run type-check` passes
📝 **Commit:** `chore: install core dependencies (react-query, nuqs, zod, vitest)`

---

#### Step 1.3: Configure Vitest

**Create `vitest.config.ts`:**

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**Create `vitest.setup.ts`:**

```typescript
import '@testing-library/jest-dom';
```

**Update `package.json` scripts:**

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "type-check": "tsc --noEmit",
    "verify": "npm run type-check && npm run lint && npm run test"
  }
}
```

✅ **Verify:** `npm run test` runs (no tests yet, but no errors)
📝 **Commit:** `chore(config): configure Vitest with React Testing Library`

---

#### Step 1.4: Configure ESLint + Prettier

```bash
npm install -D prettier eslint-config-prettier eslint-plugin-prettier
```

**Create `.prettierrc`:**

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```

✅ **Verify:** `npm run lint` passes
📝 **Commit:** `chore(config): configure ESLint and Prettier`

---

#### Step 1.5: Set Up Husky Pre-commit Hooks

```bash
npm install -D husky lint-staged
npx husky init
```

**Update `.husky/pre-commit`:**

```bash
npm run verify
```

**Add to `package.json`:**

```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,css}": ["prettier --write"]
  }
}
```

✅ **Verify:** Make a small change, commit should trigger hooks
📝 **Commit:** `chore(config): add Husky pre-commit hooks with lint-staged`

---

#### Step 1.6: Create Folder Structure

```bash
mkdir -p src/lib/{api,hooks,utils,providers}
mkdir -p src/components/{ui,search,movie,layout,shared,favorites}
mkdir -p src/features/{search,movie,favorites}/hooks
mkdir -p src/types
mkdir -p src/__tests__/{integration,e2e}
mkdir -p src/__mocks__/data
```

✅ **Verify:** Folder structure exists
📝 **Commit:** `chore: create project folder structure`

---

#### Step 1.7: Create Type Definitions

**Create `src/types/movie.ts`:**

```typescript
// Update based on actual API response from Step 1.0!
export interface Genre {
  id: number;
  name: string;
}

export interface Movie {
  id: string;
  title: string;
  overview: string;
  // ... add fields based on actual API
}
```

**Create `src/types/api.ts` with Zod schemas**

**Create `src/types/index.ts` for re-exports**

✅ **Verify:** `npm run type-check` passes
📝 **Commit:** `feat(types): add Movie, Genre, and API type definitions`

---

#### Step 1.8: Create Zod Schemas + Tests

**Create `src/lib/api/schemas.ts`**

**Create `src/lib/api/schemas.test.ts`:**

```typescript
import { describe, it, expect } from 'vitest';
import { MovieDTOSchema } from './schemas';

describe('MovieDTOSchema', () => {
  it('validates correct movie data', () => {
    const validMovie = {
      /* based on actual API */
    };
    expect(() => MovieDTOSchema.parse(validMovie)).not.toThrow();
  });

  it('rejects invalid movie data', () => {
    const invalidMovie = { id: 123 }; // missing required fields
    expect(() => MovieDTOSchema.parse(invalidMovie)).toThrow();
  });
});
```

✅ **Verify:** `npm run verify` passes
📝 **Commit:** `feat(api): add Zod schemas with validation tests`

---

#### Step 1.9: Create DTO Transformers + Tests

**Create `src/lib/api/transformers.ts`**

**Create `src/lib/api/transformers.test.ts`:**

```typescript
import { describe, it, expect } from 'vitest';
import { transformMovie, formatRuntime } from './transformers';

describe('formatRuntime', () => {
  it('formats minutes to hours and minutes', () => {
    expect(formatRuntime(142)).toBe('2h 22m');
    expect(formatRuntime(60)).toBe('1h');
    expect(formatRuntime(45)).toBe('45m');
    expect(formatRuntime(null)).toBe('N/A');
  });
});

describe('transformMovie', () => {
  it('transforms DTO to domain model', () => {
    const dto = {
      /* mock DTO */
    };
    const result = transformMovie(dto);
    expect(result.runtimeDisplay).toBe('2h 22m');
    // ... more assertions
  });
});
```

✅ **Verify:** `npm run verify` passes
📝 **Commit:** `feat(api): add DTO transformers with unit tests`

---

#### Step 1.10: Create Token Management + Tests

**Create `src/lib/api/token.ts`:**

```typescript
// Token management with retry-on-401
```

**Create `src/lib/api/token.test.ts`:**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
// Test token caching, expiry, refresh logic
```

✅ **Verify:** `npm run verify` passes
📝 **Commit:** `feat(api): add token management with retry-on-401 and tests`

---

#### Step 1.11: Create API Client + Tests

**Create `src/lib/api/client.ts`**

**Create `src/lib/api/client.test.ts`**

✅ **Verify:** `npm run verify` passes
📝 **Commit:** `feat(api): add API client with error handling and tests`

---

#### Step 1.12: Create React Query Provider

**Create `src/lib/providers/QueryProvider.tsx`:**

```typescript
'use client';
// SSR-safe React Query provider
```

✅ **Verify:** `npm run type-check` passes
📝 **Commit:** `feat(providers): add React Query provider with SSR hydration`

---

#### Step 1.13: Create Theme Provider

**Create `src/lib/providers/ThemeProvider.tsx`**

✅ **Verify:** `npm run type-check` passes
📝 **Commit:** `feat(providers): add theme provider for dark mode`

---

#### Step 1.14: Create Nuqs Provider

**Create `src/lib/providers/NuqsProvider.tsx`**

✅ **Verify:** `npm run type-check` passes
📝 **Commit:** `feat(providers): add nuqs provider for URL state`

---

#### Step 1.15: Create Root Providers

**Create `src/lib/providers/Providers.tsx`:**

```typescript
// Combine all providers
```

**Update `src/app/layout.tsx` to use Providers**

✅ **Verify:** `npm run dev` works, no errors
📝 **Commit:** `feat(providers): combine all providers in root layout`

---

#### Step 1.16: Create API Route - Movies

**Create `src/app/api/movies/route.ts`:**

```typescript
// Proxy to external API with token management
// Handle async params (Next.js 15)
```

✅ **Verify:** `curl http://localhost:3000/api/movies` returns data
📝 **Commit:** `feat(api): add /api/movies route with token proxy`

---

#### Step 1.17: Create API Route - Genres

**Create `src/app/api/genres/route.ts`**

✅ **Verify:** `curl http://localhost:3000/api/genres` returns data
📝 **Commit:** `feat(api): add /api/genres route`

---

#### Step 1.18: Install shadcn/ui

```bash
npx shadcn@latest init
npx shadcn@latest add button input skeleton badge card select
```

✅ **Verify:** Components installed in `src/components/ui/`
📝 **Commit:** `chore(ui): install and configure shadcn/ui components`

---

#### Phase 1 Summary

| Metric      | Target            |
| ----------- | ----------------- |
| **Commits** | ~18 small commits |
| **Tests**   | ~15-20 unit tests |
| **Time**    | ~5.5 hours        |

**Phase 1 Checklist:**

- [ ] API responses documented
- [ ] All dependencies installed
- [ ] Vitest configured and working
- [ ] ESLint + Prettier configured
- [ ] Husky pre-commit hooks working
- [ ] Type definitions created
- [ ] Zod schemas with tests
- [ ] Transformers with tests
- [ ] Token management with tests
- [ ] API client with tests
- [ ] All providers configured
- [ ] API routes working
- [ ] shadcn/ui installed
- [ ] All tests passing
- [ ] All types checking
- [ ] All lint rules passing

---

### Phase 2: Core Features (Day 2)

Each component follows: **Implement → Test → Verify → Commit**

---

#### Step 2.1: Create useMounted Hook + Tests

**Create `src/lib/hooks/useMounted.ts`:**

```typescript
import { useState, useEffect } from 'react';

export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
```

**Create `src/lib/hooks/useMounted.test.ts`:**

```typescript
import { renderHook } from '@testing-library/react';
import { useMounted } from './useMounted';

describe('useMounted', () => {
  it('returns false on initial render, true after mount', () => {
    const { result } = renderHook(() => useMounted());
    expect(result.current).toBe(true); // After mount
  });
});
```

✅ **Verify:** `npm run verify`
📝 **Commit:** `feat(hooks): add useMounted hook for SSR hydration safety`

---

#### Step 2.2: Create useDebounce Hook + Tests

**Create `src/lib/hooks/useDebounce.ts`**

**Create `src/lib/hooks/useDebounce.test.ts`:**

```typescript
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from './useDebounce';
import { vi } from 'vitest';

describe('useDebounce', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('debounces value changes', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 500), {
      initialProps: { value: 'initial' },
    });

    expect(result.current).toBe('initial');

    rerender({ value: 'updated' });
    expect(result.current).toBe('initial'); // Not yet updated

    act(() => vi.advanceTimersByTime(500));
    expect(result.current).toBe('updated'); // Now updated
  });
});
```

✅ **Verify:** `npm run verify`
📝 **Commit:** `feat(hooks): add useDebounce hook with tests`

---

#### Step 2.3: Build Header Component + Tests

**Create `src/components/layout/Header.tsx`**

**Create `src/components/layout/Header.test.tsx`:**

```typescript
import { render, screen } from '@testing-library/react';
import { Header } from './Header';

describe('Header', () => {
  it('renders app name', () => {
    render(<Header />);
    expect(screen.getByText('Buffalo Movie Search')).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    render(<Header />);
    expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /favorites/i })).toBeInTheDocument();
  });
});
```

✅ **Verify:** `npm run verify`
📝 **Commit:** `feat(layout): add Header component with tests`

---

#### Step 2.4: Build Footer Component

**Create `src/components/layout/Footer.tsx`**

✅ **Verify:** `npm run verify`
📝 **Commit:** `feat(layout): add Footer component`

---

#### Step 2.5: Build ThemeToggle Component + Tests

**Create `src/components/layout/ThemeToggle.tsx`**

**Create `src/components/layout/ThemeToggle.test.tsx`:**

```typescript
describe('ThemeToggle', () => {
  it('renders toggle button');
  it('toggles theme on click');
});
```

✅ **Verify:** `npm run verify`
📝 **Commit:** `feat(layout): add ThemeToggle component with tests`

---

#### Step 2.6: Build SearchBar Component + Tests

**Create `src/components/search/SearchBar.tsx`**

**Create `src/components/search/SearchBar.test.tsx`:**

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchBar } from './SearchBar';
import { vi } from 'vitest';

describe('SearchBar', () => {
  it('renders search input', () => {
    render(<SearchBar onSearchChange={vi.fn()} />);
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
  });

  it('calls onSearchChange with debounced value', async () => {
    const onSearchChange = vi.fn();
    render(<SearchBar onSearchChange={onSearchChange} />);

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'batman' } });
    // Test debounce behavior
  });

  it('does not trigger search for less than 2 characters', () => {
    // Test minimum character validation
  });
});
```

✅ **Verify:** `npm run verify`
📝 **Commit:** `feat(search): add SearchBar component with debounce and tests`

---

#### Step 2.7: Build SearchFilters Component + Tests

**Create `src/components/search/SearchFilters.tsx`**

**Create `src/components/search/SearchFilters.test.tsx`:**

```typescript
describe('SearchFilters', () => {
  it('renders genre dropdown');
  it('displays all genres');
  it('calls onGenreChange when selection changes');
  it('shows "All Genres" as default');
});
```

✅ **Verify:** `npm run verify`
📝 **Commit:** `feat(search): add SearchFilters component with tests`

---

#### Step 2.8: Build MoviePoster Component + Tests

**Create `src/components/movie/MoviePoster.tsx`**

**Create `src/components/movie/MoviePoster.test.tsx`:**

```typescript
describe('MoviePoster', () => {
  it('renders image with alt text');
  it('shows placeholder when no poster');
  it('uses Next.js Image with blur placeholder');
});
```

✅ **Verify:** `npm run verify`
📝 **Commit:** `feat(movie): add MoviePoster component with tests`

---

#### Step 2.9: Build MovieCard Component + Tests

**Create `src/components/movie/MovieCard.tsx`**

**Create `src/components/movie/MovieCard.test.tsx`:**

```typescript
describe('MovieCard', () => {
  const mockMovie = { id: '1', title: 'Test Movie' /* ... */ };

  it('renders movie title');
  it('renders movie poster');
  it('shows rating badge');
  it('links to movie detail page');
  it('renders favorite button');
});
```

✅ **Verify:** `npm run verify`
📝 **Commit:** `feat(movie): add MovieCard component with tests`

---

#### Step 2.10: Build MovieGrid Component + Tests

**Create `src/components/movie/MovieGrid.tsx`**

**Create `src/components/movie/MovieGrid.test.tsx`:**

```typescript
describe('MovieGrid', () => {
  it('renders grid of movies');
  it('renders correct number of MovieCards');
  it('applies responsive grid classes');
});
```

✅ **Verify:** `npm run verify`
📝 **Commit:** `feat(movie): add MovieGrid component with tests`

---

#### Step 2.11: Build MovieGridSkeleton Component

**Create `src/components/movie/MovieGridSkeleton.tsx`**

✅ **Verify:** `npm run verify`
📝 **Commit:** `feat(movie): add MovieGridSkeleton loading component`

---

#### Step 2.12: Create useMovieSearch Hook + Tests

**Create `src/features/search/hooks/useMovieSearch.ts`**

**Create `src/features/search/hooks/useMovieSearch.test.ts`:**

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMovieSearch } from './useMovieSearch';

describe('useMovieSearch', () => {
  it('fetches movies with search params');
  it('returns loading state');
  it('returns error state on failure');
  it('transforms response data');
});
```

✅ **Verify:** `npm run verify`
📝 **Commit:** `feat(search): add useMovieSearch hook with React Query and tests`

---

#### Step 2.13: Build SearchPagination Component + Tests

**Create `src/components/search/SearchPagination.tsx`**

**Create `src/components/search/SearchPagination.test.tsx`:**

```typescript
describe('SearchPagination', () => {
  it('renders page numbers');
  it('disables previous on first page');
  it('disables next on last page');
  it('calls onPageChange when clicking page');
  it('highlights current page');
});
```

✅ **Verify:** `npm run verify`
📝 **Commit:** `feat(search): add SearchPagination component with tests`

---

#### Step 2.14: Build SearchSummary Component

**Create `src/components/search/SearchSummary.tsx`**

✅ **Verify:** `npm run verify`
📝 **Commit:** `feat(search): add SearchSummary component`

---

#### Step 2.15: Build EmptyState Component

**Create `src/components/shared/EmptyState.tsx`**

✅ **Verify:** `npm run verify`
📝 **Commit:** `feat(shared): add EmptyState component`

---

#### Step 2.16: Build SearchResults Container

**Create `src/components/search/SearchResults.tsx`**

✅ **Verify:** `npm run verify`
📝 **Commit:** `feat(search): add SearchResults container component`

---

#### Step 2.17: Implement URL State Sync

**Create `src/lib/hooks/useSearchParams.ts`:**

```typescript
// nuqs integration with history strategy
```

✅ **Verify:** `npm run verify`
📝 **Commit:** `feat(hooks): add useSearchParams with nuqs URL sync`

---

#### Step 2.18: Build Home Page with Search

**Update `src/app/page.tsx`:**

```typescript
// Server Component with initial data fetch
// Pass to client components
```

✅ **Verify:** `npm run dev` - search flow works
📝 **Commit:** `feat(pages): implement home page with search functionality`

---

#### Phase 2 Summary

| Metric      | Target            |
| ----------- | ----------------- |
| **Commits** | ~18 small commits |
| **Tests**   | ~40-50 unit tests |
| **Time**    | ~7.5 hours        |

**Phase 2 Checklist:**

- [ ] useMounted hook with tests
- [ ] useDebounce hook with tests
- [ ] Header component with tests
- [ ] Footer component
- [ ] ThemeToggle with tests
- [ ] SearchBar with tests
- [ ] SearchFilters with tests
- [ ] MoviePoster with tests
- [ ] MovieCard with tests
- [ ] MovieGrid with tests
- [ ] MovieGridSkeleton
- [ ] useMovieSearch hook with tests
- [ ] SearchPagination with tests
- [ ] SearchSummary
- [ ] EmptyState
- [ ] SearchResults container
- [ ] URL state sync working
- [ ] Home page functional
- [ ] All tests passing
- [ ] All types checking
- [ ] All lint rules passing

---

### Phase 3: Enhanced Features (Day 3)

Each step follows: **Implement → Test → Verify → Commit**

---

#### Step 3.1: Create useMovie Hook + Tests

**Create `src/features/movie/hooks/useMovie.ts`:**

```typescript
import { useQuery } from '@tanstack/react-query';

export function useMovie(id: string) {
  return useQuery({
    queryKey: ['movie', id],
    queryFn: () => fetchMovie(id),
    enabled: !!id,
  });
}
```

**Create `src/features/movie/hooks/useMovie.test.ts`:**

```typescript
describe('useMovie', () => {
  it('fetches movie by id');
  it('returns loading state initially');
  it('returns movie data on success');
  it('returns error on failure');
  it('does not fetch when id is empty');
});
```

✅ **Verify:** `npm run verify`
📝 **Commit:** `feat(movie): add useMovie hook with React Query and tests`

---

#### Step 3.2: Build MovieDetails Component + Tests

**Create `src/components/movie/MovieDetails.tsx`**

**Create `src/components/movie/MovieDetails.test.tsx`:**

```typescript
describe('MovieDetails', () => {
  const mockMovie = {
    /* full movie data */
  };

  it('renders movie title and year');
  it('renders backdrop image');
  it('renders poster');
  it('renders rating');
  it('renders genres as badges');
  it('renders full overview');
  it('renders favorite button');
  it('renders runtime');
});
```

✅ **Verify:** `npm run verify`
📝 **Commit:** `feat(movie): add MovieDetails component with tests`

---

#### Step 3.3: Build Movie Detail Page (Next.js 15 async params)

**Create `src/app/movie/[id]/page.tsx`:**

```typescript
interface MoviePageProps {
  params: Promise<{ id: string }>;
}

export default async function MoviePage({ params }: MoviePageProps) {
  const { id } = await params; // Next.js 15 async params
  // Fetch initial data for SSR
  return <MovieDetailsClient movieId={id} />;
}
```

**Create `src/app/movie/[id]/loading.tsx`**
**Create `src/app/movie/[id]/error.tsx`**

✅ **Verify:** `npm run dev` - navigate to `/movie/1` works
📝 **Commit:** `feat(pages): add movie detail page with async params (Next.js 15)`

---

#### Step 3.4: Create useLocalStorage Hook + Tests

**Create `src/lib/hooks/useLocalStorage.ts`:**

```typescript
export function useLocalStorage<T>(key: string, initialValue: T) {
  // SSR-safe localStorage hook
}
```

**Create `src/lib/hooks/useLocalStorage.test.ts`:**

```typescript
describe('useLocalStorage', () => {
  beforeEach(() => localStorage.clear());

  it('returns initial value when localStorage is empty');
  it('returns stored value from localStorage');
  it('updates localStorage when setValue is called');
  it('handles JSON serialization');
  it('handles invalid JSON gracefully');
});
```

✅ **Verify:** `npm run verify`
📝 **Commit:** `feat(hooks): add useLocalStorage hook with SSR safety and tests`

---

#### Step 3.5: Create useFavorites Hook + Tests

**Create `src/features/favorites/hooks/useFavorites.ts`:**

```typescript
export function useFavorites() {
  const [favorites, setFavorites] = useLocalStorage<FavoriteMovie[]>('favorites', []);

  const addFavorite = (movie: FavoriteMovie) => {
    /* ... */
  };
  const removeFavorite = (id: string) => {
    /* ... */
  };
  const isFavorite = (id: string) => {
    /* ... */
  };
  const count = favorites.length;

  return { favorites, addFavorite, removeFavorite, isFavorite, count };
}
```

**Create `src/features/favorites/hooks/useFavorites.test.ts`:**

```typescript
describe('useFavorites', () => {
  beforeEach(() => localStorage.clear());

  it('starts with empty favorites');
  it('adds movie to favorites');
  it('removes movie from favorites');
  it('checks if movie is favorite');
  it('returns correct count');
  it('persists favorites across renders');
});
```

✅ **Verify:** `npm run verify`
📝 **Commit:** `feat(favorites): add useFavorites hook with persistence and tests`

---

#### Step 3.6: Build FavoriteButton Component + Tests

**Create `src/components/movie/FavoriteButton.tsx`**

**Create `src/components/movie/FavoriteButton.test.tsx`:**

```typescript
describe('FavoriteButton', () => {
  it('renders heart icon');
  it('shows filled heart when favorited');
  it('shows outline heart when not favorited');
  it('calls onToggle when clicked');
  it('has accessible label');
});
```

✅ **Verify:** `npm run verify`
📝 **Commit:** `feat(movie): add FavoriteButton component with tests`

---

#### Step 3.7: Build FavoritesList Component + Tests

**Create `src/components/favorites/FavoritesList.tsx`**

**Create `src/components/favorites/FavoritesList.test.tsx`:**

```typescript
describe('FavoritesList', () => {
  it('renders list of favorite movies');
  it('renders remove button for each movie');
  it('calls onRemove when remove clicked');
  it('links to movie detail page');
  it('uses useMounted for hydration safety');
});
```

✅ **Verify:** `npm run verify`
📝 **Commit:** `feat(favorites): add FavoritesList component with tests`

---

#### Step 3.8: Build EmptyFavorites Component

**Create `src/components/favorites/EmptyFavorites.tsx`**

✅ **Verify:** `npm run verify`
📝 **Commit:** `feat(favorites): add EmptyFavorites component`

---

#### Step 3.9: Build Favorites Page

**Create `src/app/favorites/page.tsx`:**

```typescript
export default function FavoritesPage() {
  return (
    <main>
      <h1>My Favorites</h1>
      <FavoritesPageContent />
    </main>
  );
}
```

**Create `src/app/favorites/loading.tsx`**

✅ **Verify:** `npm run dev` - navigate to `/favorites` works
📝 **Commit:** `feat(pages): add favorites page`

---

#### Step 3.10: Build FavoritesLink Component + Tests

**Create `src/components/layout/FavoritesLink.tsx`:**

```typescript
'use client';

export function FavoritesLink() {
  const mounted = useMounted();
  const { count } = useFavorites();

  if (!mounted) return <FavoritesLinkSkeleton />;

  return (
    <Link href="/favorites">
      Favorites {count > 0 && <Badge>{count}</Badge>}
    </Link>
  );
}
```

**Create `src/components/layout/FavoritesLink.test.tsx`:**

```typescript
describe('FavoritesLink', () => {
  it('renders link to favorites');
  it('shows count badge when favorites exist');
  it('hides badge when no favorites');
  it('renders skeleton before mount (SSR safety)');
});
```

✅ **Verify:** `npm run verify`
📝 **Commit:** `feat(layout): add FavoritesLink with count badge and tests`

---

#### Step 3.11: Update Header with FavoritesLink

**Update `src/components/layout/Header.tsx` to include FavoritesLink**

✅ **Verify:** `npm run verify`
📝 **Commit:** `feat(layout): integrate FavoritesLink into Header`

---

#### Step 3.12: Create useRecentSearches Hook + Tests

**Create `src/features/search/hooks/useRecentSearches.ts`:**

```typescript
export function useRecentSearches(maxItems = 10) {
  const [searches, setSearches] = useLocalStorage<string[]>('recentSearches', []);

  const addSearch = (query: string) => {
    /* dedupe, limit to maxItems */
  };
  const clearSearches = () => setSearches([]);

  return { searches, addSearch, clearSearches };
}
```

**Create `src/features/search/hooks/useRecentSearches.test.ts`:**

```typescript
describe('useRecentSearches', () => {
  beforeEach(() => localStorage.clear());

  it('starts with empty searches');
  it('adds search to beginning of list');
  it('deduplicates searches');
  it('limits to max items');
  it('clears all searches');
});
```

✅ **Verify:** `npm run verify`
📝 **Commit:** `feat(search): add useRecentSearches hook with tests`

---

#### Step 3.13: Build RecentSearches Component + Tests

**Create `src/components/search/RecentSearches.tsx`**

**Create `src/components/search/RecentSearches.test.tsx`:**

```typescript
describe('RecentSearches', () => {
  it('renders dropdown with recent searches');
  it('calls onSelect when search clicked');
  it('renders clear button');
  it('calls onClear when clear clicked');
  it('closes on escape key');
  it('uses useMounted for hydration safety');
});
```

✅ **Verify:** `npm run verify`
📝 **Commit:** `feat(search): add RecentSearches dropdown component with tests`

---

#### Step 3.14: Integrate RecentSearches into SearchBar

**Update `src/components/search/SearchBar.tsx`**

✅ **Verify:** `npm run verify`
📝 **Commit:** `feat(search): integrate RecentSearches into SearchBar`

---

#### Step 3.15: Implement Prefetching for Pagination

**Update `src/components/search/SearchPagination.tsx`:**

```typescript
// Add onMouseEnter prefetch for next/prev pages
const queryClient = useQueryClient();

const handlePrefetch = (page: number) => {
  queryClient.prefetchQuery({
    queryKey: ['movies', { ...params, page }],
    queryFn: () => fetchMovies({ ...params, page }),
  });
};
```

✅ **Verify:** `npm run verify`
📝 **Commit:** `feat(search): add prefetching on pagination hover`

---

#### Step 3.16: Build ErrorMessage Component

**Create `src/components/shared/ErrorMessage.tsx`**

✅ **Verify:** `npm run verify`
📝 **Commit:** `feat(shared): add ErrorMessage component`

---

#### Step 3.17: Build Error Boundaries

**Create `src/app/error.tsx`:**

```typescript
'use client';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <ErrorMessage
      message={error.message}
      onRetry={reset}
    />
  );
}
```

✅ **Verify:** `npm run verify`
📝 **Commit:** `feat(pages): add global error boundary`

---

#### Step 3.18: Set Up Toast Notifications

```bash
npx shadcn@latest add sonner
```

**Update `src/app/layout.tsx` to include Toaster**

**Create utility `src/lib/utils/toast.ts`:**

```typescript
import { toast } from 'sonner';

export const showSuccess = (message: string) => toast.success(message);
export const showError = (message: string) => toast.error(message);
```

✅ **Verify:** `npm run verify`
📝 **Commit:** `feat(ui): add toast notifications with Sonner`

---

#### Step 3.19: Add Toast to Favorites Actions

**Update useFavorites to show toasts:**

```typescript
const addFavorite = (movie: FavoriteMovie) => {
  setFavorites((prev) => [...prev, movie]);
  showSuccess(`Added "${movie.title}" to favorites`);
};
```

✅ **Verify:** `npm run verify`
📝 **Commit:** `feat(favorites): add toast notifications for favorite actions`

---

#### Phase 3 Summary

| Metric      | Target            |
| ----------- | ----------------- |
| **Commits** | ~19 small commits |
| **Tests**   | ~50-60 unit tests |
| **Time**    | ~8.5 hours        |

**Phase 3 Checklist:**

- [ ] useMovie hook with tests
- [ ] MovieDetails component with tests
- [ ] Movie detail page (async params)
- [ ] useLocalStorage hook with tests
- [ ] useFavorites hook with tests
- [ ] FavoriteButton with tests
- [ ] FavoritesList with tests
- [ ] EmptyFavorites component
- [ ] Favorites page
- [ ] FavoritesLink with tests
- [ ] useRecentSearches hook with tests
- [ ] RecentSearches component with tests
- [ ] Prefetching implemented
- [ ] ErrorMessage component
- [ ] Error boundaries
- [ ] Toast notifications
- [ ] All tests passing
- [ ] All types checking
- [ ] All lint rules passing

---

### Phase 4: Polish & Accessibility (Day 4 - Morning)

Each step follows: **Implement → Test → Verify → Commit**

---

#### Step 4.1: Build SkipLink Component + Tests

**Create `src/components/shared/SkipLink.tsx`:**

```typescript
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4
                 bg-primary text-primary-foreground px-4 py-2 rounded z-50"
    >
      Skip to main content
    </a>
  );
}
```

**Create `src/components/shared/SkipLink.test.tsx`:**

```typescript
describe('SkipLink', () => {
  it('is hidden by default');
  it('becomes visible on focus');
  it('links to #main-content');
  it('has correct accessible text');
});
```

✅ **Verify:** `npm run verify`
📝 **Commit:** `feat(a11y): add SkipLink component with tests`

---

#### Step 4.2: Add SkipLink to Layout

**Update `src/app/layout.tsx`:**

```typescript
<body>
  <SkipLink />
  <Providers>
    {children}
  </Providers>
</body>
```

**Update pages to have `id="main-content"` on main element**

✅ **Verify:** `npm run verify`
📝 **Commit:** `feat(a11y): integrate SkipLink into layout`

---

#### Step 4.3: Add aria-live Announcements

**Create `src/components/shared/LiveRegion.tsx`:**

```typescript
export function LiveRegion({ message, politeness = 'polite' }: LiveRegionProps) {
  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
}
```

**Update SearchResults to announce result count:**

```typescript
<LiveRegion message={`${totalResults} movies found for "${searchTerm}"`} />
```

✅ **Verify:** `npm run verify`
📝 **Commit:** `feat(a11y): add aria-live announcements for search results`

---

#### Step 4.4: Implement Focus Management After Search

**Update SearchResults to focus first result:**

```typescript
const firstResultRef = useRef<HTMLAnchorElement>(null);

useEffect(() => {
  if (data?.results.length && !isLoading) {
    firstResultRef.current?.focus();
  }
}, [data, isLoading]);
```

✅ **Verify:** `npm run verify`
📝 **Commit:** `feat(a11y): add focus management after search`

---

#### Step 4.5: Add All ARIA Labels

**Audit and update all interactive elements:**

```typescript
// SearchBar
<input
  type="search"
  role="searchbox"
  aria-label="Search movies"
  aria-describedby="search-hint"
/>

// MovieCard
<article aria-labelledby={`movie-title-${movie.id}`}>
  <h3 id={`movie-title-${movie.id}`}>{movie.title}</h3>
</article>

// Pagination
<nav aria-label="Search results pagination">
  <button aria-label="Go to previous page" />
  <button aria-label={`Go to page ${page}`} aria-current={isCurrent ? 'page' : undefined} />
  <button aria-label="Go to next page" />
</nav>

// FavoriteButton
<button aria-label={isFavorite ? `Remove ${title} from favorites` : `Add ${title} to favorites`} />
```

✅ **Verify:** `npm run verify`
📝 **Commit:** `feat(a11y): add comprehensive ARIA labels to all components`

---

#### Step 4.6: Implement Basic Keyboard Navigation

**Add keyboard support to essential interactions:**

```typescript
// SearchBar - Enter to submit
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Enter') handleSubmit();
  if (e.key === 'Escape') closeDropdown();
};

// RecentSearches - Arrow navigation
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'ArrowDown') focusNext();
  if (e.key === 'ArrowUp') focusPrev();
  if (e.key === 'Escape') onClose();
};
```

✅ **Verify:** `npm run verify`
📝 **Commit:** `feat(a11y): add keyboard navigation for essential interactions`

---

#### Step 4.7: Implement SEO Metadata

**Create `src/lib/seo/metadata.ts`:**

```typescript
import { Metadata } from 'next';

export function generateSearchMetadata(query?: string): Metadata {
  if (!query) {
    return {
      title: 'Buffalo Movie Search',
      description: 'Search thousands of movies...',
    };
  }
  return {
    title: `${query} - Buffalo Movie Search`,
    description: `Search results for "${query}"...`,
  };
}
```

**Update `src/app/page.tsx`:**

```typescript
export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const { search } = await searchParams;
  return generateSearchMetadata(search);
}
```

**Update `src/app/movie/[id]/page.tsx`:**

```typescript
export async function generateMetadata({ params }: MoviePageProps): Promise<Metadata> {
  const { id } = await params;
  const movie = await fetchMovie(id);
  return {
    title: `${movie.title} - Buffalo Movie Search`,
    description: movie.overview,
    openGraph: {
      images: [movie.posterUrl],
    },
  };
}
```

✅ **Verify:** `npm run verify`
📝 **Commit:** `feat(seo): add dynamic metadata for all pages`

---

#### Step 4.8: Add Open Graph Images

**Create `src/app/opengraph-image.tsx`:**

```typescript
import { ImageResponse } from 'next/og';

export default function OGImage() {
  return new ImageResponse(
    <div style={{ /* ... */ }}>
      Buffalo Movie Search
    </div>,
    { width: 1200, height: 630 }
  );
}
```

✅ **Verify:** Check `/opengraph-image` in browser
📝 **Commit:** `feat(seo): add Open Graph image generation`

---

#### Step 4.9: Responsive Design Polish

**Audit and fix responsive issues:**

```typescript
// MovieGrid - responsive columns
<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">

// SearchBar - full width on mobile
<div className="w-full md:w-96">

// MovieDetails - stack on mobile
<div className="flex flex-col md:flex-row gap-6">
```

✅ **Verify:** Test on mobile viewport in dev tools
📝 **Commit:** `style: polish responsive design for all breakpoints`

---

#### Step 4.10: Animation Polish

**Add subtle animations:**

```typescript
// MovieCard hover
<article className="transition-transform duration-200 hover:scale-105">

// Skeleton pulse (already in shadcn)
<Skeleton className="animate-pulse" />

// Theme transition
<body className="transition-colors duration-300">

// Toast animations (handled by Sonner)
```

✅ **Verify:** `npm run verify`
📝 **Commit:** `style: add subtle animations and transitions`

---

#### Phase 4 Summary

| Metric      | Target                     |
| ----------- | -------------------------- |
| **Commits** | ~10 small commits          |
| **Tests**   | ~10-15 accessibility tests |
| **Time**    | ~5.5 hours                 |

**Phase 4 Checklist:**

- [ ] SkipLink component with tests
- [ ] aria-live announcements
- [ ] Focus management after search
- [ ] All ARIA labels added
- [ ] Keyboard navigation (essential)
- [ ] SEO metadata for all pages
- [ ] Open Graph images
- [ ] Responsive design polished
- [ ] Animations added
- [ ] All tests passing
- [ ] All types checking
- [ ] All lint rules passing

---

### Phase 5: Additional Testing & E2E (Day 4 - Afternoon + Day 5 - Morning)

> **Note:** Unit tests were written incrementally in Phases 1-4. This phase focuses on integration tests, E2E tests, and filling any coverage gaps.

---

#### Step 5.1: Review Test Coverage

```bash
npm run test:coverage
```

**Identify gaps and prioritize:**

- Check untested edge cases
- Check error handling paths
- Check loading states

✅ **Verify:** Coverage report generated
📝 **Commit:** `test: add coverage reporting configuration`

---

#### Step 5.2: Set Up MSW for Integration Tests

**Create `src/__mocks__/server.ts`:**

```typescript
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

**Update `vitest.setup.ts`:**

```typescript
import { server } from './src/__mocks__/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

✅ **Verify:** `npm run test` still passes
📝 **Commit:** `test: configure MSW server for integration tests`

---

#### Step 5.3: Create Comprehensive Mock Data

**Create `src/__mocks__/data/movies.ts`:**

```typescript
export const mockMovies: Movie[] = [
  { id: '1', title: 'The Matrix' /* ... */ },
  { id: '2', title: 'Inception' /* ... */ },
  // 10-20 mock movies with varied data
];

export const mockMovie = mockMovies[0];
export const mockEmptyResults = { results: [], page: 1, totalPages: 0, totalResults: 0 };
export const mockPaginatedResults = {
  results: mockMovies.slice(0, 5),
  page: 1,
  totalPages: 3,
  totalResults: 15,
};
```

**Create `src/__mocks__/data/genres.ts`:**

```typescript
export const mockGenres: Genre[] = [
  { id: 1, name: 'Action' },
  { id: 2, name: 'Comedy' },
  // All genres
];
```

✅ **Verify:** `npm run type-check` passes
📝 **Commit:** `test: add comprehensive mock data for testing`

---

#### Step 5.4: Write Integration Test - Search Flow

**Create `src/__tests__/integration/search-flow.test.tsx`:**

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import HomePage from '@/app/page';

describe('Search Flow Integration', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  beforeEach(() => queryClient.clear());

  it('shows browse movies on initial load', async () => {
    render(<HomePage />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText('The Matrix')).toBeInTheDocument();
    });
  });

  it('searches for movies and displays results', async () => {
    render(<HomePage />, { wrapper });

    const searchInput = screen.getByRole('searchbox');
    fireEvent.change(searchInput, { target: { value: 'batman' } });

    await waitFor(() => {
      expect(screen.getByText('Batman Begins')).toBeInTheDocument();
    });
  });

  it('shows empty state for no results', async () => {
    // Mock empty response
    server.use(
      http.get('/api/movies', () => HttpResponse.json(mockEmptyResults))
    );

    render(<HomePage />, { wrapper });
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'xyznonexistent' } });

    await waitFor(() => {
      expect(screen.getByText(/no movies found/i)).toBeInTheDocument();
    });
  });

  it('filters by genre', async () => {
    render(<HomePage />, { wrapper });

    const genreSelect = screen.getByRole('combobox', { name: /genre/i });
    fireEvent.change(genreSelect, { target: { value: 'Action' } });

    await waitFor(() => {
      // Verify filtered results
    });
  });
});
```

✅ **Verify:** `npm run verify`
📝 **Commit:** `test(integration): add search flow integration tests`

---

#### Step 5.5: Write Integration Test - Pagination Flow

**Create `src/__tests__/integration/pagination-flow.test.tsx`:**

```typescript
describe('Pagination Flow Integration', () => {
  it('loads initial page');
  it('navigates to next page');
  it('navigates to previous page');
  it('navigates to specific page');
  it('updates URL on page change');
  it('restores page from URL on load');
});
```

✅ **Verify:** `npm run verify`
📝 **Commit:** `test(integration): add pagination flow integration tests`

---

#### Step 5.6: Write Integration Test - Favorites Flow

**Create `src/__tests__/integration/favorites-flow.test.tsx`:**

```typescript
describe('Favorites Flow Integration', () => {
  beforeEach(() => localStorage.clear());

  it('adds movie to favorites');
  it('removes movie from favorites');
  it('shows favorites count in header');
  it('persists favorites across page reload');
  it('displays favorites on favorites page');
  it('shows empty state when no favorites');
});
```

✅ **Verify:** `npm run verify`
📝 **Commit:** `test(integration): add favorites flow integration tests`

---

#### Step 5.7: Set Up Playwright

```bash
npm install -D @playwright/test
npx playwright install
```

**Create `playwright.config.ts`:**

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './src/__tests__/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile', use: { ...devices['iPhone 13'] } },
  ],
  webServer: {
    command: 'npm run build && npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

**Update `package.json`:**

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

✅ **Verify:** `npx playwright test --version`
📝 **Commit:** `test: configure Playwright for E2E testing`

---

#### Step 5.8: Write E2E Test - Search Flow

**Create `src/__tests__/e2e/search.spec.ts`:**

```typescript
import { test, expect } from '@playwright/test';

test.describe('Search Flow', () => {
  test('homepage shows browse movies', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Buffalo Movie Search');
    await expect(page.locator('[data-testid="movie-card"]').first()).toBeVisible();
  });

  test('user can search for movies', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('searchbox').fill('batman');
    await page.waitForTimeout(600); // Wait for debounce

    await expect(page.locator('[data-testid="movie-card"]')).toHaveCount.greaterThan(0);
    await expect(page.url()).toContain('search=batman');
  });

  test('user can filter by genre', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('combobox', { name: /genre/i }).selectOption('Action');

    await expect(page.url()).toContain('genre=Action');
  });

  test('user can paginate results', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: /next/i }).click();

    await expect(page.url()).toContain('page=2');
  });

  test('search state persists in URL', async ({ page }) => {
    await page.goto('/?search=inception&genre=Action&page=2');

    await expect(page.getByRole('searchbox')).toHaveValue('inception');
    await expect(page.getByRole('combobox', { name: /genre/i })).toHaveValue('Action');
  });

  test('back button preserves search', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('searchbox').fill('matrix');
    await page.waitForTimeout(600);

    await page.locator('[data-testid="movie-card"]').first().click();
    await expect(page.url()).toContain('/movie/');

    await page.goBack();
    await expect(page.getByRole('searchbox')).toHaveValue('matrix');
  });
});
```

✅ **Verify:** `npm run test:e2e`
📝 **Commit:** `test(e2e): add search flow E2E tests`

---

#### Step 5.9: Write E2E Test - Movie Detail

**Create `src/__tests__/e2e/movie-detail.spec.ts`:**

```typescript
import { test, expect } from '@playwright/test';

test.describe('Movie Detail', () => {
  test('user can view movie details', async ({ page }) => {
    await page.goto('/');

    const firstMovie = page.locator('[data-testid="movie-card"]').first();
    const movieTitle = await firstMovie.locator('h3').textContent();
    await firstMovie.click();

    await expect(page.locator('h1')).toContainText(movieTitle);
    await expect(page.locator('[data-testid="movie-overview"]')).toBeVisible();
  });

  test('user can add to favorites from detail page', async ({ page }) => {
    await page.goto('/movie/1');

    await page.getByRole('button', { name: /add.*favorites/i }).click();

    await expect(page.getByRole('button', { name: /remove.*favorites/i })).toBeVisible();
  });

  test('user can navigate back', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-testid="movie-card"]').first().click();

    await page.goBack();

    await expect(page.url()).toBe('http://localhost:3000/');
  });
});
```

✅ **Verify:** `npm run test:e2e`
📝 **Commit:** `test(e2e): add movie detail E2E tests`

---

#### Step 5.10: Write E2E Test - Favorites

**Create `src/__tests__/e2e/favorites.spec.ts`:**

```typescript
import { test, expect } from '@playwright/test';

test.describe('Favorites', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('user can add and view favorites', async ({ page }) => {
    await page.goto('/');

    // Add first movie to favorites
    await page.locator('[data-testid="favorite-button"]').first().click();

    // Navigate to favorites page
    await page.getByRole('link', { name: /favorites/i }).click();

    await expect(page.locator('[data-testid="movie-card"]')).toHaveCount(1);
  });

  test('user can remove from favorites', async ({ page }) => {
    // Add a favorite first
    await page.goto('/');
    await page.locator('[data-testid="favorite-button"]').first().click();

    // Go to favorites
    await page.goto('/favorites');

    // Remove
    await page.locator('[data-testid="remove-favorite"]').click();

    await expect(page.locator('[data-testid="empty-favorites"]')).toBeVisible();
  });

  test('shows empty state when no favorites', async ({ page }) => {
    await page.goto('/favorites');

    await expect(page.locator('[data-testid="empty-favorites"]')).toBeVisible();
    await expect(page.getByText(/no favorites yet/i)).toBeVisible();
  });

  test('favorites persist across page reload', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-testid="favorite-button"]').first().click();

    await page.reload();

    const badge = page.locator('[data-testid="favorites-count"]');
    await expect(badge).toContainText('1');
  });
});
```

✅ **Verify:** `npm run test:e2e`
📝 **Commit:** `test(e2e): add favorites E2E tests`

---

#### Step 5.11: Write E2E Test - Accessibility

**Create `src/__tests__/e2e/accessibility.spec.ts`:**

```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility', () => {
  test('homepage has no accessibility violations', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('movie detail page has no accessibility violations', async ({ page }) => {
    await page.goto('/movie/1');

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('skip link works', async ({ page }) => {
    await page.goto('/');

    await page.keyboard.press('Tab');

    const skipLink = page.locator('a:has-text("Skip to main content")');
    await expect(skipLink).toBeFocused();

    await page.keyboard.press('Enter');

    const mainContent = page.locator('#main-content');
    await expect(mainContent).toBeFocused();
  });

  test('keyboard navigation works', async ({ page }) => {
    await page.goto('/');

    // Tab to search
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('searchbox')).toBeFocused();

    // Type and search
    await page.keyboard.type('batman');
    await page.waitForTimeout(600);

    // Tab to first result
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="movie-card"] a').first()).toBeFocused();
  });
});
```

```bash
npm install -D @axe-core/playwright
```

✅ **Verify:** `npm run test:e2e`
📝 **Commit:** `test(e2e): add accessibility E2E tests with axe-core`

---

#### Step 5.12: Fill Coverage Gaps

**Run coverage and add tests for uncovered code:**

```bash
npm run test:coverage
```

**Typical gaps to address:**

- Error handling paths
- Edge cases (empty strings, null values)
- Loading states
- Boundary conditions

✅ **Verify:** Coverage > 80%
📝 **Commit:** `test: fill coverage gaps and improve edge case testing`

---

#### Phase 5 Summary

| Metric                | Target                |
| --------------------- | --------------------- |
| **Commits**           | ~12 small commits     |
| **Unit Tests**        | 80+ (from all phases) |
| **Integration Tests** | 15-20                 |
| **E2E Tests**         | 15-20                 |
| **Coverage**          | >80%                  |
| **Time**              | ~9 hours              |

**Phase 5 Checklist:**

- [ ] MSW configured for integration tests
- [ ] Comprehensive mock data created
- [ ] Search flow integration tests
- [ ] Pagination flow integration tests
- [ ] Favorites flow integration tests
- [ ] Playwright configured
- [ ] Search E2E tests
- [ ] Movie detail E2E tests
- [ ] Favorites E2E tests
- [ ] Accessibility E2E tests with axe
- [ ] Coverage gaps filled
- [ ] All tests passing
- [ ] Coverage >80%

---

### Phase 6: DevOps & Documentation (Day 5 - Afternoon)

Each step follows: **Implement → Verify → Commit**

---

#### Step 6.1: Create GitHub Repository

```bash
# Initialize git (if not already)
git init

# Create .gitignore
cat > .gitignore << EOF
# Dependencies
node_modules/
.pnpm-store/

# Next.js
.next/
out/

# Testing
coverage/
playwright-report/
test-results/

# Environment
.env
.env.local
.env.*.local

# IDE
.idea/
.vscode/
*.swp

# OS
.DS_Store
Thumbs.db

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
EOF

# Create GitHub repo
gh repo create buffalo-movie-search --public --source=. --remote=origin

# Push initial commit
git add .
git commit -m "chore: initial project setup"
git push -u origin main
```

✅ **Verify:** Repository visible on GitHub
📝 **Commit:** `chore: initialize git repository`

---

#### Step 6.2: Set Up GitHub Actions - CI

**Create `.github/workflows/ci.yml`:**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint:
    name: Lint & Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check

  test:
    name: Unit & Integration Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v4
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          fail_ci_if_error: false

  e2e:
    name: E2E Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run build
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/

  build:
    name: Build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
```

✅ **Verify:** Push and check Actions tab on GitHub
📝 **Commit:** `ci: add GitHub Actions workflow for lint, test, and build`

---

#### Step 6.3: Set Up Branch Protection

**On GitHub:**

1. Go to Settings → Branches
2. Add rule for `main`:
   - Require status checks to pass
   - Require branches to be up to date
   - Select: lint, test, e2e, build

✅ **Verify:** Branch protection rules active
📝 **Document:** Update README with contribution guidelines

---

#### Step 6.4: Configure Vercel Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Link project
vercel link

# Deploy preview
vercel

# Deploy to production
vercel --prod
```

**Set up automatic deployments:**

1. Go to vercel.com
2. Import GitHub repository
3. Configure:
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`

✅ **Verify:** Preview deployment works
📝 **Commit:** `ci: configure Vercel deployment`

---

#### Step 6.5: Set Up Environment Variables

**On Vercel:**

1. Go to Project Settings → Environment Variables
2. Add:
   - `MOVIE_API_BASE_URL` = `https://0kadddxyh3.execute-api.us-east-1.amazonaws.com`

**Create `.env.example`:**

```bash
# Movies API
MOVIE_API_BASE_URL=https://0kadddxyh3.execute-api.us-east-1.amazonaws.com

# Optional: Analytics
# NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

✅ **Verify:** Production deployment uses environment variables
📝 **Commit:** `chore: add environment variable configuration`

---

#### Step 6.6: Write Comprehensive README

**Create/Update `README.md`:**

````markdown
# 🎬 Buffalo Movie Search

A modern, accessible movie search application built with Next.js 15 and React 19.

![CI Status](https://github.com/username/buffalo-movie-search/actions/workflows/ci.yml/badge.svg)
![Coverage](https://img.shields.io/codecov/c/github/username/buffalo-movie-search)
![License](https://img.shields.io/badge/license-MIT-blue)

## ✨ Features

- 🔍 **Instant Search** - Debounced search with 500ms delay
- 🎭 **Genre Filtering** - Filter movies by genre
- 📄 **Pagination** - Navigate through results with prefetching
- ❤️ **Favorites** - Save movies to your favorites (localStorage)
- 🕐 **Recent Searches** - Quick access to your search history
- 🌙 **Dark Mode** - System preference with toggle
- ♿ **Accessible** - WCAG AA compliant, full keyboard navigation
- 📱 **Responsive** - Works on all devices

## 🛠️ Tech Stack

| Category   | Technology              |
| ---------- | ----------------------- |
| Framework  | Next.js 15 (App Router) |
| Runtime    | React 19                |
| Language   | TypeScript              |
| Styling    | Tailwind CSS            |
| UI         | shadcn/ui               |
| Data       | TanStack React Query    |
| URL State  | nuqs                    |
| Validation | Zod                     |
| Testing    | Vitest, Playwright      |

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- npm 10+

### Installation

\`\`\`bash

# Clone the repository

git clone https://github.com/username/buffalo-movie-search.git
cd buffalo-movie-search

# Install dependencies

npm install

# Copy environment variables

cp .env.example .env.local

# Start development server

npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📜 Scripts

| Command                 | Description                          |
| ----------------------- | ------------------------------------ |
| `npm run dev`           | Start development server (Turbopack) |
| `npm run build`         | Build for production                 |
| `npm run start`         | Start production server              |
| `npm run lint`          | Run ESLint                           |
| `npm run type-check`    | Run TypeScript compiler check        |
| `npm run test`          | Run unit tests                       |
| `npm run test:watch`    | Run tests in watch mode              |
| `npm run test:coverage` | Run tests with coverage              |
| `npm run test:e2e`      | Run E2E tests                        |
| `npm run verify`        | Run all checks (type, lint, test)    |

## 📁 Project Structure

\`\`\`
src/
├── app/ # Next.js App Router
│ ├── page.tsx # Home/Search page
│ ├── movie/[id]/ # Movie detail page
│ ├── favorites/ # Favorites page
│ └── api/ # API routes
├── components/ # React components
│ ├── ui/ # shadcn/ui components
│ ├── search/ # Search feature components
│ ├── movie/ # Movie feature components
│ └── layout/ # Layout components
├── features/ # Feature-specific hooks
├── lib/ # Utilities & providers
└── types/ # TypeScript types
\`\`\`

## 🧪 Testing

\`\`\`bash

# Unit & Integration tests

npm run test

# E2E tests

npm run test:e2e

# Coverage report

npm run test:coverage
\`\`\`

## ♿ Accessibility

- Skip link for keyboard users
- ARIA labels on all interactive elements
- Focus management after search
- Screen reader announcements
- Keyboard navigation support
- Color contrast WCAG AA compliant

## 📄 License

MIT
\`\`\`

✅ **Verify:** README renders correctly on GitHub
📝 **Commit:** `docs: add comprehensive README`

---

#### Step 6.7: Create Architecture Diagram

**Add to README or create `docs/ARCHITECTURE.md`:**

Include the ASCII diagrams from this plan:

- High-level architecture
- Data flow
- Token management

✅ **Verify:** Diagrams visible in documentation
📝 **Commit:** `docs: add architecture documentation`

---

#### Step 6.8: Final Testing & Bug Fixes

```bash
# Run all checks
npm run verify

# Run E2E tests
npm run test:e2e

# Build production
npm run build

# Test production build locally
npm run start
```
````

**Manual testing checklist:**

- [ ] Search works
- [ ] Genre filter works
- [ ] Pagination works
- [ ] Movie detail page works
- [ ] Favorites work (add/remove/persist)
- [ ] Recent searches work
- [ ] Dark mode works
- [ ] Mobile responsive
- [ ] Keyboard navigation
- [ ] Skip link
- [ ] Error states

✅ **Verify:** All manual tests pass
📝 **Commit:** `fix: address final bug fixes and edge cases`

---

#### Step 6.9: Performance Audit

```bash
# Build and analyze bundle
npm run build

# Check bundle size
npx @next/bundle-analyzer
```

**Lighthouse audit:**

1. Run production build: `npm run build && npm run start`
2. Open Chrome DevTools → Lighthouse
3. Run audit for: Performance, Accessibility, Best Practices, SEO

**Target scores:**

- Performance: >90
- Accessibility: >95
- Best Practices: >95
- SEO: >95

✅ **Verify:** Lighthouse scores meet targets
📝 **Commit:** `perf: optimize bundle size and performance`

---

#### Step 6.10: Accessibility Audit

```bash
# Run axe audit via E2E tests
npm run test:e2e -- accessibility
```

**Manual audit:**

1. Test with screen reader (VoiceOver/NVDA)
2. Test keyboard-only navigation
3. Test with reduced motion preference
4. Test color contrast

✅ **Verify:** No accessibility violations
📝 **Commit:** `fix(a11y): address accessibility audit findings`

---

#### Step 6.11: Final Deploy

```bash
# Final verification
npm run verify
npm run build
npm run test:e2e

# Deploy to production
vercel --prod
```

✅ **Verify:** Production site working at vercel URL
📝 **Commit:** `chore: prepare for production release`

---

#### Phase 6 Summary

| Metric      | Target            |
| ----------- | ----------------- |
| **Commits** | ~11 small commits |
| **Time**    | ~6 hours          |

**Phase 6 Checklist:**

- [ ] GitHub repository created
- [ ] GitHub Actions CI working
- [ ] Branch protection enabled
- [ ] Vercel deployment configured
- [ ] Environment variables set
- [ ] README complete
- [ ] Architecture documented
- [ ] All tests passing
- [ ] Performance audit passed
- [ ] Accessibility audit passed
- [ ] Production deployed

---

### Time Summary

| Phase                      | Hours           | Day                 | Commits         |
| -------------------------- | --------------- | ------------------- | --------------- |
| Phase 1: Foundation        | 5.5             | Day 1               | ~18             |
| Phase 2: Core Features     | 7.5             | Day 2               | ~18             |
| Phase 3: Enhanced Features | 8.5             | Day 3               | ~19             |
| Phase 4: Polish & A11y     | 5.5             | Day 4 AM            | ~10             |
| Phase 5: Testing & E2E     | 9               | Day 4 PM + Day 5 AM | ~12             |
| Phase 6: DevOps & Docs     | 6               | Day 5 PM            | ~11             |
| **Total**                  | **~42.5 hours** | **5 days**          | **~88 commits** |

### Commit Guidelines Summary

Every step in implementation follows this workflow:

```
1. IMPLEMENT  →  Small, focused change
2. TEST       →  Write unit/integration tests
3. VERIFY     →  npm run verify (type-check + lint + test)
4. COMMIT     →  Conventional commit message
5. REPEAT     →  Next small step
```

**Golden Rules:**

- ✅ Each commit is small and focused
- ✅ Each commit passes all checks (types, lint, tests)
- ✅ Each commit has a conventional commit message
- ✅ Tests are written alongside implementation, not after
- ✅ Never commit broken code

---

## 13. DevOps & CI/CD

### 13.1 GitHub Actions - CI

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run build
      - run: npm run test:e2e

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
```

### 13.2 Husky Hooks

```bash
# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,css}": ["prettier --write"]
  }
}
```

### 13.3 Environment Variables

```bash
# .env.local
MOVIES_API_BASE_URL=https://0kadddxyh3.execute-api.us-east-1.amazonaws.com
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

```bash
# .env.example
MOVIES_API_BASE_URL=
NEXT_PUBLIC_APP_URL=
```

---

## 14. README Template

````markdown
# 🎬 Buffalo Movie Search

A modern, accessible movie search application built with Next.js 15 and React 19.

![Buffalo Movie Search Screenshot](./public/og-image.png)

## 🚀 Live Demo

**[View Live Demo →](https://buffalo-movie-search.vercel.app)**

## ✨ Features

### Core Features

- 🔍 **Movie Search** - Search thousands of movies by title
- 🎭 **Genre Filtering** - Filter results by genre
- 📄 **Pagination** - Navigate through paginated results
- 🎬 **Movie Details** - View comprehensive movie information
- 🔥 **Browse Movies** - Explore movies on the homepage

### Enhanced Features

- ❤️ **Favorites Page** - Dedicated page for your saved movies (`/favorites`)
- 🕐 **Recent Searches** - Quick access to your search history
- 🌙 **Dark Mode** - System-aware theme with manual toggle
- 🔗 **Shareable URLs** - Share search results via URL

### Technical Highlights

- ⚡ **Optimistic UI** - Instant feedback on user actions
- 🚀 **Prefetching** - Next page preloaded on hover
- ♿ **Accessible** - Full keyboard navigation, screen reader support
- 📱 **Responsive** - Mobile-first design

## 🏗 Tech Stack

| Category      | Technology               |
| ------------- | ------------------------ |
| Framework     | Next.js 15 (App Router)  |
| Runtime       | React 19                 |
| Language      | TypeScript               |
| Styling       | Tailwind CSS + shadcn/ui |
| Data Fetching | TanStack React Query     |
| Validation    | Zod                      |
| Testing       | Vitest + Playwright      |
| Deployment    | Vercel                   |

## 🧠 Technical Decisions

### Why React Query with Next.js?

[Include the full justification from Section 2]

### Architecture Overview

[Include architecture diagram]

## 🎯 What I'm Most Proud Of

1. **Type-Safe API Layer** - Full Zod validation with DTO transformation
2. **Accessibility** - Complete keyboard navigation and screen reader support
3. **Testing Coverage** - Unit, integration, and E2E tests
4. **Developer Experience** - CI/CD, linting, pre-commit hooks

## 🔮 Future Improvements

Given more time, I would add:

1. **Multi-genre filtering** - Client-side filtering for multiple genres
2. **Advanced search** - Filter by year, rating, runtime
3. **User accounts** - Persist favorites across devices
4. **Movie recommendations** - "Similar movies" section
5. **Performance monitoring** - Integrate with Vercel Analytics

## 🏃 Running Locally

### Prerequisites

- Node.js 20+
- npm 9+

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/buffalo-movie-search.git
cd buffalo-movie-search

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your values

# Start development server
npm run dev
```
````

### Available Scripts

| Script               | Description              |
| -------------------- | ------------------------ |
| `npm run dev`        | Start development server |
| `npm run build`      | Build for production     |
| `npm run start`      | Start production server  |
| `npm run lint`       | Run ESLint               |
| `npm run test`       | Run unit tests           |
| `npm run test:e2e`   | Run E2E tests            |
| `npm run type-check` | Run TypeScript check     |

## 🧪 Testing

```bash
# Unit & Integration tests
npm run test

# With coverage
npm run test:coverage

# E2E tests
npm run test:e2e

# E2E with UI
npm run test:e2e:ui
```

## 📁 Project Structure

```
buffalo-movie-search/
├── app/                 # Next.js App Router
├── components/          # React components
│   ├── ui/             # shadcn components
│   ├── search/         # Search feature components
│   ├── movie/          # Movie feature components
│   └── layout/         # Layout components
├── features/           # Feature modules
├── lib/                # Utilities & providers
├── types/              # TypeScript types
└── __tests__/          # Test files
```

## 🙏 Acknowledgments

- Movie data provided by [Movies API](https://github.com/thisdot/movies-api)
- UI components from [shadcn/ui](https://ui.shadcn.com)

## 📄 License

MIT License - feel free to use this project as a reference.

```

---

## Checklist Before Starting

- [ ] All decisions documented
- [ ] Architecture understood
- [ ] API endpoints known
- [ ] Types defined
- [ ] Component specs clear
- [ ] Testing strategy clear
- [ ] Implementation order clear

---

**Ready to begin implementation!** 🚀
```
