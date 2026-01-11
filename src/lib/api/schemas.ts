// Re-export schemas from types for API layer usage
export {
  TokenResponseSchema,
  GenreDTOSchema,
  MovieListItemDTOSchema,
  MovieSearchResponseDTOSchema,
  MovieDetailDTOSchema,
  GenreListItemDTOSchema,
  GenresResponseDTOSchema,
} from '@/types/api';

export type {
  TokenResponse,
  GenreDTO,
  MovieListItemDTO,
  MovieSearchResponseDTO,
  MovieDetailDTO,
  GenreListItemDTO,
  GenresResponseDTO,
} from '@/types/api';
