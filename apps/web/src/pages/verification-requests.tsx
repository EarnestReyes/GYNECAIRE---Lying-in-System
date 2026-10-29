import { useState } from 'react';
import { useResource } from '../hooks/use-resource';
import { dateLabel, staffApi, type Patient, type Verification } from '../lib/portal';
import { Badge, Empty, Modal, Panel, ResourceState } from '../components/ui';
import { PatientPicker } from '../components/patient-picker';

export function VerificationRequests() {
  const resource = useResource<Verification[]>('/verifications'); const [selected, setSelected] = useState<Verification | null>(null);
  return <Panel title="Patient verification requests" action={<Badge>Pending clinic review</Badge>}><ResourceState {...resource} retry={resource.refresh} />{resource.data?.length ? <div className="table-scroll"><table><thead><tr><th>Applicant</th><th>Patient type</th><th>Submitted</th><th>Action</th></tr></thead><tbody>{resource.data.map(request => <tr key={request.id}><td><strong>{request.full_name}</strong></td><td>{request.patient_kind || 'Not recorded'}</td><td>{dateLabel(request.created_at)}</td><td><button className="button secondary small" onClick={() => setSelected(request)}>Review request</button></td></tr>)}</tbody></table></div> : resource.data && <Empty title="You’re all caught up" icon="staff">There are no pending verification requests.</Empty>}<p className="panel-note">Showing up to 100 pending requests, oldest first. Approvals require identity checks and a clinic record.</p>{selected && <Review request={selected} close={() => setSelected(null)} saved={() => { setSelected(null); resource.refresh(); }} />}</Panel>;
}

function Review({ request, close, saved }: { request: Verification; close: () => void; saved: () => void }) {
  const [patient, setPatient] = useState<Patient | null>(null); const [verified, setVerified] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  async function decide(status: 'approved' | 'rejected') {
    if (!window.confirm(status === 'approved' ? 'Approve this verified identity and link the selected clinic record?' : 'Reject this verification request?')) return;
    setBusy(true); setError('');
    try { await staffApi(`/verifications/${request.id}/decision`, { method: 'POST', body: status === 'approved' ? { status, patient_id: patient?.id, identity_verified: verified } : { status } }); saved(); }
    catch (error) { setError(error instanceof Error ? error.message : 'Unable to review request.'); } finally { setBusy(false); }
  }
  return <Modal title="Review patient verification" close={close} busy={busy}><div className="form-stack"><h3>{request.full_name}</h3><dl><dt>Date of birth</dt><dd>{dateLabel(request.date_of_birth)}</dd><dt>Contact number</dt><dd>{request.contact_number || 'Not recorded'}</dd></dl><p className="notice">Use the clinic’s approved identity-verification procedure. A matching name or date of birth alone is not proof of identity. Create a clinic record first for a new patient.</p><PatientPicker value={patient} onChange={setPatient} unlinked /><label className="checkbox-label"><input type="checkbox" checked={verified} onChange={event => setVerified(event.target.checked)} />I have verified this applicant’s identity and confirmed the selected record belongs to them.</label>{error && <p className="notice error" role="alert">{error}</p>}<div className="form-actions"><button className="button secondary" disabled={busy} onClick={() => decide('rejected')}>Reject request</button><button className="button" disabled={busy || !patient || !verified} onClick={() => decide('approved')}>{busy ? 'Saving…' : 'Approve & link record'}</button></div></div></Modal>;
}
