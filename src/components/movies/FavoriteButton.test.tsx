import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FavoriteButton } from './FavoriteButton';
import type { MovieListItem } from '@/types/movie';

const mockToggleFavorite = vi.fn();
const mockIsFavorite = vi.fn();

vi.mock('@/lib/hooks/useFavorites', () => ({
  useFavorites: () => ({
    isFavorite: mockIsFavorite,
    toggleFavorite: mockToggleFavorite,
  }),
}));

vi.mock('@/lib/hooks/useMounted', () => ({
  useMounted: () => true,
}));

const mockMovie: MovieListItem = {
  id: '1',
  title: 'Inception',
  posterUrl: null,
  rating: 'PG-13',
};

describe('FavoriteButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsFavorite.mockReturnValue(false);
  });

  it('renders add to favorites button when not favorite', () => {
    render(<FavoriteButton movie={mockMovie} />);
    expect(screen.getByRole('button', { name: /add to favorites/i })).toBeInTheDocument();
  });

  it('renders remove from favorites button when favorite', () => {
    mockIsFavorite.mockReturnValue(true);
    render(<FavoriteButton movie={mockMovie} />);
    expect(screen.getByRole('button', { name: /remove from favorites/i })).toBeInTheDocument();
  });

  it('calls toggleFavorite when clicked', () => {
    render(<FavoriteButton movie={mockMovie} />);
    fireEvent.click(screen.getByRole('button'));
    expect(mockToggleFavorite).toHaveBeenCalledWith(mockMovie);
  });

  it('renders icon variant', () => {
    render(<FavoriteButton movie={mockMovie} variant="icon" />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('h-9', 'w-9');
  });

  it('applies custom className', () => {
    render(<FavoriteButton movie={mockMovie} className="custom-class" />);
    expect(screen.getByRole('button')).toHaveClass('custom-class');
  });
});
