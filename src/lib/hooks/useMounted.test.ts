import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useMounted } from './useMounted';

describe('useMounted', () => {
  it('returns true after mount', () => {
    const { result } = renderHook(() => useMounted());
    expect(result.current).toBe(true);
  });
});
