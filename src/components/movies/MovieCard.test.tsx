import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MovieCard } from './MovieCard';
import type { MovieListItem } from '@/types/movie';

const mockMovie: MovieListItem = {
  id: '1',
  title: 'Inception',
  posterUrl: 'https://example.com/poster.jpg',
  rating: 'PG-13',
};

const mockMovieNoPoster: MovieListItem = {
  id: '2',
  title: 'No Poster Movie',
  posterUrl: null,
  rating: 'R',
};

const mockMovieNoRating: MovieListItem = {
  id: '3',
  title: 'Unrated Movie',
  posterUrl: 'https://example.com/poster.jpg',
  rating: 'NR',
};

describe('MovieCard', () => {
  it('renders movie title', () => {
    render(<MovieCard movie={mockMovie} />);
    expect(screen.getByText('Inception')).toBeInTheDocument();
  });

  it('renders as a link to movie detail page', () => {
    render(<MovieCard movie={mockMovie} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/movie/1');
  });

  it('renders poster image with alt text', () => {
    render(<MovieCard movie={mockMovie} />);
    const image = screen.getByAltText('Inception poster');
    expect(image).toBeInTheDocument();
  });

  it('renders placeholder when no poster', () => {
    render(<MovieCard movie={mockMovieNoPoster} />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  it('renders rating badge', () => {
    render(<MovieCard movie={mockMovie} />);
    expect(screen.getByText('PG-13')).toBeInTheDocument();
  });

  it('does not render rating badge for NR', () => {
    render(<MovieCard movie={mockMovieNoRating} />);
    expect(screen.queryByText('NR')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<MovieCard movie={mockMovie} className="custom-class" />);
    const card = container.querySelector('[data-slot="card"]');
    expect(card).toHaveClass('custom-class');
  });
});
