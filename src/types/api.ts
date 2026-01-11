import { z } from 'zod';

// ══════════════════════════════════════════════════════════════
// API Response Schemas - Based on actual API inspection
// Base URL: https://0kadddxyh3.execute-api.us-east-1.amazonaws.com
// ══════════════════════════════════════════════════════════════

// Token response from GET /auth/token
export const TokenResponseSchema = z.object({
  token: z.string(),
});

// Genre in movie details
export const GenreDTOSchema = z.object({
  id: z.string(),
  title: z.string(),
});

// Movie list item from GET /movies
export const MovieListItemDTOSchema = z.object({
  id: z.string(),
  title: z.string(),
  posterUrl: z.string().nullable().optional(),
  rating: z.string().optional().default('NR'),
});

// Movie search response from GET /movies
export const MovieSearchResponseDTOSchema = z.object({
  data: z.array(MovieListItemDTOSchema),
  totalPages: z.number(),
});

// Full movie details from GET /movies/:id
export const MovieDetailDTOSchema = z.object({
  id: z.string(),
  title: z.string(),
  posterUrl: z.string().nullable().optional(),
  rating: z.string().optional().default('NR'),
  summary: z.string().optional().default('No summary available.'),
  duration: z.string().nullable().optional(),
  directors: z.array(z.string()).optional().default([]),
  mainActors: z.array(z.string()).optional().default([]),
  datePublished: z.string().optional().default(''),
  ratingValue: z.number().optional().default(0),
  bestRating: z.number().optional().default(10),
  worstRating: z.number().optional().default(1),
  writers: z.array(z.string()).optional().default([]),
  genres: z.array(GenreDTOSchema).optional().default([]),
});

// Genre list item from GET /genres/movies
export const GenreListItemDTOSchema = z.object({
  id: z.string(),
  title: z.string(),
  movies: z.array(z.object({ id: z.string() })).optional(),
});

// Genres response from GET /genres/movies
export const GenresResponseDTOSchema = z.object({
  data: z.array(GenreListItemDTOSchema),
});

// Inferred types
export type TokenResponse = z.infer<typeof TokenResponseSchema>;
export type GenreDTO = z.infer<typeof GenreDTOSchema>;
export type MovieListItemDTO = z.infer<typeof MovieListItemDTOSchema>;
export type MovieSearchResponseDTO = z.infer<typeof MovieSearchResponseDTOSchema>;
export type MovieDetailDTO = z.infer<typeof MovieDetailDTOSchema>;
export type GenreListItemDTO = z.infer<typeof GenreListItemDTOSchema>;
export type GenresResponseDTO = z.infer<typeof GenresResponseDTOSchema>;
