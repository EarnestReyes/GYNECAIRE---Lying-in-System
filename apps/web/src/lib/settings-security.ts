type Result={error:unknown;data?:unknown};
export type PasswordAuth={updateUser:(attributes:{password:string;current_password:string;nonce?:string})=>Promise<Result>};
export function passwordProblem(current:string,password:string,confirm:string){
 if(!current)return 'Enter your current password.';
 if(password.length<10)return 'Use at least 10 characters for your new password.';
 if(password.length>128)return 'Use no more than 128 characters.';
 if(password===current)return 'Choose a different password from your current one.';
 if(password!==confirm)return 'The new passwords do not match.';
 return '';
}
export async function changePassword(auth:PasswordAuth,current:string,password:string,confirm:string,nonce:string){
 const problem=passwordProblem(current,password,confirm);if(problem)throw new Error(problem);
 let result:Result;
 try{result=await auth.updateUser({password,current_password:current,...(nonce.trim()?{nonce:nonce.trim()}: {})});}
 catch{throw new Error('Unable to contact the account service. Please retry.');}
 if(result.error)throw new Error('Password was not changed. Check your current password, or request a verification code and retry.');
}
