import { useState } from 'react';
import { initials } from '../lib/portal';
export function Avatar({name,url,large=false}:{name:string;url?:string|null;large?:boolean}){
 const [failed,setFailed]=useState<string|null>(null);
 return <span className={'avatar'+(large?' large':'')} aria-label={name}>{url&&failed!==url?<img src={url} alt="" referrerPolicy="no-referrer" onError={()=>setFailed(url)}/>:initials(name)}</span>;
}
