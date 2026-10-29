import { useSyncExternalStore } from 'react';

function subscribe(onChange: () => void) {
  if (typeof window === 'undefined') return () => {};
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  media.addEventListener('change',onChange);
  return () => media.removeEventListener('change',onChange);
}
function snapshot(): 'light' | 'dark' {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
export function useColorScheme() {
  return useSyncExternalStore(subscribe,snapshot,() => 'light' as const);
}
