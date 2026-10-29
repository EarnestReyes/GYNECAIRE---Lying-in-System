import { createContext, useCallback, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import { AppState } from 'react-native';
import { request, type Account } from './account';
import { useSession } from './session';
interface Result {
    key: string;
    owner: string;
    account: Account | null;
    error: string;
}
const Context = createContext<{
    account: Account | null;
    loading: boolean;
    error: string;
    refresh: () => void;
}>({ account: null, loading: true, error: '', refresh: () => { } });
export function AccountProvider({ children }: PropsWithChildren) {
    const { session, loading: restoring } = useSession();
    const [result, setResult] = useState<Result | null>(null);
    const [version, setVersion] = useState(0);
    const key = session ? `${session.user.id}:${session.access_token}:${version}` : '';
    const refresh = useCallback(() => setVersion(value => value + 1), []);
    useEffect(() => {
        if (!session)
            return;
        const controller = new AbortController();
        request<Account>('', undefined, controller.signal).then(account => {
            if (!controller.signal.aborted)
                setResult({ key, owner: session.user.id, account, error: '' });
        }).catch(error => {
            if (!controller.signal.aborted)
                setResult({ key, owner: session.user.id, account: null, error: error instanceof Error ? error.message : 'We couldn’t load your account. Please try again.' });
        });
        return () => controller.abort();
    }, [key, session]);
    useEffect(() => { const listener = AppState.addEventListener('change', state => { if (state === 'active')
        refresh(); }); return () => listener.remove(); }, [refresh]);
    const matching = result?.key === key;
    return <Context.Provider value={{ account: session && result?.owner === session.user.id ? result.account : null, loading: restoring || (!!session && !matching), error: matching ? result.error : '', refresh }}>{children}</Context.Provider>;
}
export const useAccount = () => useContext(Context);
