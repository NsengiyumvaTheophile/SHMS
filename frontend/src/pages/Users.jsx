import { useEffect, useState } from 'react';
import api, { statusBadge } from '../api';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: 'Password123!',
    role: 'HOSTEL_ADMIN',
  });
  const [error, setError] = useState('');

  const load = async () => {
    const { data } = await api.get('/users');
    setUsers(data);
  };

  useEffect(() => {
    load().catch((e) => setError(e.response?.data?.message || 'Failed to load'));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/users', form);
      setForm({ username: '', email: '', password: 'Password123!', role: 'HOSTEL_ADMIN' });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user');
    }
  };

  const toggle = async (u) => {
    await api.put(`/users/${u.id}`, { isActive: !u.isActive });
    await load();
  };

  return (
    <div>
      <h1 className="page-title">User Accounts</h1>
      <p className="page-sub">System Administrator — manage staff accounts. Register students from the Students page so a student profile is created.</p>
      {error && <div className="alert alert-error">{error}</div>}

      <div className="card mb-4">
        <form onSubmit={submit} className="form-grid">
          <label>
            Username
            <input className="input" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
          </label>
          <label>
            Email
            <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </label>
          <label>
            Password
            <input className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </label>
          <label>
            Role
            <select className="select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="SYSTEM_ADMIN">SYSTEM_ADMIN</option>
              <option value="HOSTEL_ADMIN">HOSTEL_ADMIN</option>
            </select>
          </label>
          <div className="flex items-end">
            <button className="btn btn-primary">Create User</button>
          </div>
        </form>
      </div>

      <div className="card table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.username}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>
                  <span className={statusBadge(u.isActive ? 'ACTIVE' : 'INACTIVE')}>
                    {u.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </td>
                <td>
                  <button className="btn btn-secondary" onClick={() => toggle(u)}>
                    {u.isActive ? 'Deactivate' : 'Activate'}
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
