import test from 'node:test';
import assert from 'node:assert/strict';
import { blankClinic,clinicFields,clinicProblems } from '../src/lib/clinic-settings.js';
test('clinic editor starts with blank facts and keeps version/actor out of the submitted configuration',()=>{
 const blank=blankClinic();assert.equal(blank.clinic_name,'');assert.equal(blank.patient_visible,false);assert.deepEqual(blank.services,[]);assert.equal(blank.timezone,'Asia/Manila');const safe=clinicFields({...blank,version:4,updated_by:'foreign'} as typeof blank);assert.ok(!('version' in safe)&&!('updated_by' in safe));assert.notEqual(blankClinic().operating_hours,blank.operating_hours);
});
test('clinic form catches incomplete hours and duplicate services before submission',()=>{
 const draft=blankClinic();assert.ok(clinicProblems(draft).length);draft.clinic_name='Synthetic Clinic';assert.deepEqual(clinicProblems(draft),[]);draft.operating_hours.monday={closed:false,opens:'18:00',closes:'09:00'};assert.ok(clinicProblems(draft).some(value=>value.includes('monday')));draft.services=['Test','test'];assert.ok(clinicProblems(draft).some(value=>value.includes('Services')));
});
