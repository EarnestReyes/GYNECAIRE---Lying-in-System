import type { IconName } from '../components/icon.js';

export const navigation = [
  ['dashboard', 'Dashboard', 'dashboard'], ['patients', 'Patients', 'patients'],
  ['appointments', 'Appointments', 'appointments'], ['records', 'Medical Records', 'records'],
  ['checkups', 'Checkups', 'checkups'], ['inventory', 'Inventory', 'inventory'],
  ['messages', 'Messages', 'messages'], ['reports', 'Reports & Analytics', 'reports'],
  ['staff', 'Staff Management', 'staff'], ['settings', 'Settings', 'settings'],
] as const satisfies readonly (readonly [string, string, IconName])[];
export type Page = typeof navigation[number][0] | 'patient-imports';
export const quickActions=[['patients','Add or find a patient','patients'],['appointments','Schedule an appointment','appointments'],['checkups','Completed consultation history','checkups'],['reports','View clinic reports','reports']] as const satisfies readonly (readonly [Page,string,IconName])[];
export function pageFromHash(hash:string): Page {
  const value = hash.replace(/^#\/?/,'').split('?')[0].replace(/\/$/,'');
  if(value==='patients/import'||value==='patient-imports')return 'patient-imports';
  return navigation.find(item => item[0] === value)?.[0] ?? 'dashboard';
}
export function patientFromHash(hash:string):string|null{
 if(pageFromHash(hash)!=='patients')return null;
 const id=new URLSearchParams(hash.split('?')[1]??'').get('patient');
 return id&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id)?id:null;
}
export function readPage():Page{return pageFromHash(window.location.hash);}
export function pageHash(page:Page){return '#'+(page==='patient-imports'?'patients/import':page);}
export function canAccessPage(page:Page,role:string){return !['patient-imports','staff'].includes(page)||role==='admin';}
export function navigate(page: Page) { window.location.hash = pageHash(page); }
export function openPatient(id:string){window.location.hash='patients?patient='+encodeURIComponent(id);}
