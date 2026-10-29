import { supabase } from './supabase';

export type StaffRole = 'admin' | 'midwife' | 'nurse' | 'receptionist';
export interface StaffIdentity { full_name: string; staff_role: StaffRole }
export interface Patient { id: string; patient_number: string; full_name: string; date_of_birth: string | null; contact_number: string | null; linked: boolean; created_at: string; last_visit?: string | null }
export interface Appointment { id: string; patient_id?: string; full_name?: string; patient_number?: string; appointment_date: string; appointment_type: string; status: 'pending' | 'confirmed' | 'completed' | 'cancelled' }
export interface PatientDetail extends Patient { appointments: Appointment[] }
export interface PageResult<T> { items: T[]; total: number; page: number; page_size: number }
export interface Overview { total_patients: number; today_appointments: number; pending_requests: number; pending_appointments: number; schedule: Appointment[]; activity: { id: string; action: string; entity_type: string; created_at: string }[] }
export interface Report { visits: { month: string; visits: number }[]; services: { service: string; count: number }[]; new_patients: number }
export interface Member { id: string; full_name: string; staff_role: StaffRole; is_active: boolean; created_at: string }
export interface Verification { id: string; full_name: string; patient_kind: string | null; date_of_birth: string | null; contact_number: string | null; created_at: string }

export async function staffApi<T>(path: string, options: { method?: string; body?: unknown; signal?: AbortSignal } = {}): Promise<T> {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) {
    window.dispatchEvent(new Event('portal-access-lost'));
    throw new Error('Your session has expired. Please sign in again.');
  }
  const response = await fetch(`${(import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '')}/api/v1/staff${path}`, {
    method: options.method || 'GET', signal: options.signal, cache: 'no-store',
    headers: { Authorization: `Bearer ${data.session.access_token}`, ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }) },
    ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
  });
  if (response.status === 401 || response.status === 403) {
    // Clear mounted clinical views immediately if the backend revokes access.
    window.dispatchEvent(new Event('portal-access-lost'));
    throw new Error(response.status === 403 ? 'Your account does not have permission for this portal.' : 'Your session has expired. Please sign in again.');
  }
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    throw new Error(body && typeof body === 'object' && 'error' in body && typeof body.error === 'string' ? body.error : 'The clinic service is unavailable. Please try again.');
  }
  return response.json() as Promise<T>;
}

export function manilaDate(value = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' }).format(value);
}
export function dateLabel(value: string | null | undefined, includeTime = false) {
  if (!value) return 'Not recorded';
  const date = new Date(value.length === 10 ? `${value.slice(0,10)}T00:00:00+08:00` : value);
  if (Number.isNaN(date.getTime())) return 'Not recorded';
  return new Intl.DateTimeFormat('en-PH', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric', year: 'numeric', ...(includeTime ? { hour: 'numeric', minute: '2-digit' } as const : {}) }).format(date);
}
export function initials(name: string) { return name.split(/\s+/).filter(Boolean).slice(0,2).map(part => part[0]).join('').toUpperCase(); }
