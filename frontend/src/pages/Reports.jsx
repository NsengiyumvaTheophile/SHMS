import { useState } from 'react';
import api, { money } from '../api';

const TYPES = [
  'students',
  'hostels',
  'rooms',
  'requests',
  'approved-requests',
  'rejected-requests',
  'occupancy',
  'allocations',
  'check-ins',
  'check-outs',
  'fees',
  'payments',
  'outstanding',
  'maintenance',
  'statistics',
];

function flatten(row) {
  const out = {};
  for (const [k, v] of Object.entries(row || {})) {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      if (v.firstName) out[k] = `${v.firstName} ${v.lastName}`;
      else if (v.name) out[k] = v.name;
      else if (v.username) out[k] = v.username;
      else if (v.email) out[k] = v.email;
      else if (v.roomNumber) out[k] = v.roomNumber;
      else if (v.hostel?.name && v.roomNumber) out[k] = `${v.hostel.name} / ${v.roomNumber}`;
      else out[k] = Object.values(v)
        .filter((x) => x != null && typeof x !== 'object')
        .slice(0, 3)
        .join(' · ');
    } else if (Array.isArray(v)) {
      out[k] = v.length;
    } else if (typeof v === 'boolean') {
      out[k] = v ? 'Yes' : 'No';
    } else {
      out[k] = v;
    }
  }
  return out;
}

export default function Reports() {
  const [type, setType] = useState('students');
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  const rows = () => {
    if (!report?.data) return [];
    const data = Array.isArray(report.data) ? report.data : [report.data];
    return data.map(flatten);
  };

  const load = async () => {
    setError('');
    try {
      const { data } = await api.get(`/reports/${type}`);
      setReport(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate report');
    }
  };

  const exportCsv = () => {
    const table = rows();
    if (!table.length) return;
    const keys = Object.keys(table[0]);
    const csv = [
      keys.join(','),
      ...table.map((r) => keys.map((k) => JSON.stringify(r[k] ?? '')).join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shms-${type}-report.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const table = rows();
  const keys = table[0] ? Object.keys(table[0]) : [];

  return (
    <div>
      <h1 className="page-title">Report Generation</h1>
      <p className="page-sub">Generate and export hostel management reports</p>
      {error && <div className="alert alert-error">{error}</div>}

      <div className="card mb-4 flex flex-wrap gap-2 items-end">
        <label className="text-sm font-semibold text-[var(--muted)]">
          Report Type
          <select className="select mt-1 min-w-[220px]" value={type} onChange={(e) => setType(e.target.value)}>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <button className="btn btn-primary" onClick={load}>
          Generate
        </button>
        {report && (
          <button className="btn btn-secondary" onClick={exportCsv}>
            Export CSV
          </button>
        )}
      </div>

      {report && (
        <div className="card">
          <div className="mb-3 text-sm text-[var(--muted)]">
            Type: <strong>{report.type}</strong>
            {report.count !== undefined && (
              <>
                {' '}
                · Records: <strong>{report.count}</strong>
              </>
            )}
          </div>
          <div className="table-wrap">
            {keys.length ? (
              <table className="data">
                <thead>
                  <tr>
                    {keys.map((k) => (
                      <th key={k}>{k}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {table.map((row, i) => (
                    <tr key={i}>
                      {keys.map((k) => (
                        <td key={k}>{String(row[k] ?? '')}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-[var(--muted)]">No records.</p>
            )}
          </div>
          {type === 'outstanding' && Array.isArray(report.data) && (
            <div className="mt-3 text-sm">
              Total outstanding listed:{' '}
              <strong>{money(report.data.reduce((s, r) => s + r.outstandingBalance, 0))}</strong>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
