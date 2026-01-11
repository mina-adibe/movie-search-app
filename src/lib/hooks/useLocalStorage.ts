import { useSyncExternalStore, useCallback } from 'react';

/**
 * Hook for persisting state in localStorage with SSR safety.
 *
 * @param key - The localStorage key
 * @param initialValue - The initial value if no stored value exists
 * @returns [value, setValue, removeValue] tuple
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const subscribe = useCallback(
    (callback: () => void): (() => void) => {
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === key) {
          callback();
        }
      };

      window.addEventListener('storage', handleStorageChange);
      // Custom event for same-tab updates
      window.addEventListener('local-storage-update', callback);

      return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('local-storage-update', callback);
      };
    },
    [key]
  );

  const getSnapshot = useCallback((): T => {
    try {
      const item = window.localStorage.getItem(key);
      return item !== null ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  }, [key, initialValue]);

  const getServerSnapshot = useCallback((): T => initialValue, [initialValue]);

  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setValue = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      try {
        const currentValue = getSnapshot();
        const valueToStore = newValue instanceof Function ? newValue(currentValue) : newValue;
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
        // Dispatch custom event for same-tab updates
        window.dispatchEvent(new Event('local-storage-update'));
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, getSnapshot]
  );

  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      window.dispatchEvent(new Event('local-storage-update'));
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [key]);

  return [value, setValue, removeValue];
}
