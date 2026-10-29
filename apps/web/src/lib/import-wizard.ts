export const importSteps=['Upload','Map fields','Validate','Review','Confirm','Summary'] as const;
export function initialImportStep(status:string){return status==='completed'?5:status==='validated'?3:status==='staged'?1:0;}
export function canVisitImportStep(step:number,status:string,unresolved:number,unsaved:boolean){
 if(unsaved)return false;
 if(status==='completed')return step===5;
 if(status==='created')return step===0;
 if(status==='staged')return step===1||step===2;
 if(status==='validated')return step===1||step===2||step===3||(step===4&&unresolved===0);
 return false;
}
