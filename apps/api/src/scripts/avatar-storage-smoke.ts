// Explicit operator-run check. Creates only random synthetic objects and removes
// those exact objects afterward. Never changes profiles, Auth, policies or buckets.
import 'dotenv/config';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { avatarStorage,normalizeAvatar } from '../routes/profile-avatar.js';

const storage=avatarStorage();
if(!storage)throw new Error('Storage credential or HTTPS project URL is missing. No objects created.');
assert.equal(await storage.inspect!(),true,'Existing bucket privacy, type or size configuration is incompatible.');
const prefix=randomUUID();
const paths=[`${prefix}/${randomUUID()}.jpg`,`${prefix}/${randomUUID()}.jpg`];
const candidates:string[]=[];
const signedUrls=new Map<string,string>();
let failed=false;
try{
 for(const [index,path] of paths.entries()){
  const input=await sharp({create:{width:48,height:32,channels:3,background:index?'#8d315f':'#e78aa9'}}).jpeg().toBuffer();
  const output=await normalizeAvatar(input);
  candidates.push(path);
  await storage.put(path,output);
  const signed:string=await storage.sign(path);
  signedUrls.set(path,signed);
  const response:Response=await fetch(signed,{signal:AbortSignal.timeout(10000)});
  assert.equal(response.status,200,'Signed image retrieval failed');
  const downloaded=Buffer.from(await response.arrayBuffer());
  assert.ok(downloaded.equals(output),'Stored image differs from uploaded image');
  const metadata=await sharp(downloaded).metadata();
  assert.equal(metadata.format,'jpeg');assert.equal(metadata.width,512);assert.equal(metadata.height,512);
  console.log(index?'Second unique image upload/sign/retrieval: passed':'First image decode/upload/sign/retrieval: passed');
 }
}catch{
 failed=true;console.error('Storage round-trip failed. Credentials and signed URLs have not been printed.');
}finally{
 for(const path of candidates){
  try{
   const signed:string=signedUrls.get(path)??await storage.sign(path);
   await storage.remove(path);
   const afterDelete:Response=await fetch(signed,{cache:'no-store',signal:AbortSignal.timeout(10000)});
   // Network failures, 401/403 and 5xx are not proof of object deletion.
   assert.ok([400,404].includes(afterDelete.status),'Test object deletion could not be confirmed');
   console.log('Synthetic object removal: passed');
  }catch{failed=true;console.error('Synthetic-object cleanup could not be verified. Exact candidate path:',path);}
 }
}
if(failed)process.exitCode=1;
else console.log('Storage-only smoke check passed. Profile/API lifecycle and persistence were not exercised.');
