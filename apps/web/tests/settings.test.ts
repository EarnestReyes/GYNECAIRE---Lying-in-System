import test from 'node:test';
import assert from 'node:assert/strict';
import { changePassword, passwordProblem } from '../src/lib/settings-security.js';
import { chooseTheme, startTheme, themeSnapshot, subscribeTheme, persistTheme, resolvedTheme, validTheme, THEME_KEY } from '../src/lib/theme.js';
test('password checks reject short, reused and unmatched passwords before an Auth request',async()=>{
 let calls=0;const auth={updateUser:async()=>{calls++;return {error:null};}};
 for(const [current,password,confirm] of [['','long-new-secret','long-new-secret'],['old','short','short'],['unchanged-password','unchanged-password','unchanged-password'],['old','new-long-secret','other']])await assert.rejects(changePassword(auth,current!,password!,confirm!,''));assert.equal(calls,0);assert.equal(passwordProblem('old','new-long-secret','new-long-secret'),'');
});
test('password update sends current verification and nonce only to Auth, and rejects provider errors',async()=>{
 const calls:unknown[]=[];await changePassword({updateUser:async value=>{calls.push(value);return {error:null};}},'old-secret','new-long-secret','new-long-secret','123456');assert.deepEqual(calls,[{password:'new-long-secret',current_password:'old-secret',nonce:'123456'}]);
 await assert.rejects(changePassword({updateUser:async()=>({error:{message:'private provider details'}})},'old','new-long-secret','new-long-secret',''),error=>error instanceof Error&&!error.message.includes('private provider details'));
 await assert.rejects(changePassword({updateUser:async()=>{throw new Error('connection lost');}},'old','new-long-secret','new-long-secret',''));
});
test('theme validation and blocked storage have safe fallbacks',()=>{assert.equal(validTheme('corrupt'),'system');assert.equal(resolvedTheme('system',true),'dark');assert.equal(resolvedTheme('light',true),'light');assert.equal(persistTheme({setItem(){throw new Error('blocked');}},'dark'),false);});
test('theme persists across restarts, follows system changes and synchronizes other tabs',()=>{
 const previousWindow=Object.getOwnPropertyDescriptor(globalThis,'window'),previousDocument=Object.getOwnPropertyDescriptor(globalThis,'document');
 const values=new Map<string,string>();const media=Object.assign(new EventTarget(),{matches:false}),events=Object.assign(new EventTarget(),{localStorage:{getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>{values.set(key,value);}},matchMedia:()=>media});const root={dataset:{} as Record<string,string>};
 Object.defineProperty(globalThis,'window',{value:events,configurable:true});Object.defineProperty(globalThis,'document',{value:{documentElement:root},configurable:true});let stop=()=>{};let notifications=0;const unsubscribe=subscribeTheme(()=>notifications++);
 try{stop=startTheme();assert.equal(root.dataset.theme,'light');assert.equal(chooseTheme('dark'),true);assert.equal(root.dataset.theme,'dark');assert.equal(values.get(THEME_KEY),'dark');stop();stop=startTheme();assert.equal(themeSnapshot(),'dark');chooseTheme('system');media.matches=true;media.dispatchEvent(new Event('change'));assert.equal(root.dataset.theme,'dark');media.matches=false;media.dispatchEvent(new Event('change'));assert.equal(root.dataset.theme,'light');events.dispatchEvent(Object.assign(new Event('storage'),{key:THEME_KEY,newValue:'dark'}));assert.equal(themeSnapshot(),'dark');assert.equal(root.dataset.theme,'dark');assert.ok(notifications>=3);}
 finally{stop();unsubscribe();if(previousWindow)Object.defineProperty(globalThis,'window',previousWindow);else Reflect.deleteProperty(globalThis,'window');if(previousDocument)Object.defineProperty(globalThis,'document',previousDocument);else Reflect.deleteProperty(globalThis,'document');}
});
