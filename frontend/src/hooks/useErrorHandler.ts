import { useState, useCallback } from 'react';

interface UseErrorHandlerReturn {
  error: Error | null;
  setError: (error: Error | string | null) => void;
  clearError: () => void;
  handleError: (error: unknown) => void;
}

/**
 * Custom hook for managing error state with proper typing and parsing.
 *
 * Usage:
 * ```tsx
 * const { error, handleError, clearError } = useErrorHandler();
 *
 * try {
 *   await fetchData();
 * } catch (err) {
 *   handleError(err);
 * }
 *
 * return <ErrorMessage error={error} onRetry={clearError} />;
 * ```
 */
export function useErrorHandler(): UseErrorHandlerReturn {
  const [error, setErrorState] = useState<Error | null>(null);

  const setError = useCallback((error: Error | string | null) => {
    if (error === null) {
      setErrorState(null);
    } else if (error instanceof Error) {
      setErrorState(error);
    } else {
      setErrorState(new Error(error));
    }
  }, []);

  const clearError = useCallback(() => {
    setErrorState(null);
  }, []);

  const handleError = useCallback((error: unknown) => {
    console.error('Error caught:', error);

    if (error instanceof Error) {
      setErrorState(error);
    } else if (typeof error === 'string') {
      setErrorState(new Error(error));
    } else if (error && typeof error === 'object' && 'message' in error) {
      setErrorState(new Error(String(error.message)));
    } else {
      setErrorState(new Error('An unexpected error occurred'));
    }
  }, []);

  return {
    error,
    setError,
    clearError,
    handleError,
  };
}

/**
 * Parse error from fetch response
 */
export async function parseErrorFromResponse(response: Response): Promise<Error> {
  try {
    const data = await response.json();
    const message = data.detail || data.message || data.error || response.statusText;
    return new Error(message);
  } catch {
    return new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
}
