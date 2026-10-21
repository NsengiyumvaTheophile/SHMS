import { useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function Account() {
  const { user } = useAuth();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '' });
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setMsg('');
    try {
      const { data } = await api.post('/auth/change-password', form);
      setMsg(data.message);
      setForm({ currentPassword: '', newPassword: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
    }
  };

  return (
    <div>
      <h1 className="page-title">My Account</h1>
      <p className="page-sub">Signed in as {user?.username} ({user?.role?.replaceAll('_', ' ')})</p>
      {error && <div className="alert alert-error">{error}</div>}
      {msg && <div className="alert alert-success">{msg}</div>}
      <div className="card max-w-lg">
        <h2 className="font-display text-xl mb-3">Change password</h2>
        <form onSubmit={submit} className="form-grid">
          <label>
            Current password
            <input
              type="password"
              className="input"
              value={form.currentPassword}
              onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
              required
            />
          </label>
          <label>
            New password
            <input
              type="password"
              className="input"
              value={form.newPassword}
              onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
              minLength={8}
              required
            />
          </label>
          <button className="btn btn-primary">Update password</button>
        </form>
      </div>
    </div>
  );
}
