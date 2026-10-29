import { useState } from 'react';
import { useResource } from '../hooks/use-resource';
import type { PageResult, Patient } from '../lib/portal';
import { ResourceState } from './ui';

export function PatientPicker({ value, onChange, unlinked = false }: { value: Patient | null; onChange: (patient: Patient | null) => void; unlinked?: boolean }) {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const { data, loading, error, refresh } = useResource<PageResult<Patient>>(value ? null : `/patients?search=${encodeURIComponent(query)}&filter=${unlinked ? 'unlinked' : 'all'}`);
  if (value) return <div className="selected-patient"><span><strong>{value.full_name}</strong><small>{value.patient_number}</small></span><button type="button" className="text-button" onClick={() => onChange(null)}>Change</button></div>;
  return <div className="patient-picker"><label>Find clinic patient<span className="inline-field"><input value={search} placeholder="Search by name or patient number" onChange={event => setSearch(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); setQuery(search); } }} /><button type="button" className="button secondary small" onClick={() => setQuery(search)}>Find</button></span></label><ResourceState loading={loading} error={error} retry={refresh} /><div className="patient-options">{data?.items.map(patient => <button type="button" key={patient.id} onClick={() => onChange(patient)}><strong>{patient.full_name}</strong><span>{patient.patient_number}</span></button>)}{data && !data.items.length && <p>No matching clinic records.</p>}</div><small>Showing up to 15 matches. Refine your search to find a patient.</small></div>;
}
