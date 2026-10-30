import { useEffect,useState,useCallback } from 'react';
import { staffApi } from '../lib/portal';
export function useAvatar(){
 const [photo,setPhoto]=useState<{available:boolean;url:string|null}>({available:false,url:null});
 const [error,setError]=useState('');
 const refresh=useCallback(async()=>{try{setPhoto(await staffApi('/profile/avatar'));setError('');}catch{setPhoto({available:false,url:null});setError('Profile photos are unavailable. Ask your administrator to check storage setup.');}},[]);
 useEffect(()=>{const initial=setTimeout(()=>void refresh(),0);const timer=setInterval(()=>void refresh(),240000);const update=()=>void refresh();window.addEventListener('portal-avatar-updated',update);return()=>{clearTimeout(initial);clearInterval(timer);window.removeEventListener('portal-avatar-updated',update);};},[refresh]);
 return {...photo,error,refresh};
}
