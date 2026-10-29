import { z } from 'zod';
export const personalProfileSchema=z.object({
 full_name:z.string().trim().min(2).max(150),
 phone_number:z.string().trim().regex(/^[+\d ()-]{7,25}$/).refine(value=>value.replace(/\D/g,'').length>=7).nullable(),
}).strict();
