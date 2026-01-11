import { useSyncExternalStore } from 'react';

/**
 * Hook to check if component is mounted on client side.
 * Used to prevent hydration mismatches with SSR.
 *
 * @returns boolean - true if component is mounted on client
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    // Subscribe function (no-op since mounted state never changes after hydration)
    () => () => {},
    // Client snapshot
    () => true,
    // Server snapshot
    () => false
  );
}
