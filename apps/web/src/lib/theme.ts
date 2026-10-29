export type ThemeChoice='light'|'dark'|'system';
export const THEME_KEY='gynecaire.portal.theme';
export function validTheme(value:unknown):ThemeChoice{return value==='light'||value==='dark'?value:'system';}
export function resolvedTheme(choice:ThemeChoice,dark:boolean){return choice==='system'?(dark?'dark':'light'):choice;}
export function persistTheme(storage:Pick<Storage,'setItem'>,choice:ThemeChoice){try{storage.setItem(THEME_KEY,choice);return true;}catch{return false;}}
let choice:ThemeChoice='system';
const listeners=new Set<()=>void>();
export const themeSnapshot=()=>choice;
export const subscribeTheme=(listener:()=>void)=>{listeners.add(listener);return()=>{listeners.delete(listener);};};
function apply(){document.documentElement.dataset.theme=resolvedTheme(choice,window.matchMedia('(prefers-color-scheme: dark)').matches);}
export function chooseTheme(next:ThemeChoice){choice=next;let saved=false;try{saved=persistTheme(window.localStorage,next);}catch{/* Storage may be blocked. */}apply();listeners.forEach(fn=>fn());return saved;}
export function startTheme(){
 try{choice=validTheme(window.localStorage.getItem(THEME_KEY));}catch{choice='system';}apply();
 const media=window.matchMedia('(prefers-color-scheme: dark)');const change=()=>apply();
 const storage=(event:StorageEvent)=>{if(event.key===THEME_KEY||event.key===null){choice=validTheme(event.newValue);apply();listeners.forEach(fn=>fn());}};
 media.addEventListener('change',change);window.addEventListener('storage',storage);
 return()=>{media.removeEventListener('change',change);window.removeEventListener('storage',storage);};
}
