import { useCallback, useEffect, useState } from 'react';
import { staffApi } from '../lib/portal';

export function useResource<T>(path: string | null) {
  const [result, setResult] = useState<{ path: string | null; data: T | null; error: string; loading: boolean }>({ path, data: null, error: '', loading: true });
  const [version, setVersion] = useState(0);
  useEffect(() => {
    if (path === null) return;
    const controller = new AbortController();
    staffApi<T>(path, { signal: controller.signal }).then(data => {
      if (!controller.signal.aborted) setResult({ path, data, error: '', loading: false });
    }).catch(error => {
      if (!controller.signal.aborted) setResult({ path, data: null, error: error instanceof Error ? error.message : 'Unable to load clinic data.', loading: false });
    });
    return () => controller.abort();
  }, [path, version]);
  const refresh = useCallback(() => {
    setResult({ path, data: null, error: '', loading: true });
    setVersion(value => value + 1);
  }, [path]);
  return { data: result.path === path ? result.data : null, error: result.path === path ? result.error : '', loading: path !== null && (result.path !== path || result.loading), refresh };
}
