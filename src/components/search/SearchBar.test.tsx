import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchBar } from './SearchBar';

describe('SearchBar', () => {
  it('renders with placeholder', () => {
    render(<SearchBar value="" onChange={() => {}} />);
    expect(screen.getByPlaceholderText('Search movies...')).toBeInTheDocument();
  });

  it('renders with custom placeholder', () => {
    render(<SearchBar value="" onChange={() => {}} placeholder="Find a movie..." />);
    expect(screen.getByPlaceholderText('Find a movie...')).toBeInTheDocument();
  });

  it('displays the current value', () => {
    render(<SearchBar value="Inception" onChange={() => {}} />);
    expect(screen.getByDisplayValue('Inception')).toBeInTheDocument();
  });

  it('calls onChange when typing', () => {
    const handleChange = vi.fn();
    render(<SearchBar value="" onChange={handleChange} />);

    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'Matrix' } });

    expect(handleChange).toHaveBeenCalledWith('Matrix');
  });

  it('has accessible label', () => {
    render(<SearchBar value="" onChange={() => {}} />);
    expect(screen.getByRole('searchbox')).toHaveAccessibleName('Search movies');
  });

  it('shows clear button when value exists', () => {
    render(<SearchBar value="test" onChange={() => {}} />);
    expect(screen.getByRole('button', { name: /clear search/i })).toBeInTheDocument();
  });

  it('hides clear button when value is empty', () => {
    render(<SearchBar value="" onChange={() => {}} />);
    expect(screen.queryByRole('button', { name: /clear search/i })).not.toBeInTheDocument();
  });

  it('calls onChange with empty string when clear is clicked', () => {
    const handleChange = vi.fn();
    render(<SearchBar value="test" onChange={handleChange} />);

    fireEvent.click(screen.getByRole('button', { name: /clear search/i }));

    expect(handleChange).toHaveBeenCalledWith('');
  });

  it('applies custom className', () => {
    const { container } = render(
      <SearchBar value="" onChange={() => {}} className="custom-class" />
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('shows loading state', () => {
    const { container } = render(<SearchBar value="" onChange={() => {}} isLoading />);
    const searchIcon = container.querySelector('svg');
    expect(searchIcon).toHaveClass('animate-pulse');
  });
});
