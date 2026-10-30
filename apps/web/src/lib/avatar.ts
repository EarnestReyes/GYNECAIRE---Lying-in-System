export const AVATAR_MAX_BYTES=3*1024*1024;
export type AvatarStatus={available:boolean;canRemove:boolean;hasPhoto:boolean;url:string|null;issues:string[]};
export const emptyAvatar:AvatarStatus={available:false,canRemove:false,hasPhoto:false,url:null,issues:[]};
export function avatarFileProblem(file:{size:number;type:string}){
 if(file.type!=='image/jpeg')return 'Choose a JPEG image (.jpg or .jpeg).';
 if(!file.size||file.size>AVATAR_MAX_BYTES)return 'Choose a JPEG image up to 3 MB.';
 return '';
}
export function avatarSetupMessages(issues:string[]){
 const messages:Record<string,string>={service_update_required:'The API photo service must be updated to match this portal build.',disabled:'Photo uploads are disabled in the API (AVATARS_ENABLED).',storage_key_missing:'The API is missing its server-only Storage credential (SUPABASE_SERVICE_ROLE_KEY).',supabase_url_missing:'The API needs a valid HTTPS SUPABASE_URL.',decoder_missing:'The API image decoder (sharp) is not installed.',schema_unavailable:'The API cannot access profiles.avatar_path or avatar_cleanup. Check schema compatibility and database grants.',bucket_unavailable:'The API cannot verify the existing staff-avatars bucket. Check its server credential and project URL.',bucket_incompatible:'The staff-avatars bucket must be private, JPEG-only, and allow 3 MB files.',photo_unavailable:'Your saved photo could not be retrieved. Initials are shown; you can replace or remove it.'};
 return [...new Set(issues)].map(issue=>messages[issue]??'Photo service setup could not be verified.');
}
