import { Worker } from 'node:worker_threads';
export interface ParsedFile {headers:string[];rows:string[][]}
export function parseFile(file:Buffer,filename:string):Promise<ParsedFile>{
 return new Promise((resolve,reject)=>{
  const worker=new Worker(new URL('./parse-worker.cjs',import.meta.url),{workerData:{file,filename},resourceLimits:{maxOldGenerationSizeMb:128,maxYoungGenerationSizeMb:16,stackSizeMb:4}});
  let settled=false;
  const timer=setTimeout(()=>{if(!settled){settled=true;void worker.terminate();reject(new Error('File parsing exceeded the 20-second limit'));}},20000);
  const fail=()=>{if(!settled){settled=true;clearTimeout(timer);reject(new Error('File exceeds parser limits or could not be parsed'));}};
  worker.once('error',fail);worker.once('exit',()=>{if(!settled)fail();});
  worker.once('message',(message:{value?:ParsedFile;error?:string})=>{if(settled)return;settled=true;clearTimeout(timer);void worker.terminate();message.value?resolve(message.value):reject(new Error(message.error??'Unable to parse file'));});
 });
}
