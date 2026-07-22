import { useState, useEffect, useCallback } from 'react';
import { api, type RequestOptions } from '../services/api';

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export function useFetch<T>(endpoint: string, options?: RequestOptions) {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const stringifiedOptions = JSON.stringify(options);

  const fetchData = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));
    try {
      const parsedOptions = stringifiedOptions ? JSON.parse(stringifiedOptions) : undefined;
      const data = await api.get<T>(endpoint, parsedOptions);
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: err instanceof Error ? err : new Error('Something went wrong') });
    }
  }, [endpoint, stringifiedOptions]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { ...state, refetch };
}

export default useFetch;
