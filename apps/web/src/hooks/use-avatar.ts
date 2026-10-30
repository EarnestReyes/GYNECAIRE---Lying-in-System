import { useEffect,useState,useCallback,useRef } from 'react';
import { staffApi } from '../lib/portal';
import { emptyAvatar,type AvatarStatus } from '../lib/avatar';
export function useAvatar(){
 const [photo,setPhoto]=useState<AvatarStatus>(emptyAvatar);
 const [loading,setLoading]=useState(true),generation=useRef(0);
 const [error,setError]=useState('');
 const invalidate=useCallback(()=>{generation.current++;},[]);
 const refresh=useCallback(async()=>{const request=++generation.current;try{const value=await staffApi<AvatarStatus>('/profile/avatar');if(request!==generation.current)return;setPhoto({...emptyAvatar,...value,issues:Array.isArray(value.issues)?value.issues:['service_update_required']});setError('');}catch{if(request!==generation.current)return;setPhoto(emptyAvatar);setError('Profile photos could not be loaded. Check the API connection and retry.');}finally{if(request===generation.current)setLoading(false);}},[]);
 useEffect(()=>{const initial=setTimeout(()=>void refresh(),0);const timer=setInterval(()=>void refresh(),240000);const update=()=>void refresh();window.addEventListener('portal-avatar-updated',update);return()=>{invalidate();clearTimeout(initial);clearInterval(timer);window.removeEventListener('portal-avatar-updated',update);};},[refresh,invalidate]);
 return {...photo,loading,error,refresh};
}
