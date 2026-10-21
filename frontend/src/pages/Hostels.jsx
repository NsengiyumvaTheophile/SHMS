import { useEffect, useState } from 'react';
import api, { statusBadge } from '../api';

export default function Hostels() {
  const [hostels, setHostels] = useState([]);
  const [form, setForm] = useState({ name: '', location: '', description: '' });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const load = async () => {
    const { data } = await api.get('/hostels');
    setHostels(data);
  };

  useEffect(() => {
    load().catch((e) => setError(e.response?.data?.message || 'Failed to load'));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setMsg('');
    try {
      if (editingId) {
        await api.put(`/hostels/${editingId}`, form);
        setMsg('Hostel updated');
      } else {
        await api.post('/hostels', form);
        setMsg('Hostel created');
      }
      setForm({ name: '', location: '', description: '' });
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save hostel');
    }
  };

  const toggle = async (h) => {
    await api.put(`/hostels/${h.id}`, { isActive: !h.isActive });
    await load();
  };

  const remove = async (h) => {
    if (!confirm(`Delete hostel ${h.name}? Empty rooms in this hostel will also be removed.`)) return;
    setError('');
    setMsg('');
    try {
      const { data } = await api.delete(`/hostels/${h.id}`);
      setMsg(data.message);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete hostel');
    }
  };

  return (
    <div>
      <h1 className="page-title">Hostel Management</h1>
      <p className="page-sub">Create and manage hostels and occupancy</p>
      {error && <div className="alert alert-error">{error}</div>}
      {msg && <div className="alert alert-success">{msg}</div>}

      <div className="card mb-4">
        <form onSubmit={submit} className="form-grid">
          <label>
            Name
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </label>
          <label>
            Location
            <input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </label>
          <label>
            Description
            <input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </label>
          <div className="flex items-end gap-2">
            <button className="btn btn-primary">{editingId ? 'Save Changes' : 'Add Hostel'}</button>
            {editingId && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setEditingId(null);
                  setForm({ name: '', location: '', description: '' });
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="card table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Name</th>
              <th>Location</th>
              <th>Rooms</th>
              <th>Capacity</th>
              <th>Occupied</th>
              <th>Available</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {hostels.map((h) => (
              <tr key={h.id}>
                <td>{h.name}</td>
                <td>{h.location || '—'}</td>
                <td>{h.roomCount}</td>
                <td>{h.capacity}</td>
                <td>{h.occupied}</td>
                <td>{h.available}</td>
                <td>
                  <span className={statusBadge(h.isActive ? 'ACTIVE' : 'INACTIVE')}>
                    {h.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </td>
                <td className="space-x-2">
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setEditingId(h.id);
                      setForm({
                        name: h.name,
                        location: h.location || '',
                        description: h.description || '',
                      });
                    }}
                  >
                    Edit
                  </button>
                  <button className="btn btn-secondary" onClick={() => toggle(h)}>
                    {h.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button className="btn btn-danger" onClick={() => remove(h)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
