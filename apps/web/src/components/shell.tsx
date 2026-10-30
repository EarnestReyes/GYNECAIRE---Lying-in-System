import { Avatar } from './avatar';
import { useAvatar } from '../hooks/use-avatar';
import { useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { Brand } from './ui';
import { Icon } from './icon';
import { type StaffIdentity } from '../lib/portal';
import { navigation, navigate, type Page } from '../lib/navigation';

export function Shell({ user, page, logout, busy, children }: PropsWithChildren<{ user: StaffIdentity; page: Page; logout: () => void; busy: boolean }>) {
  const photo=useAvatar();
  const [open, setOpen] = useState(false);
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 960px)').matches);
  const [search, setSearch] = useState('');
  const [notifications, setNotifications] = useState(false);
  const heading = useRef<HTMLDivElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const drawer = useRef<HTMLElement>(null);
  useEffect(() => {
    const query = window.matchMedia('(max-width: 960px)');
    const change = () => { setMobile(query.matches); if (!query.matches) setOpen(false); };
    query.addEventListener('change',change);
    return () => query.removeEventListener('change',change);
  }, []);
  useEffect(() => { heading.current?.focus(); window.scrollTo(0,0); }, [page]);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    const trigger = menuButton.current;
    document.body.style.overflow = 'hidden';
    drawer.current?.querySelector<HTMLAnchorElement>('a')?.focus();
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
      if (event.key === 'Tab') {
        const controls = drawer.current?.querySelectorAll<HTMLElement>('a,button');
        const first = controls?.[0], last = controls?.[controls.length-1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown',close);
    return () => { document.body.style.overflow = previous; document.removeEventListener('keydown',close); trigger?.focus(); };
  }, [open]);
  const matches = navigation.filter(item => item[1].toLowerCase().includes(search.toLowerCase()) && (item[0] !== 'staff' || user.staff_role === 'admin'));
  function go(next: Page) { setOpen(false); setSearch(''); setNotifications(false); navigate(next); }
  return <div className="portal"><a className="skip-link" href="#main-content" onClick={event => { event.preventDefault(); document.getElementById('main-content')?.focus(); }}>Skip to content</a>{open && <button className="sidebar-scrim" aria-label="Close navigation" onClick={() => setOpen(false)} />}
    <aside ref={drawer} inert={mobile && !open} role={mobile && open ? "dialog" : undefined} aria-modal={mobile && open ? true : undefined} className={`sidebar ${open ? 'open' : ''}`} aria-label="Main navigation"><Brand compact /><button className="icon-button drawer-close" aria-label="Close navigation" onClick={() => setOpen(false)}><Icon name="close" /></button><div className="sidebar-label">WORKSPACE</div><nav>{navigation.filter(item => item[0] !== 'staff' || user.staff_role === 'admin').map(([key,label,icon]) => <a key={key} href={`#${key}`} aria-current={(page === key || (page==='patient-imports'&&key==='patients')) ? 'page' : undefined} className={(page === key || (page==='patient-imports'&&key==='patients')) ? 'active' : ''} onClick={() => { setOpen(false); setSearch(''); setNotifications(false); }}><Icon name={icon} /><span>{label}</span>{(page === key || (page==='patient-imports'&&key==='patients')) && <span className="nav-dot" />}</a>)}</nav><div className="sidebar-bottom"><div className="care-note"><Icon name="heart" /><strong>Care starts with you.</strong><p>Thank you for making every patient feel seen.</p></div><button className="logout-button" disabled={busy} onClick={logout}><Icon name="logout" />{busy ? 'Signing out…' : 'Sign out'}</button></div></aside>
    <div className="portal-main" inert={mobile && open}><header className="topbar"><div className="topbar-left"><button ref={menuButton} className="icon-button mobile-menu" aria-label="Open navigation" aria-expanded={open} onClick={() => setOpen(true)}><Icon name="menu" /></button><span className="breadcrumb">Workspace <span>/</span> <strong>{navigation.find(item => item[0] === (page==='patient-imports'?'patients':page))?.[1]}</strong></span></div><div className="topbar-actions"><div className="global-search"><Icon name="search" size={18} /><input aria-label="Find a workspace page" placeholder="Find a page…" value={search} onChange={event => setSearch(event.target.value)} onKeyDown={event => { if (event.key === 'Escape') setSearch(''); }} />{search && <div className="search-results">{matches.length ? matches.map(item => <button key={item[0]} onClick={() => go(item[0])}>{item[1]}<Icon name="arrow" size={15} /></button>) : <p>No matching pages</p>}</div>}</div><div className="notification-wrap"><button className="icon-button" aria-label="Notifications" aria-expanded={notifications} onClick={() => setNotifications(!notifications)}><Icon name="bell" /></button>{notifications && <div className="notification-popover"><strong>Clinic notifications</strong><p>Live notifications aren’t connected yet. Patient verification requests are available in Patients.</p><button className="text-button" onClick={() => go('patients')}>View patient requests <Icon name="arrow" size={15} /></button></div>}</div><button className="user-menu" onClick={() => go('settings')} aria-label={`Account settings for ${user.full_name}`}><Avatar name={user.full_name} url={photo.url}/><span><strong>{user.full_name}</strong><small>{user.staff_role === 'admin' ? 'Administrator' : user.staff_role}</small></span></button></div></header><main id="main-content" className="workspace" ref={heading} tabIndex={-1}>{children}</main><footer className="portal-footer"><span>GYNECAIRE · Thoughtful care, every day.</span><span><Icon name="lock" size={12} /> Authorized staff workspace</span></footer></div>
  </div>;
}
