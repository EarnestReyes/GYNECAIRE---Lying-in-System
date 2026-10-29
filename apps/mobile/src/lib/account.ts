import { supabase } from './supabase';

export const interests = ['Preconception', 'Pregnancy', 'Postpartum', 'Family Planning', 'Women’s Health', 'Mental Health', 'Nutrition', 'General Wellness'];
export async function request<T>(path: string, body?: unknown): Promise<T> {
 const base = process.env.EXPO_PUBLIC_API_URL;
 if (!base) throw new Error('Clinic connection is not configured. Please contact the clinic.');
 const { data: { session } } = await supabase.auth.getSession();
 if (!session) throw new Error('Please log in to continue.');
 const response = await fetch(`${base.replace(/\/$/, '')}/api/v1/account${path}`, { method: body === undefined ? 'GET' : 'POST', headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
 if (!response.ok) throw new Error(response.status === 401 ? 'Your session expired. Please log in again.' : 'Unable to save or load your account. Please try again.');
 return response.json() as Promise<T>;
}
export interface Account { full_name: string; account_type: 'general' | 'patient' | 'staff' | 'admin'; interests: string[]; verification_status: 'pending' | 'approved' | 'rejected' | null }
