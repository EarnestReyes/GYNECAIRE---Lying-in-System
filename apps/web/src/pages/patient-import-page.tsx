import { useState } from 'react';
import { PageHeading } from '../components/ui';
import { PatientProfile } from './patients';
import { ImportRecords } from './patient-imports';
import { navigate } from '../lib/navigation';
export function PatientImportPage(){const [selected,setSelected]=useState<string|null>(null);return <>
 <PageHeading eyebrow="PATIENTS / IMPORT RECORDS" title="Import patient records" description="Move a historical register into the clinic directory, one reviewed step at a time." action={<button className="button secondary" onClick={()=>navigate('patients')}>Back to patients</button>}/>
 <ImportRecords onPatient={setSelected} onImported={()=>{}} initialHistory={new URLSearchParams(window.location.hash.split('?')[1]??'').get('view')==='history'}/>
 {selected&&<PatientProfile id={selected} close={()=>setSelected(null)}/>}</>;}
