import { useEffect, useState } from 'react';
import api, { statusBadge } from '../api';

const empty = {
  firstName: '',
  lastName: '',
  gender: 'Male',
  phone: '',
  address: '',
  email: '',
  password: 'Password123!',
  program: '',
  department: '',
  yearOfStudy: 1,
  studentId: '',
  registrationNo: '',
};

export default function Students() {
  const [students, setStudents] = useState([]);
  const [q, setQ] = useState('');
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const load = async () => {
    const { data } = await api.get('/students', { params: { q: q || undefined } });
    setStudents(data);
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
        const { password, email, ...payload } = form;
        await api.put(`/students/${editingId}`, payload);
        setMsg('Student updated');
      } else {
        await api.post('/students', form);
        setMsg('Student registered successfully');
      }
      setForm(empty);
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save student');
    }
  };

  const edit = (s) => {
    setEditingId(s.id);
    setForm({
      firstName: s.firstName || '',
      lastName: s.lastName || '',
      gender: s.gender || 'Male',
      phone: s.phone || '',
      address: s.address || '',
      email: s.user?.email || '',
      password: '',
      program: s.program || '',
      department: s.department || '',
      yearOfStudy: s.yearOfStudy || 1,
      studentId: s.studentId || '',
      registrationNo: s.registrationNo || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deactivate = async (id) => {
    if (!confirm('Deactivate this student?')) return;
    await api.post(`/students/${id}/deactivate`);
    await load();
  };

  const activate = async (id) => {
    await api.post(`/students/${id}/activate`);
    await load();
  };

  return (
    <div>
      <h1 className="page-title">Student Management</h1>
      <p className="page-sub">Register, search, edit, and manage student records</p>
      {error && <div className="alert alert-error">{error}</div>}
      {msg && <div className="alert alert-success">{msg}</div>}

      <div className="card mb-4">
        <h2 className="font-display text-xl mb-3">{editingId ? 'Edit Student' : 'Register Student'}</h2>
        <form onSubmit={submit} className="form-grid">
          {['firstName', 'lastName', 'email', 'phone', 'address', 'program', 'department', 'studentId', 'registrationNo'].map(
            (k) => (
              <label key={k}>
                {k === 'studentId'
                  ? 'Student ID (optional)'
                  : k === 'registrationNo'
                    ? 'Registration No (optional)'
                    : k}
                <input
                  className="input"
                  value={form[k]}
                  onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                  required={['firstName', 'lastName', 'email'].includes(k) && !editingId}
                  disabled={k === 'email' && editingId}
                />
              </label>
            )
          )}
          <label>
            Gender
            <select className="select" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
              <option>Male</option>
              <option>Female</option>
            </select>
          </label>
          <label>
            Year of Study
            <input
              type="number"
              className="input"
              value={form.yearOfStudy}
              onChange={(e) => setForm({ ...form, yearOfStudy: e.target.value })}
            />
          </label>
          {!editingId && (
            <label>
              Temporary Password
              <input
                className="input"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </label>
          )}
          <div className="flex items-end gap-2">
            <button className="btn btn-primary">{editingId ? 'Save Changes' : 'Save Student'}</button>
            {editingId && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setEditingId(null);
                  setForm(empty);
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="card">
        <div className="flex flex-wrap gap-2 mb-3">
          <input className="input max-w-sm" placeholder="Search students..." value={q} onChange={(e) => setQ(e.target.value)} />
          <button className="btn btn-secondary" onClick={() => load()}>
            Search
          </button>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Name</th>
                <th>Program</th>
                <th>Room</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id}>
                  <td>{s.studentId}</td>
                  <td>
                    {s.firstName} {s.lastName}
                  </td>
                  <td>{s.program || '—'}</td>
                  <td>
                    {s.allocations?.[0]
                      ? `${s.allocations[0].room.hostel.name} / ${s.allocations[0].room.roomNumber}`
                      : '—'}
                  </td>
                  <td>
                    <span className={statusBadge(s.status)}>{s.status}</span>
                  </td>
                  <td className="space-x-2">
                    <button className="btn btn-secondary" onClick={() => edit(s)}>
                      Edit
                    </button>
                    {s.status === 'ACTIVE' ? (
                      <button className="btn btn-danger" onClick={() => deactivate(s.id)}>
                        Deactivate
                      </button>
                    ) : (
                      <button className="btn btn-secondary" onClick={() => activate(s.id)}>
                        Activate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
