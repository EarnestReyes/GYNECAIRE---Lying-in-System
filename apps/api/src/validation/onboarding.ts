import { z } from 'zod';
const topics = ['Preconception', 'Pregnancy', 'Postpartum', 'Family Planning', 'Women’s Health', 'Mental Health', 'Nutrition', 'General Wellness'] as const;
export const preferencesSchema = z.object({ interests: z.array(z.enum(topics)).max(8).refine(items => new Set(items).size === items.length) }).strict();
export const verificationSchema = z.object({ patient_kind: z.enum(['new', 'existing']), date_of_birth: z.iso.date().refine(value => value >= '1900-01-01' && value <= new Date().toISOString().slice(0, 10)), contact_number: z.string().trim().regex(/^[+\d ()-]{7,25}$/).refine(value => value.replace(/\D/g, '').length >= 7), consent: z.literal(true) }).strict();
export const decisionSchema = z.discriminatedUnion('status', [z.object({ status: z.literal('approved'), patient_id: z.uuid(), identity_verified: z.literal(true) }).strict(), z.object({ status: z.literal('rejected') }).strict()]);
