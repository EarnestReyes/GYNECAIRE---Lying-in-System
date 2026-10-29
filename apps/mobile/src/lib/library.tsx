import { createContext, useContext, useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useSession } from './session';
import { parseSavedResources } from './education';
const Context = createContext<{
    saved: string[];
    busy: boolean;
    error: string;
    toggle: (id: string) => Promise<void>;
}>({ saved: [], busy: false, error: '', toggle: async () => { } });
export function LibraryProvider({ children }: PropsWithChildren) {
    const { session } = useSession();
    const owner = session?.user.id || '';
    const [result, setResult] = useState<{
        owner: string;
        ids: string[];
        error: string;
    } | null>(null);
    const [busy, setBusy] = useState(false);
    const lock = useRef(false);
    const key = `gynecaire.saved.${owner}`;
    useEffect(() => {
        if (!owner)
            return;
        let active = true;
        const load = Platform.OS === 'web' ? Promise.resolve().then(() => typeof window === 'undefined' ? null : window.localStorage.getItem(key)) : SecureStore.getItemAsync(key);
        load.then(value => { if (active)
            setResult({ owner, ids: parseSavedResources(value), error: '' }); }).catch(() => { if (active)
            setResult({ owner, ids: [], error: 'We couldn’t load your saved resources on this device.' }); });
        return () => { active = false; };
    }, [owner, key]);
    async function toggle(id: string) {
        if (!owner || result?.owner !== owner || lock.current)
            return;
        const ids = result.ids.includes(id) ? result.ids.filter(value => value !== id) : [...result.ids, id];
        lock.current = true;
        setBusy(true);
        try {
            if (Platform.OS === 'web')
                window.localStorage.setItem(key, JSON.stringify(ids));
            else
                await SecureStore.setItemAsync(key, JSON.stringify(ids));
            setResult({ owner, ids, error: '' });
        }
        catch {
            setResult({ ...result, error: 'We couldn’t save this change on your device. Please try again.' });
        }
        finally {
            lock.current = false;
            setBusy(false);
        }
    }
    return <Context.Provider value={{ saved: result?.owner === owner ? result.ids : [], busy: busy || (!!owner && result?.owner !== owner), error: result?.owner === owner ? result.error : '', toggle }}>{children}</Context.Provider>;
}
export const useLibrary = () => useContext(Context);
