import { createContext, useContext, useState, type Dispatch, type PropsWithChildren, type SetStateAction } from 'react';
interface Draft {
    intent: 'general' | 'clinic' | 'new' | 'existing';
    name: string;
    email: string;
    dateOfBirth: string;
    phone: string;
}
const empty: Draft = { intent: 'general', name: '', email: '', dateOfBirth: '', phone: '' };
const Context = createContext<{
    draft: Draft;
    setDraft: Dispatch<SetStateAction<Draft>>;
    clear: () => void;
}>({ draft: empty, setDraft: () => { }, clear: () => { } });
export function OnboardingDraftProvider({ children }: PropsWithChildren) {
    const [draft, setDraft] = useState(empty);
    return <Context.Provider value={{ draft, setDraft, clear: () => setDraft(empty) }}>{children}</Context.Provider>;
}
export const useOnboardingDraft = () => useContext(Context);
