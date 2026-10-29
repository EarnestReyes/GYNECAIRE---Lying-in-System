import test from 'node:test';
import assert from 'node:assert/strict';
import { personalProfileSchema } from './settings.js';
test('personal profile accepts Unicode names and optional contact',()=>{assert.deepEqual(personalProfileSchema.parse({full_name:'  María Peña ',phone_number:null}),{full_name:'María Peña',phone_number:null});assert.ok(personalProfileSchema.safeParse({full_name:'Synthetic Staff',phone_number:'+63 912 345 6789'}).success);});
test('personal profile rejects access escalation and editing another account',()=>{for(const field of ['id','profile_id','staff_role','account_type','is_active','email','verified'])assert.equal(personalProfileSchema.safeParse({full_name:'Synthetic Staff',phone_number:null,[field]:'admin'}).success,false);});
test('personal profile rejects invalid names and contact numbers',()=>{for(const value of [{full_name:' ',phone_number:null},{full_name:'A',phone_number:null},{full_name:'Staff',phone_number:'letters'},{full_name:'Staff',phone_number:'123---()'}])assert.equal(personalProfileSchema.safeParse(value).success,false);});
