import { useEffect, useState } from 'react';
import api, { formatDate, statusBadge } from '../../api';

export default function MyMaintenance() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ title: '', description: '' });
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const load = async () => {
    const { data } = await api.get('/maintenance');
    setItems(data);
  };

  
  useEffect(() => {
    load().catch((e) => setError(e.response?.data?.message || 'Failed to load'));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setMsg('');
    try {
      await api.post('/maintenance', form);
      setMsg('Maintenance request submitted');
      setForm({ title: '', description: '' });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit');
    }
  };

  return (
    <div>
      <h1 className="page-title">My Maintenance Requests</h1>
      <p className="page-sub">Report facility problems such as doors, windows, electricity, water, or furniture</p>
      {error && <div className="alert alert-error">{error}</div>}
      {msg && <div className="alert alert-success">{msg}</div>}

      <div className="card mb-4">
        <form onSubmit={submit} className="form-grid">
          <label>
            Title
            <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </label>
          <label className="md:col-span-2">
            Description
            <textarea
              className="textarea"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
            />
          </label>
          <div className="flex items-end">
            <button className="btn btn-primary">Submit</button>
          </div>
        </form>
      </div>

      <div className="card table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Number</th>
              <th>Title</th>
              <th>Submitted</th>
              <th>Status</th>
              <th>Actions Taken</th>
            </tr>
          </thead>
          <tbody>
            {items.map((m) => (
              <tr key={m.id}>
                <td>{m.requestNumber}</td>
                <td>{m.title}</td>
                <td>{formatDate(m.submittedAt)}</td>
                <td>
                  <span className={statusBadge(m.status)}>{m.status}</span>
                </td>
                <td>{m.actionsTaken || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
