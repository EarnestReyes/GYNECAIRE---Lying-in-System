import { useCallback, useEffect, useState } from 'react';
import { request, type CareSummary } from '@/lib/account';
import { useAccount } from '@/lib/account-context';
import { useSession } from '@/lib/session';

export function useCare() {
  const { account } = useAccount();
  const { session } = useSession();
  const [result, setResult] = useState<{ key: string; data: CareSummary | null; error: string } | null>(null);
  const [version, setVersion] = useState(0);
  const key = session && account?.account_type === 'patient' ? `${session.user.id}:${session.access_token}:${version}` : '';
  useEffect(() => {
    if (!key) return;
    const controller = new AbortController();
    request<CareSummary>('/care', undefined, controller.signal).then(data => { if (!controller.signal.aborted) setResult({ key, data, error: '' }); }).catch(error => { if (!controller.signal.aborted) setResult({ key, data: null, error: error instanceof Error ? error.message : 'We couldn’t load your care information.' }); });
    return () => controller.abort();
  }, [key]);
  const refresh = useCallback(() => setVersion(value => value+1), []);
  return { data: key && result?.key === key ? result.data : null, loading: !!key && result?.key !== key, error: key && result?.key === key ? result.error : '', refresh };
}
