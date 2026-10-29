const paths = {
  dashboard: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  patients: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M17 4a4 4 0 0 1 0 8 M22 21v-2a4 4 0 0 0-3-4',
  appointments: 'M4 5h16v16H4z M16 3v4 M8 3v4 M4 11h16 M8 15h2 M14 15h2',
  records: 'M6 3h9l4 4v14H6z M14 3v5h5 M9 12h7 M9 16h7',
  checkups: 'M6 3v5a4 4 0 0 0 8 0V3 M4 3h4 M12 3h4 M10 12v4a4 4 0 0 0 8 0v-3 M18 9a2 2 0 1 0 0 4 2 2 0 0 0 0-4',
  inventory: 'M3 7l9-4 9 4v12l-9 3-9-3z M3 7l9 4 9-4 M12 11v11 M7 5l10 4',
  messages: 'M21 11a9 9 0 0 1-9 9H3l2-5a9 9 0 1 1 16-4 M8 11h8',
  reports: 'M4 3v18h17 M8 16v-5 M13 16V7 M18 16V4',
  staff: 'M12 3l8 4v6c0 4-8 8-8 8s-8-4-8-8V7z M8 12l3 3 5-6',
  settings: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1z',
  search: 'M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14 M15 15l6 6',
  bell: 'M5 17h14l-2-3V9a5 5 0 0 0-10 0v5z M10 21h4',
  menu: 'M4 6h16 M4 12h16 M4 18h16',
  close: 'M6 6l12 12 M18 6L6 18',
  logout: 'M10 3H4v18h6 M14 7l5 5-5 5 M8 12h12',
  arrow: 'M4 12h16 M15 7l5 5-5 5',
  plus: 'M12 5v14 M5 12h14',
  heart: 'M12 20S2 14 2 8a5 5 0 0 1 10-1 5 5 0 0 1 10 1c0 6-10 12-10 12z',
  download: 'M12 3v12 M7 10l5 5 5-5 M4 16v5h16v-5',
  lock: 'M5 10h14v11H5z M8 10V7a4 4 0 0 1 8 0v3 M12 14v3',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6',
  check: 'M5 12l4 4L19 6',
} as const;
export type IconName = keyof typeof paths;
export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>;
}
