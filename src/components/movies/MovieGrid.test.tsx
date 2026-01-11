import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MovieGrid } from './MovieGrid';
import type { MovieListItem } from '@/types/movie';

const mockMovies: MovieListItem[] = [
  { id: '1', title: 'Inception', posterUrl: null, rating: 'PG-13' },
  { id: '2', title: 'The Matrix', posterUrl: null, rating: 'R' },
  { id: '3', title: 'Interstellar', posterUrl: null, rating: 'PG-13' },
];

describe('MovieGrid', () => {
  it('renders all movies', () => {
    render(<MovieGrid movies={mockMovies} />);
    expect(screen.getByText('Inception')).toBeInTheDocument();
    expect(screen.getByText('The Matrix')).toBeInTheDocument();
    expect(screen.getByText('Interstellar')).toBeInTheDocument();
  });

  it('renders empty state when no movies', () => {
    render(<MovieGrid movies={[]} />);
    expect(screen.getByText('No movies found')).toBeInTheDocument();
    expect(screen.getByText('Try adjusting your search criteria')).toBeInTheDocument();
  });

  it('renders correct number of movie cards', () => {
    render(<MovieGrid movies={mockMovies} />);
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(3);
  });

  it('applies custom className', () => {
    const { container } = render(<MovieGrid movies={mockMovies} className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('links to correct movie pages', () => {
    render(<MovieGrid movies={mockMovies} />);
    expect(screen.getByRole('link', { name: /inception/i })).toHaveAttribute('href', '/movie/1');
    expect(screen.getByRole('link', { name: /matrix/i })).toHaveAttribute('href', '/movie/2');
    expect(screen.getByRole('link', { name: /interstellar/i })).toHaveAttribute('href', '/movie/3');
  });
});
