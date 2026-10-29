import type { IconName } from '../components/icon';

export const navigation = [
  ['dashboard', 'Dashboard', 'dashboard'], ['patients', 'Patients', 'patients'],
  ['appointments', 'Appointments', 'appointments'], ['records', 'Medical Records', 'records'],
  ['checkups', 'Checkups', 'checkups'], ['inventory', 'Inventory', 'inventory'],
  ['messages', 'Messages', 'messages'], ['reports', 'Reports & Analytics', 'reports'],
  ['staff', 'Staff Management', 'staff'], ['settings', 'Settings', 'settings'],
] as const satisfies readonly (readonly [string, string, IconName])[];
export type Page = typeof navigation[number][0];
export function readPage(): Page {
  const value = window.location.hash.slice(1).split('?')[0];
  return navigation.find(item => item[0] === value)?.[0] ?? 'dashboard';
}
export function navigate(page: Page) { window.location.hash = page; }
