import { useState, useEffect, useCallback } from 'react';

export function useApi(fetchFn, options = {}) {
  const { immediate = true, pollInterval = null } = options;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchFn(...args);
      setData(response.data);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  useEffect(() => {
    if (immediate) {
      execute().catch(console.error);
    }
  }, [execute, immediate]);

  useEffect(() => {
    let intervalId;
    if (pollInterval && !error) {
      intervalId = setInterval(() => {
        execute().catch(console.error);
      }, pollInterval);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [execute, pollInterval, error]);

  return { data, loading, error, execute, refetch: execute };
}
