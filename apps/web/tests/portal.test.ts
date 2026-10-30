import test from 'node:test';
import assert from 'node:assert/strict';
import { navigation, pageFromHash, patientFromHash,pageHash,canAccessPage,navigate,quickActions } from '../src/lib/navigation.js';
import { readFileSync } from 'node:fs';
import { importSteps, initialImportStep, canVisitImportStep } from '../src/lib/import-wizard.js';
test('all sidebar destinations and dedicated import URLs resolve correctly',()=>{for(const [page] of navigation)assert.equal(pageFromHash('#'+page),page);assert.equal(pageFromHash('#patients/import?view=history'),'patient-imports');assert.equal(pageFromHash('#unknown'),'dashboard');});
test('all quick actions resolve to their intended connected module',()=>{for(const [page] of quickActions){assert.equal(pageFromHash(pageHash(page)),page);assert.notEqual(page,'dashboard');}});
test('shared theme covers nested action surfaces and import stylesheet has no fixed white backgrounds',()=>{
 const css=readFileSync('src/portal-system.css','utf8'),tokens=readFileSync('src/design-tokens.css','utf8'),imports=readFileSync('src/pages/patient-imports.css','utf8');
 assert.match(css,/\.quick-actions button \{[^}]*background:var\(--surface-subtle\)/);assert.match(css,/:focus-visible/);assert.match(tokens,/:root\[data-theme=dark\]/);
 for(const token of ['background','sidebar-bg','surface','elevated','input-bg','table-bg','text','muted','border','hover-bg','selected-bg','button-bg','secondary-bg','focus','danger-text'])assert.ok(tokens.includes('--'+token+':'));
 assert.doesNotMatch(imports,/background:\s*(?:white|#fff(?:fff)?)\s*[;}]/i);
});
test('import navigation serializes and restores canonical and legacy routes without losing the workspace',()=>{
 const previous=Object.getOwnPropertyDescriptor(globalThis,'window');const location={hash:'#patients'};Object.defineProperty(globalThis,'window',{value:{location},configurable:true});
 try{navigate('patient-imports');assert.equal(location.hash,'#patients/import');assert.equal(pageFromHash(location.hash),'patient-imports');assert.equal(pageHash('patient-imports'),'#patients/import');for(const hash of ['#patient-imports','#/patients/import/','#patients/import?view=history'])assert.equal(pageFromHash(hash),'patient-imports');navigate('patients');assert.equal(pageFromHash(location.hash),'patients');}finally{if(previous)Object.defineProperty(globalThis,'window',previous);else Reflect.deleteProperty(globalThis,'window');}
 for(const role of ['nurse','midwife','receptionist'])assert.equal(canAccessPage('patient-imports',role),false);assert.equal(canAccessPage('patient-imports','admin'),true);
});
test('patient deep links accept only a valid UUID on the patient route',()=>{const id='d97a2474-5cdd-4c3d-9c6b-ddc740cd0434';assert.equal(patientFromHash('#patients?patient='+id),id);assert.equal(patientFromHash('#patients?patient=other'),null);assert.equal(patientFromHash('#patients/import?patient='+id),null);assert.equal(patientFromHash('#settings?patient='+id),null);});
test('six-step wizard prevents confirmation before reviewed validation and preserves completed-job boundaries',()=>{assert.equal(importSteps.length,6);assert.equal(initialImportStep('created'),0);assert.equal(initialImportStep('staged'),1);assert.equal(initialImportStep('validated'),3);assert.equal(initialImportStep('completed'),5);assert.equal(canVisitImportStep(4,'staged',0,false),false);assert.equal(canVisitImportStep(4,'validated',1,false),false);assert.equal(canVisitImportStep(4,'validated',0,true),false);assert.equal(canVisitImportStep(4,'validated',0,false),true);assert.equal(canVisitImportStep(1,'completed',0,false),false);assert.equal(canVisitImportStep(5,'completed',0,false),true);assert.equal(canVisitImportStep(4,'expired',0,false),false);});
