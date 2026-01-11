import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Header } from './Header';

// Mock the providers and hooks
vi.mock('@/lib/providers', () => ({
  useTheme: () => ({
    resolvedTheme: 'light',
    setTheme: vi.fn(),
    theme: 'light',
  }),
}));

vi.mock('@/lib/hooks', () => ({
  useMounted: () => true,
}));

describe('Header', () => {
  it('renders the app name', () => {
    render(<Header />);
    expect(screen.getByText('Buffalo Movie Search')).toBeInTheDocument();
  });

  it('renders Home link', () => {
    render(<Header />);
    expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
  });

  it('renders Favorites link', () => {
    render(<Header />);
    expect(screen.getByRole('link', { name: /favorites/i })).toBeInTheDocument();
  });

  it('renders logo icon', () => {
    render(<Header />);
    // The Film icon is rendered
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  it('displays favorites count when provided', () => {
    render(<Header favoritesCount={5} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('does not display badge when count is 0', () => {
    render(<Header favoritesCount={0} />);
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('links to correct routes', () => {
    render(<Header />);
    const homeLink = screen.getByRole('link', { name: /home/i });
    const favoritesLink = screen.getByRole('link', { name: /favorites/i });

    expect(homeLink).toHaveAttribute('href', '/');
    expect(favoritesLink).toHaveAttribute('href', '/favorites');
  });
});
