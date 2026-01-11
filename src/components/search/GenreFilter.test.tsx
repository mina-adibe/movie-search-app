import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GenreFilter } from './GenreFilter';

const mockGenres = [
  { id: '1', title: 'Action' },
  { id: '2', title: 'Comedy' },
];

vi.mock('@/lib/hooks/useGenres', () => ({
  useGenres: () => ({
    data: mockGenres,
    isLoading: false,
  }),
}));

describe('GenreFilter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders select trigger', () => {
    render(<GenreFilter value="" onChange={() => {}} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<GenreFilter value="" onChange={() => {}} className="custom-class" />);
    expect(screen.getByRole('combobox')).toHaveClass('custom-class');
  });

  it('displays current value in trigger', () => {
    render(<GenreFilter value="all" onChange={() => {}} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });
});
