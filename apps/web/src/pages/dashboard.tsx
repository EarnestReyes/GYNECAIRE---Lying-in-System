import type { SavedClinic } from '../lib/clinic-settings';
import { useResource } from '../hooks/use-resource';
import { dateLabel, manilaDate, type Overview, type Report, type StaffIdentity } from '../lib/portal';
import { Badge, Empty, PageHeading, Panel, ResourceState } from '../components/ui';
import { Icon, type IconName } from '../components/icon';
import { navigate,quickActions } from '../lib/navigation';
import { VisitChart } from './reports';

export function Dashboard({ user }: { user: StaffIdentity }) {
  const { data, error, loading, refresh } = useResource<Overview>('/overview');
  const clinic=useResource<{settings:SavedClinic|null}>('/clinic-settings');
  const today = manilaDate();
  const trends = useResource<Report>(`/reports?from=${today.slice(0,4)}-01-01&to=${today}`);
  const metrics: { label: string; value: number | string; note: string; icon: IconName; color: string }[] = [
    { label: 'Total Patients', value: data?.total_patients ?? '—', note: 'Clinic patient records', icon: 'patients', color: 'rose' },
    { label: 'Today’s Appointments', value: data?.today_appointments ?? '—', note: 'Scheduled for today', icon: 'appointments', color: 'blue' },
    { label: 'Pending Requests', value: data?.pending_requests ?? '—', note: 'Awaiting patient verification', icon: 'staff', color: 'peach' },
    { label: 'Low Stock Items', value: '—', note: 'Inventory not connected', icon: 'inventory', color: 'peach' },
  ];
  return <>
    <PageHeading eyebrow="YOUR CLINIC AT A GLANCE" title={`Welcome back, ${user.full_name.split(' ')[0]}.`} description="Here’s what’s happening at GYNECAIRE today." action={<div className="date-chip"><Icon name="appointments" size={17} />{dateLabel(today)}</div>} />
    {clinic.data?.settings&&<p className="panel-note">{clinic.data.settings.clinic_name} ? {clinic.data.settings.timezone}</p>}
    <ResourceState loading={loading} error={error} retry={refresh} />
    <section className="metrics" aria-label="Clinic statistics">
      {metrics.map(metric => <article className="metric" key={metric.label}><div><span>{metric.label}</span><strong>{metric.value}</strong><small>{metric.note}</small></div><span className={`metric-icon ${metric.color}`}><Icon name={metric.icon} size={23} /></span></article>)}
    </section>
    <div className="dashboard-grid">
      <Panel title="Today’s schedule" action={<button className="text-button" onClick={() => navigate('appointments')}>View all <Icon name="arrow" size={15} /></button>}>
        {data?.schedule.length ? <div className="table-scroll"><table><thead><tr><th>Patient</th><th>Service</th><th>Time</th><th>Status</th></tr></thead><tbody>{data.schedule.map(item => <tr key={item.id}><td><strong>{item.full_name}</strong><small>{item.patient_number}</small></td><td>{item.appointment_type}</td><td>{new Intl.DateTimeFormat('en-PH', { timeZone: 'Asia/Manila', hour: 'numeric', minute: '2-digit' }).format(new Date(item.appointment_date))}</td><td><Badge tone={item.status}>{item.status}</Badge></td></tr>)}</tbody></table></div> : <Empty title={data ? 'A little room in today’s schedule' : 'Your schedule will appear here'} icon="appointments">{data ? 'No appointments are recorded for today.' : 'Connect to the clinic service to load appointments.'}</Empty>}
        {data && <p className="panel-note">Showing up to 20 appointments for today in Asia/Manila.</p>}
      </Panel>
      <Panel title="Completed visit trends" action={<Badge>Year to date</Badge>}>
        <ResourceState {...trends} retry={trends.refresh} />
        {trends.data?.visits.some(item => item.visits > 0) ? <VisitChart visits={trends.data.visits} /> : !trends.loading && !trends.error && <Empty title="No completed visits to chart" icon="reports">Visit trends will appear as completed appointments are recorded.</Empty>}
        <p className="panel-note">Monthly completed visits from January 1 to today. Based on recorded appointments.</p>
      </Panel>
      <Panel title="Quick actions">
        <div className="quick-actions">{quickActions.map(([page,label,icon]) => <button key={page} onClick={() => navigate(page)}><span className="quick-icon"><Icon name={icon} /></span><span>{label}</span><Icon name="arrow" size={16} /></button>)}</div>
        <div className="overview-numbers"><div><span>Verification pending</span><strong>{data?.pending_requests ?? '—'}</strong></div><div><span>Appointments pending</span><strong>{data?.pending_appointments ?? '—'}</strong></div></div>
      </Panel>
      <Panel title="Recent activity">
        {data?.activity.length ? <ol className="activity-list">{data.activity.map(item => <li key={item.id}><span className="activity-dot" /><div><strong>{item.action.replace(/[._]/g,' ')}</strong><small>{dateLabel(item.created_at,true)}</small></div></li>)}</ol> : <Empty title="No activity to show" icon="reports">{data ? 'Audited clinic actions will appear here.' : 'Recent activity is unavailable until the clinic service responds.'}</Empty>}
      </Panel>
    </div>
  </>;
}
