import { useEffect, useState } from 'react';

/**
 * Custom hook that returns a debounced version of any input value.
 * Useful for delaying expensive actions (like API calls) until after a user input stops changing.
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const stringifiedValue = JSON.stringify(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [stringifiedValue, delay]);

  return debouncedValue;
}

/**
 * Throttle utility to limit the execution frequency of callback triggers.
 */
export function throttle<Args extends any[]>(
  func: (...args: Args) => void,
  limit: number
): (...args: Args) => void {
  let inThrottle = false;
  return (...args: Args) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}
