import { supabase } from './supabase';

export const interests = ['Preconception', 'Pregnancy', 'Postpartum', 'Family Planning', 'Women’s Health', 'Mental Health', 'Nutrition', 'General Wellness'];
export async function request<T>(path: string, body?: unknown, signal?: AbortSignal): Promise<T> {
 const base = process.env.EXPO_PUBLIC_API_URL;
 if (!base) throw new Error('We can’t connect to the clinic yet. Please contact the clinic for help.');
 const { data: { session } } = await supabase.auth.getSession();
 if (!session) throw new Error('Please sign in to continue.');
 const response = await fetch(`${base.replace(/\/$/, '')}/api/v1/account${path}`, { method: body === undefined ? 'GET' : 'POST', signal, headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
 if (response.status === 401) { await supabase.auth.signOut({ scope: 'local' }); throw new Error('Please sign in again to continue.'); }
 if (!response.ok) throw new Error(response.status === 403 ? 'This part of your account isn’t available. Please check your clinic verification status.' : response.status === 400 ? 'Please check your details and try again.' : 'We couldn’t load or save this information. Please try again.');
 return response.json() as Promise<T>;
}
export interface Account { full_name: string; account_type: 'general' | 'patient' | 'staff' | 'admin'; interests: string[]; verification_status: 'pending' | 'approved' | 'rejected' | null }
export interface CareAppointment { id: string; appointment_date: string; appointment_type: string; status: 'pending' | 'confirmed' | 'completed' | 'cancelled' }
export interface CareSummary { patient_number: string; appointments: CareAppointment[] }
