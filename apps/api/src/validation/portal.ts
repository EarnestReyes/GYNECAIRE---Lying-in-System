import { z } from 'zod';

export const patientSchema = z.object({
  full_name: z.string().trim().min(2).max(150),
  patient_number: z.string().trim().min(1).max(40).regex(/^[A-Za-z0-9-]+$/),
  date_of_birth: z.iso.date().refine(value => value >= '1900-01-01' && value <= new Date().toISOString().slice(0, 10)).nullable(),
  contact_number: z.string().trim().regex(/^[+\d ()-]{7,25}$/).refine(value => value.replace(/\D/g, '').length >= 7).nullable(),
}).strict();

export const appointmentSchema = z.object({
  patient_id: z.uuid(),
  appointment_date: z.iso.datetime({ offset: true }),
  appointment_type: z.enum(['Prenatal consultation', 'Postnatal consultation', 'General consultation', 'Family planning']),
}).strict();

export const appointmentUpdateSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'completed', 'cancelled']),
  appointment_date: z.iso.datetime({ offset: true }).optional(),
}).strict();

export const pageSchema = z.object({
  page: z.coerce.number().int().min(1).max(100000).default(1),
  search: z.string().trim().max(100).default(''),
  filter: z.enum(['all', 'linked', 'unlinked']).default('all'),
});

export const dateRangeSchema = z.object({
  from: z.iso.date(),
  to: z.iso.date(),
}).refine(({ from, to }) => from <= to && (Date.parse(to) - Date.parse(from)) <= 366 * 86400000);
