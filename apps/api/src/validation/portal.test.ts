import { test } from 'node:test';
import assert from 'node:assert/strict';
import { appointmentSchema, appointmentUpdateSchema, dateRangeSchema, pageSchema, patientSchema } from './portal.js';

const patient = { full_name: 'Synthetic Test Patient', patient_number: 'TEST-0001', date_of_birth: null, contact_number: null };
test('minimal patient intake accepts nullable optional contact details', () => assert.equal(patientSchema.safeParse(patient).success, true));
test('patient intake cannot assign an account or clinical status', () => {
  for (const field of ['profile_id','account_type','risk_level','is_archived']) assert.equal(patientSchema.safeParse({ ...patient,[field]: 'test' }).success,false);
});
test('patient dates and contact numbers are validated', () => {
  assert.equal(patientSchema.safeParse({ ...patient,date_of_birth: '2999-01-01' }).success,false);
  assert.equal(patientSchema.safeParse({ ...patient,date_of_birth: '2025-02-30' }).success,false);
  assert.equal(patientSchema.safeParse({ ...patient,contact_number: '-------' }).success,false);
});
test('patient pagination is bounded and rejects unknown linkage status', () => {
  assert.equal(pageSchema.safeParse({ page: '0' }).success,false);
  assert.equal(pageSchema.safeParse({ page: '100001' }).success,false);
  assert.equal(pageSchema.safeParse({ filter: 'prenatal' }).success,false);
});
test('appointments require an explicit timezone and valid patient UUID', () => {
  const appointment = { patient_id: 'ce3f63bf-8be1-439d-85b2-a2485145b457', appointment_date: '2026-10-29T09:00:00+08:00', appointment_type: 'Prenatal consultation' };
  assert.equal(appointmentSchema.safeParse(appointment).success,true);
  assert.equal(appointmentSchema.safeParse({ ...appointment,appointment_date: '2026-10-29T09:00' }).success,false);
  assert.equal(appointmentSchema.safeParse({ ...appointment,patient_id: 'other-user' }).success,false);
});
test('appointment updates cannot reassign a patient or create an unsupported status', () => {
  assert.equal(appointmentUpdateSchema.safeParse({ status: 'confirmed',patient_id: 'ce3f63bf-8be1-439d-85b2-a2485145b457' }).success,false);
  assert.equal(appointmentUpdateSchema.safeParse({ status: 'approved' }).success,false);
});
test('reports enforce ordered bounded date ranges', () => {
  assert.equal(dateRangeSchema.safeParse({ from: '2026-01-01',to: '2026-10-29' }).success,true);
  assert.equal(dateRangeSchema.safeParse({ from: '2026-10-29',to: '2026-01-01' }).success,false);
  assert.equal(dateRangeSchema.safeParse({ from: '2020-01-01',to: '2026-01-01' }).success,false);
});
