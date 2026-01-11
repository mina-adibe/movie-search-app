import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MovieGridSkeleton } from './MovieGridSkeleton';

describe('MovieGridSkeleton', () => {
  it('renders default number of skeleton cards', () => {
    const { container } = render(<MovieGridSkeleton />);
    const cards = container.querySelectorAll('[data-slot="card"]');
    expect(cards).toHaveLength(10);
  });

  it('renders custom number of skeleton cards', () => {
    const { container } = render(<MovieGridSkeleton count={5} />);
    const cards = container.querySelectorAll('[data-slot="card"]');
    expect(cards).toHaveLength(5);
  });

  it('renders skeleton elements inside cards', () => {
    const { container } = render(<MovieGridSkeleton count={1} />);
    const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('applies custom className', () => {
    const { container } = render(<MovieGridSkeleton className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
