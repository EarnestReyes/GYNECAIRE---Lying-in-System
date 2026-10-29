import { useState } from 'react';
import { useResource } from '../hooks/use-resource';
import { manilaDate, type Report } from '../lib/portal';
import { Empty, PageHeading, Panel, ResourceState } from '../components/ui';
import { Icon } from '../components/icon';

const colors = ['#A13E71','#E9A4BF','#9896CF','#91C4CD','#DBBB91'];
function csvCell(value: string | number) { const text = String(value); return `"${(/^\s*[=+\-@]/.test(text) ? `'${text}` : text).replace(/"/g,'""')}"`; }

export function Reports() {
  const today = manilaDate(); const [from, setFrom] = useState(`${today.slice(0,4)}-01-01`); const [to, setTo] = useState(today);
  const [range, setRange] = useState({ from: `${today.slice(0,4)}-01-01`, to: today });
  const [type, setType] = useState('overview'); const [validation, setValidation] = useState('');
  const resource = useResource<Report>(`/reports?from=${range.from}&to=${range.to}`);
  const total = resource.data?.services.reduce((sum,item) => sum+item.count,0);
  const prenatal = resource.data?.services.filter(item => /prenatal/i.test(item.service)).reduce((sum,item) => sum+item.count,0);
  const postnatal = resource.data?.services.filter(item => /postnatal/i.test(item.service)).reduce((sum,item) => sum+item.count,0);
  function exportReport() {
    if (!resource.data) return;
    const rows: (string | number)[][] = [['GYNECAIRE aggregate clinic report'],['From',range.from,'To',range.to],['New patients',resource.data.new_patients],['Completed consultations',total || 0],[],['Month','Completed visits'],...resource.data.visits.map(item => [item.month,item.visits]),[],['Service','Completed consultations'],...resource.data.services.map(item => [item.service,item.count])];
    const url = URL.createObjectURL(new Blob(['\uFEFF'+rows.map(row => row.map(csvCell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href=url; link.download=`gynecaire-report-${range.from}-${range.to}.csv`; link.click(); setTimeout(() => URL.revokeObjectURL(url),1000);
  }
  return <><PageHeading title="Reports & Analytics" description="A clearer picture of your clinic, grounded in recorded care." action={<button className="button" disabled={!resource.data} onClick={exportReport}><Icon name="download" size={17} />Export CSV</button>} /><Panel title="Report controls"><form className="report-controls" onSubmit={event => { event.preventDefault(); if (from > to || Date.parse(to)-Date.parse(from)>366*86400000) { setValidation('Choose an ordered range of up to 366 days.'); return; } setValidation(''); if (range.from === from && range.to === to) resource.refresh(); else setRange({ from,to }); }}><label>From<input type="date" required value={from} onChange={event => setFrom(event.target.value)} /></label><label>To<input type="date" required value={to} onChange={event => setTo(event.target.value)} /></label><label>Report view<select value={type} onChange={event => setType(event.target.value)}><option value="overview">Clinic overview</option><option value="visits">Patient visits</option><option value="services">Service distribution</option></select></label><button className="button">Generate report</button></form>{validation && <p className="notice error" role="alert">{validation}</p>}</Panel><ResourceState {...resource} retry={resource.refresh} /><div className="metrics report-metrics">{[['Total Consultations',total],['New Patients',resource.data?.new_patients],['Prenatal Visits',prenatal],['Postnatal Visits',postnatal]].map(([label,value]) => <article className="metric" key={label}><div><span>{label}</span><strong>{value ?? '—'}</strong><small>{label === 'New Patients' ? 'Records created in range' : 'Completed appointments in range'}</small></div></article>)}</div>
    <div className="report-grid">{type !== 'services' && <Panel title="Patient visits">{resource.data?.visits.length ? <VisitChart visits={resource.data.visits} /> : <Empty title="No completed visits to chart" icon="reports">{resource.data ? 'There are no completed appointments in this date range.' : 'Generate a report from the clinic service to view trends.'}</Empty>}</Panel>}{type !== 'visits' && <Panel title="Service distribution">{resource.data?.services.length ? <ServiceChart services={resource.data.services} /> : <Empty title="No service distribution yet" icon="reports">Completed appointments determine the service mix.</Empty>}</Panel>}</div><p className="footnote">Dates use Asia/Manila. Consultation counts represent completed appointments, not unique people. Prenatal/postnatal totals use recorded service names. CSV exports contain aggregate counts only.</p></>;
}

export function VisitChart({ visits }: { visits: Report['visits'] }) {
  const max = Math.max(1,...visits.map(item => item.visits));
  const points = visits.map((item,index) => `${45+index*(460/Math.max(1,visits.length-1))},${180-item.visits/max*140}`).join(' ');
  return <div className="chart-body"><svg viewBox="0 0 550 220" className="line-chart" role="img" aria-label="Monthly completed appointment counts, with values listed below"><defs><linearGradient id="visit-fill" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#E6A3BF" stopOpacity=".45" /><stop offset="1" stopColor="#E6A3BF" stopOpacity="0" /></linearGradient></defs>{[0,.5,1].map(fraction => <g key={fraction}><line x1="45" x2="510" y1={180-fraction*140} y2={180-fraction*140} stroke="#EFE4EC" /><text x="30" y={184-fraction*140} textAnchor="end" fill="#786875" fontSize="11">{Math.round(max*fraction)}</text></g>)}<polygon points={`45,180 ${points} ${45+(visits.length-1)*(460/Math.max(1,visits.length-1))},180`} fill="url(#visit-fill)" /><polyline points={points} fill="none" stroke="#9A3E6C" strokeWidth="2.5" />{visits.map((item,index) => <circle key={item.month} cx={45+index*(460/Math.max(1,visits.length-1))} cy={180-item.visits/max*140} r="4" fill="#9A3E6C" />)}</svg><div className="chart-values">{visits.map(item => <span key={item.month}>{item.month}<strong>{item.visits}</strong></span>)}</div></div>;
}
function ServiceChart({ services }: { services: Report['services'] }) {
  const total = services.reduce((sum,item) => sum+item.count,0);
  const gradient = services.map((item,index) => { const start = services.slice(0,index).reduce((sum,entry) => sum+entry.count,0)/total*100; return `${colors[index%colors.length]} ${start}% ${start+item.count/total*100}%`; }).join(',');
  return <div className="service-chart"><div className="donut" style={{ background: `conic-gradient(${gradient})` }} role="img" aria-label={`${total} completed consultations across ${services.length} services`}><span><strong>{total}</strong><small>Total visits</small></span></div><ul>{services.map((item,index) => <li key={item.service}><i style={{ background: colors[index%colors.length] }} /><span>{item.service}</span><strong>{item.count}</strong></li>)}</ul></div>;
}
