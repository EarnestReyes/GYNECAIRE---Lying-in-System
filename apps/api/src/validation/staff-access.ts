import { z } from 'zod';
export const staffRoles=['admin','midwife','nurse','receptionist'] as const;
const access=z.object({staff_role:z.enum(staffRoles),is_active:z.boolean()}).strict();
export const staffAccessSchema=access.extend({expected:access}).strict();
