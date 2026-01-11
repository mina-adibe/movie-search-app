'use client';

import { useState, useCallback } from 'react';
import { useQueryState, parseAsInteger, parseAsString } from 'nuqs';
import { SearchBar } from './SearchBar';
import { SearchPagination } from './SearchPagination';
import { MovieGrid, MovieGridSkeleton } from '@/components/movies';
import { useMovieSearch, useDebounce } from '@/lib/hooks';
import type { PaginationInfo } from '@/types/movie';

export function SearchResults() {
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);

  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
  const [genre] = useQueryState('genre', parseAsString.withDefault(''));

  const { data, isLoading, isFetching } = useMovieSearch({
    search: debouncedSearch,
    genre: genre || undefined,
    page,
  });

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchInput(value);
      setPage(1);
    },
    [setPage]
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
      <SearchBar
        value={searchInput}
        onChange={handleSearchChange}
        isLoading={isFetching}
        className="max-w-md"
      />

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
