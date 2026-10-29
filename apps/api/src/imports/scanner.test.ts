import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer, type Socket } from 'node:net';
import { scanFile } from './scanner.js';
import { readiness } from './router.js';

test('deployment approval, encryption and scanner prerequisites fail closed',async()=>{
 const saved={...process.env};
 try{
  delete process.env.IMPORTS_ENABLED;delete process.env.IMPORT_ENCRYPTION_KEY;delete process.env.IMPORT_CLAMD_HOST;delete process.env.IMPORT_CLAMD_PORT;
  assert.equal(readiness().enabled,false);assert.equal(readiness().approved,false);
  await assert.rejects(scanFile(Buffer.from('synthetic')),/not configured/);
  process.env.IMPORTS_ENABLED='true';process.env.IMPORT_ENCRYPTION_KEY='bad';process.env.IMPORT_CLAMD_HOST='127.0.0.1';process.env.IMPORT_CLAMD_PORT='-1';
  assert.equal(readiness().enabled,false);assert.equal(readiness().encryption,false);assert.equal(readiness().scanner,false);
 }finally{for(const key of ['IMPORTS_ENABLED','IMPORT_ENCRYPTION_KEY','IMPORT_CLAMD_HOST','IMPORT_CLAMD_PORT']){if(saved[key]===undefined)delete process.env[key];else process.env[key]=saved[key];}}
});

async function scannerFixture(reply:'clean'|'infected'|'disconnect'|'trickle',run:(captured:()=>Buffer)=>Promise<void>){
 const priorHost=process.env.IMPORT_CLAMD_HOST,priorPort=process.env.IMPORT_CLAMD_PORT;let captured=Buffer.alloc(0);const sockets=new Set<Socket>();
 const server=createServer(socket=>{sockets.add(socket);let data=Buffer.alloc(0);let command=false,ended=false;socket.on('close',()=>sockets.delete(socket));socket.on('error',()=>{});
  const timer=reply==='trickle'?setInterval(()=>socket.write('x'),10):undefined;socket.on('close',()=>{if(timer)clearInterval(timer);});
  socket.on('data',chunk=>{data=Buffer.concat([data,typeof chunk==='string'?Buffer.from(chunk):chunk]);if(!command){if(data.length<10)return;assert.equal(data.subarray(0,10).toString(),'zINSTREAM\0');data=data.subarray(10);command=true;}
   while(data.length>=4&&!ended){const length=data.readUInt32BE(0);if(data.length<4+length)return;data=data.subarray(4);if(length===0){ended=true;if(reply==='clean')socket.write('stream: OK\0');if(reply==='infected')socket.write('stream: Synthetic-Test FOUND\0');if(reply==='disconnect')socket.destroy();return;}captured=Buffer.concat([captured,data.subarray(0,length)]);data=data.subarray(length);}
  });
 });server.listen(0,'127.0.0.1');await new Promise<void>(resolve=>server.once('listening',resolve));const address=server.address();assert.ok(address&&typeof address==='object');process.env.IMPORT_CLAMD_HOST='127.0.0.1';process.env.IMPORT_CLAMD_PORT=String(address.port);
 try{await run(()=>captured);}finally{for(const socket of sockets)socket.destroy();await new Promise<void>((resolve,reject)=>server.close(e=>e?reject(e):resolve()));if(priorHost===undefined)delete process.env.IMPORT_CLAMD_HOST;else process.env.IMPORT_CLAMD_HOST=priorHost;if(priorPort===undefined)delete process.env.IMPORT_CLAMD_PORT;else process.env.IMPORT_CLAMD_PORT=priorPort;}
}
test('ClamAV INSTREAM framing sends the complete synthetic file and requires clean verdict',async()=>{
 const file=Buffer.alloc(150000,65);await scannerFixture('clean',async captured=>{await scanFile(file);assert.deepEqual(captured(),file);});
});
test('scanner rejects a non-clean verdict and a lost connection',async()=>{
 for(const reply of ['infected','disconnect'] as const)await scannerFixture(reply,async()=>{await assert.rejects(scanFile(Buffer.from('synthetic')));});
});
test('scanner deadline is absolute even if the service trickles data',async()=>{
 await scannerFixture('trickle',async()=>{await assert.rejects(scanFile(Buffer.from('synthetic'),80),/timeout/);});
});
