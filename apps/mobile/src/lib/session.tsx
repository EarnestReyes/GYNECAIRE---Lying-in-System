import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import type { Session } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';
import { supabase } from './supabase';
const Context = createContext<{
    session: Session | null;
    loading: boolean;
}>({ session: null, loading: true });
export function SessionProvider({ children }: PropsWithChildren) {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        let active = true;
        let authEvents = 0;
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, next) => {
            authEvents++;
            if (active) {
                setSession(next);
                setLoading(false);
            }
        });
        const generation = authEvents;
        void supabase.auth.getSession().then(({ data }) => {
            // A late restore must never reopen the previous account after sign-out.
            if (active && generation === authEvents) {
                setSession(data.session);
                setLoading(false);
            }
        }).catch(() => { if (active && generation === authEvents)
            setLoading(false); });
        if (Platform.OS !== 'web' && AppState.currentState === 'active')
            supabase.auth.startAutoRefresh();
        const listener = AppState.addEventListener('change', state => {
            if (Platform.OS !== 'web') {
                if (state === 'active')
                    supabase.auth.startAutoRefresh();
                else
                    supabase.auth.stopAutoRefresh();
            }
        });
        return () => { active = false; subscription.unsubscribe(); listener.remove(); if (Platform.OS !== 'web')
            supabase.auth.stopAutoRefresh(); };
    }, []);
    return <Context.Provider value={{ session, loading }}>{children}</Context.Provider>;
}
export const useSession = () => useContext(Context);
