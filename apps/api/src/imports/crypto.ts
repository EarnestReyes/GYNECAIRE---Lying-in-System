import { createCipheriv, createDecipheriv, createHmac, randomBytes } from 'node:crypto';
export function encryptionKey():Buffer {
 const value=process.env.IMPORT_ENCRYPTION_KEY??'';
 if(!/^[a-f0-9]{64}$/i.test(value))throw new Error('Import encryption is not configured');
 return Buffer.from(value,'hex');
}
// AAD binds each ciphertext to its job/row, preventing ciphertext substitution.
export function seal(value:Buffer|string,aad:string):Buffer {const iv=randomBytes(12),c=createCipheriv('aes-256-gcm',encryptionKey(),iv);c.setAAD(Buffer.from(aad));const body=Buffer.concat([c.update(value),c.final()]);return Buffer.concat([iv,c.getAuthTag(),body]);}
export function unseal(value:Buffer,aad:string):Buffer {const c=createDecipheriv('aes-256-gcm',encryptionKey(),value.subarray(0,12));c.setAAD(Buffer.from(aad));c.setAuthTag(value.subarray(12,28));return Buffer.concat([c.update(value.subarray(28)),c.final()]);}
export function sourceHash(value:string):string {return createHmac('sha256',encryptionKey()).update(value.trim().normalize('NFC').toLowerCase()).digest('hex');}
