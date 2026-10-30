import test from 'node:test';
import assert from 'node:assert/strict';
import { avatarFileProblem,avatarSetupMessages,AVATAR_MAX_BYTES } from '../src/lib/avatar.js';
test('photo picker permits only nonempty JPEG files within the existing 3 MiB bucket limit',()=>{
 assert.equal(AVATAR_MAX_BYTES,3145728);assert.equal(avatarFileProblem({type:'image/jpeg',size:AVATAR_MAX_BYTES}),'');
 for(const file of [{type:'image/png',size:100},{type:'image/webp',size:100},{type:'image/jpeg',size:0},{type:'image/jpeg',size:AVATAR_MAX_BYTES+1}])assert.ok(avatarFileProblem(file));
});
test('photo setup feedback distinguishes missing flags, credentials, decoder, schema and storage',()=>{
 const messages=avatarSetupMessages(['disabled','storage_key_missing','decoder_missing','schema_unavailable','bucket_incompatible','disabled']);assert.equal(messages.length,5);assert.ok(messages.some(value=>value.includes('AVATARS_ENABLED')));assert.ok(messages.some(value=>value.includes('SUPABASE_SERVICE_ROLE_KEY')));assert.ok(messages.some(value=>value.includes('sharp')));assert.deepEqual(avatarSetupMessages([]),[]);assert.ok(avatarSetupMessages(['unexpected'])[0]?.includes('could not be verified'));
});
