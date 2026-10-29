import { useEffect, useId, useRef, type PropsWithChildren, type ReactNode } from 'react';
import { Icon, type IconName } from './icon';

export function Brand({ compact = false }: { compact?: boolean }) {
  return <div className="brand"><span className="brand-mark"><Icon name="heart" size={25} /></span><div><strong>GYNECAIRE</strong><small>{compact ? 'STAFF PORTAL' : 'Lying-in Center Management System'}</small></div></div>;
}
export function Badge({ children, tone = '' }: PropsWithChildren<{ tone?: string }>) { return <span className={`badge ${tone}`}>{children}</span>; }
export function Empty({ title, children, icon = 'records' }: PropsWithChildren<{ title: string; icon?: IconName }>) {
  return <div className="empty"><span className="empty-icon"><Icon name={icon} size={29} /></span><h3>{title}</h3><p>{children}</p></div>;
}
export function ResourceState({ loading, error, retry }: { loading: boolean; error: string; retry: () => void }) {
  if (loading) return <div className="loading-state" role="status"><span className="spinner" /> Loading clinic data…</div>;
  if (error) return <div className="notice error" role="alert"><span>{error}</span><button className="button secondary small" onClick={retry}>Try again</button></div>;
  return null;
}
export function PageHeading({ eyebrow = 'CLINIC WORKSPACE', title, description, action }: { eyebrow?: string; title: string; description: string; action?: ReactNode }) {
  return <header className="page-heading"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{action}</header>;
}
export function Panel({ title, action, children, className = '' }: PropsWithChildren<{ title: string; action?: ReactNode; className?: string }>) {
  return <section className={`panel ${className}`}><header className="panel-heading"><h2>{title}</h2>{action}</header>{children}</section>;
}
export function Modal({ title, children, close, busy=false }: PropsWithChildren<{ title: string; close: () => void; busy?:boolean }>) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId=useId();
  useEffect(() => {
    const previous = document.activeElement;
    const dialog = ref.current;
    dialog?.showModal();
    return () => { dialog?.close(); if (previous instanceof HTMLElement && previous.isConnected) previous.focus(); };
  }, []);
  return <dialog ref={ref} className="modal" aria-labelledby={titleId} aria-busy={busy} onCancel={event => { event.preventDefault(); if(!busy)close(); }}><header className="panel-heading"><h2 id={titleId}>{title}</h2><button type="button" className="icon-button" aria-label="Close dialog" disabled={busy} onClick={close}><Icon name="close" /></button></header>{children}</dialog>;
}
export function Pagination({ page, total, size, setPage }: { page: number; total: number; size: number; setPage: (page: number) => void }) {
  return <div className="pagination"><span>{total ? `${(page-1)*size+1}–${Math.min(page*size,total)} of ${total}` : '0 results'}</span><div><button className="button secondary small" disabled={page <= 1} onClick={() => setPage(page-1)}>Previous</button><button className="button secondary small" disabled={page*size >= total} onClick={() => setPage(page+1)}>Next</button></div></div>;
}
