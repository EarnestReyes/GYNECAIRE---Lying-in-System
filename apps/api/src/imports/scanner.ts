import { connect } from 'node:net';
// Trusted private ClamAV INSTREAM service only. No bypass/"scan later" switch.
export function scannerReady(){const port=Number(process.env.IMPORT_CLAMD_PORT);return Boolean(process.env.IMPORT_CLAMD_HOST)&&Number.isInteger(port)&&port>0&&port<=65535;}
export async function scanFile(file:Buffer,timeoutMs=30000):Promise<void>{
 if(!scannerReady())throw new Error('Import malware scanning is not configured');
 await new Promise<void>((resolve,reject)=>{
  const socket=connect({host:process.env.IMPORT_CLAMD_HOST!,port:Number(process.env.IMPORT_CLAMD_PORT)});let response='';let done=false;
  const finish=(error?:Error)=>{if(done)return;done=true;clearTimeout(deadline);socket.destroy();error?reject(error):resolve();};
  // Absolute deadline also stops a scanner that trickles bytes to avoid an idle timeout.
  const deadline=setTimeout(()=>finish(new Error('Scanner timeout')),timeoutMs);
  socket.on('error',()=>finish(new Error('Scanner unavailable')));
  socket.on('data',chunk=>{response+=chunk.toString();if(response.length>1024)return finish(new Error('Invalid scanner response'));if(response.includes('\0')||response.includes('\n'))finish(response.trim().replace(/\0/g,'')==='stream: OK'?undefined:new Error('File did not pass malware scanning'));});
  socket.on('close',()=>{if(!done)finish(new Error('Scanner disconnected'));});
  socket.on('connect',()=>{void (async()=>{socket.write('zINSTREAM\0');for(let i=0;i<file.length;i+=65536){const part=file.subarray(i,i+65536),size=Buffer.alloc(4);size.writeUInt32BE(part.length);if(!socket.write(Buffer.concat([size,part])))await new Promise<void>((resolveDrain,rejectDrain)=>{const clean=()=>{socket.off('drain',drain);socket.off('close',closed);};const drain=()=>{clean();resolveDrain();};const closed=()=>{clean();rejectDrain(new Error('Scanner disconnected'));};socket.once('drain',drain);socket.once('close',closed);});}socket.write(Buffer.alloc(4));})().catch(()=>finish(new Error('Scanner unavailable')));});
 });
}
