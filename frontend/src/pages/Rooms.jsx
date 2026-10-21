import { useEffect, useState } from 'react';
import api, { statusBadge } from '../api';

const empty = { hostelId: '', roomNumber: '', capacity: 4 };

export default function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [hostels, setHostels] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const load = async () => {
    const [r, h] = await Promise.all([api.get('/rooms'), api.get('/hostels')]);
    setRooms(r.data);
    setHostels(h.data);
    setForm((f) => ({ ...f, hostelId: f.hostelId || h.data[0]?.id || '' }));
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
        await api.put(`/rooms/${editingId}`, form);
        setMsg('Room updated');
      } else {
        await api.post('/rooms', form);
        setMsg('Room added');
      }
      setForm((f) => ({ ...empty, hostelId: f.hostelId || hostels[0]?.id || '' }));
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save room');
    }
  };

  const updateStatus = async (room, data) => {
    setError('');
    try {
      await api.put(`/rooms/${room.id}`, data);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update room');
    }
  };

  const remove = async (room) => {
    if (!confirm(`Delete room ${room.roomNumber} in ${room.hostel?.name}?`)) return;
    setError('');
    setMsg('');
    try {
      const { data } = await api.delete(`/rooms/${room.id}`);
      setMsg(data.message);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete room');
    }
  };

  return (
    <div>
      <h1 className="page-title">Room Management</h1>
      <p className="page-sub">Add, update, or delete rooms. Allocation uses remaining capacity, not individual beds.</p>
      {error && <div className="alert alert-error">{error}</div>}
      {msg && <div className="alert alert-success">{msg}</div>}

      <div className="card mb-4">
        <h2 className="font-display text-xl mb-3">{editingId ? 'Edit room' : 'Add room'}</h2>
        <form onSubmit={submit} className="form-grid">
          <label>
            Hostel
            <select className="select" value={form.hostelId} onChange={(e) => setForm({ ...form, hostelId: e.target.value })} required>
              <option value="">Select hostel...</option>
              {hostels.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Room Number
            <input className="input" value={form.roomNumber} onChange={(e) => setForm({ ...form, roomNumber: e.target.value })} required />
          </label>
          <label>
            Capacity
            <input type="number" min="1" className="input" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} required />
          </label>
          <div className="flex items-end gap-2">
            <button className="btn btn-primary">{editingId ? 'Save changes' : 'Add Room'}</button>
            {editingId && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setEditingId(null);
                  setForm({ ...empty, hostelId: hostels[0]?.id || '' });
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
              <th>Hostel</th>
              <th>Room</th>
              <th>Capacity</th>
              <th>Occupied</th>
              <th>Available</th>
              <th>Occupants</th>
              <th>Status</th>
              <th>Set status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rooms.map((r) => (
              <tr key={r.id}>
                <td>{r.hostel?.name}</td>
                <td>{r.roomNumber}</td>
                <td>{r.capacity}</td>
                <td>{r.occupied}</td>
                <td>{r.available}</td>
                <td className="text-sm">
                  {r.allocations?.length
                    ? r.allocations.map((a) => `${a.student.firstName} ${a.student.lastName}`).join(', ')
                    : '—'}
                </td>
                <td>
                  <span className={statusBadge(r.isFull ? 'FULL' : r.status)}>{r.isFull ? 'FULL' : r.status}</span>
                </td>
                <td>
                  <select
                    className="select"
                    value={r.status}
                    onChange={(e) => updateStatus(r, { status: e.target.value })}
                  >
                    <option value="AVAILABLE">AVAILABLE</option>
                    <option value="MAINTENANCE">MAINTENANCE</option>
                    <option value="INACTIVE">INACTIVE</option>
                    <option value="FULL">FULL</option>
                  </select>
                </td>
                <td className="space-x-2 whitespace-nowrap">
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setEditingId(r.id);
                      setForm({ hostelId: r.hostelId, roomNumber: r.roomNumber, capacity: r.capacity });
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    Edit
                  </button>
                  <button className="btn btn-danger" onClick={() => remove(r)}>
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
