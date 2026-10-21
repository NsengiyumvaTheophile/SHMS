import { useEffect, useState } from 'react';
import api, { formatDate } from '../api';

const CONTACT_KEYS = [
  { key: 'admin_office', label: 'Admin office' },
  { key: 'admin_phone', label: 'Admin phone' },
  { key: 'admin_email', label: 'Admin email' },
  { key: 'admin_hours', label: 'Office hours' },
  { key: 'institution_name', label: 'Institution name' },
  { key: 'academic_year', label: 'Academic year' },
];

export default function System() {
  const [logs, setLogs] = useState([]);
  const [settings, setSettings] = useState([]);
  const [backups, setBackups] = useState([]);
  const [settingForm, setSettingForm] = useState({ key: '', value: '' });
  const [contact, setContact] = useState({
    admin_office: '',
    admin_phone: '',
    admin_email: '',
    admin_hours: '',
    institution_name: '',
    academic_year: '',
  });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    const [l, s, b] = await Promise.all([
      api.get('/system/audit-logs'),
      api.get('/system/settings'),
      api.get('/system/backups'),
    ]);
    setLogs(l.data);
    setSettings(s.data);
    setBackups(b.data);
    const map = Object.fromEntries(s.data.map((row) => [row.key, row.value]));
    setContact((c) => ({
      ...c,
      ...Object.fromEntries(CONTACT_KEYS.map(({ key }) => [key, map[key] || c[key] || ''])),
    }));
  };

  useEffect(() => {
    load().catch((e) => setError(e.response?.data?.message || 'Failed to load'));
  }, []);

  const saveSetting = async (e) => {
    e.preventDefault();
    await api.post('/system/settings', settingForm);
    setSettingForm({ key: '', value: '' });
    await load();
  };

  const backup = async () => {
    try {
      const { data } = await api.post('/system/backup');
      setMsg(data.message);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Backup failed');
    }
  };

  const restore = async (fileName) => {
    if (!confirm(`Restore from ${fileName}? A safety backup will be created first.`)) return;
    try {
      const { data } = await api.post('/system/restore', { fileName });
      setMsg(data.message);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Restore failed');
    }
  };

  return (
    <div>
      <h1 className="page-title">System Settings & Security</h1>
      <p className="page-sub">Audit logs, settings, backup and recovery</p>
      {error && <div className="alert alert-error">{error}</div>}
      {msg && <div className="alert alert-success">{msg}</div>}

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <div className="card">
          <h2 className="font-display text-xl mb-3">Public contact & campus settings</h2>
          <form
            className="form-grid mb-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setError('');
              setMsg('');
              try {
                await Promise.all(
                  CONTACT_KEYS.map(({ key }) => api.post('/system/settings', { key, value: contact[key] || '' }))
                );
                setMsg('Campus and admin contact details saved. They appear in the site footer.');
                await load();
              } catch (err) {
                setError(err.response?.data?.message || 'Failed to save contact settings');
              }
            }}
          >
            {CONTACT_KEYS.map(({ key, label }) => (
              <label key={key}>
                {label}
                <input
                  className="input"
                  value={contact[key]}
                  onChange={(e) => setContact({ ...contact, [key]: e.target.value })}
                />
              </label>
            ))}
            <div className="flex items-end">
              <button className="btn btn-primary">Save contact details</button>
            </div>
          </form>
          <h3 className="font-semibold text-sm mb-2">Other settings</h3>
          <form onSubmit={saveSetting} className="form-grid mb-3">
            <label>
              Key
              <input className="input" value={settingForm.key} onChange={(e) => setSettingForm({ ...settingForm, key: e.target.value })} required />
            </label>
            <label>
              Value
              <input className="input" value={settingForm.value} onChange={(e) => setSettingForm({ ...settingForm, value: e.target.value })} required />
            </label>
            <button className="btn btn-primary">Save</button>
          </form>
          <ul className="text-sm space-y-1">
            {settings.map((s) => (
              <li key={s.id}>
                <strong>{s.key}</strong>: {s.value}
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <h2 className="font-display text-xl mb-3">Database Backup</h2>
          <button className="btn btn-primary mb-3" onClick={backup}>
            Create Backup Now
          </button>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>File</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {backups.map((b) => (
                  <tr key={b.name}>
                    <td>{b.name}</td>
                    <td>{formatDate(b.createdAt)}</td>
                    <td>
                      <button className="btn btn-secondary" onClick={() => restore(b.name)}>
                        Restore
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card table-wrap">
        <h2 className="font-display text-xl mb-3">Audit Logs</h2>
        <table className="data">
          <thead>
            <tr>
              <th>Time</th>
              <th>User</th>
              <th>Action</th>
              <th>Entity</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.slice(0, 50).map((l) => (
              <tr key={l.id}>
                <td>{formatDate(l.createdAt)}</td>
                <td>{l.user?.username || '—'}</td>
                <td>{l.action}</td>
                <td>
                  {l.entity || '—'} {l.entityId || ''}
                </td>
                <td>{l.details || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
