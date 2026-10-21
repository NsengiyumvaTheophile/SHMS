import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import SiteFooter from '../components/SiteFooter';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setMsg('');
    try {
      const { data } = await api.post('/auth/reset-password', { token, newPassword });
      setMsg(data.message);
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--surface)]">
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-md card">
        <h1 className="font-display text-3xl text-[var(--brand-dark)]">Reset password</h1>
        <p className="text-sm text-[var(--muted)] mt-1 mb-4">Paste the reset token and choose a new password.</p>
        {error && <div className="alert alert-error">{error}</div>}
        {msg && <div className="alert alert-success">{msg}</div>}
        <form onSubmit={submit} className="space-y-3">
          <label className="block text-sm font-semibold text-[var(--muted)]">
            Reset token
            <input className="input mt-1" value={token} onChange={(e) => setToken(e.target.value)} required />
          </label>
          <label className="block text-sm font-semibold text-[var(--muted)]">
            New password
            <input
              type="password"
              className="input mt-1"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
              required
            />
          </label>
          <button className="btn btn-primary w-full">Reset password</button>
        </form>
        <Link to="/login" className="block mt-4 text-sm text-[var(--brand)]">
          Back to login
        </Link>
      </div>
    </div>
    <SiteFooter />
    </div>
  );
}
