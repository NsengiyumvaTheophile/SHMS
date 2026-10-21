import { useEffect, useState } from 'react';
import api, { money } from '../api';

export default function Fees() {
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [hostels, setHostels] = useState([]);
  const [form, setForm] = useState({ name: '', amount: 50000, hostelId: '', academicYear: '2025/2026' });
  const [assign, setAssign] = useState({ studentId: '', feeId: '' });
  const [error, setError] = useState('');

  const load = async () => {
    const [f, s, h] = await Promise.all([api.get('/fees'), api.get('/students'), api.get('/hostels')]);
    setFees(f.data);
    setStudents(s.data);
    setHostels(h.data);
  };

  useEffect(() => {
    load().catch((e) => setError(e.response?.data?.message || 'Failed to load'));
  }, []);

  const createFee = async (e) => {
    e.preventDefault();
    try {
      await api.post('/fees', { ...form, hostelId: form.hostelId || null });
      setForm({ name: '', amount: 50000, hostelId: '', academicYear: '2025/2026' });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create fee');
    }
  };

  const assignFee = async (e) => {
    e.preventDefault();
    try {
      await api.post('/fees/assign', assign);
      setAssign({ studentId: '', feeId: '' });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign fee');
    }
  };

  return (
    <div>
      <h1 className="page-title">Hostel Fee Management</h1>
      <p className="page-sub">Define fees and assign them to students</p>
      {error && <div className="alert alert-error">{error}</div>}

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <div className="card">
          <h2 className="font-display text-xl mb-3">Define Fee</h2>
          <form onSubmit={createFee} className="form-grid">
            <label>
              Name
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </label>
            <label>
              Amount (RWF)
              <input type="number" className="input" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
            </label>
            <label>
              Hostel (optional)
              <select className="select" value={form.hostelId} onChange={(e) => setForm({ ...form, hostelId: e.target.value })}>
                <option value="">General</option>
                {hostels.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Academic Year
              <input className="input" value={form.academicYear} onChange={(e) => setForm({ ...form, academicYear: e.target.value })} />
            </label>
            <button className="btn btn-primary">Save Fee</button>
          </form>
        </div>

        <div className="card">
          <h2 className="font-display text-xl mb-3">Assign Fee to Student</h2>
          <form onSubmit={assignFee} className="form-grid">
            <label>
              Student
              <select className="select" value={assign.studentId} onChange={(e) => setAssign({ ...assign, studentId: e.target.value })} required>
                <option value="">Select...</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.firstName} {s.lastName} ({s.studentId})
                  </option>
                ))}
              </select>
            </label>
            <label>
              Fee
              <select className="select" value={assign.feeId} onChange={(e) => setAssign({ ...assign, feeId: e.target.value })} required>
                <option value="">Select...</option>
                {fees.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} — {money(f.amount)}
                  </option>
                ))}
              </select>
            </label>
            <button className="btn btn-primary">Assign</button>
          </form>
        </div>
      </div>

      <div className="card table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Fee</th>
              <th>Amount</th>
              <th>Hostel</th>
              <th>Year</th>
              <th>Assignments</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {fees.map((f) => (
              <tr key={f.id}>
                <td>{f.name}</td>
                <td>{money(f.amount)}</td>
                <td>{f.hostel?.name || 'General'}</td>
                <td>{f.academicYear || '—'}</td>
                <td>{f._count?.assignments ?? 0}</td>
                <td>
                  <button
                    className="btn btn-secondary"
                    onClick={async () => {
                      try {
                        await api.put(`/fees/${f.id}`, { isActive: !f.isActive });
                        await load();
                      } catch (err) {
                        setError(err.response?.data?.message || 'Failed to update fee');
                      }
                    }}
                  >
                    {f.isActive ? 'Deactivate' : 'Activate'}
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
