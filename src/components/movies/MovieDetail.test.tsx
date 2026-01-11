import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MovieDetail, MovieDetailSkeleton } from './MovieDetail';
import type { Movie } from '@/types/movie';

const mockMovie: Movie = {
  id: '1',
  title: 'Inception',
  summary: 'A mind-bending thriller about dream invasion.',
  genres: [
    { id: '1', title: 'Sci-Fi' },
    { id: '2', title: 'Action' },
  ],
  genreNames: 'Sci-Fi, Action',
  posterUrl: 'https://example.com/poster.jpg',
  datePublished: '2010-07-16',
  releaseYear: 2010,
  rating: 'PG-13',
  ratingValue: 8.8,
  ratingDisplay: '8.8/10',
  duration: 'PT2H28M',
  durationDisplay: '2h 28m',
  directors: ['Christopher Nolan'],
  mainActors: ['Leonardo DiCaprio', 'Marion Cotillard'],
  writers: ['Christopher Nolan'],
};

const mockMovieMinimal: Movie = {
  id: '2',
  title: 'Minimal Movie',
  summary: '',
  genres: [],
  genreNames: '',
  posterUrl: null,
  datePublished: '',
  releaseYear: 0,
  rating: 'NR',
  ratingValue: 0,
  ratingDisplay: '',
  duration: null,
  durationDisplay: '',
  directors: [],
  mainActors: [],
  writers: [],
};

describe('MovieDetail', () => {
  it('renders movie title', () => {
    render(<MovieDetail movie={mockMovie} />);
    expect(screen.getByRole('heading', { name: 'Inception' })).toBeInTheDocument();
  });

  it('renders back link', () => {
    render(<MovieDetail movie={mockMovie} />);
    const backLink = screen.getByRole('link', { name: /back to search/i });
    expect(backLink).toHaveAttribute('href', '/');
  });

  it('renders poster image', () => {
    render(<MovieDetail movie={mockMovie} />);
    expect(screen.getByAltText('Inception poster')).toBeInTheDocument();
  });

  it('renders rating badge', () => {
    render(<MovieDetail movie={mockMovie} />);
    expect(screen.getByText('PG-13')).toBeInTheDocument();
  });

  it('renders release year', () => {
    render(<MovieDetail movie={mockMovie} />);
    expect(screen.getByText('2010')).toBeInTheDocument();
  });

  it('renders duration', () => {
    render(<MovieDetail movie={mockMovie} />);
    expect(screen.getByText('2h 28m')).toBeInTheDocument();
  });

  it('renders rating value', () => {
    render(<MovieDetail movie={mockMovie} />);
    expect(screen.getByText('8.8/10')).toBeInTheDocument();
  });

  it('renders genres', () => {
    render(<MovieDetail movie={mockMovie} />);
    expect(screen.getByText('Sci-Fi')).toBeInTheDocument();
    expect(screen.getByText('Action')).toBeInTheDocument();
  });

  it('renders summary', () => {
    render(<MovieDetail movie={mockMovie} />);
    expect(screen.getByText('Summary')).toBeInTheDocument();
    expect(screen.getByText('A mind-bending thriller about dream invasion.')).toBeInTheDocument();
  });

  it('renders director', () => {
    render(<MovieDetail movie={mockMovie} />);
    expect(screen.getByText('Director')).toBeInTheDocument();
    expect(screen.getByText('Christopher Nolan')).toBeInTheDocument();
  });

  it('renders cast', () => {
    render(<MovieDetail movie={mockMovie} />);
    expect(screen.getByText('Cast')).toBeInTheDocument();
    expect(screen.getByText('Leonardo DiCaprio, Marion Cotillard')).toBeInTheDocument();
  });

  it('renders favorite button when provided', () => {
    render(<MovieDetail movie={mockMovie} favoriteButton={<button>Add to Favorites</button>} />);
    expect(screen.getByRole('button', { name: 'Add to Favorites' })).toBeInTheDocument();
  });

  it('hides optional fields when not available', () => {
    render(<MovieDetail movie={mockMovieMinimal} />);
    expect(screen.queryByText('NR')).not.toBeInTheDocument();
    expect(screen.queryByText('Director')).not.toBeInTheDocument();
    expect(screen.queryByText('Cast')).not.toBeInTheDocument();
  });
});

describe('MovieDetailSkeleton', () => {
  it('renders skeleton elements', () => {
    const { container } = render(<MovieDetailSkeleton />);
    const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
