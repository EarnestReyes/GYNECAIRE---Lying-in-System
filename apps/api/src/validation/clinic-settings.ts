import { z } from 'zod';
export const clinicDays=['monday','tuesday','wednesday','thursday','friday','saturday','sunday'] as const;
const time=z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/,'Use HH:MM in 24-hour time.');
const hours=z.strictObject({closed:z.boolean(),opens:time.nullable(),closes:time.nullable()}).superRefine((value,ctx)=>{
 if(value.closed?(value.opens!==null||value.closes!==null):(!value.opens||!value.closes||value.opens>=value.closes))ctx.addIssue({code:'custom',message:'Closed days need blank times; open days need an opening time before closing time.'});
});
const optionalText=(max:number)=>z.string().trim().max(max).nullable();
export const clinicConfigurationSchema=z.strictObject({
 clinic_name:z.string().trim().min(2).max(150),description:optionalText(2000),
 contact_number:z.string().trim().regex(/^\+?[0-9 ()-]{7,25}$/).refine(value=>{const length=value.replace(/\D/g,'').length;return length>=7&&length<=15;},'Contact numbers need 7 to 15 digits.').nullable(),
 email:z.email().max(254).nullable(),address:optionalText(1000),
 timezone:z.string().min(1).max(100).refine(value=>{try{new Intl.DateTimeFormat('en',{timeZone:value});return true;}catch{return false;}},'Choose a valid IANA timezone.'),
 operating_hours:z.strictObject(Object.fromEntries(clinicDays.map(day=>[day,hours])) as Record<typeof clinicDays[number],typeof hours>),
 services:z.array(z.string().trim().min(2).max(100)).max(30).refine(values=>new Set(values.map(value=>value.toLowerCase())).size===values.length,'Service names must be unique.'),
 appointment_policies:z.strictObject({booking_enabled:z.boolean(),minimum_notice_hours:z.number().int().min(0).max(8760),slot_minutes:z.number().int().min(5).max(240),cancellation_notice_hours:z.number().int().min(0).max(8760),cancellation_rules:optionalText(2000)}),
 patient_visible:z.boolean(),
});
export const clinicUpdateSchema=clinicConfigurationSchema.extend({expected_version:z.number().int().min(0).max(2147483646)});
export type ClinicConfiguration=z.infer<typeof clinicConfigurationSchema>;
export function patientClinicFields(value:ClinicConfiguration){
 if(!value.patient_visible)return null;
 return {clinic_name:value.clinic_name,description:value.description,contact_number:value.contact_number,email:value.email,address:value.address,timezone:value.timezone,operating_hours:value.operating_hours,services:value.services,appointment_policies:{booking_enabled:value.appointment_policies.booking_enabled,cancellation_notice_hours:value.appointment_policies.cancellation_notice_hours,cancellation_rules:value.appointment_policies.cancellation_rules}};
}
