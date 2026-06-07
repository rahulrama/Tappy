import { useCallback, useEffect, useState } from 'react';

/**
 * Persisted state hook backed by localStorage. Falls back gracefully when
 * storage is unavailable (e.g. private mode) and keeps multiple tabs in sync.
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const readValue = useCallback((): T => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? ({ ...initialValue, ...JSON.parse(raw) } as T) : initialValue;
    } catch {
      return initialValue;
    }
  }, [key, initialValue]);

  const [value, setValue] = useState<T>(readValue);

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage full or blocked — ignore */
    }
  }, [key, value]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) setValue(readValue());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [key, readValue]);

  return [value, setValue] as const;
}
