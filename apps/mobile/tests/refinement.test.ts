/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { passwordErrors, validBirthDate, validEmail, validPhone } from '../src/lib/form-validation';
import { patientNavigation, tabNames } from '../src/lib/navigation';
import { filterResources, parseSavedResources, resources } from '../src/lib/education';
import { brand } from '../src/constants/brand';

test('date validation accepts leap days and rejects rollover, future, and partial dates', () => {
  assert.equal(validBirthDate('2000-02-29','2026-10-29'),true);
  for (const date of ['2001-02-29','1995-13-01','2027-01-01','1995-1-1','1899-12-31']) assert.equal(validBirthDate(date,'2026-10-29'),false);
});
test('email and phone errors reject missing or unusable contact details', () => {
  assert.equal(validEmail(' person@example.test '),true);
  for (const value of ['','person','person@','a b@example.test']) assert.equal(validEmail(value),false);
  assert.equal(validPhone('+63 917 123 4567'),true);
  for (const value of ['-------','12345','someone@example.test']) assert.equal(validPhone(value),false);
});
test('password confirmation cannot pass when empty, short, or different', () => {
  assert.ok(Object.values(passwordErrors('short','short')).some(Boolean));
  assert.ok(Object.values(passwordErrors('long-password','different')).some(Boolean));
  assert.ok(Object.values(passwordErrors('','')).some(Boolean));
  assert.equal(Object.values(passwordErrors('long-password','long-password')).some(Boolean),false);
});
test('only a backend patient account selects patient navigation', () => {
  for (const account of [undefined,'general','staff','admin','existing','clinic']) {
    assert.equal(patientNavigation(account),false);
    assert.equal(tabNames(account).includes('records'),false);
    assert.equal(tabNames(account).includes('appointments'),false);
  }
  assert.deepEqual(tabNames('patient'),['dashboard','records','appointments','learn','profile']);
});
test('public education can be found by topic and category together', () => {
  assert.equal(filterResources('pregnancy','Pregnancy')[0]?.id,'maternal');
  assert.equal(filterResources('nutrition','Mental Health').length,0);
  assert.equal(filterResources('not-a-topic').length,0);
});
test('saved resources reject corrupt values, unknown ids, and duplicates', () => {
  assert.deepEqual(parseSavedResources('broken-json'),[]);
  assert.deepEqual(parseSavedResources('{"id":"maternal"}'),[]);
  assert.deepEqual(parseSavedResources('["maternal","maternal",null,"not-real"]'),['maternal']);
});
test('every public resource opens an attributed HTTPS WHO page', () => {
  for (const resource of resources) { const url = new URL(resource.url); assert.equal(url.protocol,'https:'); assert.equal(url.hostname,'www.who.int'); }
});
test('body, accent, success, and error text meet normal-text contrast on their backgrounds', () => {
  function luminance(hex: string) { const rgb = [1,3,5].map(offset => parseInt(hex.slice(offset,offset+2),16)/255).map(value => value <= .04045 ? value/12.92 : ((value+.055)/1.055)**2.4); return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722; }
  for (const [foreground,background] of [[brand.muted,brand.background],[brand.primary,brand.white],[brand.plum,brand.blush],[brand.white,brand.primary],[brand.success,brand.softSuccess],[brand.error,brand.blush]]) {
    const a = luminance(foreground), b = luminance(background);
    assert.ok((Math.max(a,b)+.05)/(Math.min(a,b)+.05) >= 4.5,`${foreground} on ${background}`);
  }
});
