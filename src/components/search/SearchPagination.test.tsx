import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchPagination } from './SearchPagination';
import type { PaginationInfo } from '@/types/movie';

const mockPagination: PaginationInfo = {
  currentPage: 2,
  totalPages: 5,
  hasNextPage: true,
  hasPrevPage: true,
};

describe('SearchPagination', () => {
  it('renders pagination controls', () => {
    render(<SearchPagination pagination={mockPagination} onPageChange={() => {}} />);
    expect(screen.getByLabelText('Go to first page')).toBeInTheDocument();
    expect(screen.getByLabelText('Go to previous page')).toBeInTheDocument();
    expect(screen.getByLabelText('Go to next page')).toBeInTheDocument();
    expect(screen.getByLabelText('Go to last page')).toBeInTheDocument();
  });

  it('displays current page and total pages', () => {
    render(<SearchPagination pagination={mockPagination} onPageChange={() => {}} />);
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('calls onPageChange with correct page when clicking first', () => {
    const handlePageChange = vi.fn();
    render(<SearchPagination pagination={mockPagination} onPageChange={handlePageChange} />);

    fireEvent.click(screen.getByLabelText('Go to first page'));
    expect(handlePageChange).toHaveBeenCalledWith(1);
  });

  it('calls onPageChange with correct page when clicking previous', () => {
    const handlePageChange = vi.fn();
    render(<SearchPagination pagination={mockPagination} onPageChange={handlePageChange} />);

    fireEvent.click(screen.getByLabelText('Go to previous page'));
    expect(handlePageChange).toHaveBeenCalledWith(1);
  });

  it('calls onPageChange with correct page when clicking next', () => {
    const handlePageChange = vi.fn();
    render(<SearchPagination pagination={mockPagination} onPageChange={handlePageChange} />);

    fireEvent.click(screen.getByLabelText('Go to next page'));
    expect(handlePageChange).toHaveBeenCalledWith(3);
  });

  it('calls onPageChange with correct page when clicking last', () => {
    const handlePageChange = vi.fn();
    render(<SearchPagination pagination={mockPagination} onPageChange={handlePageChange} />);

    fireEvent.click(screen.getByLabelText('Go to last page'));
    expect(handlePageChange).toHaveBeenCalledWith(5);
  });

  it('disables previous buttons on first page', () => {
    const firstPagePagination: PaginationInfo = {
      currentPage: 1,
      totalPages: 5,
      hasNextPage: true,
      hasPrevPage: false,
    };

    render(<SearchPagination pagination={firstPagePagination} onPageChange={() => {}} />);

    expect(screen.getByLabelText('Go to first page')).toBeDisabled();
    expect(screen.getByLabelText('Go to previous page')).toBeDisabled();
    expect(screen.getByLabelText('Go to next page')).not.toBeDisabled();
    expect(screen.getByLabelText('Go to last page')).not.toBeDisabled();
  });

  it('disables next buttons on last page', () => {
    const lastPagePagination: PaginationInfo = {
      currentPage: 5,
      totalPages: 5,
      hasNextPage: false,
      hasPrevPage: true,
    };

    render(<SearchPagination pagination={lastPagePagination} onPageChange={() => {}} />);

    expect(screen.getByLabelText('Go to first page')).not.toBeDisabled();
    expect(screen.getByLabelText('Go to previous page')).not.toBeDisabled();
    expect(screen.getByLabelText('Go to next page')).toBeDisabled();
    expect(screen.getByLabelText('Go to last page')).toBeDisabled();
  });

  it('renders nothing when totalPages is 1', () => {
    const singlePagePagination: PaginationInfo = {
      currentPage: 1,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    };

    const { container } = render(
      <SearchPagination pagination={singlePagePagination} onPageChange={() => {}} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('disables all buttons when loading', () => {
    render(<SearchPagination pagination={mockPagination} onPageChange={() => {}} isLoading />);

    expect(screen.getByLabelText('Go to first page')).toBeDisabled();
    expect(screen.getByLabelText('Go to previous page')).toBeDisabled();
    expect(screen.getByLabelText('Go to next page')).toBeDisabled();
    expect(screen.getByLabelText('Go to last page')).toBeDisabled();
  });

  it('applies custom className', () => {
    const { container } = render(
      <SearchPagination
        pagination={mockPagination}
        onPageChange={() => {}}
        className="custom-class"
      />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('has proper navigation role', () => {
    render(<SearchPagination pagination={mockPagination} onPageChange={() => {}} />);
    expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeInTheDocument();
  });
});
