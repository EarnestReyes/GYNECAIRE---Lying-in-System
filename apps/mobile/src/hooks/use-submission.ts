import { useRef, useState } from 'react';

export function useSubmission() {
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  async function run(task: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try { await task(); } finally { lock.current = false; setBusy(false); }
  }
  return { busy, run };
}
