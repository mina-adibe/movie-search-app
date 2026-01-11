'use client';

import { useState, useCallback } from 'react';
import { useQueryState, parseAsInteger, parseAsString } from 'nuqs';
import { SearchBar } from './SearchBar';
import { SearchPagination } from './SearchPagination';
import { GenreFilter } from './GenreFilter';
import { MovieGrid, MovieGridSkeleton } from '@/components/movies';
import { useMovieSearch, useDebounce } from '@/lib/hooks';
import type { PaginationInfo } from '@/types/movie';

export function SearchResults() {
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);

  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
  const [genre, setGenre] = useQueryState('genre', parseAsString.withDefault(''));

  const { data, isLoading, isFetching } = useMovieSearch({
    search: debouncedSearch,
    genre: genre && genre !== 'all' ? genre : undefined,
    page,
  });

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchInput(value);
      setPage(1);
    },
    [setPage]
  );

  const handleGenreChange = useCallback(
    (value: string) => {
      setGenre(value === 'all' ? null : value);
      setPage(1);
    },
    [setGenre, setPage]
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      setPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [setPage]
  );

  const pagination: PaginationInfo | null = data
    ? {
        currentPage: data.currentPage,
        totalPages: data.totalPages,
        hasNextPage: data.currentPage < data.totalPages,
        hasPrevPage: data.currentPage > 1,
      }
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <SearchBar
          value={searchInput}
          onChange={handleSearchChange}
          isLoading={isFetching}
          className="flex-1 sm:max-w-md"
        />
        <GenreFilter value={genre || 'all'} onChange={handleGenreChange} />
      </div>

      {isLoading ? (
        <MovieGridSkeleton />
      ) : data?.results ? (
        <>
          <MovieGrid movies={data.results} />
          {pagination && (
            <SearchPagination
              pagination={pagination}
              onPageChange={handlePageChange}
              isLoading={isFetching}
              className="mt-8"
            />
          )}
        </>
      ) : null}
    </div>
  );
}
